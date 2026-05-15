import { getOfflineScopeKey } from "./syncEngine";
import {
  fetchOfflineHydrationPreferences,
  putOfflineHydrationPreferences,
} from "@/services/api/offlineHydrationPreferencesApi";
import { toast } from "@/hooks/use-toast";
import i18n from "@/lib/i18n";

const STORAGE_PREFIX = "offline-hydration-module-prefs";

/** In-memory copy of compact prefs (only explicit `false` keys). Cleared on logout. */
let memoryCache: Record<string, boolean> | null = null;

/**
 * Ordered list of hydration modules (labels via i18n `labelKey`).
 * When a key is missing in storage, the module defaults to enabled (backward compatible).
 */
export const HYDRATION_MODULES = [
  { id: "projects_settings", labelKey: "syncDashboard.hydration.modules.projectsSettings" },
  { id: "projects", labelKey: "syncDashboard.hydration.modules.projects" },
  { id: "project_tasks", labelKey: "syncDashboard.hydration.modules.projectTasks" },
  { id: "daily_tasks", labelKey: "syncDashboard.hydration.modules.dailyTasks" },
  { id: "contacts", labelKey: "syncDashboard.hydration.modules.contacts" },
  { id: "documents", labelKey: "syncDashboard.hydration.modules.documents" },
  { id: "articles", labelKey: "syncDashboard.hydration.modules.articles" },
  { id: "offers", labelKey: "syncDashboard.hydration.modules.offers" },
  { id: "sales", labelKey: "syncDashboard.hydration.modules.sales" },
  { id: "service_orders", labelKey: "syncDashboard.hydration.modules.serviceOrders" },
  { id: "dispatches", labelKey: "syncDashboard.hydration.modules.dispatches" },
  { id: "planning_hr", labelKey: "syncDashboard.hydration.modules.planningHr" },
  { id: "installations", labelKey: "syncDashboard.hydration.modules.installations" },
  { id: "entity_details", labelKey: "syncDashboard.hydration.modules.entityDetails" },
  { id: "time_expenses", labelKey: "syncDashboard.hydration.modules.timeExpenses" },
  { id: "support_tickets", labelKey: "syncDashboard.hydration.modules.supportTickets" },
  { id: "lookups", labelKey: "syncDashboard.hydration.modules.lookups" },
  { id: "dynamic_forms", labelKey: "syncDashboard.hydration.modules.dynamicForms" },
  { id: "workflows", labelKey: "syncDashboard.hydration.modules.workflows" },
  { id: "directory", labelKey: "syncDashboard.hydration.modules.directory" },
  { id: "calendar", labelKey: "syncDashboard.hydration.modules.calendar" },
  { id: "dashboards", labelKey: "syncDashboard.hydration.modules.dashboards" },
  { id: "task_checklists", labelKey: "syncDashboard.hydration.modules.taskChecklists" },
  { id: "sync_pull", labelKey: "syncDashboard.hydration.modules.syncPull" },
] as const;

export type HydrationModuleId = (typeof HYDRATION_MODULES)[number]["id"];

/** Lookup list endpoints used during hydration (404 = empty; not fatal). */
export const HYDRATION_LOOKUP_SLUGS = [
  "article-categories",
  "article-statuses",
  "service-categories",
  "locations",
  "countries",
  "priorities",
  "event-types",
  "task-statuses",
  "project-statuses",
  "project-types",
  "offer-statuses",
  "sale-statuses",
  "service-order-statuses",
  "dispatch-statuses",
  "offer-categories",
  "offer-sources",
  "technician-statuses",
  "leave-types",
  "skills",
  "installation-types",
  "installation-categories",
  "work-types",
  "expense-types",
  "form-categories",
  "document-types",
  "currencies",
] as const;

function prefsStorageKey(): string {
  return `${STORAGE_PREFIX}:${getOfflineScopeKey()}`;
}

function readLocalStoragePrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(prefsStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeLocalStoragePrefs(prefs: Record<string, boolean>): void {
  try {
    localStorage.setItem(prefsStorageKey(), JSON.stringify(prefs));
  } catch {
    // ignore quota / private mode
  }
}

/** Only persist explicit `false` entries (matches API + backend). */
export function normalizeHydrationPrefsForApi(prefs: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const k of Object.keys(prefs)) {
    if (prefs[k] === false) out[k] = false;
  }
  return out;
}

