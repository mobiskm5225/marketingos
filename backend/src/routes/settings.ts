import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../core/db';
import { modelProviders, integrations, appSettings } from '../core/db/schema';
import { encrypt, tryDecrypt, encryptionAvailable } from '../lib/crypto';
import { assertFetchable, resolveLocalEndpoint } from '../core/safe-fetch';
import { HttpError } from '../middleware/error';

const router = Router();

// ─── Models ───────────────────────────────────────────────────────────────────

router.get('/models', async (_req, res, next) => {
  try {
    const rows = await db.select().from(modelProviders).orderBy(modelProviders.createdAt);

    res.json(
      rows.map((m) => ({
        id: m.slug,
        name: m.name,
        kind: m.kind,
        models: m.models,
        // Derived: connected once it has a key (hosted) or an endpoint (self-hosted).
        status: m.apiKeyEnc || m.baseUrl ? 'connected' : 'available',
        note: m.note,
        // The key itself is never returned — only whether one is stored.
        hasKey: Boolean(m.apiKeyEnc),
        baseUrl: m.baseUrl,
        defaultModel: m.defaultModel,
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.patch('/models/:slug', async (req, res, next) => {
  try {
    const body = z
      .object({
        apiKey: z.string().nullish(),
        baseUrl: z.string().nullish(),
        defaultModel: z.string().nullish(),
        models: z.array(z.string()).optional(),
      })
      .parse(req.body);

    const [provider] = await db
      .select()
      .from(modelProviders)
      .where(eq(modelProviders.slug, String(req.params.slug)));
    if (!provider) throw new HttpError(404, 'Model provider not found');

    if (body.apiKey && !encryptionAvailable()) {
      throw new HttpError(
        400,
        'ENCRYPTION_KEY is not set on the server, so an API key cannot be stored safely. Generate one with `openssl rand -hex 32`.',
      );
    }

    // allowPrivate: a self-hosted model endpoint is operator configuration and
    // is legitimately on localhost (Ollama, vLLM, LM Studio). Crawl targets,
    // which arrive as data, are still blocked from private ranges.
    if (body.baseUrl) await assertFetchable(body.baseUrl, { allowPrivate: true });

    await db
      .update(modelProviders)
      .set({
        ...(body.apiKey !== undefined
          ? { apiKeyEnc: body.apiKey ? encrypt(body.apiKey) : null }
          : {}),
        ...(body.baseUrl !== undefined ? { baseUrl: body.baseUrl || null } : {}),
        ...(body.defaultModel !== undefined ? { defaultModel: body.defaultModel || null } : {}),
        ...(body.models !== undefined ? { models: body.models } : {}),
        updatedAt: new Date(),
      })
      .where(eq(modelProviders.id, provider.id));

    res.json({ id: provider.slug });
  } catch (err) {
    next(err);
  }
});

/**
 * Probes an OpenAI-compatible endpoint, which is what the Models page's
 * "Test connection" button claims to do.
 */
router.post('/models/test', async (req, res) => {
  try {
    const { baseUrl, apiKey, slug } = z
      .object({
        baseUrl: z.string().nullish(),
        apiKey: z.string().nullish(),
        slug: z.string().nullish(),
      })
      .parse(req.body);

    let providerRow: (typeof modelProviders.$inferSelect) | undefined;
    let effectiveKey = apiKey;

    if (slug) {
      const [p] = await db.select().from(modelProviders).where(eq(modelProviders.slug, slug));
      providerRow = p;
      if (!effectiveKey && p?.apiKeyEnc) {
        effectiveKey = tryDecrypt(p.apiKeyEnc);
      }
    }

    // Default base URL for cloud providers
    let targetBaseUrl = baseUrl || providerRow?.baseUrl;
    if (!targetBaseUrl) {
      if (slug === 'openai') targetBaseUrl = 'https://api.openai.com';
      else if (slug === 'anthropic') targetBaseUrl = 'https://api.anthropic.com';
      else targetBaseUrl = 'http://localhost:11434';
    }

    // Special test for Anthropic
    if (slug === 'anthropic') {
      if (!effectiveKey) {
        res.json({ ok: false, message: 'Anthropic requires an API key' });
        return;
      }
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': effectiveKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (resp.status === 401) {
        res.json({ ok: false, message: 'Invalid Anthropic API key (401)' });
        return;
      }
      const existingModels = (providerRow?.models as string[] | undefined) ?? [];
      const models = existingModels.length > 0
        ? existingModels
        : ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'];
      res.json({
        ok: true,
        models,
        saved: false,
        message: 'Reachable · Anthropic API key verified',
      });
      return;
    }

    // A self-hosted or OpenAI-compatible server probe
    const reachable = resolveLocalEndpoint(targetBaseUrl);
    await assertFetchable(reachable, { allowPrivate: true });
    const url = `${reachable.replace(/\/+$/, '')}/v1/models`;

    const response = await fetch(url, {
      headers: effectiveKey ? { Authorization: `Bearer ${effectiveKey}` } : {},
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      res.json({ ok: false, message: `Endpoint returned ${response.status}` });
      return;
    }

    const body = (await response.json()) as { data?: { id: string }[] };
    const models = (body.data ?? []).map((m) => m.id);

    // If models returned from self-hosted server, save them
    if (slug && models.length > 0 && slug !== 'openai') {
      await db
        .update(modelProviders)
        .set({
          models,
          baseUrl: baseUrl || null,
          defaultModel: models[0],
          updatedAt: new Date(),
        })
        .where(eq(modelProviders.slug, slug));
    }

    const existingModels = (providerRow?.models as string[] | undefined) ?? [];
    const effectiveModels = models.length > 0 ? models : existingModels;

    res.json({
      ok: true,
      models: effectiveModels,
      saved: Boolean(slug && models.length > 0 && slug !== 'openai'),
      message: `Reachable · ${effectiveModels.length} models verified`,
    });
  } catch (err) {
    res.json({ ok: false, message: err instanceof Error ? err.message : 'Could not reach endpoint' });
  }
});

// ─── Integrations ─────────────────────────────────────────────────────────────

router.get('/integrations', async (_req, res, next) => {
  try {
    const rows = await db.select().from(integrations).orderBy(integrations.createdAt);
    res.json(
      rows.map((i) => ({
        id: i.slug,
        name: i.name,
        blurb: i.blurb,
        status: i.credentialsEnc ? 'connected' : 'available',
        detail: i.detail,
      })),
    );
  } catch (err) {
    next(err);
  }
});

// ─── Run defaults ─────────────────────────────────────────────────────────────

const RUN_DEFAULTS_KEY = 'run-defaults';
const runDefaults = z.object({
  temperature: z.number().min(0).max(2).default(0.4),
  localFallback: z.boolean().default(true),
  customEndpoint: z.string().default(''),
});

router.get('/settings/run-defaults', async (_req, res, next) => {
  try {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, RUN_DEFAULTS_KEY));
    res.json(runDefaults.parse(row?.value ?? {}));
  } catch (err) {
    next(err);
  }
});

router.put('/settings/run-defaults', async (req, res, next) => {
  try {
    const value = runDefaults.parse(req.body);
    await db
      .insert(appSettings)
      .values({ key: RUN_DEFAULTS_KEY, value })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedAt: new Date() },
      });
    res.json(value);
  } catch (err) {
    next(err);
  }
});

export default router;
