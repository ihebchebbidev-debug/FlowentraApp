-- =====================================================
-- Migration: Add Fiscal Stamp Column to Sales and Offers
-- Run this on your Neon database to add fiscal stamp support
-- =====================================================

-- Add FiscalStamp column to Offers table
ALTER TABLE "Offers" ADD COLUMN IF NOT EXISTS "FiscalStamp" DECIMAL(10,3) DEFAULT 1.000;

-- Add FiscalStamp column to Sales table
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "FiscalStamp" DECIMAL(10,3) DEFAULT 1.000;

-- Update existing offers to have default fiscal stamp if null
UPDATE "Offers" SET "FiscalStamp" = 1.000 WHERE "FiscalStamp" IS NULL;

-- Update existing sales to have default fiscal stamp if null
UPDATE "Sales" SET "FiscalStamp" = 1.000 WHERE "FiscalStamp" IS NULL;

-- Create indexes for fiscal stamp columns (optional, for performance)
CREATE INDEX IF NOT EXISTS "idx_offers_fiscal_stamp" ON "Offers"("FiscalStamp");
CREATE INDEX IF NOT EXISTS "idx_sales_fiscal_stamp" ON "Sales"("FiscalStamp");
