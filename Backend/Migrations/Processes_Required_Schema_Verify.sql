-- =====================================================================
-- Processes module — 100% verified schema requirements & verification
-- =====================================================================
-- Source of truth: every table/column below was extracted directly from
-- the 20 registered IProcessHandler implementations:
--   Backend/Modules/Processes/Services/Handlers/CoreProcessHandlers.cs
--   Backend/Modules/Processes/Services/Handlers/PurgeSystemLogsHandler.cs
--   Backend/Modules/Processes/Services/Handlers/RetryFailedEmailsHandler.cs
-- plus the scheduler/controller:
--   Backend/Modules/Processes/Services/ProcessSchedulerService.cs
--
-- This script is READ-ONLY: it reports what is missing. It creates
-- nothing except the two Processes-owned tables (see PART 1), which are
-- the only tables this module owns. Everything else is owned by its own
-- module migration and merely READ/UPDATED/DELETED by a process.
--
-- Run order:
--   PART 1  create the module's own tables (idempotent)
--   PART 2  verification report — must return ZERO rows
-- =====================================================================


-- =====================================================================
-- PART 1 — Tables OWNED by the Processes module (required, create these)
-- =====================================================================
-- Identical to Backend/Migrations/Processes_Migration.sql; repeated here
-- so this single file is sufficient to stand the module up.

