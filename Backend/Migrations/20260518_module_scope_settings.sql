-- =============================================================================
-- Migration: 20260518_module_scope_settings
-- Purpose : Per-module data-scope (shared vs per_company) configuration table.
--           Replaces the localStorage placeholder used by the frontend.
--
-- Scope values:
--   'per_company' (DEFAULT) → rows live per company (TenantId = current company)
--   'shared'                → one shared dataset across all companies (TenantId = 0)
--
-- Run this on EVERY tenant database (each DB tenant has its own settings).
-- =============================================================================

CREATE TABLE IF NOT EXISTS "ModuleScopeSettings" (
    "ModuleKey"        VARCHAR(64)   PRIMARY KEY,
    "Scope"            VARCHAR(16)   NOT NULL DEFAULT 'per_company',
    "UpdatedAt"        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UpdatedByUserId"  INTEGER       NULL,
    CONSTRAINT "CK_ModuleScopeSettings_Scope"
        CHECK ("Scope" IN ('per_company', 'shared'))
);

COMMENT ON TABLE "ModuleScopeSettings" IS
    'Per-module scope configuration. shared=TenantId 0 across companies; per_company=isolated per TenantId.';

-- Seed the known module keys with the back-compat default (per_company).
-- Safe to re-run: ON CONFLICT DO NOTHING preserves any admin overrides.
INSERT INTO "ModuleScopeSettings" ("ModuleKey", "Scope") VALUES
    ('contacts',       'per_company'),
    ('articles',       'per_company'),
    ('offers',         'per_company'),
    ('sales',          'per_company'),
    ('purchases',      'per_company'),
    ('hr',             'per_company'),
    ('projects',       'per_company'),
    ('service_orders', 'per_company'),
    ('calendar',       'per_company'),
    ('documents',      'per_company'),
    ('lookups',        'per_company'),
    ('notifications',  'per_company')
ON CONFLICT ("ModuleKey") DO NOTHING;
