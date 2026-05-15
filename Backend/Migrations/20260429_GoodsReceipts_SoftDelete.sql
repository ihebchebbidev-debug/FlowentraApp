-- Add soft-delete columns to GoodsReceipts so deletions preserve audit trail.
-- Receipts are referenced by SupplierInvoices and stock transactions; hard-deleting
-- them broke historical lookups and reconciliation. Service now sets IsDeleted=true
-- in DeleteReceiptAsync and all read queries filter !IsDeleted.

ALTER TABLE "GoodsReceipts"
    ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "DeletedAt" timestamp with time zone NULL,
    ADD COLUMN IF NOT EXISTS "DeletedBy" varchar(100) NULL;

CREATE INDEX IF NOT EXISTS "IX_GoodsReceipts_IsDeleted"
    ON "GoodsReceipts" ("IsDeleted");
