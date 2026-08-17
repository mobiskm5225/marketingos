import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../core/db';
import { modelProviders, integrations, appSettings } from '../core/db/schema';
import { encrypt, encryptionAvailable } from '../lib/crypto';
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
        baseUrl: z.string().min(1),
        apiKey: z.string().nullish(),
        // Optional: when given, a successful probe saves the endpoint and the
        // models it reported against that provider.
        slug: z.string().nullish(),
      })
      .parse(req.body);

    // A self-hosted server runs on the host, so a loopback URL has to be
    // rewritten before the containerised backend can reach it.
    const reachable = resolveLocalEndpoint(baseUrl);
    await assertFetchable(reachable, { allowPrivate: true });
    const url = `${reachable.replace(/\/+$/, '')}/v1/models`;

    const response = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      res.json({ ok: false, message: `Endpoint returned ${response.status}` });
      return;
    }

    const body = (await response.json()) as { data?: { id: string }[] };
    const models = (body.data ?? []).map((m) => m.id);

    // A self-hosted server is the source of truth for which models it serves, so
    // a successful probe records them rather than making the user retype a list.
    if (slug && models.length > 0) {
      await db
        .update(modelProviders)
        .set({
          models,
          baseUrl,
          defaultModel: models[0],
          updatedAt: new Date(),
        })
        .where(eq(modelProviders.slug, slug));
    }

    res.json({
      ok: true,
      models,
      saved: Boolean(slug && models.length > 0),
      message: `Reachable · ${models.length} model${models.length === 1 ? '' : 's'} found`,
    });
  } catch (err) {
    // A failed probe is a result, not a server error — report it as one.
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
