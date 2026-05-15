-- =====================================================
-- Migration: Dashboards + Public Sharing
-- Execute this SQL on your Neon PostgreSQL database
-- =====================================================

CREATE TABLE IF NOT EXISTS "Dashboards" (
    "Id"              SERIAL PRIMARY KEY,
    "Name"            VARCHAR(200) NOT NULL,
    "Description"     TEXT,
    "TemplateKey"     VARCHAR(50),
    "IsDefault"       BOOLEAN NOT NULL DEFAULT FALSE,
    "IsShared"        BOOLEAN NOT NULL DEFAULT FALSE,
    "SharedWithRoles" JSONB,
    "Widgets"         JSONB NOT NULL DEFAULT '[]',
    "GridSettings"    JSONB,
    "IsPublic"        BOOLEAN NOT NULL DEFAULT FALSE,
    "ShareToken"      VARCHAR(100),
    "SharedAt"        TIMESTAMP WITH TIME ZONE,
    "CreatedBy"       VARCHAR(200),
    "CreatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "IsDeleted"       BOOLEAN NOT NULL DEFAULT FALSE,
    "SnapshotData"    JSONB,
    "SnapshotAt"      TIMESTAMP WITH TIME ZONE
);

-- Index for fast public token lookups
CREATE UNIQUE INDEX IF NOT EXISTS "idx_dashboards_sharetoken"
ON "Dashboards"("ShareToken") WHERE "ShareToken" IS NOT NULL;

-- Index for non-deleted dashboards
CREATE INDEX IF NOT EXISTS "idx_dashboards_active"
ON "Dashboards"("IsDeleted", "UpdatedAt" DESC);

COMMENT ON TABLE  "Dashboards" IS 'User-created dashboards with widget layouts';
COMMENT ON COLUMN "Dashboards"."ShareToken" IS 'Unique token for public read-only access';
COMMENT ON COLUMN "Dashboards"."Widgets" IS 'JSONB array of widget configurations';
COMMENT ON COLUMN "Dashboards"."GridSettings" IS 'JSONB grid layout settings';
COMMENT ON COLUMN "Dashboards"."SharedWithRoles" IS 'JSONB array of role IDs the dashboard is shared with';
