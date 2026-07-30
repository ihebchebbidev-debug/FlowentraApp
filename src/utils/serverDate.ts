/**
 * Parse a timestamp returned by the .NET backend.
 *
 * Process tables (`ProcessSchedules`, `ProcessRuns`, …) use Postgres
 * `TIMESTAMP` (without time zone) and the backend always writes
 * `DateTime.UtcNow`. Npgsql hands those values back with `Kind = Unspecified`,
 * so System.Text.Json serialises them WITHOUT a trailing `Z`
 * (e.g. `2026-07-30T10:19:24`). `new Date("2026-07-30T10:19:24")` is parsed by
 * the browser as *local* time, which shifts every timestamp by the client's UTC
 * offset — in UTC+1 a job that just ran looks exactly one hour late, and the
 * Processes screen wrongly reports "Scheduler overdue".
 *
 * This helper treats an offset-less timestamp as UTC (which it is) and leaves
 * anything already carrying `Z` or `±hh:mm` untouched.
 */
export function parseServerDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = value.trim();
  if (!raw) return null;
  // Date-time without a timezone designator → it is UTC, mark it as such.
  const hasZone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(raw);
  const isDateTime = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(raw);
  const normalized = isDateTime && !hasZone ? `${raw.replace(" ", "T")}Z` : raw;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Milliseconds since epoch for a backend timestamp, or NaN when unparseable. */
export function serverDateMs(value: string | Date | null | undefined): number {
  return parseServerDate(value)?.getTime() ?? NaN;
}
