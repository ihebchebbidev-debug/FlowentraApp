/**
 * Single source of truth for the entityTypes the backend offline-sync replay can
 * apply (SyncService.ApplyOperationAsync switch). `inferEntityType()` must only ever
 * produce a value in this set — otherwise an offline mutation would queue and then be
 * rejected on sync ("Unsupported entityType"), silently losing the user's data.
 *
 * ⚠️ KEEP IN SYNC with Backend/Modules/Sync/Services/SyncService.cs → ApplyOperationAsync.
 * When you add a handler there, add the type here (and a branch in inferEntityType).
 * The dev-time check in syncEngine.ts warns if these ever drift.
 */
export const OFFLINE_REPLAYABLE_ENTITY_TYPES = [
  "contact",
  "installation",
  "article",
  "stock_transaction",
  "hr_department",
  "hr_attendance",
  "document",
  "lookup_item",
  "lookup_bulk",
  "currency",
  "dynamic_form",
  "dynamic_form_response",
  "calendar_event",
  // NOTE: "email_account" and "synced_email" intentionally omitted — inbox is
  // not hydrated into IndexedDB, so queuing offline mutations against email ids
  // the user never had cached is unsafe. Add these back only after an
  // email-accounts hydration module lands. Until then, `shouldSkipOfflineQueueForEndpoint`
  // silently no-ops these calls offline.
  "project",
  "daily_task",
  "task",
  "offer",
  "deal",
  "sale",
  "service_order",
  "service_order_job",
  "dispatch",
  "support_ticket",
  "support_ticket_comment",
  "support_ticket_link",
  "task_checklist",
  "task_checklist_item",
  "planning_assign",
  "planning_schedule",
  "planning_leave",
  "dispatch_status",
  "dispatch_start",
  "dispatch_complete",
  "dispatch_time_entry",
  "dispatch_time_entry_approve",
  "dispatch_expense",
  "dispatch_expense_approve",
  "dispatch_material",
  "dispatch_material_approve",
  "dispatch_note",
  "dispatch_history",
  "hr_salary_config",
  "hr_attendance_settings",
  "hr_leave_balance",
  "hr_attendance_import",
  "hr_payroll_run",
  "contact_note",
  "contact_tag",
  "task_comment",
  "task_attachment",
  "task_time_entry",
  "purchase_order",
  "supplier_invoice",
  "goods_receipt",
  "app_setting",
  "numbering_setting",
  "signature",
  "skill",
  "role",
  "recurring_task",
  "planning_profile",
  "dashboard",
] as const;

export type OfflineReplayableEntityType = (typeof OFFLINE_REPLAYABLE_ENTITY_TYPES)[number];

const REPLAYABLE_SET = new Set<string>(OFFLINE_REPLAYABLE_ENTITY_TYPES);

/** True when the backend has a replay handler for this entity type. */
export function isReplayableEntityType(entityType: string): boolean {
  return REPLAYABLE_SET.has(entityType);
}
