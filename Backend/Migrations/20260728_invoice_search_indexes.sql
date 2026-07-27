-- Fix §5.2: add trigram-backed indexes for case-insensitive substring search on
-- Invoices. The service now uses ILIKE (%pattern%) instead of lower(col) LIKE,
-- which trigram GIN indexes can serve efficiently even for leading-wildcard
-- queries (unlike a plain btree on lower(col), which only helps prefix search).
--
-- Idempotent: safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- InvoiceNumber: also add a plain lower() btree — invoice-number lookups are
-- frequently exact/prefix matches, and a btree is cheaper than a trigram scan
-- for those. The trigram GIN covers substring/mid-word matches.
CREATE INDEX IF NOT EXISTS ix_invoices_invoice_number_lower
    ON "Invoices" (lower("InvoiceNumber"));

CREATE INDEX IF NOT EXISTS ix_invoices_invoice_number_trgm
    ON "Invoices" USING GIN ("InvoiceNumber" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_invoices_title_trgm
    ON "Invoices" USING GIN ("Title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_invoices_notes_trgm
    ON "Invoices" USING GIN ("Notes" gin_trgm_ops);
