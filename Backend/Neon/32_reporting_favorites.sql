-- =====================================================
-- Migration: Reporting Favorites (pinned dashboard widgets)
-- Execute this SQL on your Neon PostgreSQL database
-- =====================================================

CREATE TABLE IF NOT EXISTS "ReportingFavorites" (
    "Id"        SERIAL PRIMARY KEY,
    "TenantId"  INTEGER NOT NULL DEFAULT 0,
    "UserId"    INTEGER NOT NULL,
    "Scope"     VARCHAR(64)  NOT NULL DEFAULT 'default',
    "WidgetId"  VARCHAR(200) NOT NULL,
    "Title"     VARCHAR(300) NOT NULL,
    "Source"    VARCHAR(40)  NOT NULL,
    "Position"  INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_reporting_favorites_unique"
ON "ReportingFavorites" ("TenantId", "UserId", "Scope", "WidgetId");

CREATE INDEX IF NOT EXISTS "idx_reporting_favorites_order"
ON "ReportingFavorites" ("TenantId", "UserId", "Scope", "Position");

COMMENT ON TABLE  "ReportingFavorites" IS 'Per-user pinned reporting widgets shown on the main dashboard.';
COMMENT ON COLUMN "ReportingFavorites"."Scope" IS 'Company/view scope key (e.g. all, c:<companyId>, default).';
COMMENT ON COLUMN "ReportingFavorites"."Position" IS 'User-controlled ordering (ascending).';