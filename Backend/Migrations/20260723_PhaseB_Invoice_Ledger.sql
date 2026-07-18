-- Phase B: Customer Invoice Ledger (single-entry: header + lines)
-- Additive migration. Safe to run multiple times.

CREATE TABLE IF NOT EXISTS "Invoices" (
    "Id"             SERIAL PRIMARY KEY,
    "TenantId"       INTEGER NOT NULL,
    "IsDeleted"      BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedAt"      TIMESTAMPTZ NULL,
    "DeletedBy"      VARCHAR(100) NULL,
    "InvoiceNumber"  VARCHAR(50) NULL,
    "Status"         VARCHAR(20) NOT NULL DEFAULT 'draft',
    "ContactId"      INTEGER NOT NULL,
    "SaleId"         INTEGER NULL,
    "ServiceOrderId" INTEGER NULL,
    "Title"          VARCHAR(255) NULL,
    "Notes"          TEXT NULL,
    "Currency"       VARCHAR(10) NOT NULL DEFAULT 'TND',
    "Subtotal"       NUMERIC(18,2) NOT NULL DEFAULT 0,
    "TaxAmount"      NUMERIC(18,2) NOT NULL DEFAULT 0,
    "GrandTotal"     NUMERIC(18,2) NOT NULL DEFAULT 0,
    "AmountPaid"     NUMERIC(18,2) NOT NULL DEFAULT 0,
    "IssueDate"      TIMESTAMPTZ NULL,
    "DueDate"        TIMESTAMPTZ NULL,
    "PostedAt"       TIMESTAMPTZ NULL,
    "VoidedAt"       TIMESTAMPTZ NULL,
    "VoidReason"     VARCHAR(500) NULL,
    "CreatedBy"      VARCHAR(100) NOT NULL,
    "CreatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMPTZ NULL,
    CONSTRAINT "CK_Invoices_Status"
        CHECK ("Status" IN ('draft','posted','paid','void'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Invoices_Tenant_Number"
    ON "Invoices" ("TenantId", "InvoiceNumber")
    WHERE "InvoiceNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IX_Invoices_Tenant_Contact"    ON "Invoices" ("TenantId", "ContactId");
CREATE INDEX IF NOT EXISTS "IX_Invoices_Tenant_Sale"       ON "Invoices" ("TenantId", "SaleId");
CREATE INDEX IF NOT EXISTS "IX_Invoices_Tenant_SO"         ON "Invoices" ("TenantId", "ServiceOrderId");
CREATE INDEX IF NOT EXISTS "IX_Invoices_Tenant_Status"     ON "Invoices" ("TenantId", "Status");

CREATE TABLE IF NOT EXISTS "InvoiceLines" (
    "Id"           SERIAL PRIMARY KEY,
    "TenantId"     INTEGER NOT NULL,
    "InvoiceId"    INTEGER NOT NULL REFERENCES "Invoices"("Id") ON DELETE CASCADE,
    "SourceType"   VARCHAR(50)  NULL,
    "SourceId"     VARCHAR(100) NULL,
    "ItemName"     VARCHAR(255) NOT NULL,
    "Description"  TEXT NULL,
    "Quantity"     NUMERIC(18,3) NOT NULL DEFAULT 1,
    "Unit"         VARCHAR(20) NULL,
    "UnitPrice"    NUMERIC(18,2) NOT NULL DEFAULT 0,
    "TaxRate"      NUMERIC(5,2)  NOT NULL DEFAULT 0,
    "LineTotal"    NUMERIC(18,2) NOT NULL DEFAULT 0,
    "TaxAmount"    NUMERIC(18,2) NOT NULL DEFAULT 0,
    "DisplayOrder" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_InvoiceLines_Tenant_Invoice"
    ON "InvoiceLines" ("TenantId", "InvoiceId");
CREATE INDEX IF NOT EXISTS "IX_InvoiceLines_Tenant_Source"
    ON "InvoiceLines" ("TenantId", "SourceType", "SourceId");