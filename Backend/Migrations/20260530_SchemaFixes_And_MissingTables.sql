-- =====================================================================
-- Schema fixes + missing tables (idempotent — safe to run multiple times)
-- Run order: fixes first, then new tables/columns
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- FIX 1: GoodsReceipts.Status CHECK constraint
--   DB allowed: partial | received | rejected | closed
--   Code writes: partial | complete        ← constraint violation on full delivery
--   Fix: add 'complete' to the allowed set
-- ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE cname text;
BEGIN
    SELECT conname INTO cname
      FROM pg_constraint
     WHERE conrelid = '"GoodsReceipts"'::regclass
       AND contype  = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%Status%';
    IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "GoodsReceipts" DROP CONSTRAINT %I', cname);
    END IF;
END $$;

ALTER TABLE "GoodsReceipts"
    ADD CONSTRAINT "GoodsReceipts_Status_check"
    CHECK (("Status")::text = ANY (
        ARRAY['partial'::text, 'complete'::text, 'received'::text, 'rejected'::text, 'closed'::text]
    ));

-- ─────────────────────────────────────────────────────────────────────
-- FIX 2: ArticleSuppliers — drop erroneous per-column UNIQUE constraints
--   The table has UNIQUE on TenantId, ArticleId, SupplierId individually,
--   which prevents adding more than one supplier per article (or per tenant).
--   The composite UNIQUE (TenantId, ArticleId, SupplierId) is the correct one.
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "ArticleSuppliers" DROP CONSTRAINT IF EXISTS "ArticleSuppliers_TenantId_key";
ALTER TABLE "ArticleSuppliers" DROP CONSTRAINT IF EXISTS "ArticleSuppliers_ArticleId_key";
ALTER TABLE "ArticleSuppliers" DROP CONSTRAINT IF EXISTS "ArticleSuppliers_SupplierId_key";

-- Ensure the correct composite constraint exists (covers fresh DBs too)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = '"ArticleSuppliers"'::regclass
           AND conname  = 'ArticleSuppliers_TenantId_ArticleId_SupplierId_key'
    ) THEN
        ALTER TABLE "ArticleSuppliers"
            ADD CONSTRAINT "ArticleSuppliers_TenantId_ArticleId_SupplierId_key"
            UNIQUE ("TenantId", "ArticleId", "SupplierId");
    END IF;
END $$;

-- Partial unique index (soft-delete-aware) — from 20260524_Purchases_QA_Hardening
CREATE UNIQUE INDEX IF NOT EXISTS "ux_article_suppliers_tenant_article_supplier"
    ON "ArticleSuppliers" ("TenantId", "ArticleId", "SupplierId")
    WHERE "IsDeleted" = FALSE;

-- ─────────────────────────────────────────────────────────────────────
-- MISSING TABLE: PlannedLineEntries (planning module)
--   Maps planned time & expenses to offer/sale/service-order-job lines.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PlannedLineEntries" (
    "Id"                  SERIAL PRIMARY KEY,
    "TenantId"            INTEGER          NOT NULL,
    "ParentType"          VARCHAR(30)      NOT NULL,   -- offer_item | sale_item | service_order_job
    "ParentId"            INTEGER          NOT NULL,
    "OriginOfferItemId"   INTEGER          NULL,
    "Kind"                VARCHAR(20)      NOT NULL,   -- time | expense
    "PlannedMinutes"      INTEGER          NULL,
    "TechnicianCount"     INTEGER          NULL,
    "HourlyRate"          DECIMAL(18,2)    NULL,
    "ExpenseType"         VARCHAR(30)      NULL,       -- travel | per_diem | materials | subcontractor
    "PlannedAmount"       DECIMAL(18,2)    NULL,
    "Currency"            VARCHAR(3)       NULL,
    "Description"         VARCHAR(500)     NULL,
    "CreatedAt"           TIMESTAMP        NOT NULL DEFAULT NOW(),
    "CreatedBy"           VARCHAR(100)     NULL,
    "ModifiedAt"          TIMESTAMP        NULL,
    "ModifiedBy"          VARCHAR(100)     NULL
);
CREATE INDEX IF NOT EXISTS "IX_PlannedLineEntries_Parent"
    ON "PlannedLineEntries" ("TenantId", "ParentType", "ParentId");
CREATE INDEX IF NOT EXISTS "IX_PlannedLineEntries_Origin"
    ON "PlannedLineEntries" ("TenantId", "OriginOfferItemId");

