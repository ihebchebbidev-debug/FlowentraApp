-- =====================================================================
-- Payment proof documents: allow MULTIPLE proof files per payment.
--
-- IMPORTANT naming note:
--   The `payments` table is mapped by EF with explicit snake_case
--   [Column] attributes for every property EXCEPT TenantId, which keeps
--   the default PascalCase name "TenantId" (quoted). The same is true
--   for the PaymentProofDocument entity, so this table must expose
--   "TenantId", not tenant_id.
--
-- Safe to re-run (idempotent), and repairs an earlier run of this file
-- that created the column as tenant_id.
-- =====================================================================

-- Legacy single-proof columns (no-op if 20260730 already ran).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_document_id integer NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_document_name varchar(500) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_document_url varchar(1000) NULL;

CREATE TABLE IF NOT EXISTS payment_proof_documents (
    id              VARCHAR(50)   NOT NULL,
    "TenantId"      INTEGER       NOT NULL DEFAULT 0,
    payment_id      VARCHAR(50)   NOT NULL,
    document_id     INTEGER       NULL,
    document_name   VARCHAR(500)  NULL,
    document_url    VARCHAR(1000) NULL,
    created_by      VARCHAR(50)   NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment_proof_documents PRIMARY KEY (id),
    CONSTRAINT fk_payment_proof_documents_payment
        FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE
);

-- Repair: an earlier version of this script created tenant_id.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_proof_documents' AND column_name = 'tenant_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_proof_documents' AND column_name = 'TenantId'
    ) THEN
        ALTER TABLE payment_proof_documents RENAME COLUMN tenant_id TO "TenantId";
    END IF;

    -- Table may pre-exist without the column at all.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_proof_documents' AND column_name = 'TenantId'
    ) THEN
        ALTER TABLE payment_proof_documents ADD COLUMN "TenantId" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_payment_proof_documents_payment
    ON payment_proof_documents (payment_id);

CREATE INDEX IF NOT EXISTS ix_payment_proof_documents_tenant
    ON payment_proof_documents ("TenantId");

-- One link row per (payment, document): prevents duplicate attachments
-- if a client retries an upload.
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_proof_documents_payment_document
    ON payment_proof_documents (payment_id, document_id)
    WHERE document_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- Backfill: migrate existing single-proof rows into the new link table.
-- ---------------------------------------------------------------------
INSERT INTO payment_proof_documents
    (id, "TenantId", payment_id, document_id, document_name, document_url, created_by, created_at, updated_at)
SELECT
    gen_random_uuid()::text,
    COALESCE(p."TenantId", 0),
    p.id,
    p.proof_document_id,
    p.proof_document_name,
    p.proof_document_url,
    p.created_by,
    COALESCE(p.created_at, CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
FROM payments p
WHERE p.proof_document_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM payment_proof_documents d
      WHERE d.payment_id = p.id AND d.document_id = p.proof_document_id
  );
