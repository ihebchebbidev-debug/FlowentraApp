-- Offline sync infrastructure
-- Creates idempotency receipts and change feed tables (tenant-scoped)

CREATE TABLE IF NOT EXISTS sync_operation_receipts (
    "Id" BIGSERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    "DeviceId" VARCHAR(100) NOT NULL,
    "OpId" VARCHAR(100) NOT NULL,
    "Status" VARCHAR(40) NOT NULL DEFAULT 'applied',
    "ServerEntityId" INT NULL,
    "ResponseJson" TEXT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_sync_receipts_tenant_device_op
    ON sync_operation_receipts ("TenantId", "DeviceId", "OpId");

CREATE INDEX IF NOT EXISTS ix_sync_receipts_tenant_created_at
    ON sync_operation_receipts ("TenantId", "CreatedAt");

CREATE TABLE IF NOT EXISTS sync_changes (
    "Id" BIGSERIAL PRIMARY KEY,
    "TenantId" INT NOT NULL DEFAULT 0,
    "EntityType" VARCHAR(80) NOT NULL,
    "EntityId" INT NOT NULL,
    "Operation" VARCHAR(20) NOT NULL,
    "DataJson" TEXT NULL,
    "ChangedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ChangedBy" VARCHAR(100) NULL
);

CREATE INDEX IF NOT EXISTS ix_sync_changes_tenant_changed_at
    ON sync_changes ("TenantId", "ChangedAt");

CREATE INDEX IF NOT EXISTS ix_sync_changes_tenant_entity
    ON sync_changes ("TenantId", "EntityType", "EntityId");
