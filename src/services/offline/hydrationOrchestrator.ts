/**
 * Prefetches read-only API data into IndexedDB when the user enables offline mode.
 * Scoped per tenant + user via hydrationStore DB naming + syncEngine scope.
 */
import { API_URL } from "@/config/api";
import { getAuthHeaders } from "@/utils/apiHeaders";
import { getOfflineScopeKey } from "./syncEngine";
import {
  HYDRATION_CACHE_API_MAX_BYTES,
  HYDRATION_MAX_DOCUMENT_DOWNLOADS,
  HYDRATION_PARALLEL_FETCHES,
  HYDRATION_PREFETCH_BINARY_BUDGET_BYTES,
} from "./hydrationLimits";
import { runPool } from "./parallelPool";
import { putCachedResponse, saveManifest } from "./hydrationStore";
import {
  extractDispatchIds,
  extractArticleStringIdsFromArticlesList,
  extractInstallationIds,
  extractNumericIdsFromList,
  extractSupportTicketIds,
  extractCalendarEventStringIds,
  extractDashboardIds,
  uniqNumbers,
  uniqStrings,
} from "./hydrationListExtractors";
import { HYDRATION_MODULES, HYDRATION_LOOKUP_SLUGS, isHydrationModuleEnabled } from "./offlineHydrationPreferences";
import { savePersistedHydrationRun } from "./hydrationRunPersistence";

const IMAGE_FILE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

const MAX_CHECKLIST_FETCHES = 80;

function extractDocumentsFromList(json: unknown): { id: string; fileType: string }[] {
  const out: { id: string; fileType: string }[] = [];
  const root = json as Record<string, unknown> | null;
  const data = root?.data ?? root;
  const arr = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)
      ? (data as { items: unknown[] }).items
      : [];
  for (const row of arr) {
    const r = row as Record<string, unknown>;
    const id = r.id ?? r.Id;
    if (id == null) continue;
    const raw = String(r.fileType ?? r.FileType ?? r.mimeType ?? "")
      .toLowerCase()
      .trim();
    const ext = raw.includes("/") ? (raw.split("/").pop() || "") : raw.replace(/^\./, "");
    out.push({ id: String(id), fileType: ext });
  }
  return out;
}

function isImageDocumentFileType(fileType: string): boolean {
  const base = fileType.includes(".") ? (fileType.split(".").pop() || fileType) : fileType;
  return IMAGE_FILE_EXTENSIONS.has(base);
}

function extractNumericIdsFromTaskArray(json: unknown): number[] {
  if (!json) return [];
  const arr = Array.isArray(json) ? json : [];
  const out: number[] = [];
  for (const row of arr) {
    const r = row as Record<string, unknown>;
    const id = r.id ?? r.Id;
    if (id == null) continue;
    const n = typeof id === "number" ? id : parseInt(String(id), 10);
    if (!Number.isNaN(n)) out.push(n);
  }
  return out;
}

export type HydrationModuleStatus = "pending" | "running" | "done" | "error" | "skipped";

export type HydrationModuleSnapshot = {
  id: string;
  labelKey: string;
  status: HydrationModuleStatus;
  done: number;
  total: number;
  error?: string;
  /** Wall time for this module's run (ms), set when status becomes done / error / skipped. */
  durationMs?: number;
};

export type HydrationRunSnapshot = {
  scopeKey: string;
  running: boolean;
  startedAt?: string;
  finishedAt?: string;
  /** End-to-end wall time for the full hydration run (ms), set when run completes. */
  totalDurationMs?: number;
  modules: HydrationModuleSnapshot[];
  fatalError?: string;
};

const MAX_PROJECT_PAGES = 30;
const MAX_PROJECT_TASK_FETCH = 80;
const MAX_LIST_PAGES = 25;
const MAX_SYNC_PULL_PAGES = 40;
/** How many entity detail GETs to prefetch per type (offline detail pages). */
const MAX_ENTITY_DETAIL_PREFETCH = 50;
const MAX_PAYMENT_DETAIL_PREFETCH = 20;
const MAX_SUPPORT_DETAIL_PREFETCH = 25;
const MAX_TIME_TASK_PREFETCH = 45;
/** Sub-resources for offline detail tabs (capped per entity type). */
const MAX_PROJECT_SUB_PREFETCH = 20;
const MAX_ARTICLE_DETAIL_PREFETCH = 40;
const MAX_TASK_DETAIL_PREFETCH = 40;
const MAX_DISPATCH_SUB_PREFETCH = 20;
const MAX_ACTIVITY_DETAIL_PREFETCH = 15;
/** Calendar: prefetch event detail + attendees + reminders for the first N events from the list. */
const MAX_CALENDAR_EVENT_DETAIL_PREFETCH = 35;
/** Dashboard builder: prefetch full dashboard JSON for the first N ids from the list. */
const MAX_DASHBOARD_DETAIL_PREFETCH = 20;

