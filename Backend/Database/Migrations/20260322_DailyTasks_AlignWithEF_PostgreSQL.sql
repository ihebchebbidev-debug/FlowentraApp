-- Align "DailyTasks" with EF model (Modules/Projects/Models/DailyTask.cs) and ITenantEntity.
-- Without these columns / names, GET /api/Tasks/daily/user/{userId} can return HTTP 500 during
-- offline hydration (Npgsql: column does not exist).
--
-- Safe to run multiple times (IF NOT EXISTS / conditional renames).
-- Target: PostgreSQL / Neon (public schema).

BEGIN;

-- 1) Legacy Neon schema used "UserId" and "CreatedAt"; EF expects "AssignedUserId" and "CreatedDate".
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'DailyTasks' AND column_name = 'UserId')
     AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'DailyTasks' AND column_name = 'AssignedUserId') THEN
    ALTER TABLE "DailyTasks" RENAME COLUMN "UserId" TO "AssignedUserId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'DailyTasks' AND column_name = 'CreatedAt')
     AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'DailyTasks' AND column_name = 'CreatedDate') THEN
    ALTER TABLE "DailyTasks" RENAME COLUMN "CreatedAt" TO "CreatedDate";
  END IF;
END $$;

-- 2) Columns required by the current C# model (see DailyTask.cs)
ALTER TABLE "DailyTasks" ADD COLUMN IF NOT EXISTS "Description" VARCHAR(2000) NULL;
ALTER TABLE "DailyTasks" ADD COLUMN IF NOT EXISTS "TaskType" VARCHAR(50) NOT NULL DEFAULT 'follow-up';
ALTER TABLE "DailyTasks" ADD COLUMN IF NOT EXISTS "RelatedEntityType" VARCHAR(50) NULL;
ALTER TABLE "DailyTasks" ADD COLUMN IF NOT EXISTS "RelatedEntityId" INTEGER NULL;
ALTER TABLE "DailyTasks" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;

-- 3) Model maps CreatedBy as non-nullable string; avoid NULL materialization issues
UPDATE "DailyTasks" SET "CreatedBy" = COALESCE("CreatedBy", '') WHERE "CreatedBy" IS NULL;

COMMIT;
