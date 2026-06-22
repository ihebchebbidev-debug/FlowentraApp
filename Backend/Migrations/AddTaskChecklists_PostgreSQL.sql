-- =====================================================
-- PostgreSQL Migration Script: Task Checklists Feature
-- For Neon PostgreSQL Database
-- =====================================================

-- Create the TaskChecklists table
CREATE TABLE IF NOT EXISTS "TaskChecklists" (
    "Id" SERIAL PRIMARY KEY,

    -- Multi-tenant scope (matches the EF ITenantEntity model)
    "TenantId" INTEGER NOT NULL DEFAULT 0,

    -- Foreign keys (one of these should be set)
    "ProjectTaskId" INTEGER NULL,
    "DailyTaskId" INTEGER NULL,
    
    -- Checklist details
    "Title" VARCHAR(255) NOT NULL,
    "Description" TEXT NULL,
    "IsExpanded" BOOLEAN NOT NULL DEFAULT TRUE,
    "SortOrder" INTEGER NOT NULL DEFAULT 0,
    
    -- Audit fields
    "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(100) NOT NULL,
    "ModifiedDate" TIMESTAMP WITH TIME ZONE NULL,
    "ModifiedBy" VARCHAR(100) NULL,
    
    -- Foreign key constraints
    CONSTRAINT "FK_TaskChecklists_ProjectTasks" FOREIGN KEY ("ProjectTaskId") 
        REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskChecklists_DailyTasks" FOREIGN KEY ("DailyTaskId") 
        REFERENCES "DailyTasks"("Id") ON DELETE CASCADE
);

-- Create the TaskChecklistItems table
CREATE TABLE IF NOT EXISTS "TaskChecklistItems" (
    "Id" SERIAL PRIMARY KEY,

    -- Multi-tenant scope (matches the EF ITenantEntity model)
    "TenantId" INTEGER NOT NULL DEFAULT 0,

    -- Parent checklist
    "ChecklistId" INTEGER NOT NULL,
    
    -- Item details
    "Title" VARCHAR(500) NOT NULL,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CompletedAt" TIMESTAMP WITH TIME ZONE NULL,
    "CompletedById" INTEGER NULL,
    "CompletedByName" VARCHAR(100) NULL,
    "SortOrder" INTEGER NOT NULL DEFAULT 0,
    
    -- Audit fields
    "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(100) NOT NULL,
    "ModifiedDate" TIMESTAMP WITH TIME ZONE NULL,
    "ModifiedBy" VARCHAR(100) NULL,
    
    -- Foreign key constraints
    CONSTRAINT "FK_TaskChecklistItems_TaskChecklists" FOREIGN KEY ("ChecklistId") 
        REFERENCES "TaskChecklists"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskChecklistItems_CompletedBy" FOREIGN KEY ("CompletedById") 
        REFERENCES "MainAdminUsers"("Id") ON DELETE SET NULL
);

-- Defensive: ensure TenantId exists even on databases where these tables were
-- created by an earlier version of this script (before TenantId was added natively).
ALTER TABLE "TaskChecklists"     ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TaskChecklistItems" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_TenantId" ON "TaskChecklists"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_TenantId" ON "TaskChecklistItems"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_ProjectTaskId" ON "TaskChecklists"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_DailyTaskId" ON "TaskChecklists"("DailyTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklists_SortOrder" ON "TaskChecklists"("SortOrder");

CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_ChecklistId" ON "TaskChecklistItems"("ChecklistId");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_SortOrder" ON "TaskChecklistItems"("SortOrder");
CREATE INDEX IF NOT EXISTS "IX_TaskChecklistItems_IsCompleted" ON "TaskChecklistItems"("IsCompleted");

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the tables were created correctly:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name IN ('TaskChecklists', 'TaskChecklistItems');
-- =====================================================
