-- =============================================================================
-- Migration: 20260526_module_scope_settings_extra_keys
-- Purpose : Seed additional module-scope keys that were missing from the
--           original 20260518 migration so admins can toggle them in Settings.
--
-- New keys:
--   dispatches      → Dispatch + child entities (jobs, technicians, time,
--                     expenses, materials, attachments, notes)
--   installations   → Installation, InstallationNote, MaintenanceHistory
--   planning        → User working hours, leaves, status history, dispatch
--                     history, technician status history, planned lines
--   workflow_engine → Workflow definitions / executions / triggers / approvals
--   dynamic_forms   → DynamicForm templates
--   dashboards      → User/company dashboards
--
-- WebsiteBuilder + SupportTickets intentionally NOT added — they stay
-- per_company always (no scope attribute on their entities).
-- Run on EVERY tenant database.
-- =============================================================================

INSERT INTO "ModuleScopeSettings" ("ModuleKey", "Scope") VALUES
    ('dispatches',      'per_company'),
    ('installations',   'per_company'),
    ('planning',        'per_company'),
    ('workflow_engine', 'per_company'),
    ('dynamic_forms',   'per_company'),
    ('dashboards',      'per_company')
ON CONFLICT ("ModuleKey") DO NOTHING;
