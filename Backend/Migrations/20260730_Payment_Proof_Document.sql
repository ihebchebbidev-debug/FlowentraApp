-- Payment proof-of-payment attachment
-- Additive + idempotent: all columns nullable, no backfill, no constraints.
-- The document itself lives in the shared `documents` table (same upload path
-- used by sales/offers); we only keep a soft pointer here so deleting the
-- document from the Documents tab cannot break payment reads.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_document_id integer NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_document_name varchar(500) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_document_url varchar(1000) NULL;
