-- Migration Script: Refactor ProjectTasks to Activity Tracker Entity

BEGIN;

-- 1. Add new columns
ALTER TABLE "ProjectTasks" 
ADD COLUMN IF NOT EXISTS "RelatedEntityType" VARCHAR(50) NULL;

ALTER TABLE "ProjectTasks" 
ADD COLUMN IF NOT EXISTS "RelatedEntityId" INT NULL;

ALTER TABLE "ProjectTasks" 
ADD COLUMN IF NOT EXISTS "TaskType" VARCHAR(50) DEFAULT 'follow-up' NOT NULL;

ALTER TABLE "ProjectTasks" 
ADD COLUMN IF NOT EXISTS "Status" VARCHAR(50) DEFAULT 'open' NOT NULL;

-- 2. Migrate existing data conceptually
UPDATE "ProjectTasks" 
SET "RelatedEntityType" = 'project',
    "RelatedEntityId" = "ProjectId"
WHERE "ProjectId" IS NOT NULL AND "RelatedEntityType" IS NULL;

-- 3. Drop Foreign Key Constraints (check your specific constraint names if they differ)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_ProjectTasks_Projects_ProjectId') THEN
        ALTER TABLE "ProjectTasks" DROP CONSTRAINT "FK_ProjectTasks_Projects_ProjectId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_ProjectTasks_ProjectColumns_ColumnId') THEN
        ALTER TABLE "ProjectTasks" DROP CONSTRAINT "FK_ProjectTasks_ProjectColumns_ColumnId";
    END IF;
END $$;

-- 4. Drop old columns
ALTER TABLE "ProjectTasks" 
DROP COLUMN IF EXISTS "ProjectId" CASCADE,
DROP COLUMN IF EXISTS "ColumnId" CASCADE,
DROP COLUMN IF EXISTS "DisplayOrder" CASCADE;

-- 5. Drop removed feature tables
DROP TABLE IF EXISTS "TaskAttachments" CASCADE;
DROP TABLE IF EXISTS "TaskChecklistItems" CASCADE;
DROP TABLE IF EXISTS "TaskChecklists" CASCADE;
DROP TABLE IF EXISTS "ProjectColumns" CASCADE;

COMMIT;
