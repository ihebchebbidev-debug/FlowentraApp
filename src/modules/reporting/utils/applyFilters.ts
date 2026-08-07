/**
 * Client-side filter application for reporting dashboards. Because the
 * backend does not (yet) consume filter query params, we apply the two
 * common filters (period, status) on the returned data so users see the
 * charts / tables actually respond.
 *
 * Assumptions on the shape returned by the API:
 *  - "By status" arrays are `{ name, value }[]` where `name` is the status
 *    label ("Draft", "Confirmed", ...).
 *  - Time-series arrays (trend / by-month) are `{ name, value, ... }[]` and
 *    are already ordered chronologically (oldest → newest). We slice the tail
 *    based on the period filter.
 *  - Table rows have a `status` string we can match against.
 */

type Row = { name?: string; status?: string };

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

/**
 * Word-aware status match — avoids false positives like filter "on" matching
 * "Confirmed" via naive `includes`. Accepts exact match, whole-word match, or
 * a token-in-token match where the shorter side is >= 4 chars (so "progress"
 * still matches "In Progress" without matching "In").
 */
const matchesStatus = (candidate: string, filterValue: string) => {
  if (!filterValue || filterValue === 'all') return true;
  const c = norm(candidate);
  const f = norm(filterValue);
  if (!c || !f) return false;
  if (c === f) return true;
  // Whole-word match either way.
  const wordRe = (needle: string) =>
    new RegExp(`(?:^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-z0-9])`);
  if (wordRe(f).test(c) || wordRe(c).test(f)) return true;
  // Substring only when the shorter token is unambiguous (>= 4 chars).
  const shorter = c.length < f.length ? c : f;
  return shorter.length >= 4 && (c.includes(f) || f.includes(c));
};

/** Filter a `{ name, value }` array by a status filter. */
export const filterByStatusName = <T extends { name?: string }>(
  rows: T[],
  status?: string
): T[] => {
  if (!status || status === 'all') return rows;
  return rows.filter((r) => matchesStatus(r.name ?? '', status));
};

/** Filter table rows (using a `status` field) by a status filter. */
export const filterTableByStatus = <T extends Row>(
  rows: T[],
  status?: string
): T[] => {
  if (!status || status === 'all') return rows;
  return rows.filter((r) => matchesStatus(r.status ?? '', status));
};

/**
 * Slice a chronological series by a period filter. Backend trend rows are
 * labeled by month abbreviation only ("Jan", "Feb", …) — they never carry the
 * year. So YTD uses the current month index directly instead of trying to
 * substring-match the year (which was always empty and silently no-op'd).
 *  - `12m` → last 12 entries (default, effectively no-op for a 12-month feed)
 *  - `ytd` → last N entries where N = current month number (Jan=1 … Dec=12)
 *  - `q`   → last 3 entries
 */
export const sliceByPeriod = <T extends { name?: string }>(
  rows: T[],
  period?: string
): T[] => {
  if (!rows.length || !period || period === '12m') return rows;
  if (period === 'q') return rows.slice(-3);
  if (period === 'ytd') {
    const monthsSoFar = new Date().getMonth() + 1;
    return rows.slice(-Math.min(monthsSoFar, rows.length));
  }
  return rows;
};
