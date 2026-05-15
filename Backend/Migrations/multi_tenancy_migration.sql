-- ═══════════════════════════════════════════════════════════════════════════
-- MULTI-TENANCY MIGRATION — Single Database, TenantId Column Approach
-- Execute this script on your Neon database BEFORE deploying the new backend.
-- All existing data gets TenantId = 0 (default tenant) automatically.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1: Create the Tenants registry table
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Tenants" (
    "Id"              SERIAL PRIMARY KEY,
    "MainAdminUserId" INT NOT NULL REFERENCES "MainAdminUsers"("Id") ON DELETE CASCADE,
    "Slug"            VARCHAR(50) NOT NULL UNIQUE,
    "CompanyName"     VARCHAR(255) NOT NULL,
    "CompanyLogoUrl"  VARCHAR(500),
    "CompanyWebsite"  VARCHAR(500),
    "CompanyPhone"    VARCHAR(50),
    "CompanyAddress"  TEXT,
    "CompanyCountry"  VARCHAR(2),
    "Industry"        VARCHAR(100),
    "IsActive"        BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDefault"       BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_Tenants_MainAdminUserId" ON "Tenants"("MainAdminUserId");
CREATE INDEX IF NOT EXISTS "IX_Tenants_Slug" ON "Tenants"("Slug");

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2: Insert default tenant (TenantId=0 is used in data tables)
-- This maps the existing MainAdminUser (Id=1) to a "default" company.
-- Adjust MainAdminUserId if your admin has a different Id.
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO "Tenants" ("MainAdminUserId", "Slug", "CompanyName", "IsActive", "IsDefault")
SELECT 1, 'default', COALESCE("CompanyName", 'My Company'), TRUE, TRUE
FROM "MainAdminUsers"
WHERE "Id" = 1
ON CONFLICT ("Slug") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 3: Add "TenantId" INT NOT NULL DEFAULT 0 to ALL data tables
-- Uses a PL/pgSQL DO block — skips tables that already have the column.
-- All existing rows automatically get TenantId = 0.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    tbl TEXT;
    tbls TEXT[] := ARRAY[
        -- Users & Auth
        'Users','UserPreferences','Roles','RolePermissions','UserRoles',
        'Skills','UserSkills','RoleSkills',
        -- Contacts
        'Contacts','ContactNotes','ContactTags','ContactTagAssignments',
        -- Articles & Inventory
        'Articles','ArticleCategories','Locations','InventoryTransactions','stock_transactions',
        -- Calendar
        'calendar_events','event_types','event_attendees','event_reminders',
        -- Email Accounts
        'ConnectedEmailAccounts','CustomEmailAccounts','EmailBlocklistItems',
        'SyncedEmails','SyncedEmailAttachments','SyncedCalendarEvents',
        -- Projects & Tasks
        'Projects','ProjectColumns','ProjectNotes','ProjectActivities',
        'ProjectTasks','DailyTasks','TaskComments','TaskAttachments',
        'TaskTimeEntries','TaskChecklists','TaskChecklistItems',
        'RecurringTasks','RecurringTaskLogs',
        -- Lookups
        'LookupItems','Currencies',
        -- Offers
        'Offers','OfferItems','OfferActivities',
        -- Sales
        'Sales','SaleItems','SaleActivities',
        -- Installations
        'Installations','InstallationNotes','MaintenanceHistories',
        -- Dispatches
        'Dispatches','DispatchTechnicians','DispatchJobs',
        'TimeEntries','Expenses','MaterialUsage','Attachments','Notes',
        -- Service Orders
        'ServiceOrders','ServiceOrderJobs','ServiceOrderMaterials',
        'ServiceOrderTimeEntries','ServiceOrderExpenses','ServiceOrderNotes',
        -- Planning
        'user_working_hours','user_leaves','user_status_history','dispatch_history',
        -- System
        'Notifications','SystemLogs','PdfSettings',
        'NumberingSettings','NumberSequences',
        -- Dynamic Forms
        'DynamicForms','DynamicFormResponses',
        -- Dashboards
        'Dashboards',
        -- Shared
        'EntityFormDocuments',
        -- AI Chat
        'AiConversations','AiMessages',
        -- Workflow Engine
        'WorkflowDefinitions','WorkflowTriggers','WorkflowExecutions',
        'WorkflowExecutionLogs','WorkflowApprovals','WorkflowProcessedEntities',
        -- Documents & Signatures
        'Documents','UserSignatures',
        -- Website Builder
        'WB_Sites','WB_Pages','WB_PageVersions','WB_GlobalBlocks',
        'WB_GlobalBlockUsages','WB_BrandProfiles','WB_FormSubmissions',
        'WB_Media','WB_Templates','WB_ActivityLog',
        -- User AI Settings
        'UserAiKeys','UserAiPreferences',
        -- Payments
        'payment_plans','payment_plan_installments','payments','payment_item_allocations',
        -- Retenue Source
        'RSRecords','TEJExportLogs',
        -- Support Tickets
        'SupportTickets','SupportTicketAttachments','SupportTicketComments','SupportTicketLinks',
        -- App Settings
        'AppSettings'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbls LOOP
        -- Only add if column doesn't exist yet
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = tbl AND column_name = 'TenantId'
        ) THEN
            BEGIN
                EXECUTE format('ALTER TABLE %I ADD COLUMN "TenantId" INT NOT NULL DEFAULT 0', tbl);
                EXECUTE format('CREATE INDEX IF NOT EXISTS "IX_%s_TenantId" ON %I ("TenantId")', replace(tbl, ' ', '_'), tbl);
                RAISE NOTICE 'Added TenantId to table: %', tbl;
            EXCEPTION WHEN undefined_table THEN
                RAISE NOTICE 'Table % does not exist, skipping', tbl;
            END;
        ELSE
            RAISE NOTICE 'Table % already has TenantId, skipping', tbl;
        END IF;
    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- DONE! All existing data now has TenantId = 0 (default tenant).
-- New tenants will get TenantId = 1, 2, 3, etc. (from Tenants.Id)
-- ─────────────────────────────────────────────────────────────────────────
