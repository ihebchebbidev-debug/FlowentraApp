-- Idempotency guard for stock movements.
--
-- Each business event that consumes physical stock should map to AT MOST one
-- deduction row, keyed by (tenant, article, reference). Without this, a Sale
-- reopen/close cycle, a retried API call, or a Sale close followed by a
-- Dispatch material entry for the same article can all deduct the same goods
-- twice.
--
-- Partial unique index — only enforced for the two reference types that
-- represent physical consumption. Manual "adjustment", "add", "offer_added"
-- rows stay unconstrained. NULL reference_id rows (legacy) are excluded so
-- this is safe on live data.
CREATE UNIQUE INDEX IF NOT EXISTS "UX_stock_transactions_idempotency"
    ON "stock_transactions" ("TenantId", "article_id", "reference_type", "reference_id", "transaction_type")
    WHERE "reference_type" IN ('sale', 'dispatch_material')
      AND "reference_id" IS NOT NULL;