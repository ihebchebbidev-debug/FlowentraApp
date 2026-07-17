-- Migration: end-to-end currency tracking for invoice lines.
--
-- Before this migration:
--   * SaleItem lines had no Currency column — historical lines could not tell
--     which currency they were priced in if the parent Sale was later re-currencied.
--   * Dispatch "Expenses" had no Currency column — the DispatchService received
--     dto.Currency on create/update but silently dropped it, so cross-currency
--     expenses were billed as-if in the sale's currency by PrepareForInvoiceAsync.
--
-- After this migration:
--   * Every new SaleItem is stamped with its parent Sale.Currency at write time
--     (see ServiceOrderService.PrepareForInvoiceAsync + SaleService item creators).
--   * Dispatch Expenses persist Currency, and the invoice-prep guard rejects
--     any currency-carrying expense (SO- or dispatch-sourced) that differs
--     from the target Sale.Currency.
--
-- Both columns are nullable so legacy rows stay valid; a NULL Currency is
-- interpreted at read/validation time as the parent sale's currency.
--
-- Run on every tenant database before deploying the backend.

ALTER TABLE "SaleItems" ADD COLUMN IF NOT EXISTS "Currency" varchar(10) NULL;
ALTER TABLE "Expenses"  ADD COLUMN IF NOT EXISTS "Currency" varchar(10) NULL;

-- Backfill: stamp every existing SaleItem with its parent Sale.Currency so
-- historical lines behave the same as newly-stamped ones from now on.
UPDATE "SaleItems" si
SET    "Currency" = s."Currency"
FROM   "Sales" s
WHERE  si."SaleId" = s."Id"
  AND  si."Currency" IS NULL
  AND  s."Currency" IS NOT NULL;

-- Note: Dispatch "Expenses" rows are intentionally NOT backfilled — a NULL
-- currency there means "trust the sale's currency at invoice time", which is
-- exactly the legacy behaviour. Only rows explicitly created with a currency
-- (post-migration) will trigger the mismatch guard.
