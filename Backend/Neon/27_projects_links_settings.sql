-- Projects cross-module linking + settings
-- Adds ProjectId to Offers/Sales/ServiceOrders/Dispatches
-- Adds tenant-scoped ProjectSettings table

ALTER TABLE "Offers"
    ADD COLUMN IF NOT EXISTS "ProjectId" INT NULL;

ALTER TABLE "Sales"
    ADD COLUMN IF NOT EXISTS "ProjectId" INT NULL;

ALTER TABLE "ServiceOrders"
    ADD COLUMN IF NOT EXISTS "ProjectId" INT NULL;

ALTER TABLE "Dispatches"
    ADD COLUMN IF NOT EXISTS "ProjectId" INT NULL;

CREATE INDEX IF NOT EXISTS ix_offers_tenant_projectid
    ON "Offers" ("TenantId", "ProjectId");

CREATE INDEX IF NOT EXISTS ix_sales_tenant_projectid
    ON "Sales" ("TenantId", "ProjectId");

CREATE INDEX IF NOT EXISTS ix_serviceorders_tenant_projectid
    ON "ServiceOrders" ("TenantId", "ProjectId");

CREATE INDEX IF NOT EXISTS ix_dispatches_tenant_projectid
    ON "Dispatches" ("TenantId", "ProjectId");

CREATE TABLE IF NOT EXISTS "ProjectSettings" (
    "Id" SERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    "SettingsJson" TEXT NOT NULL DEFAULT '{}',
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedBy" VARCHAR(100) NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_projectsettings_tenantid_unique
    ON "ProjectSettings" ("TenantId");
