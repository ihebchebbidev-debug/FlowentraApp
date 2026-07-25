-- Allow multiple active dispatches per Job.
--
-- Previously the system enforced "one active dispatch per job" via two partial
-- unique indexes. The product now supports planning the same job into any
-- number of independent dispatches (different technicians / times), so we drop
-- the uniqueness and keep plain btree indexes for lookup performance.

DROP INDEX IF EXISTS ux_dispatchjobs_tenant_jobid_active;
DROP INDEX IF EXISTS ux_dispatches_tenant_legacy_jobid_active;

CREATE INDEX IF NOT EXISTS ix_dispatchjobs_tenant_jobid_active
  ON "DispatchJobs" ("TenantId", "JobId")
  WHERE "IsDeleted" = FALSE;

CREATE INDEX IF NOT EXISTS ix_dispatches_tenant_legacy_jobid_active
  ON "Dispatches" ("TenantId", "JobId")
  WHERE "JobId" IS NOT NULL AND "IsDeleted" = FALSE;
