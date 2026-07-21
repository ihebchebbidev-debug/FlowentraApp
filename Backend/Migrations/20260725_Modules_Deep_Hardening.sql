-- =====================================================================
-- Deep hardening for Articles, Installations, Contacts modules
-- 2026-07-25
--
-- Goals:
--  1. Enforce real DB-level uniqueness for article/installation numbers
--     and contact emails (tenant-scoped, soft-delete aware) so that
--     application-layer TOCTOU races can no longer create duplicates.
--  2. Add soft-delete columns to Installations so deletes stop leaving
--     orphaned InstallationId references on TimeEntries / Expenses /
--     MaterialUsage / ServiceOrderJobs / ServiceOrderMaterials.
--
-- All statements are idempotent (IF NOT EXISTS / DROP IF EXISTS) so
-- the migration can be re-run safely.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Articles: tenant-scoped unique ArticleNumber (excluding soft-deleted)
-- ---------------------------------------------------------------------
DROP INDEX IF EXISTS "IX_Articles_ArticleNumber";
CREATE UNIQUE INDEX IF NOT EXISTS "UX_Articles_Tenant_ArticleNumber_Active"
    ON "Articles" ("TenantId", "ArticleNumber")
    WHERE "IsDeleted" = false;

-- ---------------------------------------------------------------------
-- 2) Installations: add soft-delete columns + tenant-scoped unique number
-- ---------------------------------------------------------------------
ALTER TABLE "Installations"
    ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;
ALTER TABLE "Installations"
    ADD COLUMN IF NOT EXISTS "DeletedAt" timestamp with time zone NULL;
ALTER TABLE "Installations"
    ADD COLUMN IF NOT EXISTS "DeletedBy" varchar(100) NULL;

CREATE INDEX IF NOT EXISTS "IX_Installations_IsDeleted"
    ON "Installations" ("IsDeleted");

-- Replace the global unique index with a tenant-scoped, soft-delete-aware one
DROP INDEX IF EXISTS "IX_Installations_InstallationNumber";
CREATE UNIQUE INDEX IF NOT EXISTS "UX_Installations_Tenant_InstallationNumber_Active"
    ON "Installations" ("TenantId", "InstallationNumber")
    WHERE "IsDeleted" = false;

-- ---------------------------------------------------------------------
-- 3) Contacts: tenant-scoped unique Email (case-insensitive,
--    only for non-deleted rows, only when Email is not null)
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "UX_Contacts_Tenant_Email_Active"
    ON "Contacts" ("TenantId", (LOWER("Email")))
    WHERE "IsDeleted" = false AND "Email" IS NOT NULL;
