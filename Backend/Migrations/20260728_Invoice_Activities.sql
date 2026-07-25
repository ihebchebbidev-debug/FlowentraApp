-- Phase B.1: Invoice Activity Audit Trail
-- Additive migration. Safe to run multiple times.
-- Also created idempotently on startup in Backend/Program.cs.

CREATE TABLE IF NOT EXISTS "InvoiceActivities" (
    "Id"           SERIAL PRIMARY KEY,
    "TenantId"     INTEGER NOT NULL DEFAULT 0,
    "InvoiceId"    INTEGER NOT NULL,
    "ActivityType" VARCHAR(50) NOT NULL,
    "Description"  VARCHAR(1000) NULL,
    "OldValue"     VARCHAR(500) NULL,
    "NewValue"     VARCHAR(500) NULL,
    "CreatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "CreatedBy"    VARCHAR(100) NOT NULL DEFAULT '',
    CONSTRAINT "FK_InvoiceActivities_Invoices"
        FOREIGN KEY ("InvoiceId") REFERENCES "Invoices" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_InvoiceActivities_Tenant_Invoice_CreatedAt"
    ON "InvoiceActivities" ("TenantId", "InvoiceId", "CreatedAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_InvoiceActivities_Tenant_Type"
    ON "InvoiceActivities" ("TenantId", "ActivityType");
