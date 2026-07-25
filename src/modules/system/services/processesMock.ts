/**
 * Mock catalogue of administrative Processes (Phase 1 — FE only).
 * Every entry is anchored to a real backend service / table in this repo.
 * When the backend Processes tables land (Phase 2) this file is replaced
 * by a live API service; the shape is intentionally close to the future DTOs.
 */

export type ProcessStatus = "idle" | "running" | "paused" | "failed" | "blocked";
export type ScheduleType = "manual" | "interval" | "cron";
export type WorkspaceId =
  | "sales"
  | "purchases"
  | "service"
  | "projects"
  | "hr"
  | "reporting"
  | "integrations"
  | "lookups"
  | "service-desk"
  | "administration";

export interface ProcessRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  durationMs: number;
  status: "success" | "failed" | "blocked" | "cancelled";
  itemsProcessed: number;
  error?: string;
  blockReason?: string;
  triggeredBy: "schedule" | "manual";
}

export interface DiagnosticCheck {
  label: string;
  ok: boolean;
  detail?: string;
}

export interface ProcessDefinition {
  key: string;
  name: string;
  description: string;
  workspace: WorkspaceId;
  module: string;
  anchor: string;
  scheduleType: ScheduleType;
  scheduleHuman: string;
  intervalMinutes?: number;
  cronExpression?: string;
  timezone: string;
  isEnabled: boolean;
  isPaused: boolean;
  status: ProcessStatus;
  lastRunAt?: string;
  lastDurationMs?: number;
  lastItems?: number;
  lastError?: string;
  blockReason?: string;
  nextRunAt?: string;
  consecutiveFailures: number;
  successRate30: number;
  settings: { label: string; value: string | number | boolean }[];
  diagnostics: DiagnosticCheck[];
  history: ProcessRun[];
}

const now = Date.now();
const iso = (offsetMin: number) => new Date(now + offsetMin * 60_000).toISOString();

const mkHistory = (
  baseStatus: ProcessRun["status"],
  itemsBase: number,
  intervalMin: number,
  failEvery = 0,
): ProcessRun[] =>
  Array.from({ length: 12 }).map((_, i) => {
    const failed = failEvery > 0 && i % failEvery === 0 && i !== 0;
    const status: ProcessRun["status"] = failed ? "failed" : baseStatus;
    const startMin = -intervalMin * (i + 1);
    const dur = 1_200 + Math.round(Math.random() * 8_000);
    return {
      id: `run-${i}`,
      startedAt: iso(startMin),
      finishedAt: iso(startMin + Math.round(dur / 60_000)),
      durationMs: dur,
      status,
      itemsProcessed: failed ? 0 : itemsBase + Math.round(Math.random() * itemsBase),
      error: failed ? "Connection reset by peer" : undefined,
      triggeredBy: i === 0 ? "manual" : "schedule",
    };
  });

const okChecks = (labels: string[]): DiagnosticCheck[] =>
  labels.map((label) => ({ label, ok: true }));

const mixChecks = (items: [string, boolean, string?][]): DiagnosticCheck[] =>
  items.map(([label, ok, detail]) => ({ label, ok, detail }));

