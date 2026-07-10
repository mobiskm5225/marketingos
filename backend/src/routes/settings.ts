import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../core/db';
import { appSettings } from '../core/db/schema';
import { requirePermission } from '../middleware/requirePermission';
import { logAudit } from '../core/audit';
import log from '../logger';

const router = Router();
const THEME_KEY = 'theme';

// GET /api/settings/theme — any authenticated user (theme applies to everyone)
router.get('/settings/theme', async (_req: Request, res: Response) => {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, THEME_KEY)).limit(1);
  if (!row) { res.json({ theme: null }); return; }
  try {
    res.json({ theme: JSON.parse(row.value), updatedBy: row.updatedBy, updatedAt: row.updatedAt });
  } catch {
    res.json({ theme: null });
  }
});

// PUT /api/settings/theme — admins only. Body: the full theme object.
// Send { "theme": null } to reset to defaults.
router.put('/settings/theme', requirePermission('admin:users'), async (req: Request, res: Response) => {
  const { theme } = req.body ?? {};

  try {
    if (theme === null) {
      await db.delete(appSettings).where(eq(appSettings.key, THEME_KEY));
      await logAudit(req.user!.userId, req.user!.username, 'settings.theme_reset', 'app_settings', undefined);
      res.json({ ok: true, theme: null });
      return;
    }

    if (typeof theme !== 'object') {
      res.status(400).json({ error: 'theme must be an object or null' });
      return;
    }

    const value = JSON.stringify(theme);
    await db.insert(appSettings)
      .values({ key: THEME_KEY, value, updatedBy: req.user!.username, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedBy: req.user!.username, updatedAt: new Date() },
      });

    await logAudit(req.user!.userId, req.user!.username, 'settings.theme_updated', 'app_settings', undefined);
    res.json({ ok: true });
  } catch (err: any) {
    log.error({ err: err.message }, 'Theme save failed');
    res.status(500).json({ error: 'Failed to save theme' });
  }
});

// ─── Logo ─────────────────────────────────────────────────────────────────────

const LOGO_KEY = 'logo';
const MAX_LOGO_BYTES = 1_000_000; // 1 MB decoded
const ALLOWED_LOGO_MIME = new Set(['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']);

// GET /api/settings/logo — binary, used by the frontend preview
router.get('/settings/logo', async (_req: Request, res: Response) => {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, LOGO_KEY)).limit(1);
  if (!row) { res.status(404).json({ error: 'No logo configured' }); return; }
  try {
    const logo = JSON.parse(row.value);
    const buf = Buffer.from(logo.b64, 'base64');
    res.setHeader('Content-Type', logo.mime ?? 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buf);
  } catch {
    res.status(404).json({ error: 'No logo configured' });
  }
});

// PUT /api/settings/logo — body { b64, mime }. Stamped onto every generated creative.
router.put('/settings/logo', requirePermission('admin:users'), async (req: Request, res: Response) => {
  const { b64, mime } = req.body ?? {};
  if (!b64 || typeof b64 !== 'string') {
    res.status(400).json({ error: 'b64 image data is required' });
    return;
  }
  if (!ALLOWED_LOGO_MIME.has(mime)) {
    res.status(400).json({ error: 'Logo must be PNG, SVG, JPEG, or WebP' });
    return;
  }
  const bytes = Buffer.byteLength(b64, 'base64');
  if (bytes > MAX_LOGO_BYTES) {
    res.status(400).json({ error: `Logo too large (${Math.round(bytes / 1024)} KB, max 1000 KB)` });
    return;
  }

  const value = JSON.stringify({ b64, mime });
  await db.insert(appSettings)
    .values({ key: LOGO_KEY, value, updatedBy: req.user!.username, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: req.user!.username, updatedAt: new Date() } });
  await logAudit(req.user!.userId, req.user!.username, 'settings.logo_updated', 'app_settings', undefined, { mime, bytes });
  res.json({ ok: true });
});

// DELETE /api/settings/logo — creatives go unbranded until a new logo is uploaded
router.delete('/settings/logo', requirePermission('admin:users'), async (req: Request, res: Response) => {
  await db.delete(appSettings).where(eq(appSettings.key, LOGO_KEY));
  await logAudit(req.user!.userId, req.user!.username, 'settings.logo_removed', 'app_settings', undefined);
  res.json({ ok: true });
});

// ─── Figma export ─────────────────────────────────────────────────────────────

const FIGMA_KEY = 'figma';

function hexToFigmaColor(hex: string): { r: number; g: number; b: number; a: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0, a: 1 };
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
}

async function getFigmaConfig(): Promise<{ token: string; fileKey: string } | null> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, FIGMA_KEY)).limit(1);
  if (!row) return null;
  try {
    const cfg = JSON.parse(row.value);
    return cfg.token && cfg.fileKey ? cfg : null;
  } catch { return null; }
}

// GET /api/settings/figma — connection status (token never returned)
router.get('/settings/figma', requirePermission('admin:users'), async (_req: Request, res: Response) => {
  const cfg = await getFigmaConfig();
  res.json({ configured: !!cfg, fileKey: cfg?.fileKey ?? null });
});

// PUT /api/settings/figma — save personal access token + target file key
router.put('/settings/figma', requirePermission('admin:users'), async (req: Request, res: Response) => {
  const { token, fileKey } = req.body ?? {};
  if (!token || !fileKey) {
    res.status(400).json({ error: 'token and fileKey are required' });
    return;
  }
  const value = JSON.stringify({ token: String(token).trim(), fileKey: String(fileKey).trim() });
  await db.insert(appSettings)
    .values({ key: FIGMA_KEY, value, updatedBy: req.user!.username, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: req.user!.username, updatedAt: new Date() } });
  await logAudit(req.user!.userId, req.user!.username, 'settings.figma_configured', 'app_settings', undefined, { fileKey });
  res.json({ ok: true });
});

