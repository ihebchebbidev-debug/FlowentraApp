-- =====================================================================
-- Purchases module — Deep hardening (Round 2)
--
-- Addresses the following audit findings:
--   (a) No idempotency on PO / GR / Invoice creation. Add a nullable
--       IdempotencyKey column on each of the three tables + a per-tenant
--       partial unique index so a retried POST with the same header
--       value cannot mint a duplicate financial document.
--   (b) No natural-key uniqueness for supplier invoices. Add a partial
--       unique index on (TenantId, SupplierId, SupplierInvoiceRef) so
--       the same supplier's invoice reference can't be booked twice.
--   (c) Missing composite indexes for the most common list filters
--       (TenantId, Status, CreatedDate) / (TenantId, SupplierId) /
--       (TenantId, PurchaseOrderId).
--   (d) ILIKE '%…%' search on OrderNumber / ReceiptNumber / InvoiceNumber
--       / Title / SupplierName can't use a b-tree. Add pg_trgm GIN
--       indexes so search stays sub-linear as data grows.
--
-- Idempotent (uses IF NOT EXISTS everywhere).
-- =====================================================================

BEGIN;

-- pg_trgm powers the ILIKE '%needle%' GIN indexes below.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── IdempotencyKey columns ───────────────────────────────────────────
ALTER TABLE "PurchaseOrders"    ADD COLUMN IF NOT EXISTS "IdempotencyKey" varchar(64) NULL;
ALTER TABLE "GoodsReceipts"     ADD COLUMN IF NOT EXISTS "IdempotencyKey" varchar(64) NULL;
ALTER TABLE "SupplierInvoices"  ADD COLUMN IF NOT EXISTS "IdempotencyKey" varchar(64) NULL;

-- Per-tenant idempotency: a client that retries a POST with the same
-- Idempotency-Key gets the existing row instead of a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS "ux_purchase_orders_tenant_idempotency"
    ON "PurchaseOrders" ("TenantId", "IdempotencyKey")
    WHERE "IdempotencyKey" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ux_goods_receipts_tenant_idempotency"
    ON "GoodsReceipts" ("TenantId", "IdempotencyKey")
    WHERE "IdempotencyKey" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ux_supplier_invoices_tenant_idempotency"
    ON "SupplierInvoices" ("TenantId", "IdempotencyKey")
    WHERE "IdempotencyKey" IS NOT NULL;

-- Natural-key idempotency for supplier invoices: the same supplier's
-- invoice reference cannot be booked twice within a tenant. Soft-deleted
-- rows are excluded so re-recording a previously deleted invoice works.
CREATE UNIQUE INDEX IF NOT EXISTS "ux_supplier_invoices_tenant_supplier_ref"
    ON "SupplierInvoices" ("TenantId", "SupplierId", "SupplierInvoiceRef")
    WHERE "SupplierInvoiceRef" IS NOT NULL AND "IsDeleted" = FALSE;

-- ── Composite b-tree indexes on the common list filters ──────────────
-- Purchase Orders
CREATE INDEX IF NOT EXISTS "ix_purchase_orders_tenant_status_created"
    ON "PurchaseOrders" ("TenantId", "Status", "CreatedDate" DESC)
    WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "ix_purchase_orders_tenant_supplier"
    ON "PurchaseOrders" ("TenantId", "SupplierId")
    WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "ix_purchase_orders_tenant_payment_status"
    ON "PurchaseOrders" ("TenantId", "PaymentStatus")
    WHERE "IsDeleted" = FALSE;

-- Goods Receipts
CREATE INDEX IF NOT EXISTS "ix_goods_receipts_tenant_status_created"
    ON "GoodsReceipts" ("TenantId", "Status", "CreatedDate" DESC)
    WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "ix_goods_receipts_tenant_supplier"
    ON "GoodsReceipts" ("TenantId", "SupplierId")
    WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "ix_goods_receipts_tenant_po"
    ON "GoodsReceipts" ("TenantId", "PurchaseOrderId")
    WHERE "IsDeleted" = FALSE;

-- Supplier Invoices
CREATE INDEX IF NOT EXISTS "ix_supplier_invoices_tenant_status_created"
    ON "SupplierInvoices" ("TenantId", "Status", "CreatedDate" DESC)
    WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "ix_supplier_invoices_tenant_supplier"
    ON "SupplierInvoices" ("TenantId", "SupplierId")
    WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "ix_supplier_invoices_tenant_po"
    ON "SupplierInvoices" ("TenantId", "PurchaseOrderId")
    WHERE "IsDeleted" = FALSE AND "PurchaseOrderId" IS NOT NULL;

-- ── Trigram (pg_trgm) GIN indexes for ILIKE '%…%' search ─────────────
-- Wrapping columns with COALESCE keeps NULLs indexable and prevents the
-- GIN build from failing on any legacy NULL row.
CREATE INDEX IF NOT EXISTS "gin_purchase_orders_trgm_order_number"
    ON "PurchaseOrders" USING gin (COALESCE("OrderNumber", '') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "gin_purchase_orders_trgm_title"
    ON "PurchaseOrders" USING gin (COALESCE("Title", '') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "gin_purchase_orders_trgm_supplier_name"
    ON "PurchaseOrders" USING gin (COALESCE("SupplierName", '') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "gin_goods_receipts_trgm_receipt_number"
    ON "GoodsReceipts" USING gin (COALESCE("ReceiptNumber", '') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "gin_goods_receipts_trgm_supplier_name"
    ON "GoodsReceipts" USING gin (COALESCE("SupplierName", '') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "gin_supplier_invoices_trgm_invoice_number"
    ON "SupplierInvoices" USING gin (COALESCE("InvoiceNumber", '') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "gin_supplier_invoices_trgm_supplier_name"
    ON "SupplierInvoices" USING gin (COALESCE("SupplierName", '') gin_trgm_ops);

COMMIT;
