import type { TFunction } from "i18next";

// Per-process "what this does" documentation. English strings remain here as
// the fallback source of truth; when a translation exists under the
// `explanations.<key>` namespace it is used instead, so the drawer's
// When-it-runs / Inputs / Outputs blocks localise cleanly.

export interface ProcessExplanation {
  whenItRuns: string;
  inputs: string[];
  outputs: string[];
}

const PROCESS_EXPLANATIONS: Record<string, ProcessExplanation> = {
  "admin.purge-system-logs": {
    whenItRuns: "Once every 24 hours — after the midnight housekeeping window.",
    inputs: [
      "SystemLogs rows across every tenant",
      "ProcessRuns history rows",
      "Config: retention_days (default 30), run_retention_days (min 30)",
    ],
    outputs: [
      "Hard-deletes SystemLogs older than retention_days",
      "Hard-deletes ProcessRuns older than run_retention_days",
      "Reports counts: logs_deleted, runs_deleted",
    ],
  },
  "admin.retry-failed-emails": {
    whenItRuns: "Every 5 minutes — keeps the outbound queue moving.",
    inputs: [
      "OutboundEmailLog rows with Status=failed, Attempts<MaxAttempts, NextRetryAt≤now",
      "Original send payload (recipients, subject, body, attachments)",
      "Config: batch_size (default 50, max 500)",
    ],
    outputs: [
      "Replays each candidate through EmailAccountService.SendEmailAsync",
      "Updates Status → sent / failed with exponential NextRetryAt",
      "Transitions orphaned rows (missing account/user) to gave_up",
    ],
  },
  "admin.invoices-mark-overdue": {
    whenItRuns: "Every hour — keeps AR aging accurate.",
    inputs: [
      "Invoices where DueDate<now and AmountPaid<GrandTotal",
      "Statuses considered: posted, sent, partial",
    ],
    outputs: ["Sets Status='overdue' and bumps UpdatedAt"],
  },
  "admin.offers-mark-expired": {
    whenItRuns: "Every hour.",
    inputs: [
      "Offers where ValidUntil<now and Status in (sent, pending)",
      "Drafts are excluded — an unsent offer cannot expire",
    ],
    outputs: ["Sets Status='expired' and bumps UpdatedAt"],
  },
  "admin.dispatches-mark-missed": {
    whenItRuns: "Every hour.",
    inputs: [
      "Dispatches with ScheduledDate<now−grace_hours and no ActualStartTime",
      "Statuses considered: pending, scheduled, assigned",
      "Config: grace_hours (default 2, max 168)",
    ],
    outputs: ["Sets Status='missed' and bumps ModifiedDate"],
  },
  "admin.payment-installments-mark-overdue": {
    whenItRuns: "Every hour.",
    inputs: [
      "PaymentPlanInstallments with DueDate<now",
      "Statuses considered: pending, partially_paid",
    ],
    outputs: ["Sets Status='overdue'"],
  },
  "admin.support-tickets-autoclose-resolved": {
    whenItRuns: "Every 6 hours.",
    inputs: [
      "SupportTickets with Status=resolved and last activity older than days_resolved",
      "Config: days_resolved (default 7, max 365)",
    ],
    outputs: ["Sets Status='closed'"],
  },
  "admin.draft-offers-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "Offers with Status=draft older than age_days",
      "Config: age_days (default 60, min 7)",
    ],
    outputs: [
      "Hard-deletes matching offers",
      "Reports 'skipped' with block_reason if child FK constraints prevent deletion (retrying can't fix it)",
    ],
  },
  "admin.draft-invoices-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "Invoices with Status=draft older than age_days",
      "Config: age_days (default 60, min 7)",
    ],
    outputs: [
      "Hard-deletes matching invoices",
      "Reports 'skipped' with block_reason on FK constraint",
    ],
  },
  "admin.notifications-purge-read": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "Notifications with IsRead=true older than age_days",
      "Config: age_days (default 30)",
    ],
    outputs: ["Hard-deletes matching notifications"],
  },
  "admin.notifications-purge-stale-unread": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "Notifications with IsRead=false older than age_days",
      "Config: age_days (default 180, min 30)",
    ],
    outputs: ["Hard-deletes long-ignored notifications"],
  },
  "admin.calendar-events-purge-past": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "CalendarEvents whose End<now−age_days and Status in (completed, cancelled)",
      "Config: age_days (default 180, min 30)",
    ],
    outputs: ["Hard-deletes closed past events"],
  },
  "admin.sync-changes-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "SyncChanges rows with ChangedAt older than age_days",
      "Config: age_days (default 30)",
    ],
    outputs: ["Hard-deletes stale offline-sync deltas"],
  },
  "admin.sync-receipts-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "SyncOperationReceipts with CreatedAt older than age_days",
      "Config: age_days (default 30)",
    ],
    outputs: ["Hard-deletes stale sync receipts"],
  },
  "admin.webhook-jobs-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "WebhookForwardJobs with Status in (completed, dead_letter) and CompletedAt older than age_days",
      "Config: age_days (default 30)",
    ],
    outputs: ["Hard-deletes finished webhook forward jobs"],
  },
  "admin.external-endpoint-logs-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "ExternalEndpoints (non-deleted) and their per-endpoint LogRetentionDays",
      "ExternalEndpointLogs older than each endpoint's retention",
    ],
    outputs: ["Hard-deletes matching logs endpoint by endpoint"],
  },
  "admin.dispatch-audit-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "DispatchAuditLogs older than age_days",
      "Config: age_days (default 180, min 30)",
    ],
    outputs: ["Hard-deletes old audit rows"],
  },
  "admin.hr-audit-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "HrAuditLogs older than age_days",
      "Config: age_days (default 365, min 90)",
    ],
    outputs: ["Hard-deletes old HR audit rows"],
  },
  "admin.soft-deleted-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "Rows with IsDeleted=true and DeletedAt older than age_days across: invoices, offers, deals, sales, articles, dispatches, service_orders",
      "Config: age_days (default 90, min 30)",
    ],
    outputs: [
      "Hard-deletes matching rows per table (independent — one table's FK block never fails the whole run)",
      "Reports per-table counts and a skipped_tables list",
    ],
  },
  "admin.recurring-task-logs-purge": {
    whenItRuns: "Once every 24 hours.",
    inputs: [
      "RecurringTaskLogs with GeneratedDate older than age_days",
      "Config: age_days (default 180, min 30)",
    ],
    outputs: ["Hard-deletes old recurring-task generation history"],
  },
};

/**
 * Localised explanation. When called without `t` (or in a non-processes
 * namespace), falls back to the English source above so no caller ever
 * gets `undefined`. When `t` is provided, prefers `explanations.<key>.*`
 * translations, then per-line fallback to the English source.
 */
export function getProcessExplanation(
  key: string,
  t?: TFunction
): ProcessExplanation | null {
  const src = PROCESS_EXPLANATIONS[key] ?? null;
  if (!src) return null;
  if (!t) return src;

  // returnObjects for arrays; per-line defaultValue guards missing keys.
  const whenItRuns = t(`explanations.${key}.whenItRuns`, {
    defaultValue: src.whenItRuns,
  }) as string;

  const translateList = (field: "inputs" | "outputs"): string[] => {
    const translated = t(`explanations.${key}.${field}`, {
      returnObjects: true,
      defaultValue: src[field],
    }) as unknown;
    if (Array.isArray(translated) && translated.every((x) => typeof x === "string")) {
      return translated as string[];
    }
    return src[field];
  };

  return {
    whenItRuns,
    inputs: translateList("inputs"),
    outputs: translateList("outputs"),
  };
}