let snapshot: HydrationRunSnapshot = {
  scopeKey: "",
  running: false,
  modules: [],
};

let abortCtl: AbortController | null = null;

function emitProgress(): void {
  window.dispatchEvent(
    new CustomEvent("offline:hydration-progress", {
      detail: { ...snapshot, modules: snapshot.modules.map((m) => ({ ...m })) },
    })
  );
}

export function getHydrationSnapshot(): HydrationRunSnapshot {
  return {
    ...snapshot,
    modules: snapshot.modules.map((m) => ({ ...m })),
  };
}

function mod(id: string, labelKey: string): HydrationModuleSnapshot {
  return { id, labelKey, status: "pending", done: 0, total: 1 };
}

function setModule(id: string, patch: Partial<HydrationModuleSnapshot>): void {
  const idx = snapshot.modules.findIndex((m) => m.id === id);
  if (idx < 0) return;
  snapshot.modules[idx] = { ...snapshot.modules[idx], ...patch };
  emitProgress();
}

function getCurrentUserId(): number | null {
  try {
    const raw = localStorage.getItem("user_data");
    if (!raw) return null;
    const u = JSON.parse(raw) as Record<string, unknown>;
    const id = u.id ?? u.userId;
    if (typeof id === "number" && !Number.isNaN(id)) return id;
    if (id != null) {
      const n = parseInt(String(id), 10);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchAndCache(url: string, signal: AbortSignal): Promise<Response> {
  // Always hit the network during hydration (avoid serving stale IndexedDB for this run).
  const res = await fetch(url, {
    headers: { ...(getAuthHeaders() as Record<string, string>), "X-Bypass-Hydration-Cache": "true" },
    signal,
  });
  if (res.ok) {
    try {
      await putCachedResponse("GET", url, res.clone());
    } catch {
      // best-effort cache write
    }
  }
  return res;
}

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function abortOfflineHydration(): void {
  abortCtl?.abort();
}

export async function runOfflineHydration(): Promise<{ ok: boolean; modulesFailed: number }> {
  abortCtl?.abort();
  abortCtl = new AbortController();
  const signal = abortCtl.signal;
  const wallStart = performance.now();

  const scopeKey = getOfflineScopeKey();
  const modules: HydrationModuleSnapshot[] = HYDRATION_MODULES.map((m) => mod(m.id, m.labelKey));

  snapshot = {
    scopeKey,
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: undefined,
    fatalError: undefined,
    modules,
  };
  emitProgress();

  let modulesFailed = 0;

  const projectTaskIds = new Set<number>();
  const dailyTaskIds = new Set<number>();
  const contactIds: number[] = [];
  const offerIds: number[] = [];
  const saleIds: number[] = [];
  const serviceOrderIds: number[] = [];
  const dispatchIds: number[] = [];
  const installationIds: string[] = [];
  const supportTicketIds: number[] = [];
  const articleIds: string[] = [];

  const run = async (id: string, fn: () => Promise<void>) => {
    if (signal.aborted) return;
    if (!isHydrationModuleEnabled(id)) {
      setModule(id, { status: "skipped", done: 0, total: 0, durationMs: 0 });
      return;
    }
    const t0 = performance.now();
    setModule(id, { status: "running", error: undefined, durationMs: undefined });
    try {
      await fn();
      if (!signal.aborted) {
        setModule(id, { status: "done", durationMs: Math.round(performance.now() - t0) });
      }
    } catch (e: unknown) {
      if (signal.aborted) return;
      const msg = e instanceof Error ? e.message : String(e);
      setModule(id, { status: "error", error: msg, durationMs: Math.round(performance.now() - t0) });
      modulesFailed++;
    }
  };

  try {
    await run("projects_settings", async () => {
      const url = `${API_URL}/api/Projects/settings`;
      const res = await fetchAndCache(url, signal);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setModule("projects_settings", { done: 1, total: 1 });
    });

    const projectIds: number[] = [];
    await run("projects", async () => {
      let page = 1;
      let done = 0;
      let totalPages = 1;
      setModule("projects", { total: MAX_PROJECT_PAGES, done: 0 });
      while (page <= totalPages && page <= MAX_PROJECT_PAGES && !signal.aborted) {
        const url = `${API_URL}/api/Projects?pageNumber=${page}&pageSize=50`;
        const res = await fetchAndCache(url, signal);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = parseJsonSafe(await res.clone().text()) as Record<string, unknown> | null;
        const list = json?.projects ?? json?.Projects ?? (Array.isArray(json) ? json : null);
        if (Array.isArray(list)) {
          for (const p of list) {
            const row = p as Record<string, unknown>;
            const pid = row.id ?? row.Id;
            if (pid != null) projectIds.push(Number(pid));
          }
        }
        const hasNext =
          json?.hasNextPage === true ||
          json?.HasNextPage === true ||
          (typeof json?.totalPages === "number" && page < (json.totalPages as number)) ||
          (typeof json?.TotalPages === "number" && page < (json.TotalPages as number));
        totalPages = hasNext ? page + 1 : page;
        done++;
        setModule("projects", { done, total: Math.min(totalPages, MAX_PROJECT_PAGES) });
        if (!hasNext) break;
        page++;
      }
    });

    await run("project_tasks", async () => {
      const slice = projectIds.slice(0, MAX_PROJECT_TASK_FETCH);
      const total = Math.max(slice.length, 1);
      setModule("project_tasks", { total, done: 0 });
      let done = 0;
      if (slice.length === 0) {
        setModule("project_tasks", { done: 1, total: 1 });
        return;
      }
      await runPool(
        slice,
        HYDRATION_PARALLEL_FETCHES,
        async (pid) => {
          if (signal.aborted) return;
          const url = `${API_URL}/api/Tasks/project/${pid}`;
          const res = await fetchAndCache(url, signal);
          if (res.ok) {
            const json = parseJsonSafe(await res.clone().text());
            for (const tid of extractNumericIdsFromTaskArray(json)) {
              projectTaskIds.add(tid);
            }
          }
          done++;
          setModule("project_tasks", { done, total });
        },
        { signal },
      );
    });

    await run("daily_tasks", async () => {
      const uid = getCurrentUserId();
      if (uid == null) {
        setModule("daily_tasks", { done: 1, total: 1, status: "done" });
        return;
      }
      const url = `${API_URL}/api/Tasks/daily/user/${uid}`;
      const res = await fetchAndCache(url, signal);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = parseJsonSafe(await res.clone().text());
      for (const tid of extractNumericIdsFromTaskArray(json)) {
        dailyTaskIds.add(tid);
      }
      setModule("daily_tasks", { done: 1, total: 1 });
    });

    await run("contacts", async () => {
      let page = 1;
      let done = 0;
      setModule("contacts", { total: MAX_LIST_PAGES, done: 0 });
      while (page <= MAX_LIST_PAGES && !signal.aborted) {
        const url = `${API_URL}/api/Contacts?pageNumber=${page}&pageSize=50`;
        const res = await fetchAndCache(url, signal);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = parseJsonSafe(await res.clone().text()) as Record<string, unknown> | null;
        const contacts = json?.contacts ?? json?.data ?? json?.items;
        if (Array.isArray(contacts)) {
          for (const c of contacts) {
            const r = c as Record<string, unknown>;
            const cid = r.id ?? r.Id;
            if (cid != null) {
              const n = typeof cid === "number" ? cid : parseInt(String(cid), 10);
              if (!Number.isNaN(n)) contactIds.push(n);
            }
          }
        }
        const hasMore =
          json?.hasNextPage === true ||
          (Array.isArray(contacts) && contacts.length >= 50) ||
          (typeof json?.totalPages === "number" && page < (json.totalPages as number));
        done++;
        setModule("contacts", { done, total: Math.max(done, page + (hasMore ? 1 : 0)) });
        if (!hasMore) break;
        page++;
      }
    });

    await run("documents", async () => {
      const listUrl = `${API_URL}/api/Documents`;
      let r = await fetchAndCache(listUrl, signal);
      if (!r.ok) throw new Error(`Documents list HTTP ${r.status}`);
      const listJson = parseJsonSafe(await r.clone().text());
      const allDocs = extractDocumentsFromList(listJson);
      const imageDocs = allDocs
        .filter((d) => isImageDocumentFileType(d.fileType))
        .slice(0, HYDRATION_MAX_DOCUMENT_DOWNLOADS);

      const totalSteps = 2 + imageDocs.length;
      setModule("documents", { total: totalSteps, done: 0 });
      setModule("documents", { done: 1, total: totalSteps });

      r = await fetchAndCache(`${API_URL}/api/Documents/stats`, signal);
      if (!r.ok) {
        // stats optional
      }
      setModule("documents", { done: 2, total: totalSteps });

      let budgetLeft = HYDRATION_PREFETCH_BINARY_BUDGET_BYTES;
      let done = 2;
      for (const doc of imageDocs) {
        if (signal.aborted) break;
        const dlUrl = `${API_URL}/api/Documents/download/${doc.id}`;
        const dl = await fetch(dlUrl, {
          headers: { ...(getAuthHeaders() as Record<string, string>), "X-Bypass-Hydration-Cache": "true" },
          signal,
        });
        if (dl.ok) {
          const buf = await dl.arrayBuffer();
          if (buf.byteLength <= HYDRATION_CACHE_API_MAX_BYTES && buf.byteLength <= budgetLeft) {
            await putCachedResponse(
              "GET",
              dlUrl,
              new Response(buf, { status: dl.status, headers: new Headers(dl.headers) })
            );
            budgetLeft -= buf.byteLength;
          }
        }
        done++;
        setModule("documents", { done, total: totalSteps });
      }
    });

    const paginateSimple = async (
      moduleId: string,
      buildUrl: (page: number) => string,
      onPage?: (json: Record<string, unknown> | null) => void
    ) => {
      let page = 1;
      let done = 0;
      setModule(moduleId, { total: MAX_LIST_PAGES, done: 0 });
      while (page <= MAX_LIST_PAGES && !signal.aborted) {
        const url = buildUrl(page);
        const res = await fetchAndCache(url, signal);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = parseJsonSafe(await res.clone().text()) as Record<string, unknown> | null;
        onPage?.(json);
        const data = json?.data ?? json;
        const pagination = (data as Record<string, unknown>)?.pagination ?? json?.pagination;
        const p = pagination as Record<string, unknown> | undefined;
        const totalPages =
          typeof p?.totalPages === "number"
            ? (p.totalPages as number)
            : typeof p?.TotalPages === "number"
              ? (p.TotalPages as number)
              : page;
        const hasMore = page < totalPages;
        done++;
        setModule(moduleId, { done, total: Math.min(Math.max(totalPages, done), MAX_LIST_PAGES) });
        if (!hasMore) break;
        page++;
      }
    };

    await run("articles", async () => {
      let page = 1;
      let done = 0;
      setModule("articles", { total: MAX_LIST_PAGES, done: 0 });
      while (page <= MAX_LIST_PAGES && !signal.aborted) {
        const url = `${API_URL}/api/articles?page=${page}&limit=100`;
        const res = await fetchAndCache(url, signal);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = parseJsonSafe(await res.clone().text()) as Record<string, unknown> | null;
        articleIds.push(...extractArticleStringIdsFromArticlesList(json));
        const pagination = (json?.pagination as Record<string, unknown>) || {};
        const pages =
          typeof pagination.pages === "number"
            ? (pagination.pages as number)
            : typeof pagination.page === "number" &&
                typeof pagination.total === "number" &&
                typeof pagination.limit === "number" &&
                (pagination.limit as number) > 0
              ? Math.max(1, Math.ceil((pagination.total as number) / (pagination.limit as number)))
              : page;
        const hasMore = page < pages;
        done++;
        setModule("articles", { done, total: Math.min(Math.max(pages, done), MAX_LIST_PAGES) });
        if (!hasMore) break;
        page++;
      }
    });

    await run("offers", async () => {
      await paginateSimple("offers", (p) => `${API_URL}/api/offers?page=${p}&limit=100`, (json) => {
        offerIds.push(...extractNumericIdsFromList(json, ["offers"]));
      });
    });

    await run("sales", async () => {
      await paginateSimple("sales", (p) => `${API_URL}/api/sales?page=${p}&limit=100`, (json) => {
        saleIds.push(...extractNumericIdsFromList(json, ["sales"]));
      });
    });

    await run("service_orders", async () => {
      await paginateSimple(
        "service_orders",
        (p) => `${API_URL}/api/service-orders?page=${p}&pageSize=100`,
        (json) => {
          serviceOrderIds.push(
            ...extractNumericIdsFromList(json, ["serviceOrders", "service_orders", "ServiceOrders"])
          );
        }
      );
    });

    await run("dispatches", async () => {
      let page = 1;
      let done = 0;
      setModule("dispatches", { total: MAX_LIST_PAGES, done: 0 });
      while (page <= MAX_LIST_PAGES && !signal.aborted) {
        const url = `${API_URL}/api/dispatches?pageNumber=${page}&pageSize=50`;
        const res = await fetchAndCache(url, signal);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = parseJsonSafe(await res.clone().text()) as Record<string, unknown> | null;
        dispatchIds.push(...extractDispatchIds(json));
        const totalItems = typeof json?.totalItems === "number" ? (json.totalItems as number) : 0;
        const pageSize = typeof json?.pageSize === "number" ? (json.pageSize as number) : 50;
        const hasMore = totalItems > page * pageSize;
        done++;
        setModule("dispatches", { done, total: hasMore ? Math.min(done + 5, MAX_LIST_PAGES) : done });
        if (!hasMore) break;
        page++;
      }
    });

    await run("planning_hr", async () => {
      const uid = getCurrentUserId();
      const total = uid != null ? 4 : 3;
      setModule("planning_hr", { total, done: 0 });
      let done = 0;
      const bump = () => {
        done++;
        setModule("planning_hr", { done, total });
      };
      {
        const res = await fetchAndCache(
          `${API_URL}/api/planning/unassigned-jobs?page=1&page_size=50`,
          signal,
        );
        if (!res.ok) throw new Error(`Planning jobs HTTP ${res.status}`);
        bump();
      }
      {
        const res = await fetchAndCache(`${API_URL}/api/hr/departments`, signal);
        if (!res.ok) throw new Error(`HR departments HTTP ${res.status}`);
        bump();
      }
      {
        const res = await fetchAndCache(`${API_URL}/api/hr/employees`, signal);
        if (!res.ok) throw new Error(`HR employees HTTP ${res.status}`);
        bump();
      }
      if (uid != null) {
        const res = await fetchAndCache(`${API_URL}/api/planning/schedule/${uid}`, signal);
        if (!res.ok) throw new Error(`Planning schedule HTTP ${res.status}`);
        bump();
      }
    });

    await run("installations", async () => {
      let page = 1;
      let done = 0;
      setModule("installations", { total: MAX_LIST_PAGES, done: 0 });
      while (page <= MAX_LIST_PAGES && !signal.aborted) {
        const url = `${API_URL}/api/installations?page=${page}&page_size=50`;
        const res = await fetchAndCache(url, signal);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = parseJsonSafe(await res.clone().text()) as Record<string, unknown> | null;
        installationIds.push(...extractInstallationIds(json));
        const raw = json?.data ?? json;
        const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown>)?.installations;
        const hasMore = Array.isArray(arr) && arr.length >= 50;
        done++;
        setModule("installations", { done, total: hasMore ? Math.min(done + 5, MAX_LIST_PAGES) : done });
        if (!hasMore) break;
        page++;
      }
    });

    await run("support_tickets", async () => {
      const url = `${API_URL}/api/SupportTickets`;
      const res = await fetchAndCache(url, signal);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const listJson = parseJsonSafe(await res.clone().text());
      supportTicketIds.push(...extractSupportTicketIds(listJson));
      setModule("support_tickets", { done: 1, total: 1 });
    });

    await run("entity_details", async () => {
      const pi = uniqNumbers(projectIds).slice(0, MAX_ENTITY_DETAIL_PREFETCH);
      const ci = uniqNumbers(contactIds).slice(0, MAX_ENTITY_DETAIL_PREFETCH);
      const oi = uniqNumbers(offerIds).slice(0, MAX_ENTITY_DETAIL_PREFETCH);
      const si = uniqNumbers(saleIds).slice(0, MAX_ENTITY_DETAIL_PREFETCH);
      const soi = uniqNumbers(serviceOrderIds).slice(0, MAX_ENTITY_DETAIL_PREFETCH);
      const di = uniqNumbers(dispatchIds).slice(0, MAX_ENTITY_DETAIL_PREFETCH);
      const ii = uniqStrings(installationIds).slice(0, MAX_ENTITY_DETAIL_PREFETCH);
      const sti = uniqNumbers(supportTicketIds).slice(0, MAX_SUPPORT_DETAIL_PREFETCH);
      const om = oi.slice(0, MAX_PAYMENT_DETAIL_PREFETCH);
      const sm = si.slice(0, MAX_PAYMENT_DETAIL_PREFETCH);

      const pSub = pi.slice(0, MAX_PROJECT_SUB_PREFETCH);
      const art = uniqStrings(articleIds).slice(0, MAX_ARTICLE_DETAIL_PREFETCH);
      const tDetail = uniqNumbers([...projectTaskIds]).slice(0, MAX_TASK_DETAIL_PREFETCH);
      const dSub = di.slice(0, MAX_DISPATCH_SUB_PREFETCH);
      const oa = oi.slice(0, MAX_ACTIVITY_DETAIL_PREFETCH);
      const sa = si.slice(0, MAX_ACTIVITY_DETAIL_PREFETCH);

      const paySteps = om.length * 3 + sm.length * 3;
      const supSteps = sti.length * 3;
      const projectSubSteps = pSub.length * 5;
      const dispatchSubSteps = dSub.length * 5;
      const catalogAndMetaSteps = 6;

      const totalSteps =
        pi.length +
        ci.length +
        oi.length +
        si.length +
        soi.length +
        di.length +
        ii.length +
        paySteps +
        supSteps +
        projectSubSteps +
        art.length +
        tDetail.length +
        dispatchSubSteps +
        oa.length +
        sa.length +
        catalogAndMetaSteps +
        3;

      let done = 0;
      setModule("entity_details", { total: Math.max(totalSteps, 1), done: 0 });
      const bump = () => {
        done++;
        setModule("entity_details", { done, total: Math.max(totalSteps, 1) });
      };

      await runPool(
        pi,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/Projects/${id}`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        ci,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/Contacts/${id}`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        oi,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/offers/${id}`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        si,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/sales/${id}`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        soi,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/service-orders/${id}`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        di,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/dispatches/${id}`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        ii,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/installations/${id}`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        pSub,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/Projects/${id}/stats`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/Projects/${id}/team-members`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/Projects/${id}/notes`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/Projects/${id}/activity`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/Projects/${id}/links`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        art,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/articles/${encodeURIComponent(id)}`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        tDetail,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/Tasks/project-task/${id}`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        dSub,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/dispatches/${id}/time-entries`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/dispatches/${id}/expenses`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/dispatches/${id}/materials`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/dispatches/${id}/notes`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/dispatches/${id}/history`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        oa,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/offers/${id}/activities?page=1&limit=50`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        sa,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/sales/${id}/activities?page=1&limit=50`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        om,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/offers/${id}/payments`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/offers/${id}/payments/summary`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/offers/${id}/payment-plans`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        sm,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/sales/${id}/payments`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/sales/${id}/payments/summary`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/sales/${id}/payment-plans`, signal);
          bump();
        },
        { signal },
      );
      await runPool(
        sti,
        HYDRATION_PARALLEL_FETCHES,
        async (id) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/SupportTickets/${id}`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/SupportTickets/${id}/comments`, signal);
          bump();
          await fetchAndCache(`${API_URL}/api/SupportTickets/${id}/links`, signal);
          bump();
        },
        { signal },
      );
      if (!signal.aborted) {
        const tailUrls = [
          `${API_URL}/api/articles/categories`,
          `${API_URL}/api/articles/locations`,
          `${API_URL}/api/articles/transactions`,
          `${API_URL}/api/OfflineHydrationPreferences`,
          `${API_URL}/api/dispatches/statistics`,
          `${API_URL}/api/service-orders/statistics`,
          `${API_URL}/api/settings/app`,
          `${API_URL}/api/Notifications?limit=100`,
          `${API_URL}/api/Notifications/unread-count`,
        ];
        await runPool(
          tailUrls,
          HYDRATION_PARALLEL_FETCHES,
          async (url) => {
            if (signal.aborted) return;
            await fetchAndCache(url, signal);
            bump();
          },
          { signal },
        );
      }
    });

    await run("time_expenses", async () => {
      const proj = uniqNumbers([...projectTaskIds]).slice(0, MAX_TIME_TASK_PREFETCH);
      const daily = uniqNumbers([...dailyTaskIds]).slice(0, MAX_TIME_TASK_PREFETCH);
      const totalSteps = proj.length * 2 + daily.length * 2;
      let done = 0;
      setModule("time_expenses", { total: Math.max(totalSteps, 1), done: 0 });
      if (totalSteps === 0) {
        setModule("time_expenses", { done: 1, total: 1 });
        return;
      }
      await runPool(
        proj,
        HYDRATION_PARALLEL_FETCHES,
        async (tid) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/TaskTimeEntries/project-task/${tid}`, signal);
          done++;
          setModule("time_expenses", { done, total: Math.max(totalSteps, 1) });
          await fetchAndCache(`${API_URL}/api/TaskTimeEntries/summary/project-task/${tid}`, signal);
          done++;
          setModule("time_expenses", { done, total: Math.max(totalSteps, 1) });
        },
        { signal },
      );
      await runPool(
        daily,
        HYDRATION_PARALLEL_FETCHES,
        async (tid) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/TaskTimeEntries/daily-task/${tid}`, signal);
          done++;
          setModule("time_expenses", { done, total: Math.max(totalSteps, 1) });
          await fetchAndCache(`${API_URL}/api/TaskTimeEntries/summary/daily-task/${tid}`, signal);
          done++;
          setModule("time_expenses", { done, total: Math.max(totalSteps, 1) });
        },
        { signal },
      );
    });

    const lookupUrls = [
      ...HYDRATION_LOOKUP_SLUGS.map((slug) => `${API_URL}/api/Lookups/${slug}`),
      `${API_URL}/api/articles/groups`,
    ];

    await run("lookups", async () => {
      let done = 0;
      const total = lookupUrls.length;
      setModule("lookups", { total, done: 0 });
      await runPool(
        lookupUrls,
        HYDRATION_PARALLEL_FETCHES,
        async (url) => {
          if (signal.aborted) return;
          await fetchAndCache(url, signal);
          done++;
          setModule("lookups", { done, total });
        },
        { signal },
      );
    });

    await run("dynamic_forms", async () => {
      const url = `${API_URL}/api/DynamicForms`;
      const res = await fetchAndCache(url, signal);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setModule("dynamic_forms", { done: 1, total: 1 });
    });

    await run("workflows", async () => {
      setModule("workflows", { total: 2, done: 0 });
      await Promise.all([
        fetchAndCache(`${API_URL}/api/workflows`, signal),
        fetchAndCache(`${API_URL}/api/workflows/default`, signal),
      ]);
      setModule("workflows", { done: 2, total: 2 });
    });

    await run("directory", async () => {
      const uid = getCurrentUserId();
      const isMainAdmin = uid === 1;
      const steps = [() => fetchAndCache(`${API_URL}/api/Users`, signal)];
      if (isMainAdmin) steps.push(() => fetchAndCache(`${API_URL}/api/Tenants`, signal));
      steps.push(
        () => fetchAndCache(`${API_URL}/api/Skills`, signal),
        () => fetchAndCache(`${API_URL}/api/Roles`, signal)
      );
      if (uid != null && uid >= 2) {
        steps.push(() => fetchAndCache(`${API_URL}/api/Permissions/user/${uid}`, signal));
      }
      const totalSteps = steps.length;
      setModule("directory", { total: totalSteps, done: 0 });
      if (!signal.aborted) {
        await Promise.all(steps.map((fn) => fn()));
        setModule("directory", { done: totalSteps, total: totalSteps });
      }
    });

    await run("calendar", async () => {
      const listRes = await fetchAndCache(`${API_URL}/api/Calendar/events`, signal);
      if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
      const rawList = parseJsonSafe(await listRes.clone().text());
      const eventIds = extractCalendarEventStringIds(rawList);
      const capped = eventIds.slice(0, MAX_CALENDAR_EVENT_DETAIL_PREFETCH);
      const totalSteps = 2 + capped.length * 3;
      setModule("calendar", { total: Math.max(totalSteps, 1), done: 1 });

      const typesRes = await fetchAndCache(`${API_URL}/api/Calendar/event-types`, signal);
      if (!typesRes.ok) {
        // Optional reference data — list still cached above
      }
      setModule("calendar", { done: 2, total: Math.max(totalSteps, 1) });

      let done = 2;
      await runPool(
        capped,
        HYDRATION_PARALLEL_FETCHES,
        async (eid) => {
          if (signal.aborted) return;
          const enc = encodeURIComponent(eid);
          await fetchAndCache(`${API_URL}/api/Calendar/events/${enc}`, signal);
          done++;
          setModule("calendar", { done, total: Math.max(totalSteps, 1) });
          await fetchAndCache(`${API_URL}/api/Calendar/events/${enc}/attendees`, signal);
          done++;
          setModule("calendar", { done, total: Math.max(totalSteps, 1) });
          await fetchAndCache(`${API_URL}/api/Calendar/events/${enc}/reminders`, signal);
          done++;
          setModule("calendar", { done, total: Math.max(totalSteps, 1) });
        },
        { signal },
      );
    });

    await run("dashboards", async () => {
      const res = await fetchAndCache(`${API_URL}/api/Dashboards`, signal);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = parseJsonSafe(await res.clone().text());
      const ids = extractDashboardIds(raw).slice(0, MAX_DASHBOARD_DETAIL_PREFETCH);
      const totalSteps = 1 + ids.length;
      setModule("dashboards", { total: Math.max(totalSteps, 1), done: 1 });
      let done = 1;
      await runPool(
        ids,
        HYDRATION_PARALLEL_FETCHES,
        async (did) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/Dashboards/${did}`, signal);
          done++;
          setModule("dashboards", { done, total: Math.max(totalSteps, 1) });
        },
        { signal },
      );
    });

    await run("task_checklists", async () => {
      const proj = [...projectTaskIds];
      const daily = [...dailyTaskIds];
      const recurringIds = uniqNumbers(proj).slice(0, 20);
      const totalFetches =
        Math.min(MAX_CHECKLIST_FETCHES, proj.length + daily.length) + recurringIds.length;
      setModule("task_checklists", { total: Math.max(totalFetches, 1), done: 0 });
      let done = 0;
      if (totalFetches === 0) {
        setModule("task_checklists", { done: 1, total: 1 });
        return;
      }
      const checklistUrls: string[] = [];
      for (const tid of proj) {
        if (checklistUrls.length >= MAX_CHECKLIST_FETCHES) break;
        checklistUrls.push(`${API_URL}/api/TaskChecklists/project-task/${tid}`);
      }
      for (const tid of daily) {
        if (checklistUrls.length >= MAX_CHECKLIST_FETCHES) break;
        checklistUrls.push(`${API_URL}/api/TaskChecklists/daily-task/${tid}`);
      }
      if (checklistUrls.length) {
        await runPool(
          checklistUrls,
          HYDRATION_PARALLEL_FETCHES,
          async (url) => {
            if (signal.aborted) return;
            await fetchAndCache(url, signal);
            done++;
            setModule("task_checklists", { done, total: Math.max(totalFetches, 1) });
          },
          { signal },
        );
      }
      await runPool(
        recurringIds,
        HYDRATION_PARALLEL_FETCHES,
        async (tid) => {
          if (signal.aborted) return;
          await fetchAndCache(`${API_URL}/api/recurringtasks/project-task/${tid}`, signal);
          done++;
          setModule("task_checklists", { done, total: Math.max(totalFetches, 1) });
        },
        { signal },
      );
    });

    await run("sync_pull", async () => {
      let cursor: string | null = null;
      let n = 0;
      setModule("sync_pull", { total: MAX_SYNC_PULL_PAGES, done: 0 });
      while (n < MAX_SYNC_PULL_PAGES && !signal.aborted) {
        const q = cursor ? `cursor=${encodeURIComponent(cursor)}&limit=200` : `limit=200`;
        const url = `${API_URL}/api/sync/pull?${q}`;
        const res = await fetchAndCache(url, signal);
        if (!res.ok) {
          break;
        }
        const json = parseJsonSafe(await res.clone().text()) as Record<string, unknown> | null;
        const next = (json?.nextCursor as string) || (json?.NextCursor as string) || null;
        const hasMore = json?.hasMore === true || json?.HasMore === true;
        n++;
        setModule("sync_pull", { done: n, total: hasMore || next ? Math.min(n + 2, MAX_SYNC_PULL_PAGES) : n });
        if (!hasMore && !next) break;
        cursor = next;
        if (!cursor && hasMore) break;
      }
    });
  } catch (e: unknown) {
    if (!signal.aborted) {
      snapshot.fatalError = e instanceof Error ? e.message : String(e);
    }
  } finally {
    snapshot.running = false;
    snapshot.finishedAt = new Date().toISOString();
    const wallMs = Math.round(performance.now() - wallStart);
    snapshot.totalDurationMs = wallMs;
    savePersistedHydrationRun({
      scopeKey: snapshot.scopeKey,
      finishedAt: snapshot.finishedAt,
      startedAt: snapshot.startedAt,
      totalDurationMs: wallMs,
      modulesFailed,
      fatalError: snapshot.fatalError,
      modules: snapshot.modules.map((m) => ({
        id: m.id,
        labelKey: m.labelKey,
        status: m.status,
        done: m.done,
        total: m.total,
        error: m.error,
        durationMs: m.durationMs,
      })),
    });
    emitProgress();
    try {
      await saveManifest({
        lastFullHydrationAt: snapshot.finishedAt,
        lastHydrationError: modulesFailed || snapshot.fatalError ? snapshot.fatalError || "partial" : undefined,
        scopeKey,
      });
    } catch {
      // ignore
    }
  }

  return { ok: modulesFailed === 0 && !snapshot.fatalError, modulesFailed };
}
