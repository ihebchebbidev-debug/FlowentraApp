-- =====================================================
-- PERFORMANCE INDEXES FOR SCALE (1000 tenants, millions of rows)
-- DATE: 2026-02-16
-- DESCRIPTION: Composite, partial, and covering indexes
--   for the most common query patterns. Safe to run
--   repeatedly (IF NOT EXISTS).
--
-- WHY:
--   • Partial indexes on soft-delete flags cut index size 50-90%
--   • Composite indexes avoid index-merge overhead
--   • LOWER() functional indexes enable index-backed ILIKE/= searches
--   • Covering indexes (INCLUDE) avoid heap fetches for list queries
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. CONTACTS — heaviest table at scale
-- ─────────────────────────────────────────────────────

-- List queries always filter IsActive + sort by CreatedDate
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_contacts_active_created"
    ON "Contacts" ("CreatedDate" DESC)
    WHERE "IsActive" = true;

-- Search by name (case-insensitive)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_contacts_name_lower"
    ON "Contacts" (LOWER("Name"))
    WHERE "IsActive" = true;

-- Search by email (case-insensitive, unique-ish)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_contacts_email_lower"
    ON "Contacts" (LOWER("Email"))
    WHERE "IsActive" = true;

-- Filter by company
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_contacts_company_lower"
    ON "Contacts" (LOWER("Company"))
    WHERE "IsActive" = true;

-- Filter by status + type (common combo)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_contacts_status_type"
    ON "Contacts" ("Status", "Type")
    WHERE "IsActive" = true;

-- Favorite contacts (small subset)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_contacts_favorites"
    ON "Contacts" ("CreatedDate" DESC)
    WHERE "IsActive" = true AND "Favorite" = true;

-- Geolocation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_contacts_geolocation"
    ON "Contacts" ("Latitude", "Longitude")
    WHERE "IsActive" = true AND "Latitude" IS NOT NULL AND "Longitude" IS NOT NULL;

-- ─────────────────────────────────────────────────────
-- 2. USERS — authentication & lookup hot path
-- ─────────────────────────────────────────────────────

-- Login by email (case-insensitive) — critical auth path
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email_lower_active"
    ON "Users" (LOWER("Email"))
    WHERE "IsDeleted" = false;

-- List active users sorted by creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_active_created"
    ON "Users" ("CreatedDate" DESC)
    WHERE "IsDeleted" = false;

-- MainAdminUsers email lookup (auth path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_mainadmin_email_lower"
    ON "MainAdminUsers" (LOWER("Email"))
    WHERE "IsActive" = true;

-- ─────────────────────────────────────────────────────
-- 3. OFFERS — financial queries
-- ─────────────────────────────────────────────────────

-- List by contact + status (common dashboard query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_offers_contact_status"
    ON "offers" ("contact_id", "status");

-- Date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_offers_created_desc"
    ON "offers" ("created_at" DESC);

-- ─────────────────────────────────────────────────────
-- 4. SALES — financial queries
-- ─────────────────────────────────────────────────────

-- Pipeline view: stage + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_sales_stage_status"
    ON "sales" ("stage", "status");

-- Contact sales history
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_sales_contact_created"
    ON "sales" ("contact_id", "created_at" DESC);

-- ─────────────────────────────────────────────────────
-- 5. DISPATCHES — scheduling hot path
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_dispatches_status_date"
    ON "Dispatches" ("Status", "ScheduledDate")
    WHERE "IsDeleted" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_dispatchtechnicians_user"
    ON "DispatchTechnicians" ("UserId", "DispatchId");

-- ─────────────────────────────────────────────────────
-- 6. SERVICE ORDERS
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_serviceorders_status_created"
    ON "ServiceOrders" ("Status", "CreatedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_serviceorders_contact"
    ON "ServiceOrders" ("ContactId");

-- ─────────────────────────────────────────────────────
-- 7. PROJECT TASKS — kanban board queries
-- ─────────────────────────────────────────────────────

-- Board view: project + column + sort order
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_projecttasks_board"
    ON "ProjectTasks" ("ProjectId", "ColumnId", "SortOrder");

-- My tasks across projects
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_projecttasks_assignee"
    ON "ProjectTasks" ("AssignedTo", "Status")
    WHERE "IsDeleted" = false;

-- Daily tasks for a user
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_dailytasks_user_date"
    ON "DailyTasks" ("UserId", "DueDate");

-- ─────────────────────────────────────────────────────
-- 8. CALENDAR — date range queries
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_calendar_range"
    ON "calendar_events" ("Start", "End");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_calendar_user"
    ON "calendar_events" ("CreatedBy", "Start");

-- ─────────────────────────────────────────────────────
-- 9. NOTIFICATIONS — real-time badge counts
-- ─────────────────────────────────────────────────────

-- Unread count per user (most frequent query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_unread"
    ON "Notifications" ("UserId", "CreatedAt" DESC)
    WHERE "IsRead" = false;

-- ─────────────────────────────────────────────────────
-- 10. WORKFLOW ENGINE
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_workflow_executions_status"
    ON "WorkflowExecutions" ("Status", "StartedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_workflow_processed"
    ON "WorkflowProcessedEntities" ("WorkflowDefinitionId", "EntityType", "EntityId");

-- ─────────────────────────────────────────────────────
-- 11. ARTICLES — inventory lookups
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_active_type"
    ON "Articles" ("Type", "IsActive")
    WHERE "IsDeleted" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_name_lower"
    ON "Articles" (LOWER("Name"))
    WHERE "IsDeleted" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_articles_sku"
    ON "Articles" ("Sku")
    WHERE "IsDeleted" = false AND "Sku" IS NOT NULL;

-- Stock transactions by article (audit trail)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_stock_tx_article_date"
    ON "stock_transactions" ("ArticleId", "CreatedAt" DESC);

-- ─────────────────────────────────────────────────────
-- 12. PAYMENTS — financial reporting
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_sale_status"
    ON "Payments" ("SaleId", "Status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_installments_due"
    ON "PaymentPlanInstallments" ("DueDate", "Status")
    WHERE "Status" != 'paid';

-- ─────────────────────────────────────────────────────
-- 13. INSTALLATIONS
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_installations_contact_status"
    ON "Installations" ("ContactId", "Status");

-- ─────────────────────────────────────────────────────
-- 14. CONNECTED EMAIL ACCOUNTS
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_email_accounts_user"
    ON "ConnectedEmailAccounts" ("UserId", "IsActive")
    WHERE "IsActive" = true;

-- ─────────────────────────────────────────────────────
-- 15. DASHBOARDS
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_dashboards_user"
    ON "Dashboards" ("UserId");

-- ─────────────────────────────────────────────────────
-- 16. DYNAMIC FORMS
-- ─────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_form_responses_form"
    ON "DynamicFormResponses" ("FormId", "SubmittedAt" DESC);

-- =====================================================
-- ANALYZE: Update query planner statistics after index creation
-- Run this AFTER all indexes are created
-- =====================================================
ANALYZE "Contacts";
ANALYZE "Users";
ANALYZE "MainAdminUsers";
ANALYZE "offers";
ANALYZE "sales";
ANALYZE "Dispatches";
ANALYZE "ServiceOrders";
ANALYZE "ProjectTasks";
ANALYZE "DailyTasks";
ANALYZE "calendar_events";
ANALYZE "Notifications";
ANALYZE "Articles";
ANALYZE "stock_transactions";
ANALYZE "Payments";
ANALYZE "Installations";
