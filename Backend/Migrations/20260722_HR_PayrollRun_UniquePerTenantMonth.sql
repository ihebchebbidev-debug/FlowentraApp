-- ============================================================================
-- Prevent duplicate payroll runs for the same tenant/year/month.
-- Fixes: double-click and concurrent-admin race that created duplicate runs
--        with duplicate HrPayrollEntry rows (both independently payable).
-- ============================================================================

BEGIN;

-- 1. Deduplicate any pre-existing duplicates: keep the earliest run per
--    (TenantId, year, month); delete the rest. hr_payroll_entries has
--    ON DELETE CASCADE on payroll_run_id (see Backend/Neon/26_hr_module.sql),
--    so entry rows for the removed runs are cleaned up automatically.
DELETE FROM hr_payroll_runs r
USING (
    SELECT "TenantId", year, month, MIN(id) AS keep_id
    FROM hr_payroll_runs
    GROUP BY "TenantId", year, month
    HAVING COUNT(*) > 1
) dup
WHERE r."TenantId" = dup."TenantId"
  AND r.year      = dup.year
  AND r.month     = dup.month
  AND r.id       <> dup.keep_id;

-- 2. Enforce uniqueness at the DB level so a race past the service-layer check
--    still fails cleanly with 23505 (surfaced as a 400 by the service).
CREATE UNIQUE INDEX IF NOT EXISTS uq_hr_payroll_runs_tenant_year_month
    ON hr_payroll_runs ("TenantId", year, month);

COMMIT;