-- =============================================================================
-- Migration: Enforce one ServiceOrder per Sale (per tenant)
-- Prevents duplicate SO creation when two clients race the "Convert to
-- Service Order" action. Idempotent. Safe to re-run.
-- Run per tenant DB BEFORE deploying the matching backend build.
-- =============================================================================

BEGIN;

-- 1) Clean any legacy duplicates first (keep earliest by Id).
--    Only touch non-deleted rows to preserve historical audit trail.
DELETE FROM "ServiceOrders" AS so
USING "ServiceOrders" AS dup
WHERE so."TenantId" = dup."TenantId"
  AND so."SaleId"    = dup."SaleId"
  AND so."SaleId"   IS NOT NULL
  AND so."SaleId"   <> ''
  AND so."IsDeleted" = FALSE
  AND dup."IsDeleted" = FALSE
  AND so."Id"       > dup."Id";

-- 2) Unique index scoped to tenant + non-null SaleId + non-deleted rows.
CREATE UNIQUE INDEX IF NOT EXISTS "ux_serviceorders_tenant_saleid"
    ON "ServiceOrders" ("TenantId", "SaleId")
    WHERE "SaleId" IS NOT NULL
      AND "SaleId" <> ''
      AND "IsDeleted" = FALSE;

COMMIT;
