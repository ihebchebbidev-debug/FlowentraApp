-- =====================================================
-- Migration: Add TaxType Column to Sales Table
-- This ensures TVA can be stored as percentage or fixed value
-- Run this on your Neon database
-- =====================================================

-- Add TaxType column to Sales table (matches Offers table structure)
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "TaxType" VARCHAR(20) DEFAULT 'percentage';

-- Add comment for documentation
COMMENT ON COLUMN "Sales"."TaxType" IS 'Type of tax calculation: percentage or fixed';

-- Update existing records to have default value
UPDATE "Sales" SET "TaxType" = 'percentage' WHERE "TaxType" IS NULL;

-- Create index for TaxType if needed for filtering
CREATE INDEX IF NOT EXISTS "idx_sales_TaxType" ON "Sales"("TaxType");
