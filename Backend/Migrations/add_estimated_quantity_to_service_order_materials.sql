-- =============================================================================
-- Migration: Add EstimatedQuantity to ServiceOrderMaterials
-- =============================================================================
-- Adds a nullable planned/estimated quantity column so we can distinguish the
-- originally planned amount from the actual delivered/used Quantity.
--
-- Safe to re-run: guarded with IF NOT EXISTS / column check.
-- Run per tenant database.
-- =============================================================================

-- ---- SQL Server ---------------------------------------------------------------
IF COL_LENGTH('dbo.ServiceOrderMaterials', 'EstimatedQuantity') IS NULL
BEGIN
    ALTER TABLE dbo.ServiceOrderMaterials
        ADD EstimatedQuantity DECIMAL(18, 2) NULL;
END;
GO

-- Backfill legacy rows: assume the historical Quantity was the planned amount.
UPDATE dbo.ServiceOrderMaterials
   SET EstimatedQuantity = Quantity
 WHERE EstimatedQuantity IS NULL;
GO

-- Optional index for planned-vs-actual reporting.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
     WHERE name = 'IX_ServiceOrderMaterials_ServiceOrderId_EstimatedQuantity'
       AND object_id = OBJECT_ID('dbo.ServiceOrderMaterials')
)
BEGIN
    CREATE INDEX IX_ServiceOrderMaterials_ServiceOrderId_EstimatedQuantity
        ON dbo.ServiceOrderMaterials (ServiceOrderId)
        INCLUDE (EstimatedQuantity, Quantity);
END;
GO

-- =============================================================================
-- PostgreSQL equivalent (uncomment if the tenant runs on Postgres)
-- =============================================================================
-- ALTER TABLE "ServiceOrderMaterials"
--     ADD COLUMN IF NOT EXISTS "EstimatedQuantity" numeric(18,2) NULL;
--
-- UPDATE "ServiceOrderMaterials"
--    SET "EstimatedQuantity" = "Quantity"
--  WHERE "EstimatedQuantity" IS NULL;
--
-- CREATE INDEX IF NOT EXISTS "IX_ServiceOrderMaterials_ServiceOrderId_EstimatedQuantity"
--     ON "ServiceOrderMaterials" ("ServiceOrderId")
--     INCLUDE ("EstimatedQuantity", "Quantity");
