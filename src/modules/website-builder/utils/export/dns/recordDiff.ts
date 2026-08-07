/**
 * Compare expected DNS records (from domainConfig.buildDnsRecords) with the
 * actual resolved values (from dohClient.resolveDns). Produces a per-record
 * verdict plus an aggregate propagation status.
 */
import type { DnsRecord } from '../domainConfig';
import type { DohResult, DnsQueryType } from './dohClient';

export type RecordStatus = 'match' | 'partial' | 'mismatch' | 'missing' | 'error' | 'pending';

export interface RecordVerdict {
  record: DnsRecord;
  status: RecordStatus;
  observed: string[];
  message: string;
}

export type AggregateStatus = 'not-configured' | 'propagating' | 'live' | 'partial' | 'error';

/** Convert our DnsRecord.type to what DoH can query (ALIAS resolves as A). */
export function toQueryType(type: DnsRecord['type']): DnsQueryType {
  if (type === 'ALIAS') return 'A';
  if (type === 'AAAA') return 'AAAA';
  if (type === 'CNAME') return 'CNAME';
  if (type === 'TXT') return 'TXT';
  return 'A';
}

/** Build the FQDN to query for a given record `name` (`@` = apex, `www`, …). */
export function toFqdn(name: string, domain: string): string {
  const clean = name.trim();
  if (!clean || clean === '@') return domain;
  if (clean.endsWith('.')) return clean.replace(/\.$/, '');
  if (clean.includes('.')) return clean; // already fully qualified
  return `${clean}.${domain}`;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\.$/, '').replace(/^"|"$/g, '');

/**
 * Diff a single expected record against a resolver result.
 * Handles CNAME chains: if we asked for an A record but the resolver returned a
 * CNAME that chains to the expected target, we treat it as a match.
 */
export function diffRecord(record: DnsRecord, dohResult: DohResult): RecordVerdict {
  if (dohResult.error) {
    return { record, status: 'error', observed: [], message: `Lookup failed: ${dohResult.error}` };
  }
  const expected = norm(record.value);
  const observedValues = dohResult.answers.map(a => norm(a.data));

  if (observedValues.length === 0) {
    return {
      record, status: 'missing', observed: [],
      message: dohResult.status === 3 ? 'Domain does not resolve (NXDOMAIN)' : 'No matching record found',
    };
  }

  // Placeholder values (e.g. `<your-github-user>.github.io.`) can never verify.
  if (expected.startsWith('<') && expected.endsWith('>')) {
    return {
      record, status: 'pending', observed: observedValues,
      message: 'Set your provider handle to enable verification',
    };
  }

  const hit = observedValues.some(v => v === expected);
  if (hit) {
    return { record, status: 'match', observed: observedValues, message: 'Live' };
  }
  return {
    record, status: 'mismatch', observed: observedValues,
    message: `Currently resolves to ${observedValues.join(', ')}`,
  };
}

/**
 * Reduce a set of per-record verdicts into a single top-line status.
 * Rules:
 *   • all `match`  → `live`
 *   • any `error`  → `error`
 *   • any `match` + any `missing`/`mismatch` → `partial`
 *   • all `missing`/`mismatch` (no matches) → `propagating`
 *   • empty        → `not-configured`
 */
export function aggregateStatus(verdicts: RecordVerdict[]): AggregateStatus {
  if (verdicts.length === 0) return 'not-configured';
  const has = (s: RecordStatus) => verdicts.some(v => v.status === s);
  if (has('error')) return 'error';
  const allMatch = verdicts.every(v => v.status === 'match');
  if (allMatch) return 'live';
  if (has('match')) return 'partial';
  return 'propagating';
}