-- =====================================================================
-- Purchases module — QA hardening (Round 1)
--
-- 1. Race-safe uniqueness for ArticleSuppliers within a tenant.
--    Today uniqueness (ArticleId, SupplierId) is enforced only in C# code
--    (ArticleSupplierService.CreateAsync). Two concurrent POSTs can slip
--    past that check. A partial unique index — excluding soft-deleted rows
--    so re-creating a previously-deleted link still works — closes the gap.
--
-- 2. Activity-type tolerance for failed TEJ sync ('tej_sync_failed').
--    If a CHECK constraint exists on PurchaseActivities.ActivityType, this
--    migration is a no-op; the new value will only be rejected when such
--    a constraint is present. We do NOT add one here to stay backward-compat.
-- =====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "ux_article_suppliers_tenant_article_supplier"
    ON "ArticleSuppliers" ("TenantId", "ArticleId", "SupplierId")
    WHERE "IsDeleted" = FALSE;

-- Helpful supporting index for TEJ idempotency lookups by RsRecordId.
CREATE INDEX IF NOT EXISTS "ix_supplier_invoices_rs_record"
    ON "SupplierInvoices" ("RsRecordId")
    WHERE "RsRecordId" IS NOT NULL;
