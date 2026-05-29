-- =====================================================
-- Projects Module: create tables the code expects but DB lacks
--  - ProjectColumns (Kanban columns)
--  - TaskAttachments
--  - TaskChecklists / TaskChecklistItems (with TenantId)
-- Idempotent: safe to run on databases where some objects exist.
-- =====================================================

-- ProjectColumns ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "ProjectColumns" (
    "Id"           SERIAL PRIMARY KEY,
    "TenantId"     INTEGER NOT NULL DEFAULT 0,
    "ProjectId"    INTEGER NOT NULL,
    "Name"         VARCHAR(100) NOT NULL,
    "DisplayOrder" INTEGER NOT NULL DEFAULT 0,
    "Color"        VARCHAR(7) NULL,
    CONSTRAINT "FK_ProjectColumns_Projects" FOREIGN KEY ("ProjectId")
        REFERENCES "Projects"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_ProjectColumns_ProjectId"    ON "ProjectColumns"("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectColumns_TenantId"     ON "ProjectColumns"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_ProjectColumns_DisplayOrder" ON "ProjectColumns"("DisplayOrder");

-- TaskAttachments --------------------------------------------------
CREATE TABLE IF NOT EXISTS "TaskAttachments" (
    "Id"           SERIAL PRIMARY KEY,
    "TenantId"     INTEGER NOT NULL DEFAULT 0,
    "TaskId"       INTEGER NOT NULL,
    "FileName"     VARCHAR(255) NOT NULL,
    "FilePath"     VARCHAR(500) NOT NULL,
    "FileSize"     BIGINT NOT NULL DEFAULT 0,
    "ContentType"  VARCHAR(100) NOT NULL,
    "UploadedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UploadedBy"   VARCHAR(100) NOT NULL,
    CONSTRAINT "FK_TaskAttachments_ProjectTasks" FOREIGN KEY ("TaskId")
        REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_TaskAttachments_TaskId"   ON "TaskAttachments"("TaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskAttachments_TenantId" ON "TaskAttachments"("TenantId");

-- TaskChecklists ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "TaskChecklists" (
    "Id"            SERIAL PRIMARY KEY,
    "TenantId"      INTEGER NOT NULL DEFAULT 0,
    "ProjectTaskId" INTEGER NULL,
    "DailyTaskId"   INTEGER NULL,
    "Title"         VARCHAR(255) NOT NULL,
    "Description"   TEXT NULL,
    "IsExpanded"    BOOLEAN NOT NULL DEFAULT TRUE,
    "SortOrder"     INTEGER NOT NULL DEFAULT 0,
    "CreatedDate"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy"     VARCHAR(100) NOT NULL,
    "ModifiedDate"  TIMESTAMP WITH TIME ZONE NULL,
    "ModifiedBy"    VARCHAR(100) NULL,
    CONSTRAINT "FK_TaskChecklists_ProjectTasks" FOREIGN KEY ("ProjectTaskId")
        REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskChecklists_DailyTasks" FOREIGN KEY ("DailyTaskId")
        REFERENCES "DailyTasks"("Id") ON DELETE CASCADE
);
ALTER TABLE "TaskChecklists"
    ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_ProjectTaskId" ON "TaskChecklists"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_DailyTaskId"   ON "TaskChecklists"("DailyTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_TenantId"      ON "TaskChecklists"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_SortOrder"     ON "TaskChecklists"("SortOrder");

-- TaskChecklistItems -----------------------------------------------
CREATE TABLE IF NOT EXISTS "TaskChecklistItems" (
    "Id"              SERIAL PRIMARY KEY,
    "TenantId"        INTEGER NOT NULL DEFAULT 0,
    "ChecklistId"     INTEGER NOT NULL,
    "Title"           VARCHAR(500) NOT NULL,
    "IsCompleted"     BOOLEAN NOT NULL DEFAULT FALSE,
    "CompletedAt"     TIMESTAMP WITH TIME ZONE NULL,
    "CompletedById"   INTEGER NULL,
    "CompletedByName" VARCHAR(100) NULL,
    "SortOrder"       INTEGER NOT NULL DEFAULT 0,
    "CreatedDate"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy"       VARCHAR(100) NOT NULL,
    "ModifiedDate"    TIMESTAMP WITH TIME ZONE NULL,
    "ModifiedBy"      VARCHAR(100) NULL,
    CONSTRAINT "FK_TaskChecklistItems_TaskChecklists" FOREIGN KEY ("ChecklistId")
        REFERENCES "TaskChecklists"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskChecklistItems_CompletedBy" FOREIGN KEY ("CompletedById")
        REFERENCES "MainAdminUsers"("Id") ON DELETE SET NULL
);
ALTER TABLE "TaskChecklistItems"
    ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_ChecklistId" ON "TaskChecklistItems"("ChecklistId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_TenantId"    ON "TaskChecklistItems"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_SortOrder"   ON "TaskChecklistItems"("SortOrder");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_IsCompleted" ON "TaskChecklistItems"("IsCompleted");