/**
 * DNS-over-HTTPS client using Cloudflare's public resolver.
 * Browser-safe (CORS-enabled), no backend required.
 *
 * https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/
 */

export type DnsQueryType = 'A' | 'AAAA' | 'CNAME' | 'TXT';

export interface DohAnswer {
  name: string;
  type: number; // numeric RR type (1=A, 5=CNAME, 16=TXT, 28=AAAA)
  TTL: number;
  data: string;
}

export interface DohResult {
  /** Fully-qualified name that was queried (with trailing dot stripped). */
  name: string;
  type: DnsQueryType;
  /** Answers returned (may be empty when NXDOMAIN or no record of that type). */
  answers: DohAnswer[];
  /** DNS RCODE — 0 = no error, 3 = NXDOMAIN, etc. */
  status: number;
  /** Set when the fetch itself failed (network/CORS). */
  error?: string;
}

const TYPE_NUM: Record<DnsQueryType, number> = { A: 1, AAAA: 28, CNAME: 5, TXT: 16 };

// Simple in-memory TTL cache so repeated Verify clicks don't hammer 1.1.1.1.
const CACHE = new Map<string, { at: number; result: DohResult }>();
const CACHE_TTL_MS = 30_000;

export function clearDohCache(): void {
  CACHE.clear();
}

/**
 * Resolve a DNS record via Cloudflare DoH. Returns a normalised result even
 * on error — callers can inspect `error` / `status` / `answers.length`.
 */
export async function resolveDns(name: string, type: DnsQueryType): Promise<DohResult> {
  const key = `${type}:${name.toLowerCase()}`;
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.result;

  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  let result: DohResult;
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/dns-json' },
      // Bypass service workers so preview envs don't intercept.
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rrType = TYPE_NUM[type];
    result = {
      name: name.replace(/\.$/, ''),
      type,
      status: typeof json.Status === 'number' ? json.Status : -1,
      answers: Array.isArray(json.Answer)
        ? (json.Answer as DohAnswer[]).filter(a => a.type === rrType || a.type === TYPE_NUM.CNAME)
        : [],
    };
  } catch (err) {
    result = {
      name, type, status: -1, answers: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
  CACHE.set(key, { at: Date.now(), result });
  return result;
}

/** Convenience — resolve every DNS record in a batch, in parallel. */
export async function resolveMany(
  queries: Array<{ name: string; type: DnsQueryType }>,
): Promise<DohResult[]> {
  return Promise.all(queries.map(q => resolveDns(q.name, q.type)));
}