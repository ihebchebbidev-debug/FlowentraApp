-- ============================================================================
-- DISPATCH JOBS JOIN TABLE + INSTALLATION COLUMNS MIGRATION
-- Supports "One Dispatch Per Installation" feature
-- Run this against your PostgreSQL database
-- ============================================================================

-- Step 1: Create DispatchJobs join table
CREATE TABLE IF NOT EXISTS "DispatchJobs" (
  "Id" SERIAL PRIMARY KEY,
  "DispatchId" INT NOT NULL REFERENCES "Dispatches"("Id") ON DELETE CASCADE,
  "JobId" INT NOT NULL,
  "CreatedDate" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("DispatchId", "JobId")
);
CREATE INDEX IF NOT EXISTS "IX_DispatchJobs_DispatchId" ON "DispatchJobs"("DispatchId");
CREATE INDEX IF NOT EXISTS "IX_DispatchJobs_JobId" ON "DispatchJobs"("JobId");

-- Step 2: Add InstallationId and InstallationName to Dispatches
ALTER TABLE "Dispatches" ADD COLUMN IF NOT EXISTS "InstallationId" INT NULL;
ALTER TABLE "Dispatches" ADD COLUMN IF NOT EXISTS "InstallationName" VARCHAR(255) NULL;

-- Step 3: Backfill existing single-job dispatches into join table
INSERT INTO "DispatchJobs" ("DispatchId", "JobId", "CreatedDate")
SELECT "Id", CAST("JobId" AS INT), "CreatedDate"
FROM "Dispatches"
WHERE "JobId" IS NOT NULL AND "JobId" ~ '^\d+$' AND NOT "IsDeleted"
ON CONFLICT ("DispatchId", "JobId") DO NOTHING;

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT 'DispatchJobs backfill count:' as info;
SELECT COUNT(*) as count FROM "DispatchJobs";

SELECT 'Dispatches with InstallationId:' as info;
SELECT COUNT(*) as count FROM "Dispatches" WHERE "InstallationId" IS NOT NULL;
