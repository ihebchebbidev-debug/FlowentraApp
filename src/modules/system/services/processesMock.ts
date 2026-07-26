/**
 * Static catalogue used by the Administration > Processes page.
 *
 * Only entries backed by a real, end-to-end reliable backend handler live here.
 * The list is kept intentionally tight — we removed dozens of "planned" mock
 * jobs that had no server-side implementation, because surfacing broken jobs
 * to admins was worse than surfacing fewer working ones.
 *
 * Every key below MUST have:
 *   1. a registered handler in Backend/Modules/Processes/Services/Handlers
 *   2. an entry in ProcessSchedulerService.BuiltInSchedules (so it auto-seeds)
 *   3. an entry in REAL_HANDLER_KEYS in processesService.ts
 */

export type ProcessStatus = "idle" | "running" | "paused" | "failed" | "blocked";
export type ScheduleType = "manual" | "interval" | "cron";
export type WorkspaceId = "administration";

export interface ProcessRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  durationMs: number;
  status: "success" | "failed" | "blocked" | "cancelled" | "running" | "skipped";
  itemsProcessed: number;
  error?: string;
  blockReason?: string;
  triggeredBy: "schedule" | "manual" | "retry";
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
  successRate30?: number;
  settings: { label: string; value: string | number | boolean }[];
  diagnostics: DiagnosticCheck[];
  history: ProcessRun[];
}

const okChecks = (labels: string[]): DiagnosticCheck[] =>
  labels.map((label) => ({ label, ok: true }));

