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

const matchesStatus = (candidate: string, filterValue: string) => {
  if (!filterValue || filterValue === 'all') return true;
  const c = norm(candidate);
  const f = norm(filterValue);
  // Accept both direction: filter value contained in status name, or the
  // reverse (e.g. filter "progress" matches "In Progress").
  return c === f || c.includes(f) || f.includes(c);
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
 * Slice a chronological series by a period filter.
 *  - `12m` → last 12 entries (default, effectively no-op for a 12-month feed)
 *  - `ytd` → entries whose name matches the current year, else last N=current-month entries
 *  - `q`   → last 3 entries
 */
export const sliceByPeriod = <T extends { name?: string }>(
  rows: T[],
  period?: string
): T[] => {
  if (!rows.length || !period || period === '12m') return rows;
  if (period === 'q') return rows.slice(-3);
  if (period === 'ytd') {
    const year = new Date().getFullYear();
    const yearFiltered = rows.filter((r) => String(r.name ?? '').includes(String(year)));
    if (yearFiltered.length) return yearFiltered;
    const monthsSoFar = new Date().getMonth() + 1;
    return rows.slice(-monthsSoFar);
  }
  return rows;
};
