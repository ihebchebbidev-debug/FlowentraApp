-- =============================================================================
-- Migration: Add approval workflow columns to MaterialUsage
-- Mirrors the approval shape used elsewhere (see ApproveExpenseAsync).
-- Idempotent. Safe to re-run.
-- Run per tenant DB BEFORE deploying the matching backend build.
-- =============================================================================

BEGIN;

ALTER TABLE "MaterialUsage"
    ADD COLUMN IF NOT EXISTS "ApprovalStatus"  varchar(20)  NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS "ApprovedBy"      varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS "ApprovedAt"      timestamp    NULL,
    ADD COLUMN IF NOT EXISTS "RejectionReason" varchar(500) NULL;

-- Guard: keep status values in a known set.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_materialusage_approvalstatus'
    ) THEN
        ALTER TABLE "MaterialUsage"
            ADD CONSTRAINT "ck_materialusage_approvalstatus"
            CHECK ("ApprovalStatus" IN ('pending','approved','rejected'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_MaterialUsage_ApprovalStatus"
    ON "MaterialUsage" ("ApprovalStatus");

COMMIT;
