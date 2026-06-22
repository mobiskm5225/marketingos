import crypto from 'crypto';

const SECRET = () => process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const TTL_SECONDS = 7 * 24 * 3600; // 7 days

export interface GroupMembership {
  group: string;
  role: 'member' | 'manager';
}

export interface TokenPayload {
  username: string;
  userId: string;
  permissions: string[];
  groupMemberships: GroupMembership[];
  exp: number;
}

export function signToken(payload: Omit<TokenPayload, 'exp'>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SECRET())
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [header, body, sig] = parts;

  const expected = crypto
    .createHmac('sha256', SECRET())
    .update(`${header}.${body}`)
    .digest('base64url');

  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) throw new Error('Invalid signature');

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}
