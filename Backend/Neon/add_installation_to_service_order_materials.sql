-- =====================================================
-- Add Installation columns to ServiceOrderMaterials table
-- This allows tracking which installation a material is associated with
-- Run this script directly on the Neon database
-- =====================================================

-- Add InstallationId column
ALTER TABLE "ServiceOrderMaterials"
ADD COLUMN IF NOT EXISTS "InstallationId" VARCHAR(50);

-- Add InstallationName column
ALTER TABLE "ServiceOrderMaterials"
ADD COLUMN IF NOT EXISTS "InstallationName" VARCHAR(255);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "idx_service_order_materials_installation" 
ON "ServiceOrderMaterials"("InstallationId");

-- Comment for documentation
COMMENT ON COLUMN "ServiceOrderMaterials"."InstallationId" IS 'Reference to the installation this material is associated with';
COMMENT ON COLUMN "ServiceOrderMaterials"."InstallationName" IS 'Name of the installation for display purposes';