export function clearHydrationPreferencesMemory(): void {
  memoryCache = null;
}

export function loadHydrationModulePrefs(): Record<string, boolean> {
  if (memoryCache != null) {
    return { ...memoryCache };
  }
  return readLocalStoragePrefs();
}

export function saveHydrationModulePrefs(prefs: Record<string, boolean>): void {
  const compact = normalizeHydrationPrefsForApi(prefs);
  memoryCache = { ...compact };
  writeLocalStoragePrefs(compact);
}

/** Default: enabled when preference is unset. */
export function isHydrationModuleEnabled(id: string): boolean {
  const prefs = loadHydrationModulePrefs();
  if (Object.prototype.hasOwnProperty.call(prefs, id)) {
    return prefs[id] !== false;
  }
  return true;
}

export function setHydrationModuleEnabled(id: string, enabled: boolean): void {
  const prefs = { ...loadHydrationModulePrefs() };
  if (enabled) {
    delete prefs[id];
  } else {
    prefs[id] = false;
  }
  saveHydrationModulePrefs(prefs);
  void persistToServer();
}

export function setAllHydrationModulesEnabled(enabled: boolean): void {
  if (enabled) {
    saveHydrationModulePrefs({});
    void persistToServer();
    return;
  }
  const next: Record<string, boolean> = {};
  for (const m of HYDRATION_MODULES) {
    next[m.id] = false;
  }
  saveHydrationModulePrefs(next);
  void persistToServer();
}

async function persistToServer(): Promise<void> {
  const modules = normalizeHydrationPrefsForApi(loadHydrationModulePrefs());
  const { data, error } = await putOfflineHydrationPreferences(modules);
  if (error) {
    console.warn("[offlineHydrationPreferences] Save failed (will retry on next sync):", error);
    // Avoid noisy toasts when the device is fully offline (local prefs still apply).
    if (typeof navigator !== "undefined" && navigator.onLine) {
      toast({
        title: i18n.t("offlineHydration.saveFailed", { ns: "settings" }),
        variant: "destructive",
      });
    }
    return;
  }
  const body = data as {
    success?: boolean;
    queued?: boolean;
    data?: { modules?: Record<string, boolean> };
  } | null;
  // Offline queue: mutation was stored locally; server modules unchanged — keep current memory/localStorage.
  if (body?.queued) {
    return;
  }
  if (body?.success === false) {
    return;
  }
  if (body?.success && body.data?.modules !== undefined) {
    memoryCache = { ...body.data.modules };
    writeLocalStoragePrefs(memoryCache);
  }
}

/**
 * Load preferences from the API for the current user/tenant, update memory + local cache.
 * If the server has no row and legacy localStorage had data, uploads once.
 * @returns whether the server round-trip succeeded (false = using local cache only).
 */
export async function syncHydrationPreferencesFromServer(): Promise<boolean> {
  const localSnapshot = readLocalStoragePrefs();
  const { data, error } = await fetchOfflineHydrationPreferences();

  if (error || data == null) {
    memoryCache = { ...localSnapshot };
    return false;
  }

  const envelope = data as { success?: boolean; data?: { modules?: Record<string, boolean> } };
  if (envelope.success === false) {
    memoryCache = { ...localSnapshot };
    return false;
  }

  let serverModules = envelope?.data?.modules ?? {};

  if (Object.keys(serverModules).length === 0 && Object.keys(localSnapshot).length > 0) {
    const putRes = await putOfflineHydrationPreferences(normalizeHydrationPrefsForApi(localSnapshot));
    const putBody = putRes.data as {
      success?: boolean;
      queued?: boolean;
      data?: { modules?: Record<string, boolean> };
    } | null;
    const migrated = !putRes.error && putBody?.success === true && !putBody?.queued;
    if (migrated) {
      serverModules =
        putBody.data?.modules !== undefined
          ? { ...putBody.data.modules }
          : normalizeHydrationPrefsForApi(localSnapshot);
    } else {
      // Keep local toggles if migration upload failed, was queued offline, or API returned failure.
      serverModules = normalizeHydrationPrefsForApi(localSnapshot);
    }
  }

  memoryCache = { ...serverModules };
  writeLocalStoragePrefs(memoryCache);
  return true;
}
