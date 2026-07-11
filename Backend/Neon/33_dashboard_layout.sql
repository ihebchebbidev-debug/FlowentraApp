-- =====================================================
-- Migration: Dashboard Layouts (per-user main dashboard customization)
-- Execute this SQL on your Neon PostgreSQL database
-- =====================================================

CREATE TABLE IF NOT EXISTS "DashboardLayouts" (
    "Id"         SERIAL PRIMARY KEY,
    "TenantId"   INTEGER NOT NULL DEFAULT 0,
    "UserId"     INTEGER NOT NULL,
    "Scope"      VARCHAR(64) NOT NULL DEFAULT 'default',
    "OrderJson"  JSONB NOT NULL DEFAULT '[]',
    "HiddenJson" JSONB NOT NULL DEFAULT '[]',
    "CreatedAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_dashboard_layouts_unique"
ON "DashboardLayouts" ("TenantId", "UserId", "Scope");

COMMENT ON TABLE  "DashboardLayouts" IS 'Per-user customization of the main dashboard landing page (card order + hidden cards).';
COMMENT ON COLUMN "DashboardLayouts"."OrderJson"  IS 'Ordered array of card ids (default cards + pinned reporting widget ids).';
COMMENT ON COLUMN "DashboardLayouts"."HiddenJson" IS 'Array of default card ids the user removed.';
COMMENT ON COLUMN "DashboardLayouts"."Scope"      IS 'Company/view scope key (e.g. all, c:<companyId>, default).';