export const PROCESSES: ProcessDefinition[] = [
  // ---------------- SALES ----------------
  {
    key: "sales.offer-expiration",
    name: "Offer expiration",
    description: "Flip offers past their ValidUntil date to 'expired' and notify the owner.",
    workspace: "sales", module: "Offers", anchor: "Offers/OfferService",
    scheduleType: "cron", scheduleHuman: "Daily at 02:00", cronExpression: "0 2 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-720), lastDurationMs: 4_200, lastItems: 6, nextRunAt: iso(720),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Grace period (days)", value: 0 }, { label: "Notify owner", value: true }],
    diagnostics: okChecks(["Database reachable", "Offers module enabled", "Notification channel ready"]),
    history: mkHistory("success", 5, 1440),
  },
  {
    key: "sales.deal-rot",
    name: "Deal rot watchdog",
    description: "Nudge owners of deals with no activity beyond the threshold.",
    workspace: "sales", module: "Deals", anchor: "Deals/DealService",
    scheduleType: "cron", scheduleHuman: "Weekdays at 08:30", cronExpression: "30 8 * * 1-5", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-600), lastDurationMs: 1_800, lastItems: 3, nextRunAt: iso(840),
    consecutiveFailures: 0, successRate30: 96,
    settings: [{ label: "Idle threshold (days)", value: 14 }],
    diagnostics: okChecks(["Deals module enabled", "Notification channel ready"]),
    history: mkHistory("success", 4, 1440, 6),
  },
  {
    key: "sales.invoice-overdue",
    name: "Invoice overdue refresh",
    description: "Move invoices past due date to status 'overdue'.",
    workspace: "sales", module: "Invoices", anchor: "Invoices module + entity-status config",
    scheduleType: "interval", scheduleHuman: "Every 6 hours", intervalMinutes: 360, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-90), lastDurationMs: 2_100, lastItems: 12, nextRunAt: iso(270),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Grace period (days)", value: 1 }],
    diagnostics: okChecks(["Database reachable", "Invoice statuses configured"]),
    history: mkHistory("success", 10, 360),
  },
  {
    key: "sales.payment-reminders-customer",
    name: "Payment reminders (customers)",
    description: "Send tiered payment reminders to customers with overdue invoices.",
    workspace: "sales", module: "Payments", anchor: "Payments/PaymentReminderService (BackgroundService)",
    scheduleType: "cron", scheduleHuman: "Daily at 09:00", cronExpression: "0 9 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "blocked",
    lastRunAt: iso(-180), lastDurationMs: 400, lastItems: 0, nextRunAt: iso(1260),
    blockReason: "SMTP account not configured for tenant",
    consecutiveFailures: 3, successRate30: 78,
    settings: [
      { label: "Tier 1 (days after due)", value: 3 },
      { label: "Tier 2 (days after due)", value: 10 },
      { label: "Final notice (days)", value: 21 },
    ],
    diagnostics: mixChecks([
      ["SMTP account configured", false, "No default sender for tenant"],
      ["Reminder templates present", true],
      ["Contacts with valid emails", true],
    ]),
    history: mkHistory("success", 8, 1440, 4),
  },
  {
    key: "sales.recurring-invoices",
    name: "Recurring invoice generator",
    description: "Generate invoices from recurring templates.",
    workspace: "sales", module: "Invoices", anchor: "Invoices module",
    scheduleType: "cron", scheduleHuman: "Daily at 01:00", cronExpression: "0 1 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-780), lastDurationMs: 3_400, lastItems: 4, nextRunAt: iso(660),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Numbering series", value: "REC-{{YYYY}}" }],
    diagnostics: okChecks(["Numbering series exists", "Recurring templates present"]),
    history: mkHistory("success", 3, 1440),
  },
  {
    key: "sales.fiscal-compliance",
    name: "Fiscal stamp / RS compliance recompute",
    description: "Recompute fiscal stamp and retenue-à-la-source fields on invoices.",
    workspace: "sales", module: "Invoices", anchor: "08_fiscal_stamp.sql + RetenueSource module",
    scheduleType: "cron", scheduleHuman: "Nightly at 03:15", cronExpression: "15 3 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-500), lastDurationMs: 5_800, lastItems: 42, nextRunAt: iso(940),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Recompute window (days)", value: 30 }],
    diagnostics: okChecks(["Fiscal config present", "Compliance flags enabled"]),
    history: mkHistory("success", 40, 1440),
  },
  {
    key: "sales.installation-warranty",
    name: "Installation warranty reminders",
    description: "Notify at T-30 and T-7 before installation warranty expiry.",
    workspace: "sales", module: "Installations", anchor: "Installations/InstallationService",
    scheduleType: "cron", scheduleHuman: "Daily at 07:00", cronExpression: "0 7 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-300), lastDurationMs: 900, lastItems: 2, nextRunAt: iso(1140),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Reminder offsets (days)", value: "30,7" }],
    diagnostics: okChecks(["Installations enabled", "Warranty field populated"]),
    history: mkHistory("success", 2, 1440),
  },

  // ---------------- PURCHASES ----------------
  {
    key: "purchases.invoice-gr-match",
    name: "Supplier invoice ↔ goods receipt matching",
    description: "Match supplier invoices to received goods and flag mismatches.",
    workspace: "purchases", module: "Purchases", anchor: "SupplierInvoiceService + GoodsReceiptService",
    scheduleType: "interval", scheduleHuman: "Every 4 hours", intervalMinutes: 240, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-120), lastDurationMs: 6_800, lastItems: 18, nextRunAt: iso(120),
    consecutiveFailures: 0, successRate30: 92,
    settings: [{ label: "Tolerance (%)", value: 2 }],
    diagnostics: okChecks(["Supplier module enabled", "Goods receipts present"]),
    history: mkHistory("success", 15, 240, 7),
  },
  {
    key: "purchases.preferred-supplier",
    name: "Preferred-supplier integrity",
    description: "Enforce one preferred supplier per article; flag violations.",
    workspace: "purchases", module: "Articles", anchor: "ArticleSupplierService",
    scheduleType: "cron", scheduleHuman: "Sundays at 04:00", cronExpression: "0 4 * * 0", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1440 * 3), lastDurationMs: 2_400, lastItems: 0, nextRunAt: iso(1440 * 4),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Auto-fix", value: false }],
    diagnostics: okChecks(["Articles table reachable", "Constraint present"]),
    history: mkHistory("success", 0, 10080),
  },
  {
    key: "purchases.low-stock",
    name: "Low-stock notifications",
    description: "Alert buyers when article stock falls below its reorder point.",
    workspace: "purchases", module: "Articles", anchor: "lowStockNotificationService",
    scheduleType: "interval", scheduleHuman: "Every 30 minutes", intervalMinutes: 30, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "running",
    lastRunAt: iso(-2), lastDurationMs: 1_100, lastItems: 5, nextRunAt: iso(28),
    consecutiveFailures: 0, successRate30: 99,
    settings: [{ label: "Buffer (%)", value: 10 }],
    diagnostics: okChecks(["Stock module enabled", "Notification channel ready"]),
    history: mkHistory("success", 4, 30, 20),
  },
  {
    key: "purchases.po-autoclose",
    name: "Purchase order auto-close",
    description: "Close purchase orders once all lines have been received.",
    workspace: "purchases", module: "Purchases", anchor: "PurchaseOrderService",
    scheduleType: "cron", scheduleHuman: "Daily at 02:30", cronExpression: "30 2 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-690), lastDurationMs: 1_900, lastItems: 7, nextRunAt: iso(750),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Only fully received", value: true }],
    diagnostics: okChecks(["PO module enabled"]),
    history: mkHistory("success", 6, 1440),
  },
  {
    key: "purchases.payment-reminders-supplier",
    name: "Supplier payment reminders",
    description: "Notify AP when supplier invoices approach due date.",
    workspace: "purchases", module: "Payments", anchor: "PaymentReminderService (supplier side)",
    scheduleType: "cron", scheduleHuman: "Weekdays at 08:00", cronExpression: "0 8 * * 1-5", timezone: "UTC",
    isEnabled: false, isPaused: false, status: "paused",
    lastRunAt: iso(-1440 * 5), lastDurationMs: 800, lastItems: 0, nextRunAt: undefined,
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Days before due", value: 3 }],
    diagnostics: okChecks(["Payments module enabled"]),
    history: mkHistory("success", 3, 1440),
  },

  // ---------------- SERVICE ----------------
  {
    key: "service.dispatch-sla",
    name: "Dispatch SLA watchdog",
    description: "Flag dispatches open past their SLA and notify the dispatcher.",
    workspace: "service", module: "Dispatches", anchor: "Dispatches + 34_dispatch_audit_logs.sql",
    scheduleType: "interval", scheduleHuman: "Every 15 minutes", intervalMinutes: 15, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-6), lastDurationMs: 650, lastItems: 1, nextRunAt: iso(9),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "SLA (hours)", value: 4 }],
    diagnostics: okChecks(["Dispatch module enabled", "Audit table present"]),
    history: mkHistory("success", 1, 15),
  },
  {
    key: "service.so-autoclose",
    name: "Auto-close completed service orders",
    description: "Close service orders that have been idle after completion.",
    workspace: "service", module: "Service orders", anchor: "ServiceOrders module",
    scheduleType: "cron", scheduleHuman: "Daily at 03:00", cronExpression: "0 3 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-660), lastDurationMs: 1_500, lastItems: 4, nextRunAt: iso(780),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Idle days", value: 7 }],
    diagnostics: okChecks(["Service orders enabled"]),
    history: mkHistory("success", 3, 1440),
  },
  {
    key: "service.planning-rollover",
    name: "Planning rollover",
    description: "Refresh technician availability at day start.",
    workspace: "service", module: "Planning", anchor: "Planning/PlanningService + PlanningProfileService",
    scheduleType: "cron", scheduleHuman: "Daily at 00:05", cronExpression: "5 0 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-100), lastDurationMs: 2_800, lastItems: 24, nextRunAt: iso(1340),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Include weekends", value: true }],
    diagnostics: okChecks(["Planning enabled", "Profiles present"]),
    history: mkHistory("success", 20, 1440),
  },
  {
    key: "service.preferred-skill",
    name: "Preferred-skill match audit",
    description: "Report service orders with no qualified technician available.",
    workspace: "service", module: "Skills", anchor: "37_service_order_preferred_skills.sql",
    scheduleType: "cron", scheduleHuman: "Every 2 hours", cronExpression: "0 */2 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "failed",
    lastRunAt: iso(-30), lastDurationMs: 3_100, lastItems: 0,
    lastError: "Skill catalog missing for tenant",
    nextRunAt: iso(90),
    consecutiveFailures: 2, successRate30: 86,
    settings: [{ label: "Min match score", value: 0.7 }],
    diagnostics: mixChecks([
      ["Skills catalog present", false, "0 skills defined for tenant"],
      ["Service orders reachable", true],
    ]),
    history: mkHistory("success", 0, 120, 3),
  },
  {
    key: "service.incident-autoticket",
    name: "Incident → ticket auto-creation",
    description: "Turn qualifying incidents into support tickets automatically.",
    workspace: "service", module: "Incidents", anchor: "Incidents/IncidentAutoTicketService",
    scheduleType: "interval", scheduleHuman: "Every 5 minutes", intervalMinutes: 5, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-3), lastDurationMs: 450, lastItems: 0, nextRunAt: iso(2),
    consecutiveFailures: 0, successRate30: 99,
    settings: [{ label: "Min severity", value: "warning" }],
    diagnostics: okChecks(["Incidents enabled", "Tickets module enabled"]),
    history: mkHistory("success", 1, 5, 30),
  },

  // ---------------- PROJECTS ----------------
  {
    key: "projects.recurring-tasks",
    name: "Generate due recurring tasks",
    description: "Materialize recurring task instances that are due.",
    workspace: "projects", module: "Tasks", anchor: "RecurringTaskService.GenerateDueTasksAsync",
    scheduleType: "interval", scheduleHuman: "Every hour", intervalMinutes: 60, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-25), lastDurationMs: 1_400, lastItems: 6, nextRunAt: iso(35),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Look-ahead (hours)", value: 24 }, { label: "Dry run", value: false }],
    diagnostics: okChecks(["Tasks module enabled", "Recurring templates present"]),
    history: mkHistory("success", 5, 60),
  },
  {
    key: "projects.overdue-tasks",
    name: "Escalate overdue tasks",
    description: "Move overdue tasks to 'overdue' and notify assignees.",
    workspace: "projects", module: "Tasks", anchor: "Tasks (Projects backend)",
    scheduleType: "cron", scheduleHuman: "Every 3 hours", cronExpression: "0 */3 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-120), lastDurationMs: 850, lastItems: 3, nextRunAt: iso(60),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Grace (hours)", value: 2 }],
    diagnostics: okChecks(["Tasks enabled", "Notifications ready"]),
    history: mkHistory("success", 3, 180),
  },
  {
    key: "projects.health-rag",
    name: "Project health / RAG recompute",
    description: "Refresh red/amber/green health indicators for projects.",
    workspace: "projects", module: "Projects", anchor: "30_projects_client_success.sql",
    scheduleType: "cron", scheduleHuman: "Daily at 06:00", cronExpression: "0 6 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-360), lastDurationMs: 3_600, lastItems: 18, nextRunAt: iso(1080),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Include archived", value: false }],
    diagnostics: okChecks(["Projects enabled", "Health thresholds set"]),
    history: mkHistory("success", 15, 1440),
  },
  {
    key: "projects.calendar-sync",
    name: "Calendar sync",
    description: "Pull/push events for connected calendars.",
    workspace: "projects", module: "Calendar", anchor: "Calendar backend + SyncedCalendarEventsTable",
    scheduleType: "interval", scheduleHuman: "Every 10 minutes", intervalMinutes: 10, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "blocked",
    lastRunAt: iso(-15), lastDurationMs: 500, lastItems: 0,
    blockReason: "Google Calendar token expired for 1 account",
    nextRunAt: iso(-5),
    consecutiveFailures: 5, successRate30: 72,
    settings: [{ label: "Two-way sync", value: true }],
    diagnostics: mixChecks([
      ["OAuth token valid", false, "Refresh failed for account jane@acme.com"],
      ["Calendar API reachable", true],
    ]),
    history: mkHistory("success", 6, 10, 3),
  },

  // ---------------- HR ----------------
  {
    key: "hr.leave-accrual",
    name: "Leave accrual",
    description: "Accrue monthly leave balances for employees.",
    workspace: "hr", module: "Leaves", anchor: "HrService",
    scheduleType: "cron", scheduleHuman: "1st of month at 01:00", cronExpression: "0 1 1 * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1440 * 12), lastDurationMs: 4_400, lastItems: 34, nextRunAt: iso(1440 * 18),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Policy version", value: "v3" }],
    diagnostics: okChecks(["HR module enabled", "Policies configured"]),
    history: mkHistory("success", 30, 43200),
  },
  {
    key: "hr.contract-expiry",
    name: "Contract expiration reminders",
    description: "Notify at T-30 and T-7 before contract end date.",
    workspace: "hr", module: "Employees", anchor: "HrService.PerformanceRecruitment",
    scheduleType: "cron", scheduleHuman: "Daily at 08:00", cronExpression: "0 8 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-540), lastDurationMs: 700, lastItems: 1, nextRunAt: iso(900),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Reminder offsets (days)", value: "30,7" }],
    diagnostics: okChecks(["Employees present", "Contracts recorded"]),
    history: mkHistory("success", 1, 1440),
  },
  {
    key: "hr.interview-reminders",
    name: "Interview reminders",
    description: "Send 24-hour reminders for scheduled interviews.",
    workspace: "hr", module: "Recruitment", anchor: "HrInterview model",
    scheduleType: "interval", scheduleHuman: "Every hour", intervalMinutes: 60, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-40), lastDurationMs: 400, lastItems: 0, nextRunAt: iso(20),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Lead time (hours)", value: 24 }],
    diagnostics: okChecks(["Recruitment enabled"]),
    history: mkHistory("success", 0, 60),
  },
  {
    key: "hr.birthday-anniversary",
    name: "Birthday / anniversary notifications",
    description: "Daily digest of employee birthdays and work anniversaries.",
    workspace: "hr", module: "Employees", anchor: "Employees records",
    scheduleType: "cron", scheduleHuman: "Daily at 08:00", cronExpression: "0 8 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-540), lastDurationMs: 300, lastItems: 2, nextRunAt: iso(900),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Include anniversaries", value: true }],
    diagnostics: okChecks(["HR enabled"]),
    history: mkHistory("success", 2, 1440),
  },
  {
    key: "hr.payroll-prep",
    name: "Payroll cutoff prep",
    description: "Pre-compute payroll variables the day before payroll run.",
    workspace: "hr", module: "Payroll", anchor: "HR payroll page",
    scheduleType: "cron", scheduleHuman: "25th of month at 20:00", cronExpression: "0 20 25 * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1440 * 8), lastDurationMs: 8_400, lastItems: 34, nextRunAt: iso(1440 * 22),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Include bonuses", value: true }],
    diagnostics: okChecks(["Payroll enabled"]),
    history: mkHistory("success", 32, 43200),
  },

  // ---------------- REPORTING ----------------
  {
    key: "reporting.cache-warmup",
    name: "Report cache warmup",
    description: "Pre-render top dashboard queries in the morning.",
    workspace: "reporting", module: "Reporting", anchor: "Reporting + 33_dashboard_layout.sql",
    scheduleType: "cron", scheduleHuman: "Weekdays at 06:30", cronExpression: "30 6 * * 1-5", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-330), lastDurationMs: 12_800, lastItems: 24, nextRunAt: iso(1110),
    consecutiveFailures: 0, successRate30: 96,
    settings: [{ label: "Top N dashboards", value: 10 }],
    diagnostics: okChecks(["Reporting enabled", "Dashboards present"]),
    history: mkHistory("success", 20, 1440, 8),
  },
  {
    key: "reporting.scheduled-exports",
    name: "Scheduled report export & email",
    description: "Send periodic CSV/PDF reports to configured recipients.",
    workspace: "reporting", module: "Reporting", anchor: "Reporting/export page",
    scheduleType: "cron", scheduleHuman: "Mondays at 07:00", cronExpression: "0 7 * * 1", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1440 * 2), lastDurationMs: 6_100, lastItems: 5, nextRunAt: iso(1440 * 5),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Format", value: "PDF" }],
    diagnostics: okChecks(["SMTP configured", "Report templates present"]),
    history: mkHistory("success", 5, 10080),
  },
  {
    key: "reporting.favorites-cleanup",
    name: "Reporting favorites cleanup",
    description: "Remove favorites pointing to deleted reports.",
    workspace: "reporting", module: "Reporting", anchor: "32_reporting_favorites.sql",
    scheduleType: "cron", scheduleHuman: "Sundays at 03:00", cronExpression: "0 3 * * 0", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1440 * 5), lastDurationMs: 600, lastItems: 0, nextRunAt: iso(1440 * 2),
    consecutiveFailures: 0, successRate30: 100,
    settings: [], diagnostics: okChecks(["Reporting enabled"]),
    history: mkHistory("success", 0, 10080),
  },

  // ---------------- INTEGRATIONS ----------------
  {
    key: "integrations.wf-cleanup-stuck",
    name: "Cleanup stuck workflow executions",
    description: "Terminate workflow executions running longer than the threshold.",
    workspace: "integrations", module: "Workflow", anchor: "WorkflowExecutionsController.CleanupStuckExecutionsAsync",
    scheduleType: "interval", scheduleHuman: "Every 5 minutes", intervalMinutes: 5, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-2), lastDurationMs: 320, lastItems: 0, nextRunAt: iso(3),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Older than (minutes)", value: 5 }],
    diagnostics: okChecks(["Workflow enabled", "DB reachable"]),
    history: mkHistory("success", 0, 5),
  },
  {
    key: "integrations.wf-resume-delayed",
    name: "Resume delayed executions",
    description: "Wake workflow executions parked on a delay node when ResumeAt is due.",
    workspace: "integrations", module: "Workflow", anchor: "WorkflowPollingService",
    scheduleType: "interval", scheduleHuman: "Every 1 minute", intervalMinutes: 1, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1), lastDurationMs: 180, lastItems: 2, nextRunAt: iso(1),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Batch size", value: 50 }],
    diagnostics: okChecks(["Workflow polling active"]),
    history: mkHistory("success", 1, 1),
  },
  {
    key: "integrations.wf-expire-approvals",
    name: "Expire pending approvals",
    description: "Mark approvals past their expiry as 'expired' and continue the workflow.",
    workspace: "integrations", module: "Workflow", anchor: "WorkflowApprovals",
    scheduleType: "interval", scheduleHuman: "Every 15 minutes", intervalMinutes: 15, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-8), lastDurationMs: 220, lastItems: 0, nextRunAt: iso(7),
    consecutiveFailures: 0, successRate30: 100,
    settings: [], diagnostics: okChecks(["Approvals table present"]),
    history: mkHistory("success", 0, 15),
  },
  {
    key: "integrations.wf-reconcile",
    name: "Workflow reconciliation sweep",
    description: "Reconcile inconsistent workflow state (missed triggers, orphan nodes).",
    workspace: "integrations", module: "Workflow", anchor: "WorkflowReconciliationController",
    scheduleType: "cron", scheduleHuman: "Every 30 minutes", cronExpression: "*/30 * * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-12), lastDurationMs: 1_800, lastItems: 3, nextRunAt: iso(18),
    consecutiveFailures: 0, successRate30: 98,
    settings: [{ label: "Look-back (hours)", value: 24 }],
    diagnostics: okChecks(["Workflow module enabled"]),
    history: mkHistory("success", 2, 30, 10),
  },
  {
    key: "integrations.webhook-retry",
    name: "External API webhook retry",
    description: "Retry failed outbound webhook calls with exponential backoff.",
    workspace: "integrations", module: "External APIs", anchor: "ExternalEndpoints",
    scheduleType: "interval", scheduleHuman: "Every 2 minutes", intervalMinutes: 2, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "failed",
    lastRunAt: iso(-1), lastDurationMs: 800, lastItems: 0,
    lastError: "Target returned 502 (3/3 attempts)",
    nextRunAt: iso(1),
    consecutiveFailures: 3, successRate30: 82,
    settings: [{ label: "Max attempts", value: 5 }, { label: "Backoff (s)", value: 30 }],
    diagnostics: mixChecks([
      ["Endpoints reachable", false, "1 target returning 5xx"],
      ["Backoff policy set", true],
    ]),
    history: mkHistory("success", 4, 2, 5),
  },
  {
    key: "integrations.sync-retry",
    name: "Retry failed sync entries",
    description: "Retry offline-sync entries that previously failed to apply.",
    workspace: "integrations", module: "Sync", anchor: "SyncService + 29_sync_history_retry.sql",
    scheduleType: "interval", scheduleHuman: "Every 10 minutes", intervalMinutes: 10, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-8), lastDurationMs: 900, lastItems: 1, nextRunAt: iso(2),
    consecutiveFailures: 0, successRate30: 94,
    settings: [{ label: "Max attempts", value: 3 }],
    diagnostics: okChecks(["Sync module enabled"]),
    history: mkHistory("success", 2, 10, 8),
  },
  {
    key: "integrations.sync-log-rotate",
    name: "Sync log rotation",
    description: "Trim old rows from the sync log table.",
    workspace: "integrations", module: "Sync", anchor: "SyncLoggingService",
    scheduleType: "cron", scheduleHuman: "Daily at 04:00", cronExpression: "0 4 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-420), lastDurationMs: 700, lastItems: 1_200, nextRunAt: iso(1020),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Retention (days)", value: 30 }],
    diagnostics: okChecks(["Sync logs table present"]),
    history: mkHistory("success", 1000, 1440),
  },
  {
    key: "integrations.offline-rehydrate",
    name: "Rehydrate offline caches",
    description: "Refresh offline caches for active tenants.",
    workspace: "integrations", module: "Sync", anchor: "OfflineHydration module",
    scheduleType: "cron", scheduleHuman: "Every 2 hours", cronExpression: "0 */2 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-60), lastDurationMs: 5_200, lastItems: 12, nextRunAt: iso(60),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Only active users", value: true }],
    diagnostics: okChecks(["OfflineHydration enabled"]),
    history: mkHistory("success", 10, 120),
  },

  // ---------------- LOOKUPS ----------------
  {
    key: "lookups.usage-audit",
    name: "Lookup usage audit",
    description: "Report orphan / unused lookup values.",
    workspace: "lookups", module: "Lookups", anchor: "Lookups module",
    scheduleType: "cron", scheduleHuman: "Sundays at 05:00", cronExpression: "0 5 * * 0", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1440 * 4), lastDurationMs: 1_100, lastItems: 8, nextRunAt: iso(1440 * 3),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Auto-archive", value: false }],
    diagnostics: okChecks(["Lookups enabled"]),
    history: mkHistory("success", 7, 10080),
  },

  // ---------------- SERVICE DESK ----------------
  {
    key: "servicedesk.ticket-autoclose",
    name: "Auto-close resolved tickets",
    description: "Close resolved tickets that have been idle for N days.",
    workspace: "service-desk", module: "Tickets", anchor: "SupportTickets backend",
    scheduleType: "cron", scheduleHuman: "Daily at 03:30", cronExpression: "30 3 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-630), lastDurationMs: 1_200, lastItems: 4, nextRunAt: iso(810),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Idle days", value: 5 }],
    diagnostics: okChecks(["Tickets enabled"]),
    history: mkHistory("success", 4, 1440),
  },
  {
    key: "servicedesk.sla-breach",
    name: "SLA breach watchdog",
    description: "Flag tickets past first-response / resolution SLA.",
    workspace: "service-desk", module: "Tickets", anchor: "SupportTickets backend",
    scheduleType: "interval", scheduleHuman: "Every 10 minutes", intervalMinutes: 10, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-4), lastDurationMs: 500, lastItems: 0, nextRunAt: iso(6),
    consecutiveFailures: 0, successRate30: 100,
    settings: [
      { label: "First response SLA (h)", value: 2 },
      { label: "Resolution SLA (h)", value: 24 },
    ],
    diagnostics: okChecks(["Tickets enabled", "SLA config present"]),
    history: mkHistory("success", 0, 10),
  },
  {
    key: "servicedesk.ticket-reopen",
    name: "Ticket re-open sweeper",
    description: "Re-open closed tickets when a customer reply arrives.",
    workspace: "service-desk", module: "Tickets", anchor: "SupportTickets backend",
    scheduleType: "interval", scheduleHuman: "Every 5 minutes", intervalMinutes: 5, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-2), lastDurationMs: 260, lastItems: 0, nextRunAt: iso(3),
    consecutiveFailures: 0, successRate30: 100,
    settings: [], diagnostics: okChecks(["Tickets enabled"]),
    history: mkHistory("success", 0, 5),
  },

  // ---------------- ADMINISTRATION ----------------
  {
    key: "admin.purge-system-logs",
    name: "Purge system logs",
    description: "Delete SystemLogs rows older than the retention window.",
    workspace: "administration", module: "System logs", anchor: "SystemLogService.CleanupOldLogsAsync",
    scheduleType: "cron", scheduleHuman: "Daily at 02:15", cronExpression: "15 2 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-705), lastDurationMs: 3_400, lastItems: 8_432, nextRunAt: iso(735),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Retention (days)", value: 90 }, { label: "Dry run", value: false }],
    diagnostics: okChecks(["SystemLogs table present", "DB reachable"]),
    history: mkHistory("success", 7000, 1440),
  },
  {
    key: "admin.purge-traceability",
    name: "Purge traceability activity",
    description: "Delete activity feed events older than the retention window.",
    workspace: "administration", module: "Traceability", anchor: "Traceability module",
    scheduleType: "cron", scheduleHuman: "Daily at 02:30", cronExpression: "30 2 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-690), lastDurationMs: 2_100, lastItems: 3_112, nextRunAt: iso(750),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Retention (days)", value: 180 }],
    diagnostics: okChecks(["Activity table present"]),
    history: mkHistory("success", 3000, 1440),
  },
  {
    key: "admin.purge-notifications",
    name: "Purge notifications",
    description: "Delete read notifications older than N days.",
    workspace: "administration", module: "Notifications", anchor: "14_add_notifications_table.sql",
    scheduleType: "cron", scheduleHuman: "Daily at 02:45", cronExpression: "45 2 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-675), lastDurationMs: 900, lastItems: 402, nextRunAt: iso(765),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Retention (days)", value: 30 }, { label: "Only read", value: true }],
    diagnostics: okChecks(["Notifications table present"]),
    history: mkHistory("success", 400, 1440),
  },
  {
    key: "admin.purge-soft-deleted",
    name: "Purge soft-deleted rows",
    description: "Hard-delete rows flagged IsDeleted=true across major entities.",
    workspace: "administration", module: "Housekeeping", anchor: "Offers/Sales/Invoices/Articles/Contacts/Projects",
    scheduleType: "cron", scheduleHuman: "Sundays at 04:15", cronExpression: "15 4 * * 0", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1440 * 3), lastDurationMs: 8_400, lastItems: 88, nextRunAt: iso(1440 * 4),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Older than (days)", value: 60 }, { label: "Dry run", value: false }],
    diagnostics: okChecks(["Entities reachable"]),
    history: mkHistory("success", 80, 10080),
  },
  {
    key: "admin.purge-email-tokens",
    name: "Purge expired email-verification tokens",
    description: "Delete unused email verification tokens past expiry.",
    workspace: "administration", module: "Auth", anchor: "35_email_verification.sql",
    scheduleType: "cron", scheduleHuman: "Every 6 hours", cronExpression: "0 */6 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-120), lastDurationMs: 200, lastItems: 14, nextRunAt: iso(240),
    consecutiveFailures: 0, successRate30: 100,
    settings: [], diagnostics: okChecks(["Auth tables present"]),
    history: mkHistory("success", 12, 360),
  },
  {
    key: "admin.purge-2fa",
    name: "Purge expired 2FA challenges",
    description: "Delete stale 2FA challenges past expiry.",
    workspace: "administration", module: "Auth", anchor: "36_two_factor.sql",
    scheduleType: "cron", scheduleHuman: "Every 15 minutes", cronExpression: "*/15 * * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-5), lastDurationMs: 90, lastItems: 3, nextRunAt: iso(10),
    consecutiveFailures: 0, successRate30: 100,
    settings: [], diagnostics: okChecks(["Auth tables present"]),
    history: mkHistory("success", 2, 15),
  },
  {
    key: "admin.purge-orphan-uploads",
    name: "Purge orphan uploads",
    description: "Delete uploaded files whose parent entity no longer exists.",
    workspace: "administration", module: "Documents", anchor: "uploadThingService",
    scheduleType: "cron", scheduleHuman: "Nightly at 03:45", cronExpression: "45 3 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-435), lastDurationMs: 4_100, lastItems: 27, nextRunAt: iso(1005),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Dry run", value: false }],
    diagnostics: okChecks(["Storage reachable"]),
    history: mkHistory("success", 25, 1440),
  },
  {
    key: "admin.retry-notifications",
    name: "Retry unsent notifications",
    description: "Re-send notifications stuck in pending/failed state.",
    workspace: "administration", module: "Notifications", anchor: "Notifications backend",
    scheduleType: "interval", scheduleHuman: "Every 3 minutes", intervalMinutes: 3, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1), lastDurationMs: 400, lastItems: 2, nextRunAt: iso(2),
    consecutiveFailures: 0, successRate30: 97,
    settings: [{ label: "Max attempts", value: 5 }],
    diagnostics: okChecks(["Notification channels ready"]),
    history: mkHistory("success", 2, 3, 25),
  },
  {
    key: "admin.imap-pull",
    name: "IMAP inbox pull",
    description: "Fetch new messages for each connected email account.",
    workspace: "administration", module: "Email accounts", anchor: "EmailAccounts backend",
    scheduleType: "interval", scheduleHuman: "Every 5 minutes", intervalMinutes: 5, timezone: "UTC",
    isEnabled: true, isPaused: false, status: "blocked",
    lastRunAt: iso(-4), lastDurationMs: 1_100, lastItems: 0,
    blockReason: "IMAP auth failed on account support@acme.com",
    nextRunAt: iso(1),
    consecutiveFailures: 4, successRate30: 68,
    settings: [{ label: "Batch size / account", value: 100 }],
    diagnostics: mixChecks([
      ["Accounts configured", true],
      ["Credentials valid", false, "support@acme.com — password rejected"],
      ["IMAP host reachable", true],
    ]),
    history: mkHistory("success", 8, 5, 3),
  },
  {
    key: "admin.dyn-forms-cleanup",
    name: "Dynamic-forms submission cleanup",
    description: "Retention on dynamic-forms submissions.",
    workspace: "administration", module: "Dynamic forms", anchor: "15_dynamic_forms.sql",
    scheduleType: "cron", scheduleHuman: "Weekly on Sunday 05:15", cronExpression: "15 5 * * 0", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1440 * 4), lastDurationMs: 1_800, lastItems: 220, nextRunAt: iso(1440 * 3),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Retention (days)", value: 365 }],
    diagnostics: okChecks(["Dynamic forms enabled"]),
    history: mkHistory("success", 200, 10080),
  },
  {
    key: "admin.plugin-reconcile",
    name: "Plugin activation reconciliation",
    description: "Ensure plugin activation rows match the plugin catalogue.",
    workspace: "administration", module: "Plugins", anchor: "15_plugin_activations.sql",
    scheduleType: "cron", scheduleHuman: "Daily at 05:00", cronExpression: "0 5 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-390), lastDurationMs: 700, lastItems: 0, nextRunAt: iso(1050),
    consecutiveFailures: 0, successRate30: 100,
    settings: [], diagnostics: okChecks(["Plugins module enabled"]),
    history: mkHistory("success", 0, 1440),
  },
  {
    key: "admin.numbering-yearly-reset",
    name: "Yearly numbering reset",
    description: "Reset yearly numbering sequences on January 1st.",
    workspace: "administration", module: "Numbering", anchor: "NumberingService + 24_numbering_system.sql",
    scheduleType: "cron", scheduleHuman: "Jan 1 at 00:05", cronExpression: "5 0 1 1 *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-1440 * 200), lastDurationMs: 400, lastItems: 8, nextRunAt: iso(1440 * 160),
    consecutiveFailures: 0, successRate30: 100,
    settings: [], diagnostics: okChecks(["Numbering module enabled"]),
    history: mkHistory("success", 8, 525600),
  },
  {
    key: "admin.tenant-storage-snapshot",
    name: "Tenant storage snapshot",
    description: "Capture per-tenant DB row counts and storage size.",
    workspace: "administration", module: "Platform", anchor: "SystemAdminPage / DatabaseSchemaPage",
    scheduleType: "cron", scheduleHuman: "Daily at 04:30", cronExpression: "30 4 * * *", timezone: "UTC",
    isEnabled: true, isPaused: false, status: "idle",
    lastRunAt: iso(-450), lastDurationMs: 6_000, lastItems: 42, nextRunAt: iso(990),
    consecutiveFailures: 0, successRate30: 100,
    settings: [{ label: "Include indexes", value: true }],
    diagnostics: okChecks(["DB stats reachable"]),
    history: mkHistory("success", 42, 1440),
  },
];

export const WORKSPACE_LABELS: Record<WorkspaceId, string> = {
  sales: "Sales",
  purchases: "Purchases",
  service: "Service",
  projects: "Projects",
  hr: "HR",
  reporting: "Reporting",
  integrations: "Integrations",
  lookups: "Lookups",
  "service-desk": "Service Desk",
  administration: "Administration",
};
