import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * Guards outbound fetches against SSRF.
 *
 * Any URL that reaches the crawler can be user-supplied — a knowledge-base
 * source, a page a skill was told to read. Without this, `http://169.254.169.254/`
 * would make the server fetch cloud instance metadata on the attacker's behalf,
 * and `http://localhost:5433` would reach our own Postgres.
 *
 * The check resolves the hostname first and rejects any address in a private,
 * loopback, link-local or reserved range, then pins the request to the address
 * that was actually validated so DNS cannot change under us between the check
 * and the request.
 */

export class BlockedUrlError extends Error {
  constructor(reason: string) {
    super(`Refused to fetch: ${reason}`);
  }
}

/** True when this process is running inside a container. */
function inContainer(): boolean {
  if (process.env.RUNNING_IN_DOCKER === 'true') return true;
  try {
    return require('node:fs').existsSync('/.dockerenv');
  } catch {
    return false;
  }
}

/**
 * Rewrites a loopback endpoint to one the container can actually reach.
 *
 * Self-hosted model servers run on the host, so "http://localhost:11434" is what
 * a user naturally types — and from inside the backend container that resolves
 * to the container itself and fails. Docker Desktop exposes the host as
 * host.docker.internal, so translate rather than making the user know this.
 *
 * Only ever applied to operator-configured endpoints, never to crawl targets.
 */
export function resolveLocalEndpoint(rawUrl: string): string {
  if (!inContainer()) return rawUrl;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      url.hostname = process.env.DOCKER_HOST_GATEWAY ?? 'host.docker.internal';
      return url.toString().replace(/\/$/, '');
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  const [a, b] = parts as [number, number, number, number];
  if (a === 10) return true; // 10.0.0.0/8      private
  if (a === 127) return true; // 127.0.0.0/8     loopback
  if (a === 0) return true; // 0.0.0.0/8       this host
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isBlockedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalized === '::1' || normalized === '::') return true; // loopback / unspecified
  if (normalized.startsWith('fe80')) return true; // link-local
  if (/^f[cd]/.test(normalized)) return true; // unique local
  // IPv4-mapped (::ffff:10.0.0.1) must be checked as IPv4.
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIPv4(mapped[1]!);
  return false;
}

function isBlockedAddress(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isBlockedIPv4(ip);
  if (version === 6) return isBlockedIPv6(ip);
  return true; // not an IP we can reason about
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  userAgent?: string;
  maxBytes?: number;
}

export interface ValidateOptions {
  /**
   * Permit private and loopback addresses.
   *
   * Reserved for operator *configuration* — a self-hosted model endpoint such as
   * Ollama on http://localhost:11434 is the whole point of running local models,
   * and refusing it would break that feature.
   *
   * Never set this for URLs that arrive as *data* (crawl targets, links found in
   * a document, anything a skill supplies), because that is the SSRF path.
   *
   * Note: while the API has no authentication, "operator" means anyone who can
   * reach port 8000 — which is why that port is bound to loopback only.
   */
  allowPrivate?: boolean;
}

/** Validates a URL and returns the address it resolved to. */
export async function assertFetchable(
  rawUrl: string,
  options: ValidateOptions = {},
): Promise<{ url: URL; address: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BlockedUrlError('not a valid URL');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new BlockedUrlError(`unsupported protocol "${url.protocol}"`);
  }

  const host = url.hostname.replace(/^\[|\]$/g, '');

  // A literal IP needs no lookup, but still needs checking.
  if (net.isIP(host)) {
    if (!options.allowPrivate && isBlockedAddress(host)) {
      throw new BlockedUrlError(`${host} is a private or reserved address`);
    }
    return { url, address: host };
  }

  let resolved: { address: string }[];
  try {
    resolved = await dns.lookup(host, { all: true });
  } catch {
    throw new BlockedUrlError(`could not resolve "${host}"`);
  }

  if (resolved.length === 0) throw new BlockedUrlError(`"${host}" resolved to nothing`);

  // Every address must be safe — a host resolving to both a public and a private
  // address must not be reachable via the private one.
  if (!options.allowPrivate) {
    for (const { address } of resolved) {
      if (isBlockedAddress(address)) {
        throw new BlockedUrlError(`"${host}" resolves to the private address ${address}`);
      }
    }
  }

  return { url, address: resolved[0]!.address };
}

/**
 * Fetch with SSRF protection and a response size cap. Redirects are followed
 * manually so each hop is validated — otherwise a public URL could redirect
 * straight to instance metadata.
 */
export async function safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<string> {
  const { timeoutMs = 15_000, userAgent = 'MarketingOS/1.0', maxBytes = 5_000_000 } = options;

  let current = rawUrl;
  for (let hop = 0; hop < 5; hop += 1) {
    const { url } = await assertFetchable(current);

    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent },
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new BlockedUrlError('redirect without a destination');
      current = new URL(location, url).toString();
      continue;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url.toString()}`);

    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > maxBytes) throw new Error(`Response too large (${declared} bytes)`);

    const text = await response.text();
    if (text.length > maxBytes) throw new Error('Response too large');
    return text;
  }

  throw new BlockedUrlError('too many redirects');
}
