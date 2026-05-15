-- =====================================================
-- Migration: Add Missing Sales Columns
-- Run this on your Neon database to fix the schema mismatch
-- =====================================================

-- Add missing columns to Sales table
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "SaleNumber" VARCHAR(50);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "SaleDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "TotalAmount" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "DiscountPercent" DECIMAL(5,2);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "DiscountAmount" DECIMAL(18,2);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "TaxAmount" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "GrandTotal" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "PaymentStatus" VARCHAR(20) DEFAULT 'pending';
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "PaymentMethod" VARCHAR(50);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "Notes" TEXT;
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "Category" VARCHAR(50);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "Source" VARCHAR(50);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "CreatedByName" VARCHAR(255);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "ModifiedDate" TIMESTAMP;
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "ModifiedBy" VARCHAR(100);
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "ConvertedFromOfferAt" TIMESTAMP;

-- Add missing columns to SaleItems table
ALTER TABLE "SaleItems" ADD COLUMN IF NOT EXISTS "TaxRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "SaleItems" ADD COLUMN IF NOT EXISTS "LineTotal" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "SaleItems" ADD COLUMN IF NOT EXISTS "DisplayOrder" INTEGER DEFAULT 0;
ALTER TABLE "SaleItems" ADD COLUMN IF NOT EXISTS "RequiresServiceOrder" BOOLEAN DEFAULT FALSE;
ALTER TABLE "SaleItems" ADD COLUMN IF NOT EXISTS "ServiceOrderGenerated" BOOLEAN DEFAULT FALSE;
ALTER TABLE "SaleItems" ADD COLUMN IF NOT EXISTS "ServiceOrderId" VARCHAR(50);
ALTER TABLE "SaleItems" ADD COLUMN IF NOT EXISTS "FulfillmentStatus" VARCHAR(20);

-- Add missing columns to SaleActivities table (model uses different column names)
ALTER TABLE "SaleActivities" ADD COLUMN IF NOT EXISTS "ActivityType" VARCHAR(50);
ALTER TABLE "SaleActivities" ADD COLUMN IF NOT EXISTS "ActivityDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "SaleActivities" ADD COLUMN IF NOT EXISTS "PerformedBy" VARCHAR(100);

-- Update existing data if needed
UPDATE "SaleActivities" SET "ActivityType" = "type" WHERE "ActivityType" IS NULL AND "type" IS NOT NULL;
UPDATE "SaleActivities" SET "ActivityDate" = "created_at" WHERE "ActivityDate" IS NULL AND "created_at" IS NOT NULL;
UPDATE "SaleActivities" SET "PerformedBy" = "created_by_name" WHERE "PerformedBy" IS NULL AND "created_by_name" IS NOT NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "idx_sales_sale_number" ON "Sales"("SaleNumber");
CREATE INDEX IF NOT EXISTS "idx_sales_sale_date" ON "Sales"("SaleDate");
CREATE INDEX IF NOT EXISTS "idx_sales_payment_status" ON "Sales"("PaymentStatus");
