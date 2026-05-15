-- ExternalEndpoints — drop FK to Tenants
--
-- Why:
-- The app collapses every "default" tenant to TenantId=0 on insert (see
-- TenantSlugCache.ToDataTenantId + ApplicationDbContext.StampTenantIdOnNewEntities).
-- No row with Id=0 exists in "Tenants", so when a MainAdminUser creates an
-- ExternalEndpoint for a default-flagged company the insert blows up with:
--     23503: insert or update on table "ExternalEndpoints"
--     violates foreign key constraint "FK_ExternalEndpoints_Tenants"
--
-- Every other tenant-scoped table in the schema works without this FK —
-- tenant scoping is enforced in code via EF global query filters, not at
-- the DB level. The FK was added by a stray migration and contradicts the
-- rest of the model. Drop it.

ALTER TABLE "ExternalEndpoints"
    DROP CONSTRAINT IF EXISTS "FK_ExternalEndpoints_Tenants";

-- Same defensive cleanup on the related tables in case earlier migrations
-- added matching FKs there. Safe no-op if they don't exist.
ALTER TABLE "ExternalEndpointLogs"
    DROP CONSTRAINT IF EXISTS "FK_ExternalEndpointLogs_Tenants";

ALTER TABLE "WebhookForwardJobs"
    DROP CONSTRAINT IF EXISTS "FK_WebhookForwardJobs_Tenants";
