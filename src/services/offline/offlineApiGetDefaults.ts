/**
 * Synthetic JSON for GET requests when offline cache misses (503 + offline/no-cache body).
 * Used by apiClient + axios so list screens degrade gracefully instead of throwing.
 */
import { API_URL } from "@/config/api";

const NUM = /^\d+$/;

function segments(endpoint: string): string[] {
  try {
    const raw = endpoint.startsWith("http")
      ? endpoint
      : `${API_URL.replace(/\/$/, "")}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const u = new URL(raw);
    return u.pathname
      .toLowerCase()
      .split("/")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function defaultDaySchedules(): Record<number, unknown> {
  const daySchedules: Record<number, unknown> = {};
  for (let d = 0; d <= 6; d++) {
    daySchedules[d] = {
      enabled: d >= 1 && d <= 5,
      startTime: "08:00",
      endTime: "17:00",
      lunchStart: "12:00",
      lunchEnd: "13:00",
      fullDayOff: d === 0 || d === 6,
    };
  }
  return daySchedules;
}

/**
 * @param endpoint Relative `/api/...` path including query string, or absolute URL.
 * @returns JSON body to use as successful GET data, or `null` if no safe default (detail views).
 */
export function getSyntheticDataForOfflineCacheMissGet(endpoint: string): unknown | null {
  const s = segments(endpoint);
  if (s[0] !== "api") return null;
  const p = s.slice(1);
  if (p.length === 0) return null;

  const head = p[0];

  // ── Auth (user info for activity/notes tabs) ──
  if (head === "auth" && p.length === 3 && p[1] === "user" && NUM.test(p[2])) {
    const id = parseInt(p[2], 10);
    return { id, email: "", firstName: "", lastName: "", fullName: "" };
  }

  // ── Contacts ──
  if (head === "contacts") {
    if (p.length === 1) {
      return {
        contacts: [],
        totalCount: 0,
        pageSize: 20,
        pageNumber: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    if (p[1] === "search") {
      return {
        contacts: [],
        totalCount: 0,
        pageSize: 20,
        pageNumber: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    if (p[1] === "exists") return false;
    if (p.length === 2 && NUM.test(p[1])) return null;
  }

  // ── Offers ──
  if (head === "offers") {
    if (p.length === 1) {
      return {
        data: {
          offers: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      };
    }
    if (p.length === 2 && NUM.test(p[1])) return null;
    if (p.length === 3 && NUM.test(p[1]) && p[2] === "activities") {
      return { activities: [], pagination: { page: 1, limit: 50, total: 0 } };
    }
  }

  // ── Sales ──
  if (head === "sales") {
    if (p.length === 1) {
      return {
        data: {
          sales: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      };
    }
    if (p.length === 2 && NUM.test(p[1])) return null;
    if (p.length === 3 && NUM.test(p[1]) && p[2] === "activities") {
      return { activities: [], pagination: { page: 1, limit: 50, total: 0 } };
    }
  }

  // ── Service orders ──
  if (head === "service-orders") {
    if (p.length === 1) {
      return {
        data: {
          serviceOrders: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        },
      };
    }
    if (p.length === 2 && p[1] === "statistics") {
      return { totalServiceOrders: 0, byStatus: {}, byPriority: {} };
    }
    if (p.length === 2 && NUM.test(p[1])) return null;
    if (p.length === 3 && NUM.test(p[1])) {
      const sub = p[2];
      if (["dispatches", "time-entries", "expenses", "materials", "notes"].includes(sub)) return [];
      if (sub === "full-summary") return {};
    }
  }

  // ── Dispatches ──
  if (head === "dispatches") {
    if (p.length === 1) {
      return { data: [], totalItems: 0, pageNumber: 1, pageSize: 50 };
    }
    if (p.length === 2 && p[1] === "statistics") {
      return { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 };
    }
    if (p.length === 2 && NUM.test(p[1])) return null;
    if (p.length === 3 && NUM.test(p[1])) {
      const sub = p[2];
      if (["time-entries", "expenses", "materials", "notes", "history"].includes(sub)) return [];
    }
  }

  // ── Installations ──
  if (head === "installations") {
    if (p.length === 1) return { data: [] };
    if (p.length === 2) return null;
  }

  // ── Support tickets ──
  if (head === "supporttickets") {
    if (p.length === 1) return [];
    if (p.length === 2 && p[1] === "search") return [];
    if (p.length === 2 && NUM.test(p[1])) return null;
    if (p.length === 3 && NUM.test(p[1])) {
      if (p[2] === "comments" || p[2] === "links") return [];
    }
  }

  // ── Dynamic forms, workflows ──
  if (head === "dynamicforms" && p.length === 1) return [];
  if (head === "dynamicforms" && p.length === 3 && NUM.test(p[1]) && p[2] === "responses") {
    return [];
  }
  if (
    head === "dynamicforms" &&
    p.length === 4 &&
    NUM.test(p[1]) &&
    p[2] === "responses" &&
    p[3] === "count"
  ) {
    return { count: 0 };
  }
  if (head === "workflows") {
    if (p.length === 1) return [];
    if (p.length === 2 && p[1] === "default") return null;
    if (p.length === 2 && NUM.test(p[1])) return null;
    if (p.length === 3 && NUM.test(p[1]) && p[2] === "triggers") return [];
    if (p.length === 3 && NUM.test(p[1]) && p[2] === "executions") return [];
  }

  // ── Workflow approvals / executions (lists) ──
  if (head === "workflow-approvals" && p.length === 1) return [];
  if (head === "workflow-executions" && p.length === 1) return [];

  // ── Directory ──
  if (head === "users" && p.length === 1) return [];
  if (head === "skills" && p.length === 1) return [];

  // ── Roles ──
  if (head === "roles" && p.length === 1) return [];
  // Empty map: usersApi uses `rolesData.data || rolesData || {}`
  if (head === "roles" && p[1] === "all-user-roles") return {};
  if (head === "roles" && p.length === 3 && p[1] === "user" && NUM.test(p[2])) {
    return [];
  }

  // ── Notifications ──
  if (head === "notifications") {
    if (p.length === 2 && p[1] === "unread-count") return { unreadCount: 0 };
    if (p.length === 1) return { notifications: [], unreadCount: 0, totalCount: 0 };
  }

  // ── App settings ──
  if (head === "settings" && p[1] === "app") {
    if (p.length === 2) return { data: [] };
    if (p.length === 3) return { data: { value: null } };
  }

  // ── Numbering (settings) ──
  if (head === "settings" && p[1] === "numbering" && p.length === 3) {
    return { data: null };
  }

  // ── Offline hydration prefs ──
  if (head === "offlinehydrationpreferences" && p.length === 1) {
    return { success: true, data: { modules: {} } };
  }

  // ── Lookups ──
  if (head === "lookups" && p.length === 2) {
    if (p[1] === "currencies") return { currencies: [], totalCount: 0 };
    return { items: [], totalCount: 0 };
  }
  if (head === "lookups" && p.length === 3 && p[1] === "currencies") {
    return null; // detail placeholder via offlineDetailPlaceholders if needed
  }

  // ── Documents ──
  if (head === "documents") {
    if (p.length === 1) return { data: [] };
    if (p.length === 2 && p[1] === "stats") {
      return {
        totalFiles: 0,
        totalSize: 0,
        crmFiles: 0,
        fieldFiles: 0,
        byModule: { contacts: 0, sales: 0, offers: 0, services: 0, projects: 0, field: 0 },
        recentActivity: 0,
      };
    }
    if (p.length === 2) return null;
  }

  // ── Task checklists ──
  if (
    head === "taskchecklists" &&
    p.length === 3 &&
    (p[1] === "project-task" || p[1] === "daily-task")
  ) {
    return [];
  }

  // ── Task time entries (query + summaries already use fetch helpers) ──
  if (head === "tasktimeentries" && p[1] === "query") return [];

  // ── Sync pull / history ──
  if (head === "sync" && p[1] === "pull") {
    return { items: [], nextCursor: null, hasMore: false, HasMore: false };
  }
  if (head === "sync" && p[1] === "history") {
    return { items: [], page: 1, pageSize: 20, totalCount: 0 };
  }

  // ── Recurring tasks ──
  if (head === "recurringtasks") {
    if (p.length === 2 && p[1] === "active") return [];
    if (p.length === 3 && p[1] === "project-task" && NUM.test(p[2])) return [];
    if (p.length === 3 && p[1] === "daily-task" && NUM.test(p[2])) return [];
    if (p.length === 3 && NUM.test(p[1]) && p[2] === "logs") return [];
    if (p.length === 3 && NUM.test(p[1]) && p[2] === "next-occurrence") return { nextOccurrence: null };
    if (p.length === 2 && NUM.test(p[1])) return null;
  }

  // ── Planning / HR schedules ──
  if (head === "planning") {
    if (p[1] === "unassigned-jobs") {
      return {
        success: true,
        data: {
          data: [],
          pageNumber: 1,
          pageSize: 50,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }
    if (p[1] === "leaves" && p.length === 3 && NUM.test(p[2])) {
      return { success: true, data: [] };
    }
    if (p[1] === "schedule" && p.length === 3 && NUM.test(p[2])) {
      const uid = parseInt(p[2], 10);
      return {
        success: true,
        data: {
          userId: uid,
          userName: "",
          daySchedules: defaultDaySchedules(),
          leaves: [],
        },
      };
    }
  }

  // ── Articles (apiFetch callers, if any) ──
  if (head === "articles" && p.length === 1) {
    return { data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } };
  }
  if (head === "articles" && p.length === 2 && p[1] === "groups") {
    return { items: [], totalCount: 0 };
  }
  if (head === "articles" && p.length === 2 && p[1] === "transactions") {
    return [];
  }
  if (head === "articles" && p.length === 3 && p[2] === "transactions" && NUM.test(p[1])) {
    return [];
  }

  // ── Signatures (user profile) ──
  if (head === "signatures" && p.length === 2 && p[1] === "me") {
    return { signatureUrl: null };
  }

  // ── Tenants (main admin) ──
  if (head === "tenants" && p.length === 1) {
    return [];
  }

  // ── Offer/Sale payments (some screens use apiFetch; paymentsApi also uses fetch) ──
  if (head === "offers" && p.length === 3 && NUM.test(p[1]) && p[2] === "payment-plans") {
    return [];
  }
  if (head === "sales" && p.length === 3 && NUM.test(p[1]) && p[2] === "payment-plans") {
    return [];
  }
  if (head === "offers" && p.length === 3 && NUM.test(p[1]) && p[2] === "payments") {
    return [];
  }
  if (head === "offers" && p.length === 4 && NUM.test(p[1]) && p[2] === "payments" && p[3] === "summary") {
    return {
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentStatus: "unpaid",
      paymentCount: 0,
      currency: "TND",
    };
  }
  if (head === "sales" && p.length === 3 && NUM.test(p[1]) && p[2] === "payments") {
    return [];
  }
  if (head === "sales" && p.length === 4 && NUM.test(p[1]) && p[2] === "payments" && p[3] === "summary") {
    return {
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentStatus: "unpaid",
      paymentCount: 0,
      currency: "TND",
    };
  }
  if (
    (head === "offers" || head === "sales") &&
    p.length === 4 &&
    NUM.test(p[1]) &&
    p[2] === "payments" &&
    p[3] === "statement"
  ) {
    return { lines: [], payments: [], totals: {} };
  }

  // ── TaskTimeEntries timer (active timer GET) ──
  if (head === "tasktimeentries" && p.length === 3 && p[1] === "timer" && p[2] === "active") {
    return null;
  }

  // ── Connected email accounts (lists / tabs) ──
  if (head === "email-accounts") {
    if (p.length === 1) return [];
    if (p.length === 2 && p[1] === "custom") return [];
    if (p.length === 3 && p[2] === "blocklist") return [];
    if (p.length === 3 && p[2] === "emails") {
      return { items: [], totalCount: 0, page: 1, pageSize: 25 };
    }
    if (p.length === 3 && p[2] === "calendar-events") {
      return { items: [], totalCount: 0, page: 1, pageSize: 25 };
    }
  }

  // ── Calendar (shared axios instance) ──
  if (head === "calendar") {
    if (p.length === 2 && p[1] === "events") return [];
    if (p.length === 2 && p[1] === "event-types") return [];
    if (p.length === 3 && p[1] === "events" && p[2] === "date-range") return [];
    if (p.length === 4 && p[1] === "events" && p[3] === "attendees") {
      return [];
    }
    if (p.length === 4 && p[1] === "events" && p[3] === "reminders") {
      return [];
    }
    if (p.length === 4 && p[1] === "events" && p[2] === "contact" && NUM.test(p[3])) {
      return [];
    }
  }

  // ── Subscriptions (billing settings) ──
  if (head === "subscriptions" && p.length === 2) {
    if (p[1] === "current") {
      return {
        id: 0,
        tenantId: 0,
        planKey: "free",
        status: "active",
        interval: "monthly",
        pricePerSeat: 0,
        currency: "TND",
        seats: 1,
        currentPeriodStart: "1970-01-01T00:00:00.000Z",
        currentPeriodEnd: "1970-01-01T00:00:00.000Z",
        trialEnd: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        createdAt: "1970-01-01T00:00:00.000Z",
        updatedAt: "1970-01-01T00:00:00.000Z",
      };
    }
    // Include a minimal "free" plan so Settings UI can resolve `currentPlan` when offline stub uses planKey `free`
    if (p[1] === "plans") {
      return [
        {
          id: 0,
          planKey: "free",
          name: "Free",
          description: "",
          monthlyPricePerSeat: 0,
          yearlyPricePerSeat: 0,
          currency: "TND",
          maxSeats: null,
          creditsPerPeriod: 0,
          features: [],
          isActive: true,
          sortOrder: 0,
        },
      ];
    }
    if (p[1] === "usage" || p[1] === "invoices") return [];
    if (p[1] === "billing-portal") return { url: "" };
  }

  // ── Permissions (if any caller uses apiFetch) ──
  if (head === "permissions") {
    if (p.length === 3 && p[1] === "role" && NUM.test(p[2])) {
      return { roleId: parseInt(p[2], 10), roleName: "", permissions: [] };
    }
    if (p.length === 3 && p[1] === "user" && NUM.test(p[2])) {
      return { userId: parseInt(p[2], 10), permissions: [] };
    }
  }

  // ── Dashboards (dashboard builder) ──
  if (head === "dashboards") {
    if (p.length === 1) return [];
    if (p.length === 2 && NUM.test(p[1])) return null;
  }

  // ── Projects (apiFetch callers) ──
  if (head === "projects") {
    if (p.length === 1) {
      return {
        projects: [],
        totalCount: 0,
        pageSize: 20,
        pageNumber: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    if (p[1] === "search") {
      return { projects: [], totalCount: 0 };
    }
    if (p.length === 2 && p[1] === "settings") return { data: [] };
    if (p.length === 2 && NUM.test(p[1])) return null;
  }

  return null;
}