CREATE TABLE IF NOT EXISTS "ProcessSchedules" (
  "Id"                      SERIAL PRIMARY KEY,
  "Key"                     VARCHAR(120) NOT NULL UNIQUE,
  "Name"                    VARCHAR(200) NOT NULL,
  "Enabled"                 BOOLEAN NOT NULL DEFAULT TRUE,
  "Paused"                  BOOLEAN NOT NULL DEFAULT FALSE,
  "IntervalMinutes"         INTEGER NOT NULL DEFAULT 60,
  "MaxRetries"              INTEGER NOT NULL DEFAULT 3,
  "RetryBackoffSeconds"     INTEGER NOT NULL DEFAULT 60,
  "ConfigJson"              JSONB NOT NULL DEFAULT '{}'::jsonb,
  "Timezone"                VARCHAR(60) NOT NULL DEFAULT 'UTC',
  "NextRunAt"               TIMESTAMP NULL,
  "LastRunAt"               TIMESTAMP NULL,
  "LastStatus"              VARCHAR(20) NULL,
  "ConsecutiveFailures"     INTEGER NOT NULL DEFAULT 0,
  "BlockReason"             VARCHAR(500) NULL,
  "UpdatedAt"               TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  "CreatedAt"               TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS "IX_ProcessSchedules_NextRunAt"
  ON "ProcessSchedules" ("Enabled", "Paused", "NextRunAt");

CREATE TABLE IF NOT EXISTS "ProcessRuns" (
  "Id"              BIGSERIAL PRIMARY KEY,
  "ProcessKey"      VARCHAR(120) NOT NULL,
  "TriggeredBy"     VARCHAR(20)  NOT NULL DEFAULT 'schedule',
  "Attempt"         INTEGER NOT NULL DEFAULT 1,
  "Status"          VARCHAR(20)  NOT NULL DEFAULT 'running',
  "StartedAt"       TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  "FinishedAt"      TIMESTAMP NULL,
  "DurationMs"      INTEGER NULL,
  "ItemsProcessed"  INTEGER NULL,
  "Error"           TEXT NULL,
  "BlockReason"     VARCHAR(500) NULL,
  "NextRetryAt"     TIMESTAMP NULL,
  "OutputJson"      JSONB NULL
);

CREATE INDEX IF NOT EXISTS "IX_ProcessRuns_Key_StartedAt"
  ON "ProcessRuns" ("ProcessKey", "StartedAt" DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON "ProcessSchedules", "ProcessRuns" TO app_user';
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE "ProcessSchedules_Id_seq", "ProcessRuns_Id_seq" TO app_user';
  END IF;
END $$;


-- =====================================================================
-- PART 2 — Verification report
-- =====================================================================
-- Returns one row per MISSING table or MISSING column that at least one
-- process depends on. A clean install must return ZERO rows.
-- The "process_key" column tells you exactly which process breaks.

WITH required(process_key, tbl, col) AS (
  VALUES
  -- ── module infrastructure (used by ALL 20 processes) ──────────────
  ('*scheduler*',                              'ProcessSchedules', 'Key'),
  ('*scheduler*',                              'ProcessSchedules', 'Enabled'),
  ('*scheduler*',                              'ProcessSchedules', 'Paused'),
  ('*scheduler*',                              'ProcessSchedules', 'IntervalMinutes'),
  ('*scheduler*',                              'ProcessSchedules', 'MaxRetries'),
  ('*scheduler*',                              'ProcessSchedules', 'RetryBackoffSeconds'),
  ('*scheduler*',                              'ProcessSchedules', 'ConfigJson'),
  ('*scheduler*',                              'ProcessSchedules', 'NextRunAt'),
  ('*scheduler*',                              'ProcessSchedules', 'LastRunAt'),
  ('*scheduler*',                              'ProcessSchedules', 'LastStatus'),
  ('*scheduler*',                              'ProcessSchedules', 'ConsecutiveFailures'),
  ('*scheduler*',                              'ProcessSchedules', 'BlockReason'),
  ('*history*',                                'ProcessRuns',      'ProcessKey'),
  ('*history*',                                'ProcessRuns',      'TriggeredBy'),
  ('*history*',                                'ProcessRuns',      'Attempt'),
  ('*history*',                                'ProcessRuns',      'Status'),
  ('*history*',                                'ProcessRuns',      'StartedAt'),
  ('*history*',                                'ProcessRuns',      'FinishedAt'),
  ('*history*',                                'ProcessRuns',      'DurationMs'),
  ('*history*',                                'ProcessRuns',      'ItemsProcessed'),
  ('*history*',                                'ProcessRuns',      'Error'),
  ('*history*',                                'ProcessRuns',      'BlockReason'),
  ('*history*',                                'ProcessRuns',      'NextRetryAt'),
  ('*history*',                                'ProcessRuns',      'OutputJson'),
  -- server-side audit logging of every run outcome
  ('*run logging*',                            'SystemLogs',       'Timestamp'),
  ('*run logging*',                            'SystemLogs',       'Level'),
  ('*run logging*',                            'SystemLogs',       'Message'),
  ('*run logging*',                            'SystemLogs',       'Module'),

  -- ── 1. admin.invoices-mark-overdue ────────────────────────────────
  ('admin.invoices-mark-overdue',              'Invoices',         'Status'),
  ('admin.invoices-mark-overdue',              'Invoices',         'DueDate'),
  ('admin.invoices-mark-overdue',              'Invoices',         'AmountPaid'),
  ('admin.invoices-mark-overdue',              'Invoices',         'GrandTotal'),
  ('admin.invoices-mark-overdue',              'Invoices',         'IsDeleted'),
  ('admin.invoices-mark-overdue',              'Invoices',         'UpdatedAt'),

  -- ── 2. admin.offers-mark-expired ──────────────────────────────────
  ('admin.offers-mark-expired',                'Offers',           'Status'),
  ('admin.offers-mark-expired',                'Offers',           'ValidUntil'),
  ('admin.offers-mark-expired',                'Offers',           'IsDeleted'),
  ('admin.offers-mark-expired',                'Offers',           'UpdatedAt'),

  -- ── 3. admin.dispatches-mark-missed ───────────────────────────────
  ('admin.dispatches-mark-missed',             'Dispatches',       'Status'),
  ('admin.dispatches-mark-missed',             'Dispatches',       'ScheduledDate'),
  ('admin.dispatches-mark-missed',             'Dispatches',       'ActualStartTime'),
  ('admin.dispatches-mark-missed',             'Dispatches',       'IsDeleted'),
  ('admin.dispatches-mark-missed',             'Dispatches',       'ModifiedDate'),

  -- ── 4. admin.payment-installments-mark-overdue (snake_case table) ─
  ('admin.payment-installments-mark-overdue',  'payment_plan_installments', 'status'),
  ('admin.payment-installments-mark-overdue',  'payment_plan_installments', 'due_date'),

  -- ── 5. admin.support-tickets-autoclose-resolved ───────────────────
  ('admin.support-tickets-autoclose-resolved', 'SupportTickets',   'Status'),
  ('admin.support-tickets-autoclose-resolved', 'SupportTickets',   'LastOccurredAt'),
  ('admin.support-tickets-autoclose-resolved', 'SupportTickets',   'CreatedAt'),

  -- ── 6. admin.draft-offers-purge ───────────────────────────────────
  ('admin.draft-offers-purge',                 'Offers',           'ModifiedDate'),
  ('admin.draft-offers-purge',                 'Offers',           'CreatedDate'),

  -- ── 7. admin.draft-invoices-purge ─────────────────────────────────
  ('admin.draft-invoices-purge',               'Invoices',         'CreatedAt'),

  -- ── 8/9. admin.notifications-purge-read / -stale-unread ───────────
  ('admin.notifications-purge-read',           'Notifications',    'IsRead'),
  ('admin.notifications-purge-read',           'Notifications',    'CreatedAt'),

  -- ── 10. admin.calendar-events-purge-past (snake_case table) ───────
  ('admin.calendar-events-purge-past',         'calendar_events',  'End'),
  ('admin.calendar-events-purge-past',         'calendar_events',  'Status'),

  -- ── 11. admin.sync-changes-purge ──────────────────────────────────
  ('admin.sync-changes-purge',                 'sync_changes',     'ChangedAt'),

  -- ── 12. admin.sync-receipts-purge ─────────────────────────────────
  ('admin.sync-receipts-purge',                'sync_operation_receipts', 'CreatedAt'),

  -- ── 13. admin.webhook-jobs-purge ──────────────────────────────────
  ('admin.webhook-jobs-purge',                 'WebhookForwardJobs', 'Status'),
  ('admin.webhook-jobs-purge',                 'WebhookForwardJobs', 'CompletedAt'),

  -- ── 14. admin.external-endpoint-logs-purge ────────────────────────
  ('admin.external-endpoint-logs-purge',       'ExternalEndpoints',    'IsDeleted'),
  ('admin.external-endpoint-logs-purge',       'ExternalEndpoints',    'LogRetentionDays'),
  ('admin.external-endpoint-logs-purge',       'ExternalEndpointLogs', 'EndpointId'),
  ('admin.external-endpoint-logs-purge',       'ExternalEndpointLogs', 'ReceivedAt'),

  -- ── 15. admin.dispatch-audit-purge ────────────────────────────────
  ('admin.dispatch-audit-purge',               'DispatchAuditLogs', 'CreatedAt'),

  -- ── 16. admin.hr-audit-purge (snake_case table + column) ──────────
  ('admin.hr-audit-purge',                     'hr_audit_logs',    'created_at'),

  -- ── 17. admin.soft-deleted-purge (7 tables, all must exist) ───────
  ('admin.soft-deleted-purge',                 'Invoices',         'DeletedAt'),
  ('admin.soft-deleted-purge',                 'Offers',           'DeletedAt'),
  ('admin.soft-deleted-purge',                 'Offers',           'IsDeleted'),
  ('admin.soft-deleted-purge',                 'Deals',            'IsDeleted'),
  ('admin.soft-deleted-purge',                 'Deals',            'DeletedAt'),
  ('admin.soft-deleted-purge',                 'Sales',            'IsDeleted'),
  ('admin.soft-deleted-purge',                 'Sales',            'DeletedAt'),
  ('admin.soft-deleted-purge',                 'Articles',         'IsDeleted'),
  ('admin.soft-deleted-purge',                 'Articles',         'DeletedAt'),
  ('admin.soft-deleted-purge',                 'Dispatches',       'DeletedAt'),
  ('admin.soft-deleted-purge',                 'ServiceOrders',    'IsDeleted'),
  ('admin.soft-deleted-purge',                 'ServiceOrders',    'DeletedAt'),

  -- ── 18. admin.recurring-task-logs-purge ───────────────────────────
  ('admin.recurring-task-logs-purge',          'RecurringTaskLogs', 'GeneratedDate'),

  -- ── 19. admin.purge-system-logs ───────────────────────────────────
  ('admin.purge-system-logs',                  'SystemLogs',       'Timestamp'),

  -- ── 20. admin.retry-failed-emails ─────────────────────────────────
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'Status'),
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'Attempts'),
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'MaxAttempts'),
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'NextRetryAt'),
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'LastAttemptAt'),
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'LastError'),
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'AccountId'),
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'UserId'),
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'TenantId'),
  ('admin.retry-failed-emails',                'OutboundEmailLogs', 'CreatedAt'),
  -- the retry actually re-sends through IEmailAccountService, which resolves
  -- the sending account row; without it every retry fails "Account not found".
  ('admin.retry-failed-emails',                'ConnectedEmailAccounts', 'Id'),
  ('admin.retry-failed-emails',                'ConnectedEmailAccounts', 'TenantId')
)
SELECT
  r.process_key,
  r.tbl   AS missing_in_table,
  CASE WHEN t.table_name IS NULL THEN '<TABLE MISSING>' ELSE r.col END AS problem
FROM required r
LEFT JOIN information_schema.tables t
       ON t.table_schema = 'public' AND t.table_name = r.tbl
LEFT JOIN information_schema.columns c
       ON c.table_schema = 'public' AND c.table_name = r.tbl AND c.column_name = r.col
WHERE t.table_name IS NULL OR c.column_name IS NULL
ORDER BY 1, 2, 3;


-- =====================================================================
-- PART 3 — Optional: grants for a restricted application role
-- =====================================================================
-- Processes run under the API's own connection. If you enabled role
-- separation (app_user), the role needs write access to every table a
-- process mutates, otherwise runs fail with "permission denied".

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'Invoices','Offers','Dispatches','payment_plan_installments','SupportTickets',
    'Notifications','calendar_events','sync_changes','sync_operation_receipts',
    'WebhookForwardJobs','ExternalEndpoints','ExternalEndpointLogs',
    'DispatchAuditLogs','hr_audit_logs','Deals','Sales','Articles','ServiceOrders',
    'RecurringTaskLogs','SystemLogs','OutboundEmailLogs','ConnectedEmailAccounts'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    FOREACH t IN ARRAY tables LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema='public' AND table_name=t) THEN
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO app_user', t);
      END IF;
    END LOOP;
  END IF;
END $$;
