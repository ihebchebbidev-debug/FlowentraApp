-- Migration 008 — Realign GoodsReceipts.Status check constraint with what the backend actually writes
--
-- Migration 004 restricted GoodsReceipts.Status to ('partial','received','rejected','closed'),
-- but the C# service writes 'partial' and 'complete' (and 'rejected' for reject flows).
-- That mismatch caused 23514: "GoodsReceipts_Status_check" violation on create.
--
-- Backend (Backend/Modules/Purchases/Services/GoodsReceiptService.cs):
--   Status = "partial"   (initial / downgrade)
--   Status = "complete"  (all items received)
--   Status = "rejected"  (reject flows)

BEGIN;

-- Normalize any pre-existing rows so the new constraint will accept them.
UPDATE "GoodsReceipts" SET "Status" = 'complete' WHERE "Status" IN ('received','closed');
UPDATE "GoodsReceipts" SET "Status" = 'partial'  WHERE "Status" IS NULL OR "Status" = '';

ALTER TABLE "GoodsReceipts" DROP CONSTRAINT IF EXISTS "GoodsReceipts_Status_check";

ALTER TABLE "GoodsReceipts"
  ADD CONSTRAINT "GoodsReceipts_Status_check"
  CHECK ("Status" IN ('partial','complete','rejected'));

COMMIT;