// POST /api/settings/figma-export — push current theme as Figma Variables.
// Replaces the previous "Design System" collection wholesale on re-export.
// NOTE: Figma's variables WRITE API requires an Enterprise plan token.
router.post('/settings/figma-export', requirePermission('admin:users'), async (req: Request, res: Response) => {
  const cfg = await getFigmaConfig();
  if (!cfg) {
    res.status(400).json({ error: 'Figma is not connected. Save a personal access token and file key first.' });
    return;
  }

  const [themeRow] = await db.select().from(appSettings).where(eq(appSettings.key, THEME_KEY)).limit(1);
  let vars: Record<string, string> = {};
  let baseFontSize = 14;
  if (themeRow) {
    try {
      const t = JSON.parse(themeRow.value);
      vars = t.vars ?? {};
      baseFontSize = t.baseFontSize ?? 14;
    } catch { /* fall through to defaults below */ }
  }
  const v = (key: string, fallback: string) => vars[key] || fallback;

  const COLLECTION = 'Design System';
  // Fallbacks = Acefone Design System defaults
  const colorVars: [string, string][] = [
    ['brand/primary-action', v('--sn-accent', '#083DDE')],
    ['brand/accent',         v('--sn-green',  '#00AB40')],
    ['brand/header',         v('--sn-top',    '#051441')],
    ['brand/rail',           v('--sn-rail',   '#0A2080')],
    ['brand/link',           v('--sn-link',   '#1E4AE2')],
    ['surface/background',   v('--sn-bg',     '#F7F8FB')],
    ['surface/panel',        v('--sn-panel',  '#ffffff')],
    ['surface/border',       v('--sn-border', '#DDE1EB')],
    ['text/body',            v('--sn-text',   '#051441')],
    ['text/muted',           v('--sn-muted',  '#4D5570')],
    ['status/info',          v('--sn-blue',   '#1E4AE2')],
    ['status/warning',       v('--sn-orange', '#9C6500')],
    ['status/danger',        v('--sn-red',    '#E5484D')],
  ];
  const floatVars: [string, number][] = [
    ['shape/radius-control', parseFloat(v('--sn-radius', '4px')) || 4],
    ['shape/radius-card',    parseFloat(v('--sn-radius-lg', '8px')) || 8],
    ['type/font-size-base',  baseFontSize],
  ];
  const stringVars: [string, string][] = [
    ['type/font-sans', v('--sn-font', 'sans-serif')],
    ['type/font-mono', v('--sn-mono', 'monospace')],
  ];

  const figmaHeaders = { 'X-Figma-Token': cfg.token, 'Content-Type': 'application/json' };

  try {
    // Delete previous collection with the same name so re-exports replace, not duplicate
    const existingResp = await fetch(`https://api.figma.com/v1/files/${cfg.fileKey}/variables/local`, { headers: figmaHeaders });
    const deletions: any[] = [];
    if (existingResp.ok) {
      const existing = await existingResp.json() as any;
      for (const col of Object.values(existing.meta?.variableCollections ?? {}) as any[]) {
        if (col.name === COLLECTION && !col.remote) {
          deletions.push({ action: 'DELETE', id: col.id });
        }
      }
    }

    const modeId = 'tmp_mode';
    const collectionId = 'tmp_collection';
    const variables: any[] = [];
    const variableModeValues: any[] = [];
    let i = 0;

    for (const [name, hex] of colorVars) {
      const id = `tmp_var_${i++}`;
      variables.push({ action: 'CREATE', id, name, variableCollectionId: collectionId, resolvedType: 'COLOR' });
      variableModeValues.push({ variableId: id, modeId, value: hexToFigmaColor(hex) });
    }
    for (const [name, num] of floatVars) {
      const id = `tmp_var_${i++}`;
      variables.push({ action: 'CREATE', id, name, variableCollectionId: collectionId, resolvedType: 'FLOAT' });
      variableModeValues.push({ variableId: id, modeId, value: num });
    }
    for (const [name, str] of stringVars) {
      const id = `tmp_var_${i++}`;
      variables.push({ action: 'CREATE', id, name, variableCollectionId: collectionId, resolvedType: 'STRING' });
      variableModeValues.push({ variableId: id, modeId, value: str });
    }

    const payload = {
      variableCollections: [
        ...deletions,
        { action: 'CREATE', id: collectionId, name: COLLECTION, initialModeId: modeId },
      ],
      variableModes: [
        { action: 'UPDATE', id: modeId, name: 'Default', variableCollectionId: collectionId },
      ],
      variables,
      variableModeValues,
    };

    const resp = await fetch(`https://api.figma.com/v1/files/${cfg.fileKey}/variables`, {
      method: 'POST',
      headers: figmaHeaders,
      body: JSON.stringify(payload),
    });
    const body = await resp.json().catch(() => ({})) as any;

    if (!resp.ok) {
      const msg = body?.message ?? `Figma API error ${resp.status}`;
      const hint = resp.status === 403
        ? ' (variables write requires a Figma Enterprise token — otherwise download the file and import via the free Tokens Studio plugin)'
        : '';
      res.status(502).json({ error: `${msg}${hint}` });
      return;
    }

    await logAudit(req.user!.userId, req.user!.username, 'settings.figma_export', 'app_settings', undefined, { fileKey: cfg.fileKey, variables: variables.length });
    res.json({ ok: true, variables: variables.length, replaced: deletions.length > 0 });
  } catch (err: any) {
    log.error({ err: err.message }, 'Figma export failed');
    res.status(500).json({ error: `Figma export failed: ${err.message}` });
  }
});

export default router;
