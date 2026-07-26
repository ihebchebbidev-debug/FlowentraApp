import type { TFunction } from "i18next";
import type { ProcessDefinition } from "@/modules/system/services/processesMock";

/**
 * Maps free-text strings from processesMock.ts to stable translation keys.
 * The mock file remains English (source of truth); this layer localizes it.
 */
const MODULE_KEY: Record<string, string> = {
  "System logs": "system_logs",
  "Email delivery": "email_delivery",
  "Invoices": "invoices",
  "Offers": "offers",
  "Dispatches": "dispatches",
  "Payments": "payments",
  "Support": "support",
  "Notifications": "notifications",
  "Calendar": "calendar",
  "Offline sync": "offline_sync",
  "External endpoints": "external_endpoints",
  "Human resources": "human_resources",
  "Data retention": "data_retention",
  "Projects": "projects",
};

const SCHEDULE_KEY: Record<string, string> = {
  "Every 5 minutes": "every_5_minutes",
  "Every hour": "every_hour",
  "Every 6 hours": "every_6_hours",
  "Every 24 hours": "every_24_hours",
};

const SETTING_KEY: Record<string, string> = {
  "Retention (days)": "retention_days",
  "Dry run": "dry_run",
  "Batch size": "batch_size",
  "Max attempts per email": "max_attempts_per_email",
  "Statuses considered": "statuses_considered",
  "Grace hours": "grace_hours",
  "Days resolved": "days_resolved",
  "Age (days)": "age_days",
  "Retention source": "retention_source",
};

const SETTING_VALUE_KEY: Record<string, string> = {
  "per-endpoint LogRetentionDays": "retention_source_value",
};

const DIAG_KEY: Record<string, string> = {
  "SystemLogs table present": "systemlogs_present",
  "DB reachable": "db_reachable",
  "OutboundEmailLogs table present": "outbound_emails_present",
  "EmailAccountService reachable": "email_service_reachable",
  "Invoices table present": "invoices_present",
  "Offers table present": "offers_present",
  "Dispatches table present": "dispatches_present",
  "PaymentPlanInstallments table present": "installments_present",
  "SupportTickets table present": "tickets_present",
  "Notifications table present": "notifications_present",
  "CalendarEvents table present": "calendar_events_present",
  "SyncChanges table present": "sync_changes_present",
  "SyncOperationReceipts table present": "sync_receipts_present",
  "WebhookForwardJobs table present": "webhook_jobs_present",
  "ExternalEndpointLogs table present": "endpoint_logs_present",
  "DispatchAuditLogs table present": "dispatch_audit_present",
  "HrAuditLogs table present": "hr_audit_present",
  "Target tables present": "target_tables_present",
  "RecurringTaskLogs table present": "recurring_logs_present",
};

export function tModule(t: TFunction, en: string): string {
  const k = MODULE_KEY[en];
  return k ? t(`modules.${k}`, { defaultValue: en }) : en;
}

export function tScheduleHuman(t: TFunction, en: string): string {
  const k = SCHEDULE_KEY[en];
  return k ? t(`schedule_human.${k}`, { defaultValue: en }) : en;
}

export function tSettingLabel(t: TFunction, en: string): string {
  const k = SETTING_KEY[en];
  return k ? t(`settings_labels.${k}`, { defaultValue: en }) : en;
}

export function tSettingValue(t: TFunction, v: string | number | boolean): string {
  if (typeof v !== "string") return String(v);
  const k = SETTING_VALUE_KEY[v];
  return k ? t(`settings_labels.${k}`, { defaultValue: v }) : v;
}

export function tDiagLabel(t: TFunction, en: string): string {
  const k = DIAG_KEY[en];
  return k ? t(`diagnostics_labels.${k}`, { defaultValue: en }) : en;
}

/** Returns a shallow-cloned ProcessDefinition with translated user-visible strings. */
export function localizeProcess(t: TFunction, p: ProcessDefinition): ProcessDefinition {
  return {
    ...p,
    name: t(`items.${p.key}.name`, { defaultValue: p.name }),
    description: t(`items.${p.key}.description`, { defaultValue: p.description }),
    module: tModule(t, p.module),
    scheduleHuman: tScheduleHuman(t, p.scheduleHuman),
    settings: p.settings.map((s) => ({
      label: tSettingLabel(t, s.label),
      value: tSettingValue(t, s.value),
    })),
    diagnostics: p.diagnostics.map((d) => ({
      ...d,
      label: tDiagLabel(t, d.label),
    })),
  };
}
