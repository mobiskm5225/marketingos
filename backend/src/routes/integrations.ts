import { Router } from 'express';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../core/db';
import { integrations, knowledgeBases, documents } from '../core/db/schema';
import { getConnector, listConnectors, ConnectorError } from '../core/integrations';
import { ingestDocument } from '../core/knowledge/ingest';
import { encrypt, tryDecrypt, encryptionAvailable } from '../lib/crypto';
import { slugify } from '../core/skills/parse';
import { HttpError } from '../middleware/error';
import log from '../logger';

const router = Router();

async function findIntegration(slug: string) {
  const [row] = await db.select().from(integrations).where(eq(integrations.slug, slug));
  if (!row) throw new HttpError(404, 'Integration not found');
  return row;
}

/** Merges stored credentials with anything supplied in this request. */
function credentialsFor(
  row: typeof integrations.$inferSelect,
  supplied: Record<string, string> = {},
): Record<string, string> {
  const stored = tryDecrypt(row.credentialsEnc);
  const base = stored ? (JSON.parse(stored) as Record<string, string>) : {};
  const config = (row.config ?? {}) as Record<string, string>;
  return { ...config, ...base, ...supplied };
}

/** The fields the Connect dialog should render, per integration. */
router.get('/integrations/fields', (_req, res) => {
  res.json(
    listConnectors().map((c) => ({
      id: c.slug,
      fields: c.fields.map((f) => ({ ...f })),
    })),
  );
});

router.post('/integrations/:slug/connect', async (req, res, next) => {
  try {
    const row = await findIntegration(String(req.params.slug));
    const connector = getConnector(row.slug);

    if (!connector) {
      // Office needs delegated OAuth, which needs an identity we do not have.
      throw new HttpError(
        501,
        `${row.name} needs sign-in, which is not available yet. Upload files or use Notion, Obsidian or Google Drive.`,
      );
    }

    const input = z.record(z.string(), z.string()).parse(req.body ?? {});
    for (const field of connector.fields) {
      if (field.required && !input[field.key]?.trim()) {
        throw new HttpError(400, `${field.label} is required.`);
      }
    }

    if (!encryptionAvailable()) {
      throw new HttpError(
        400,
        'ENCRYPTION_KEY is not set, so credentials cannot be stored safely. Generate one with `openssl rand -hex 32`.',
      );
    }

    const result = await connector.connect(input);

    // Secrets are encrypted; everything else is plain config the UI can show.
    const secretKeys = new Set(connector.fields.filter((f) => f.secret).map((f) => f.key));
    const secrets: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      if (secretKeys.has(key)) secrets[key] = value;
    }

    await db
      .update(integrations)
      .set({
        status: 'connected',
        detail: result.detail,
        config: result.config,
        credentialsEnc: encrypt(JSON.stringify(secrets)),
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, row.id));

    res.json({ id: row.slug, detail: result.detail, config: result.config });
  } catch (err) {
    if (err instanceof ConnectorError) {
      next(new HttpError(400, err.message));
      return;
    }
    next(err);
  }
});

