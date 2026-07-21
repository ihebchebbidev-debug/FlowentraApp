-- =============================================================================
-- Migration: Hard fences for conversion/dispatch races
--   1) One Sale per Offer (per tenant) — closes Offer→Sale double-convert race.
--   2) One active DispatchJob per Job (per tenant) — closes double-dispatch race
--      when planning a dispatch from the Service Order detail page or the
--      Planning Board.
--   3) One active legacy single-job Dispatch per JobId (per tenant).
-- Idempotent. Safe to re-run.
-- =============================================================================

BEGIN;

-- 1) Clean any legacy duplicate Sales pointing at the same Offer.
DELETE FROM "Sales" AS s
USING "Sales" AS dup
WHERE s."TenantId" = dup."TenantId"
  AND s."OfferId"    = dup."OfferId"
  AND s."OfferId"   IS NOT NULL
  AND s."OfferId"   <> ''
  AND s."Id"        > dup."Id";

CREATE UNIQUE INDEX IF NOT EXISTS "ux_sales_tenant_offerid"
    ON "Sales" ("TenantId", "OfferId")
    WHERE "OfferId" IS NOT NULL AND "OfferId" <> '';

-- 2) Deduplicate DispatchJobs on the same (tenant, job) keeping earliest by Id
--    among rows whose parent dispatch is still active (not deleted).
DELETE FROM "DispatchJobs" AS dj
USING "DispatchJobs" AS dup,
      "Dispatches"   AS d1,
      "Dispatches"   AS d2
WHERE dj."TenantId" = dup."TenantId"
  AND dj."JobId"    = dup."JobId"
  AND dj."IsDeleted" = FALSE
  AND dup."IsDeleted" = FALSE
  AND dj."DispatchId" = d1."Id" AND d1."IsDeleted" = FALSE
  AND dup."DispatchId" = d2."Id" AND d2."IsDeleted" = FALSE
  AND dj."Id" > dup."Id";

CREATE UNIQUE INDEX IF NOT EXISTS "ux_dispatchjobs_tenant_jobid_active"
    ON "DispatchJobs" ("TenantId", "JobId")
    WHERE "IsDeleted" = FALSE;

-- 3) Legacy single-job dispatch fence: at most one non-deleted Dispatch may
--    carry a given JobId per tenant. (Multi-job dispatches store NULL here.)
CREATE UNIQUE INDEX IF NOT EXISTS "ux_dispatches_tenant_legacy_jobid_active"
    ON "Dispatches" ("TenantId", "JobId")
    WHERE "JobId" IS NOT NULL AND "IsDeleted" = FALSE;

COMMIT;