-- ─────────────────────────────────────────────────────────────────────
-- MISSING TABLE: planning_profiles + user_active_planning_profile
--   Dispatcher view configuration profiles, shareable across users.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "planning_profiles" (
    "id"                SERIAL PRIMARY KEY,
    "tenant_id"         INTEGER      NOT NULL,
    "owner_user_id"     VARCHAR(64)  NOT NULL,
    "name"              VARCHAR(120) NOT NULL,
    "description"       TEXT,
    "color"             VARCHAR(16),
    "icon"              VARCHAR(64),
    "is_shared"         BOOLEAN      NOT NULL DEFAULT FALSE,
    "visible_user_ids"  JSONB        NOT NULL DEFAULT '[]'::jsonb,
    "required_skill_ids" JSONB,
    "settings"          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    "created_at"        TIMESTAMP    NOT NULL DEFAULT NOW(),
    "created_by"        VARCHAR(100),
    "updated_at"        TIMESTAMP    NOT NULL DEFAULT NOW(),
    "updated_by"        VARCHAR(100),
    "deleted_at"        TIMESTAMP,
    "deleted_by"        VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_planning_profiles_tenant_owner"
    ON "planning_profiles" ("tenant_id", "owner_user_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_planning_profiles_tenant_shared"
    ON "planning_profiles" ("tenant_id", "is_shared") WHERE "deleted_at" IS NULL;

CREATE TABLE IF NOT EXISTS "user_active_planning_profile" (
    "user_id"    VARCHAR(64) NOT NULL,
    "tenant_id"  INTEGER     NOT NULL,
    "profile_id" INTEGER     NOT NULL REFERENCES "planning_profiles"("id") ON DELETE CASCADE,
    "updated_at" TIMESTAMP   NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("user_id", "tenant_id")
);
CREATE INDEX IF NOT EXISTS "idx_uapp_profile"
    ON "user_active_planning_profile" ("profile_id");

-- ─────────────────────────────────────────────────────────────────────
-- MISSING TABLE: ProjectColumns (Kanban columns per project)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ProjectColumns" (
    "Id"           SERIAL PRIMARY KEY,
    "TenantId"     INTEGER      NOT NULL DEFAULT 0,
    "ProjectId"    INTEGER      NOT NULL,
    "Name"         VARCHAR(100) NOT NULL,
    "DisplayOrder" INTEGER      NOT NULL DEFAULT 0,
    "Color"        VARCHAR(7)   NULL,
    CONSTRAINT "FK_ProjectColumns_Projects"
        FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_ProjectColumns_ProjectId"    ON "ProjectColumns"("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectColumns_TenantId"     ON "ProjectColumns"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_ProjectColumns_DisplayOrder" ON "ProjectColumns"("DisplayOrder");

-- ─────────────────────────────────────────────────────────────────────
-- MISSING TABLE: TaskAttachments
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "TaskAttachments" (
    "Id"           SERIAL PRIMARY KEY,
    "TenantId"     INTEGER      NOT NULL DEFAULT 0,
    "TaskId"       INTEGER      NOT NULL,
    "FileName"     VARCHAR(255) NOT NULL,
    "FilePath"     VARCHAR(500) NOT NULL,
    "FileSize"     BIGINT       NOT NULL DEFAULT 0,
    "ContentType"  VARCHAR(100) NOT NULL,
    "UploadedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UploadedBy"   VARCHAR(100) NOT NULL,
    CONSTRAINT "FK_TaskAttachments_ProjectTasks"
        FOREIGN KEY ("TaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_TaskAttachments_TaskId"   ON "TaskAttachments"("TaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskAttachments_TenantId" ON "TaskAttachments"("TenantId");

-- ─────────────────────────────────────────────────────────────────────
-- TaskChecklists / TaskChecklistItems — ensure TenantId column exists
--   These tables may exist from AddTaskChecklists_PostgreSQL.sql but without TenantId.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "TaskChecklists" (
    "Id"            SERIAL PRIMARY KEY,
    "TenantId"      INTEGER      NOT NULL DEFAULT 0,
    "ProjectTaskId" INTEGER      NULL,
    "DailyTaskId"   INTEGER      NULL,
    "Title"         VARCHAR(255) NOT NULL,
    "Description"   TEXT         NULL,
    "IsExpanded"    BOOLEAN      NOT NULL DEFAULT TRUE,
    "SortOrder"     INTEGER      NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy"     VARCHAR(100) NOT NULL,
    "ModifiedDate"  TIMESTAMP WITH TIME ZONE NULL,
    "ModifiedBy"    VARCHAR(100) NULL,
    CONSTRAINT "FK_TaskChecklists_ProjectTasks"
        FOREIGN KEY ("ProjectTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskChecklists_DailyTasks"
        FOREIGN KEY ("DailyTaskId") REFERENCES "DailyTasks"("Id") ON DELETE CASCADE
);
ALTER TABLE "TaskChecklists" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_ProjectTaskId" ON "TaskChecklists"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_DailyTaskId"   ON "TaskChecklists"("DailyTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_TenantId"      ON "TaskChecklists"("TenantId");

CREATE TABLE IF NOT EXISTS "TaskChecklistItems" (
    "Id"              SERIAL PRIMARY KEY,
    "TenantId"        INTEGER      NOT NULL DEFAULT 0,
    "ChecklistId"     INTEGER      NOT NULL,
    "Title"           VARCHAR(500) NOT NULL,
    "IsCompleted"     BOOLEAN      NOT NULL DEFAULT FALSE,
    "CompletedAt"     TIMESTAMP WITH TIME ZONE NULL,
    "CompletedById"   INTEGER      NULL,
    "CompletedByName" VARCHAR(100) NULL,
    "SortOrder"       INTEGER      NOT NULL DEFAULT 0,
    "CreatedDate"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy"       VARCHAR(100) NOT NULL,
    "ModifiedDate"    TIMESTAMP WITH TIME ZONE NULL,
    "ModifiedBy"      VARCHAR(100) NULL,
    CONSTRAINT "FK_TaskChecklistItems_TaskChecklists"
        FOREIGN KEY ("ChecklistId") REFERENCES "TaskChecklists"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskChecklistItems_CompletedBy"
        FOREIGN KEY ("CompletedById") REFERENCES "MainAdminUsers"("Id") ON DELETE SET NULL
);
ALTER TABLE "TaskChecklistItems" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_ChecklistId" ON "TaskChecklistItems"("ChecklistId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_TenantId"    ON "TaskChecklistItems"("TenantId");

-- ─────────────────────────────────────────────────────────────────────
-- COLUMN ADDITIONS: OverrunFlag / OverrunReason on TimeEntries
--   Expenses already has these (confirmed in current schema).
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "TimeEntries"
    ADD COLUMN IF NOT EXISTS "OverrunFlag"   BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "OverrunReason" VARCHAR(500) NULL;