router.delete('/integrations/:slug/connect', async (req, res, next) => {
  try {
    const row = await findIntegration(String(req.params.slug));
    await db
      .update(integrations)
      .set({
        status: 'available',
        detail: 'Not connected',
        config: {},
        credentialsEnc: null,
        lastSyncedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, row.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * Pulls everything the source currently holds into a knowledge base.
 *
 * Documents already ingested from the same source (matched on sourceRef) are
 * replaced rather than duplicated, so syncing twice does not double the corpus.
 */
async function syncInto(
  integrationSlug: string,
  kbId: string,
): Promise<{ added: number; replaced: number; chunks: number }> {
  const row = await findIntegration(integrationSlug);
  const connector = getConnector(row.slug);
  if (!connector) throw new HttpError(501, `${row.name} cannot sync yet.`);
  if (row.status !== 'connected') throw new HttpError(400, `${row.name} is not connected.`);

  const sourceDocuments = await connector.list(credentialsFor(row));

  const existing = await db
    .select({ id: documents.id, sourceRef: documents.sourceRef })
    .from(documents)
    .where(eq(documents.kbId, kbId));
  const existingByRef = new Map(existing.map((d) => [d.sourceRef, d.id]));

  let added = 0;
  let replaced = 0;
  let chunks = 0;

  for (const source of sourceDocuments) {
    const previous = existingByRef.get(source.externalId);
    if (previous) {
      // Chunks cascade from the document, so deleting clears the old vectors too.
      await db.delete(documents).where(eq(documents.id, previous));
      replaced += 1;
    } else {
      added += 1;
    }

    const result = await ingestDocument({
      kbId,
      name: source.name,
      sourceType: row.slug === 'obsidian' ? 'obsidian' : row.slug === 'notion' ? 'notion' : 'upload',
      sourceRef: source.externalId,
      mimeType: source.mimeType ?? null,
      text: source.text,
    });
    chunks += result.chunks;
  }

  await db
    .update(integrations)
    .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
    .where(eq(integrations.id, row.id));

  await db
    .update(knowledgeBases)
    .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
    .where(eq(knowledgeBases.id, kbId));

  return { added, replaced, chunks };
}

router.post('/integrations/:slug/sync', async (req, res, next) => {
  try {
    const slug = String(req.params.slug);
    const row = await findIntegration(slug);
    const { kb } = z.object({ kb: z.string().nullish() }).parse(req.body ?? {});

    // Sync needs somewhere to put the documents. Reuse the base already bound to
    // this integration, or create one named after it.
    let kbId: string;
    if (kb) {
      const [target] = await db.select().from(knowledgeBases).where(eq(knowledgeBases.slug, kb));
      if (!target) throw new HttpError(404, 'Knowledge base not found');
      kbId = target.id;
    } else {
      const [bound] = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.integrationId, row.id));
      if (bound) {
        kbId = bound.id;
      } else {
        const [created] = await db
          .insert(knowledgeBases)
          .values({
            slug: slugify(`${row.name} sync`),
            name: row.name,
            type: 'Raw corpus',
            source: row.name,
            icon: 'FileText',
            integrationId: row.id,
          })
          .returning({ id: knowledgeBases.id });
        kbId = created!.id;
      }
    }

    await db
      .update(knowledgeBases)
      .set({ integrationId: row.id })
      .where(eq(knowledgeBases.id, kbId));

    res.json(await syncInto(slug, kbId));
  } catch (err) {
    if (err instanceof ConnectorError) {
      next(new HttpError(400, err.message));
      return;
    }
    next(err);
  }
});

/** "Sync all" — every connected source that has a knowledge base bound to it. */
router.post('/knowledge-bases/sync', async (_req, res, next) => {
  try {
    const connected = await db
      .select()
      .from(integrations)
      .where(eq(integrations.status, 'connected'));

    if (connected.length === 0) {
      res.json({ synced: 0, message: 'No sources are connected yet.' });
      return;
    }

    const bases = await db
      .select()
      .from(knowledgeBases)
      .where(inArray(knowledgeBases.integrationId, connected.map((i) => i.id)));

    const results = [];
    for (const base of bases) {
      const integration = connected.find((i) => i.id === base.integrationId);
      if (!integration || !getConnector(integration.slug)) continue;
      try {
        results.push({ kb: base.slug, ...(await syncInto(integration.slug, base.id)) });
      } catch (err) {
        // One failing source must not abort the rest.
        const message = err instanceof Error ? err.message : String(err);
        log.warn({ kb: base.slug, err: message }, 'Sync failed for one base');
        results.push({ kb: base.slug, error: message });
      }
    }

    res.json({ synced: results.length, results });
  } catch (err) {
    next(err);
  }
});

export default router;
