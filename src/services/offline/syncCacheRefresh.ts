/**
 * After offline sync applies mutations, refresh hydrated GET caches so list screens
 * show server truth instead of stale pre-sync snapshots.
 */
import { API_URL } from "@/config/api";
import { getAuthHeaders } from "@/utils/apiHeaders";
import { putCachedResponse } from "./hydrationStore";

function absoluteApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL.replace(/\/$/, "")}${p}`;
}

function getCurrentUserIdFromStorage(): number | null {
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

/** List GET paths to re-fetch when these entity types were successfully synced. */
export function getHydrationRefreshPathsForEntityTypes(entityTypes: Iterable<string>): string[] {
  const paths = new Set<string>();
  for (const et of entityTypes) {
    if (et === "support_ticket" || et.startsWith("support_ticket")) {
      paths.add("/api/SupportTickets");
    }
    if (et === "calendar_event" || et.includes("calendar")) {
      paths.add("/api/Calendar/events");
      paths.add("/api/Calendar/event-types");
    }
    if (et === "daily_task") {
      const uid = getCurrentUserIdFromStorage();
      if (uid != null) paths.add(`/api/Tasks/daily/user/${uid}`);
    }
    if (et === "task") {
      // Refresh project task lists — we don't know which project, so refresh search
      paths.add("/api/tasks/search");
      paths.add("/api/tasks/overdue");
    }
    if (et === "project") {
      paths.add("/api/Projects?pageNumber=1&pageSize=50");
      paths.add("/api/Projects/settings");
    }
    if (et === "contact") {
      paths.add("/api/Contacts?pageNumber=1&pageSize=50");
    }
    if (et === "article") {
      paths.add("/api/articles?page=1&limit=100");
      paths.add("/api/articles/categories");
      paths.add("/api/articles/locations");
      paths.add("/api/articles/groups");
    }
    if (et === "document") {
      paths.add("/api/Documents");
      paths.add("/api/Documents/stats");
    }
    if (et === "dispatch" || et.startsWith("dispatch_")) {
      paths.add("/api/dispatches?pageNumber=1&pageSize=50");
      paths.add("/api/dispatches/statistics");
    }
    if (et.startsWith("planning_")) {
      paths.add("/api/planning/unassigned-jobs?page=1&page_size=50");
      const uid = getCurrentUserIdFromStorage();
      if (uid != null) {
        paths.add(`/api/planning/schedule/${uid}`);
        paths.add(`/api/planning/leaves/${uid}`);
      }
    }
    if (et.startsWith("hr_") || et === "hr_department") {
      paths.add("/api/hr/employees");
      paths.add("/api/hr/departments");
    }
    if (et === "offer") {
      paths.add("/api/offers?page=1&limit=50");
    }
    if (et === "sale") {
      paths.add("/api/sales?page=1&limit=50");
    }
    if (et === "service_order" || et === "service_order_job") {
      paths.add("/api/service-orders?page=1&pageSize=50");
      paths.add("/api/service-orders/statistics");
    }
    if (et === "installation") {
      paths.add("/api/installations?page=1&page_size=50");
    }
    if (et === "lookup_item" || et === "lookup_bulk" || et === "currency") {
      paths.add("/api/Lookups/currencies");
    }
    if (et === "stock_transaction") {
      paths.add("/api/articles/transactions");
    }
    if (et === "dynamic_form" || et === "dynamic_form_response") {
      paths.add("/api/DynamicForms");
    }
    if (et === "task_checklist" || et === "task_checklist_item") {
      // Checklists are per-task; can't refresh all, but notify listeners
    }
    if (et === "synced_email" || et === "email_account") {
      // Email sync is per-account; no global list to refresh
    }
  }
  return [...paths];
}

export async function refreshHydrationCachesForSyncedEntityTypes(entityTypes: string[]): Promise<void> {
  const paths = getHydrationRefreshPathsForEntityTypes(entityTypes);
  if (!paths.length || typeof navigator === "undefined" || !navigator.onLine) return;

  const headers: Record<string, string> = {
    ...(getAuthHeaders() as Record<string, string>),
    "X-Bypass-Hydration-Cache": "true",
  };

  await Promise.all(
    paths.map(async (path) => {
      const url = absoluteApiUrl(path);
      try {
        const res = await fetch(url, { method: "GET", headers });
        if (res.ok) await putCachedResponse("GET", url, res.clone());
      } catch {
        /* best-effort */
      }
    }),
  );
}

export function dispatchSyncCompletedForEntityTypes(entityTypes: string[]): void {
  if (!entityTypes.length || typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("offline:sync-completed", { detail: { entityTypes: [...new Set(entityTypes)] } }),
    );
  } catch {
    /* ignore */
  }
}

/** Refreshes hydrated GET caches and notifies listeners (e.g. tickets list). */
export async function runPostSyncCacheRefresh(entityTypes: string[]): Promise<void> {
  const uniq = [...new Set(entityTypes.filter(Boolean))];
  if (!uniq.length) return;
  await refreshHydrationCachesForSyncedEntityTypes(uniq);
  dispatchSyncCompletedForEntityTypes(uniq);
}
