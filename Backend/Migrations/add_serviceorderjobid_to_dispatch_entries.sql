-- Migration: Per-job attribution for dispatch time entries, expenses and materials.
-- A single dispatch can hold all jobs of a service order; these columns record which
-- job each time entry / expense / material belongs to. NULL = whole dispatch / legacy.
-- Run on every tenant database before (or with) deploying the backend.

ALTER TABLE "TimeEntries"   ADD COLUMN IF NOT EXISTS "ServiceOrderJobId" integer NULL;
ALTER TABLE "Expenses"      ADD COLUMN IF NOT EXISTS "ServiceOrderJobId" integer NULL;
ALTER TABLE "MaterialUsage" ADD COLUMN IF NOT EXISTS "ServiceOrderJobId" integer NULL;

CREATE INDEX IF NOT EXISTS "IX_TimeEntries_ServiceOrderJobId"   ON "TimeEntries"   ("ServiceOrderJobId");
CREATE INDEX IF NOT EXISTS "IX_Expenses_ServiceOrderJobId"      ON "Expenses"      ("ServiceOrderJobId");
CREATE INDEX IF NOT EXISTS "IX_MaterialUsage_ServiceOrderJobId" ON "MaterialUsage" ("ServiceOrderJobId");
