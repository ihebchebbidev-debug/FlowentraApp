-- Migration: replace ON DELETE CASCADE with ON DELETE RESTRICT on
-- ArticleSuppliers.SupplierId → Contacts.Id.
--
-- Rationale: every other Purchases FK to Contacts (PurchaseOrders,
-- GoodsReceipts, SupplierInvoices) uses NO ACTION / RESTRICT. Contacts are
-- only ever soft-deleted in application code. Leaving CASCADE here is a
-- dormant landmine: any future hard delete on a contact (bulk cleanup,
-- GDPR erasure, admin script) would silently cascade-wipe ArticleSuppliers
-- and their price history while sibling tables would block — producing an
-- asymmetric partial delete with no error surfaced.
--
-- Safe to re-run: drops the existing FK by name-pattern lookup, then adds
-- the RESTRICT variant only if not already present.

DO $$
DECLARE
    fk_name TEXT;
    already_restrict BOOLEAN;
BEGIN
    SELECT tc.constraint_name
      INTO fk_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema   = kcu.table_schema
     WHERE tc.table_name       = 'ArticleSuppliers'
       AND tc.constraint_type  = 'FOREIGN KEY'
       AND kcu.column_name     = 'SupplierId'
     LIMIT 1;

    IF fk_name IS NULL THEN
        RAISE NOTICE 'No FK on ArticleSuppliers.SupplierId — nothing to migrate.';
        RETURN;
    END IF;

    -- Check current delete rule; skip if already RESTRICT / NO ACTION.
    SELECT rc.delete_rule IN ('RESTRICT', 'NO ACTION')
      INTO already_restrict
      FROM information_schema.referential_constraints rc
     WHERE rc.constraint_name = fk_name;

    IF already_restrict THEN
        RAISE NOTICE 'ArticleSuppliers.SupplierId FK % is already RESTRICT/NO ACTION — skipping.', fk_name;
        RETURN;
    END IF;

    EXECUTE format('ALTER TABLE "ArticleSuppliers" DROP CONSTRAINT %I', fk_name);
    ALTER TABLE "ArticleSuppliers"
        ADD CONSTRAINT "FK_ArticleSuppliers_Contacts_SupplierId"
        FOREIGN KEY ("SupplierId") REFERENCES "Contacts"("Id") ON DELETE RESTRICT;
END $$;
