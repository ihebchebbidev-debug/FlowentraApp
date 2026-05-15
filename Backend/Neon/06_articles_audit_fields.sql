-- =====================================================
-- Add CreatedBy and ModifiedBy columns to Articles table
-- Run this SQL in your Neon database console
-- =====================================================

-- Add CreatedBy column
ALTER TABLE "Articles" ADD COLUMN IF NOT EXISTS "CreatedBy" VARCHAR(100);

-- Add ModifiedBy column  
ALTER TABLE "Articles" ADD COLUMN IF NOT EXISTS "ModifiedBy" VARCHAR(100);

-- Update existing records to have a default value (optional)
-- UPDATE "Articles" SET "CreatedBy" = '1' WHERE "CreatedBy" IS NULL;
-- UPDATE "Articles" SET "ModifiedBy" = '1' WHERE "ModifiedBy" IS NULL;

-- =====================================================
-- Verify the changes
-- =====================================================
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'Articles' 
-- AND column_name IN ('CreatedBy', 'ModifiedBy');
