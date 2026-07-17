-- =============================================================================
-- Migration: Denormalize InstallationId on dispatch entries (B)
--            + convert VARCHAR InstallationId columns to INT (E)
-- Idempotent. Safe to re-run.
-- Run per tenant DB BEFORE deploying the matching backend build.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- B) Add denormalized InstallationId column to dispatch entry tables so
--    time / expense / material usage can be rolled up per installation without
--    traversing Dispatch -> Job.
-- -----------------------------------------------------------------------------
ALTER TABLE "TimeEntries"   ADD COLUMN IF NOT EXISTS "InstallationId" integer NULL;
ALTER TABLE "Expenses"      ADD COLUMN IF NOT EXISTS "InstallationId" integer NULL;
ALTER TABLE "MaterialUsage" ADD COLUMN IF NOT EXISTS "InstallationId" integer NULL;

CREATE INDEX IF NOT EXISTS "IX_TimeEntries_InstallationId"   ON "TimeEntries"   ("InstallationId");
CREATE INDEX IF NOT EXISTS "IX_Expenses_InstallationId"      ON "Expenses"      ("InstallationId");
CREATE INDEX IF NOT EXISTS "IX_MaterialUsage_InstallationId" ON "MaterialUsage" ("InstallationId");

-- -----------------------------------------------------------------------------
-- E) Convert VARCHAR(50) -> INT for:
--      ServiceOrderJobs.InstallationId
--      ServiceOrderMaterials.InstallationId
--    Rows with non-numeric legacy values become NULL rather than blocking the
--    migration. Log those before running if you need to preserve them.
-- -----------------------------------------------------------------------------

-- Show any rows that would be nulled (informational only; safe to keep).
DO $$
DECLARE
    bad_jobs      int;
    bad_materials int;
BEGIN
    SELECT COUNT(*) INTO bad_jobs
    FROM "ServiceOrderJobs"
    WHERE "InstallationId" IS NOT NULL
      AND "InstallationId" !~ '^\d+$';

    SELECT COUNT(*) INTO bad_materials
    FROM "ServiceOrderMaterials"
    WHERE "InstallationId" IS NOT NULL
      AND "InstallationId" !~ '^\d+$';

    RAISE NOTICE 'ServiceOrderJobs rows with non-numeric InstallationId (will become NULL): %', bad_jobs;
    RAISE NOTICE 'ServiceOrderMaterials rows with non-numeric InstallationId (will become NULL): %', bad_materials;
END $$;

-- ServiceOrderJobs.InstallationId : varchar -> int
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'ServiceOrderJobs' AND column_name = 'InstallationId';

    IF col_type IS NOT NULL AND col_type <> 'integer' THEN
        ALTER TABLE "ServiceOrderJobs"
            ALTER COLUMN "InstallationId" TYPE integer
            USING NULLIF(regexp_replace("InstallationId", '\D', '', 'g'), '')::integer;
    END IF;
END $$;

-- ServiceOrderMaterials.InstallationId : varchar -> int
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'ServiceOrderMaterials' AND column_name = 'InstallationId';

    IF col_type IS NOT NULL AND col_type <> 'integer' THEN
        ALTER TABLE "ServiceOrderMaterials"
            ALTER COLUMN "InstallationId" TYPE integer
            USING NULLIF(regexp_replace("InstallationId", '\D', '', 'g'), '')::integer;
    END IF;
END $$;

-- Refresh indexes on the newly-typed columns
DROP INDEX IF EXISTS "idx_service_order_materials_installation";
CREATE INDEX IF NOT EXISTS "IX_ServiceOrderMaterials_InstallationId" ON "ServiceOrderMaterials"("InstallationId");
CREATE INDEX IF NOT EXISTS "IX_ServiceOrderJobs_InstallationId"      ON "ServiceOrderJobs"("InstallationId");

-- -----------------------------------------------------------------------------
-- B') Backfill denormalized InstallationId for historical entries.
--     Priority: Dispatch.InstallationId (installation-scoped dispatch)
--     Fallback: ServiceOrderJob.InstallationId via ServiceOrderJobId.
-- -----------------------------------------------------------------------------

-- TimeEntries
UPDATE "TimeEntries" te
   SET "InstallationId" = d."InstallationId"
  FROM "Dispatches" d
 WHERE te."DispatchId" = d."Id"
   AND te."InstallationId" IS NULL
   AND d."InstallationId" IS NOT NULL;

UPDATE "TimeEntries" te
   SET "InstallationId" = j."InstallationId"
  FROM "ServiceOrderJobs" j
 WHERE te."ServiceOrderJobId" = j."Id"
   AND te."InstallationId" IS NULL
   AND j."InstallationId" IS NOT NULL;

-- Expenses
UPDATE "Expenses" e
   SET "InstallationId" = d."InstallationId"
  FROM "Dispatches" d
 WHERE e."DispatchId" = d."Id"
   AND e."InstallationId" IS NULL
   AND d."InstallationId" IS NOT NULL;

UPDATE "Expenses" e
   SET "InstallationId" = j."InstallationId"
  FROM "ServiceOrderJobs" j
 WHERE e."ServiceOrderJobId" = j."Id"
   AND e."InstallationId" IS NULL
   AND j."InstallationId" IS NOT NULL;

-- MaterialUsage
UPDATE "MaterialUsage" m
   SET "InstallationId" = d."InstallationId"
  FROM "Dispatches" d
 WHERE m."DispatchId" = d."Id"
   AND m."InstallationId" IS NULL
   AND d."InstallationId" IS NOT NULL;

UPDATE "MaterialUsage" m
   SET "InstallationId" = j."InstallationId"
  FROM "ServiceOrderJobs" j
 WHERE m."ServiceOrderJobId" = j."Id"
   AND m."InstallationId" IS NULL
   AND j."InstallationId" IS NOT NULL;

COMMIT;

-- =============================================================================
-- VERIFY
-- =============================================================================
SELECT 'TimeEntries with InstallationId backfilled' AS metric, COUNT(*) AS count
  FROM "TimeEntries" WHERE "InstallationId" IS NOT NULL
UNION ALL
SELECT 'Expenses with InstallationId backfilled', COUNT(*)
  FROM "Expenses" WHERE "InstallationId" IS NOT NULL
UNION ALL
SELECT 'MaterialUsage with InstallationId backfilled', COUNT(*)
  FROM "MaterialUsage" WHERE "InstallationId" IS NOT NULL;

SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name IN ('ServiceOrderJobs','ServiceOrderMaterials','TimeEntries','Expenses','MaterialUsage')
   AND column_name = 'InstallationId'
 ORDER BY table_name;
