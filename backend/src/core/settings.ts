import { eq } from 'drizzle-orm';
import { db } from './db';
import { appSettings } from './db/schema';

// Acefone Design System defaults (acefone-design-system/project/colors_and_type.css)
const FALLBACK_BRAND = {
  headerColor: '#051441',   // ace-blue-950 Dark Blue
  accentColor: '#00AB40',   // ace-green-500 (logo accent)
  primaryColor: '#083DDE',  // ace-blue-600 PRIMARY (logo)
};

export interface BrandColors {
  headerColor: string;
  accentColor: string;
  primaryColor: string;
}

export interface StoredLogo {
  b64: string;
  mime: string;
}

// Org logo (app_settings.logo) — stamped onto every generated creative.
export async function getLogo(): Promise<StoredLogo | null> {
  try {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, 'logo')).limit(1);
    if (!row) return null;
    const logo = JSON.parse(row.value);
    return logo?.b64 ? { b64: logo.b64, mime: logo.mime ?? 'image/png' } : null;
  } catch {
    return null;
  }
}

// Brand colors from the saved design system (app_settings.theme).
// Falls back to shipped defaults when no theme is saved.
export async function getBrandColors(): Promise<BrandColors> {
  try {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, 'theme')).limit(1);
    if (!row) return FALLBACK_BRAND;
    const theme = JSON.parse(row.value);
    const vars = theme?.vars ?? {};
    return {
      headerColor:  vars['--sn-top']    || FALLBACK_BRAND.headerColor,
      accentColor:  vars['--sn-green']  || FALLBACK_BRAND.accentColor,
      primaryColor: vars['--sn-accent'] || FALLBACK_BRAND.primaryColor,
    };
  } catch {
    return FALLBACK_BRAND;
  }
}
