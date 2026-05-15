-- ═══════════════════════════════════════════════════════════════════
-- 15_plugin_activations.sql
-- Per-tenant plugin enable/disable overrides.
-- Absence of a row = enabled (default-on semantics, no seed required).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS activated_modules (
    id           SERIAL PRIMARY KEY,
    "TenantId"   INT          NOT NULL DEFAULT 0,
    plugin_code  VARCHAR(40)  NOT NULL,
    is_enabled   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_by   INT          NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_activated_modules_tenant_code
    ON activated_modules ("TenantId", plugin_code);

CREATE INDEX IF NOT EXISTS ix_activated_modules_tenant
    ON activated_modules ("TenantId");
