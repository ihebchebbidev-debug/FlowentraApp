-- Extend sync receipts to support history details and retry payloads

ALTER TABLE sync_operation_receipts
    ADD COLUMN IF NOT EXISTS "OperationJson" TEXT NULL;