export const PROCESSES: ProcessDefinition[] = [
  {
    key: "admin.purge-system-logs",
    name: "Purge system logs",
    description: "Delete SystemLogs rows older than the retention window.",
    workspace: "administration",
    module: "System logs",
    anchor: "SystemLogService.CleanupOldLogsAsync",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [
      { label: "Retention (days)", value: 90 },
      { label: "Dry run", value: false },
    ],
    diagnostics: okChecks(["SystemLogs table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.retry-failed-emails",
    name: "Retry failed outbound emails",
    description:
      "Re-send OutboundEmailLog rows still in status=failed with attempts < max_attempts. Every send attempt (success or failure) is logged with its provider error for audit.",
    workspace: "administration",
    module: "Email delivery",
    anchor: "EmailAccountService.SendEmailAsync + RetryFailedEmailsHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 5 minutes",
    intervalMinutes: 5,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [
      { label: "Batch size", value: 50 },
      { label: "Max attempts per email", value: 5 },
    ],
    diagnostics: okChecks(["OutboundEmailLogs table present", "EmailAccountService reachable"]),
    history: [],
  },
  {
    key: "admin.invoices-mark-overdue",
    name: "Mark overdue invoices",
    description:
      "Flip invoices past their DueDate to status=overdue when they still have an unpaid balance. Skips drafts, cancelled, and fully-paid invoices.",
    workspace: "administration",
    module: "Invoices",
    anchor: "InvoicesMarkOverdueHandler",
    scheduleType: "interval",
    scheduleHuman: "Every hour",
    intervalMinutes: 60,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Statuses considered", value: "posted, sent, partial" }],
    diagnostics: okChecks(["Invoices table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.offers-mark-expired",
    name: "Expire past-due offers",
    description:
      "Move draft/sent/pending offers past ValidUntil into status=expired so pipeline views stay accurate.",
    workspace: "administration",
    module: "Offers",
    anchor: "OffersMarkExpiredHandler",
    scheduleType: "interval",
    scheduleHuman: "Every hour",
    intervalMinutes: 60,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Statuses considered", value: "draft, sent, pending" }],
    diagnostics: okChecks(["Offers table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.dispatches-mark-missed",
    name: "Mark missed dispatches",
    description:
      "Mark scheduled dispatches that never started (no ActualStartTime) more than a grace window past their ScheduledDate as status=missed.",
    workspace: "administration",
    module: "Dispatches",
    anchor: "DispatchesMarkMissedHandler",
    scheduleType: "interval",
    scheduleHuman: "Every hour",
    intervalMinutes: 60,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Grace hours", value: 2 }],
    diagnostics: okChecks(["Dispatches table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.payment-installments-mark-overdue",
    name: "Mark overdue payment installments",
    description: "Flip pending PaymentPlanInstallments past their DueDate to status=overdue.",
    workspace: "administration",
    module: "Payments",
    anchor: "PaymentInstallmentsMarkOverdueHandler",
    scheduleType: "interval",
    scheduleHuman: "Every hour",
    intervalMinutes: 60,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [],
    diagnostics: okChecks(["PaymentPlanInstallments table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.support-tickets-autoclose-resolved",
    name: "Auto-close resolved support tickets",
    description: "Close tickets that have been in status=resolved for longer than the configured window.",
    workspace: "administration",
    module: "Support",
    anchor: "SupportTicketsAutocloseHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 6 hours",
    intervalMinutes: 360,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Days resolved", value: 7 }],
    diagnostics: okChecks(["SupportTickets table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.draft-offers-purge",
    name: "Purge abandoned draft offers",
    description: "Hard-delete offers stuck in status=draft that haven't been touched for the age window.",
    workspace: "administration",
    module: "Offers",
    anchor: "DraftOffersPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 60 }],
    diagnostics: okChecks(["Offers table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.draft-invoices-purge",
    name: "Purge abandoned draft invoices",
    description: "Hard-delete invoices stuck in status=draft that haven't been touched for the age window.",
    workspace: "administration",
    module: "Invoices",
    anchor: "DraftInvoicesPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 60 }],
    diagnostics: okChecks(["Invoices table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.notifications-purge-read",
    name: "Purge read notifications",
    description: "Delete Notification rows where IsRead=true and CreatedAt older than the retention window.",
    workspace: "administration",
    module: "Notifications",
    anchor: "NotificationsPurgeReadHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 30 }],
    diagnostics: okChecks(["Notifications table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.notifications-purge-stale-unread",
    name: "Purge stale unread notifications",
    description: "Delete very old unread notifications so the tray doesn't accumulate abandoned rows.",
    workspace: "administration",
    module: "Notifications",
    anchor: "NotificationsPurgeStaleUnreadHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 180 }],
    diagnostics: okChecks(["Notifications table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.calendar-events-purge-past",
    name: "Purge past calendar events",
    description: "Delete completed/cancelled calendar events whose End is older than the retention window.",
    workspace: "administration",
    module: "Calendar",
    anchor: "CalendarEventsPurgePastHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 180 }],
    diagnostics: okChecks(["CalendarEvents table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.sync-changes-purge",
    name: "Purge old sync changes",
    description: "Trim the SyncChanges outbox so offline-sync bookkeeping doesn't grow forever.",
    workspace: "administration",
    module: "Offline sync",
    anchor: "SyncChangesPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 30 }],
    diagnostics: okChecks(["SyncChanges table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.sync-receipts-purge",
    name: "Purge old sync receipts",
    description: "Delete SyncOperationReceipt rows older than the retention window.",
    workspace: "administration",
    module: "Offline sync",
    anchor: "SyncReceiptsPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 30 }],
    diagnostics: okChecks(["SyncOperationReceipts table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.webhook-jobs-purge",
    name: "Purge completed webhook jobs",
    description: "Delete WebhookForwardJobs that finished (completed or dead_letter) longer ago than the retention window.",
    workspace: "administration",
    module: "External endpoints",
    anchor: "WebhookJobsPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 30 }],
    diagnostics: okChecks(["WebhookForwardJobs table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.external-endpoint-logs-purge",
    name: "Purge external endpoint logs",
    description: "Per-endpoint retention: uses each ExternalEndpoint's own LogRetentionDays to trim its ExternalEndpointLogs.",
    workspace: "administration",
    module: "External endpoints",
    anchor: "ExternalEndpointLogsPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Retention source", value: "per-endpoint LogRetentionDays" }],
    diagnostics: okChecks(["ExternalEndpointLogs table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.dispatch-audit-purge",
    name: "Purge old dispatch audit logs",
    description: "Delete DispatchAuditLogs older than the retention window.",
    workspace: "administration",
    module: "Dispatches",
    anchor: "DispatchAuditPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 180 }],
    diagnostics: okChecks(["DispatchAuditLogs table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.hr-audit-purge",
    name: "Purge old HR audit logs",
    description: "Delete HrAuditLogs older than the retention window.",
    workspace: "administration",
    module: "Human resources",
    anchor: "HrAuditPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 365 }],
    diagnostics: okChecks(["HrAuditLogs table present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.soft-deleted-purge",
    name: "Hard-purge soft-deleted records",
    description:
      "Permanently delete rows across invoices, offers, deals, sales, articles, dispatches, and service orders that were soft-deleted longer than the retention window ago.",
    workspace: "administration",
    module: "Data retention",
    anchor: "SoftDeletedPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 90 }],
    diagnostics: okChecks(["Target tables present", "DB reachable"]),
    history: [],
  },
  {
    key: "admin.recurring-task-logs-purge",
    name: "Purge old recurring task logs",
    description: "Delete RecurringTaskLog rows older than the retention window.",
    workspace: "administration",
    module: "Projects",
    anchor: "RecurringTaskLogsPurgeHandler",
    scheduleType: "interval",
    scheduleHuman: "Every 24 hours",
    intervalMinutes: 1440,
    timezone: "UTC",
    isEnabled: true,
    isPaused: false,
    status: "idle",
    consecutiveFailures: 0,
    successRate30: 100,
    settings: [{ label: "Age (days)", value: 180 }],
    diagnostics: okChecks(["RecurringTaskLogs table present", "DB reachable"]),
    history: [],
  },
];

export const WORKSPACE_LABELS: Record<WorkspaceId, string> = {
  administration: "Administration",
};
