-- ============================================================================
-- MIGRATION: Add Critical Tunisian RS Compliance Fields
-- Date: 2026-02-18
-- Purpose: Add deadline tracking, penalty calculation, and compliance fields
--          to RSRecords table per Tunisia tax authority requirements
-- Database: PostgreSQL (Neon)
-- ============================================================================

-- Add CRITICAL COMPLIANCE fields (Deadline Enforcement)
ALTER TABLE "RSRecords" 
  ADD COLUMN IF NOT EXISTS "DeclarationDeadline" TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS "IsOverdue" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "DaysLate" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "PenaltyAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Add MEDIUM PRIORITY COMPLIANCE fields (Supplier Classification & Treaty)
ALTER TABLE "RSRecords"
  ADD COLUMN IF NOT EXISTS "SupplierType" VARCHAR(20) NULL,  -- individual, company, non_resident
  ADD COLUMN IF NOT EXISTS "IsExemptByTreaty" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "TreatyCode" VARCHAR(20) NULL;  -- EU-TN, AGTC, etc.

-- Add TEJ Transmission Tracking fields
ALTER TABLE "RSRecords"
  ADD COLUMN IF NOT EXISTS "TEJAcceptanceNumber" VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS "TEJTransmissionStatus" VARCHAR(20) NOT NULL DEFAULT 'pending';  -- pending, accepted, rejected

-- ============================================================================
-- CREATE INDEXES for performance on new compliance fields
-- ============================================================================

-- Index for deadline enforcement queries
CREATE INDEX IF NOT EXISTS "IX_RSRecords_DeclarationDeadline" 
  ON "RSRecords" ("DeclarationDeadline") 
  WHERE "IsOverdue" = true;

-- Index for supplier type filtering
CREATE INDEX IF NOT EXISTS "IX_RSRecords_SupplierType" 
  ON "RSRecords" ("SupplierType");

-- Index for tax treaty lookups
CREATE INDEX IF NOT EXISTS "IX_RSRecords_IsExemptByTreaty" 
  ON "RSRecords" ("IsExemptByTreaty") 
  WHERE "IsExemptByTreaty" = true;

-- Index for TEJ transmission status tracking
CREATE INDEX IF NOT EXISTS "IX_RSRecords_TEJTransmissionStatus" 
  ON "RSRecords" ("TEJTransmissionStatus");

-- Composite index for compliance queries (often used together)
CREATE INDEX IF NOT EXISTS "IX_RSRecords_Compliance" 
  ON "RSRecords" ("PaymentDate", "IsOverdue", "SupplierType");

-- ============================================================================
-- UPDATE EXISTING RECORDS: Auto-calculate deadlines for historical records
-- This ensures all existing records have declaration deadlines set
-- Deadline = 20th of the month following the payment date per Tunisia law
-- ============================================================================

-- Calculate the deadline date first (cleaner approach)
UPDATE "RSRecords"
SET 
  "DeclarationDeadline" = (
    (DATE_TRUNC('month', "PaymentDate" + INTERVAL '1 month'))::DATE + 19
  )::TIMESTAMP,
  "IsOverdue" = NOW()::DATE > ((DATE_TRUNC('month', "PaymentDate" + INTERVAL '1 month'))::DATE + 19),
  "DaysLate" = GREATEST(
    0, 
    (NOW()::DATE - ((DATE_TRUNC('month', "PaymentDate" + INTERVAL '1 month'))::DATE + 19))::INTEGER
  ),
  "PenaltyAmount" = CASE 
    WHEN NOW()::DATE > ((DATE_TRUNC('month', "PaymentDate" + INTERVAL '1 month'))::DATE + 19)
    THEN "RSAmount" * 0.05 * GREATEST(
      1::DECIMAL, 
      CEIL((NOW()::DATE - ((DATE_TRUNC('month', "PaymentDate" + INTERVAL '1 month'))::DATE + 19))::DECIMAL / 30.0)
    )
    ELSE 0
  END
WHERE "DeclarationDeadline" IS NULL AND "Status" = 'pending';

-- ============================================================================
-- VALIDATION: Show migration results
-- ============================================================================

-- Verify columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE 
  table_name = 'RSRecords' 
  AND column_name IN (
    'DeclarationDeadline', 'IsOverdue', 'DaysLate', 'PenaltyAmount',
    'SupplierType', 'IsExemptByTreaty', 'TreatyCode',
    'TEJAcceptanceNumber', 'TEJTransmissionStatus'
  )
ORDER BY ordinal_position DESC;

-- Count overdue records
SELECT 
  COUNT(*) as TotalRecords,
  SUM(CASE WHEN "IsOverdue" = true THEN 1 ELSE 0 END) as OverdueRecords,
  SUM("PenaltyAmount") as TotalPenalties
FROM "RSRecords";

-- ============================================================================
-- ROLLBACK SCRIPT (if needed):
-- 
-- ALTER TABLE "RSRecords" DROP COLUMN IF EXISTS "DeclarationDeadline";
-- ALTER TABLE "RSRecords" DROP COLUMN IF EXISTS "IsOverdue";
-- ALTER TABLE "RSRecords" DROP COLUMN IF EXISTS "DaysLate";
-- ALTER TABLE "RSRecords" DROP COLUMN IF EXISTS "PenaltyAmount";
-- ALTER TABLE "RSRecords" DROP COLUMN IF EXISTS "SupplierType";
-- ALTER TABLE "RSRecords" DROP COLUMN IF EXISTS "IsExemptByTreaty";
-- ALTER TABLE "RSRecords" DROP COLUMN IF EXISTS "TreatyCode";
-- ALTER TABLE "RSRecords" DROP COLUMN IF EXISTS "TEJAcceptanceNumber";
-- ALTER TABLE "RSRecords" DROP COLUMN IF EXISTS "TEJTransmissionStatus";
-- DROP INDEX IF EXISTS "IX_RSRecords_DeclarationDeadline";
-- DROP INDEX IF EXISTS "IX_RSRecords_SupplierType";
-- DROP INDEX IF EXISTS "IX_RSRecords_IsExemptByTreaty";
-- DROP INDEX IF EXISTS "IX_RSRecords_TEJTransmissionStatus";
-- DROP INDEX IF EXISTS "IX_RSRecords_Compliance";
-- ============================================================================
