-- ============================================================================
-- Fix schema drift on Purchases tables.
--
-- Symptom: GET /api/supplier-invoices fails with
--   System.InvalidCastException: Reading as 'System.Int32' is not supported for
--   fields having DataTypeName 'character varying'
--
-- Cause: several integer columns on "SupplierInvoices" / "SupplierInvoiceItems"
-- drifted to character varying in this database, while the EF model + the
-- canonical migrations declare them as INTEGER (and RsRecordId is an FK to
-- "RSRecords"."Id"). The EF value-converter shim in PurchaseConfiguration.cs is
-- never registered, so EF reads these as Int32 and Npgsql throws on the varchar.
--
-- This script converts any of those columns that are currently varchar/text back
-- to integer. It is idempotent: a column already integer is left untouched.
-- Empty strings become NULL (nullable cols) or 0 (NOT NULL cols).
-- ============================================================================

DO $$
DECLARE
  -- "table.column" pairs that the EF model treats as (nullable) integers.
  cols text[] := ARRAY[
    'SupplierInvoices.SupplierId',
    'SupplierInvoices.PurchaseOrderId',
    'SupplierInvoices.GoodsReceiptId',
    'SupplierInvoices.RsRecordId',
    'SupplierInvoices.AnneeFacturation',
    'SupplierInvoiceItems.SupplierInvoiceId',
    'SupplierInvoiceItems.PurchaseOrderItemId',
    'SupplierInvoiceItems.ArticleId',
    'SupplierInvoiceItems.DisplayOrder'
  ];
  entry      text;
  tbl        text;
  col        text;
  dtype      text;
  nullable   text;
  using_expr text;
BEGIN
  FOREACH entry IN ARRAY cols LOOP
    tbl := split_part(entry, '.', 1);
    col := split_part(entry, '.', 2);

    SELECT data_type, is_nullable
      INTO dtype, nullable
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = tbl AND column_name = col;

    IF dtype IS NULL THEN
      CONTINUE; -- column does not exist in this database
    END IF;

    IF dtype IN ('character varying', 'text') THEN
      IF nullable = 'YES' THEN
        using_expr := format('NULLIF(btrim(%I::text), '''')::integer', col);
      ELSE
        using_expr := format('COALESCE(NULLIF(btrim(%I::text), '''')::integer, 0)', col);
      END IF;

      RAISE NOTICE 'Converting %.% from % to integer', tbl, col, dtype;
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN %I TYPE integer USING %s',
        tbl, col, using_expr
      );
    END IF;
  END LOOP;
END $$;

-- Re-assert the RsRecordId FK + idempotency index if they were lost during drift.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE table_name = 'SupplierInvoices' AND constraint_type = 'FOREIGN KEY'
       AND constraint_name = 'FK_SupplierInvoices_RSRecords_RsRecordId'
  ) AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'RSRecords') THEN
    BEGIN
      ALTER TABLE "SupplierInvoices"
        ADD CONSTRAINT "FK_SupplierInvoices_RSRecords_RsRecordId"
        FOREIGN KEY ("RsRecordId") REFERENCES "RSRecords"("Id") ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipped FK re-add on RsRecordId: %', SQLERRM;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_SupplierInvoices_RsRecordId"
  ON "SupplierInvoices" ("RsRecordId")
  WHERE "RsRecordId" IS NOT NULL;
