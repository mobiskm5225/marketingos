import crypto from 'node:crypto';

/**
 * AES-256-GCM for provider API keys at rest.
 *
 * Stored as `iv:authTag:ciphertext`, all base64. GCM is authenticated, so a
 * tampered ciphertext fails to decrypt rather than returning garbage that would
 * be sent to a provider as a credential.
 *
 * ENCRYPTION_KEY must be 32 bytes hex (`openssl rand -hex 32`).
 */

class MissingKeyError extends Error {
  constructor() {
    super('ENCRYPTION_KEY is not set — cannot store or read provider credentials.');
  }
}

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new MissingKeyError();
  const buffer = Buffer.from(raw, 'hex');
  if (buffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes of hex — generate with `openssl rand -hex 32`.');
  }
  return buffer;
}

export function encryptionAvailable(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
}

export function decrypt(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split(':');
  if (!ivPart || !tagPart || !dataPart) throw new Error('Stored credential is malformed.');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key(),
    Buffer.from(ivPart, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/** Decrypts without throwing — used where a bad credential should just mean "unavailable". */
export function tryDecrypt(payload: string | null): string | null {
  if (!payload) return null;
  try {
    return decrypt(payload);
  } catch {
    return null;
  }
}
