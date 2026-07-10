import sharp from 'sharp';
import { getLogo } from './settings';
import log from '../logger';

// Composite the org logo onto a generated creative (top-right, ~13% width).
// Deterministic overlay — image models distort logos, so the logo is never
// generated, always stamped. Returns the original image if no logo configured
// or compositing fails.
export async function brandCreative(pngB64: string): Promise<string> {
  const logo = await getLogo();
  if (!logo) return pngB64;

  try {
    const image = sharp(Buffer.from(pngB64, 'base64'));
    const meta = await image.metadata();
    const width = meta.width ?? 1536;

    const logoWidth = Math.round(width * 0.13);
    const margin = Math.round(width * 0.026);

    const logoBuf = await sharp(Buffer.from(logo.b64, 'base64'))
      .resize({ width: logoWidth })
      .png()
      .toBuffer();

    const branded = await image
      .composite([{
        input: logoBuf,
        left: width - logoWidth - margin,
        top: margin,
      }])
      .png()
      .toBuffer();

    return branded.toString('base64');
  } catch (err: any) {
    log.warn({ err: err.message }, 'Logo compositing failed — returning unbranded image');
    return pngB64;
  }
}
