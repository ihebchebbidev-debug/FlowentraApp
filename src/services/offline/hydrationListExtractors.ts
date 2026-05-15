/**
 * Helpers to collect entity IDs from list JSON during offline hydration.
 */

function mapRowsToIds(arr: unknown[]): number[] {
  const ids: number[] = [];
  for (const row of arr) {
    const r = row as Record<string, unknown>;
    const id = r.id ?? r.Id;
    if (id == null) continue;
    const n = typeof id === "number" ? id : parseInt(String(id), 10);
    if (!Number.isNaN(n)) ids.push(n);
  }
  return ids;
}

export function extractNumericIdsFromList(json: Record<string, unknown> | null, keys: string[]): number[] {
  if (!json) return [];
  const root = json as Record<string, unknown>;
  if (Array.isArray(root.data)) {
    return mapRowsToIds(root.data);
  }
  const data = root.data ?? root;
  const d = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  let arr: unknown[] = [];
  for (const k of keys) {
    const v = d[k];
    if (Array.isArray(v)) {
      arr = v;
      break;
    }
  }
  return mapRowsToIds(arr);
}

/** Dispatches list may return `data` as array or nested. */
export function extractDispatchIds(json: Record<string, unknown> | null): number[] {
  if (!json) return [];
  const data = json.data;
  if (Array.isArray(data)) {
    return mapRowsToIds(data);
  }
  return extractNumericIdsFromList(json, ["dispatches", "items", "data"]);
}

/** Installations list: array or `installations` key; ids may be string or number. */
export function extractInstallationIds(json: Record<string, unknown> | null): string[] {
  if (!json) return [];
  const raw = json.data ?? json;
  const d = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw as unknown[];
  else {
    const inst = d.installations ?? d.Installations;
    if (Array.isArray(inst)) arr = inst;
  }
  const out: string[] = [];
  for (const row of arr) {
    const r = row as Record<string, unknown>;
    const id = r.id ?? r.Id;
    if (id != null) out.push(String(id));
  }
  return out;
}

export function uniqNumbers(ids: number[]): number[] {
  return [...new Set(ids)];
}

export function uniqStrings(ids: string[]): string[] {
  return [...new Set(ids)];
}

/** Article list pages: `data` is an array of rows with `id`. */
export function extractArticleStringIdsFromArticlesList(json: Record<string, unknown> | null): string[] {
  if (!json) return [];
  const data = json.data;
  if (!Array.isArray(data)) return [];
  const out: string[] = [];
  for (const row of data) {
    const r = row as Record<string, unknown>;
    const id = r.id ?? r.Id;
    if (id != null) out.push(String(id));
  }
  return out;
}

export function extractSupportTicketIds(json: unknown): number[] {
  if (Array.isArray(json)) return mapRowsToIds(json);
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const data = o.data ?? o.supportTickets ?? o.tickets;
    if (Array.isArray(data)) return mapRowsToIds(data);
  }
  return extractNumericIdsFromList(json as Record<string, unknown> | null, ["supportTickets", "tickets", "data"]);
}

/** GET /api/Calendar/events — array of events with Guid (string) ids. */
export function extractCalendarEventStringIds(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  const out: string[] = [];
  for (const row of json) {
    const r = row as Record<string, unknown>;
    const id = r.id ?? r.Id;
    if (id != null) out.push(String(id));
  }
  return [...new Set(out)];
}

/** GET /api/Dashboards — often a bare array of dashboards. */
export function extractDashboardIds(json: unknown): number[] {
  if (Array.isArray(json)) {
    return mapRowsToIds(json);
  }
  return extractNumericIdsFromList(json as Record<string, unknown> | null, ["dashboards", "data", "items"]);
}
