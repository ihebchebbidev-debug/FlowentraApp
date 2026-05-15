-- =============================================
-- Migration: 19_fix_dispatches_isdeleted.sql
-- Date: 2026-02-06
-- Purpose: Fix schema issues preventing workflow status updates
-- =============================================

-- =============================================
-- 1. Fix Dispatches table - add IsDeleted if missing
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Dispatches' AND column_name = 'IsDeleted') THEN
        ALTER TABLE "Dispatches" ADD COLUMN "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Added IsDeleted column to Dispatches table';
    ELSE
        RAISE NOTICE 'IsDeleted column already exists in Dispatches table';
    END IF;
END $$;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_dispatches_not_deleted 
ON "Dispatches" ("IsDeleted") WHERE "IsDeleted" = FALSE;

-- =============================================
-- 2. Ensure ServiceOrders has all required workflow columns
-- =============================================

-- Add TechnicallyCompletedAt if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ServiceOrders' AND column_name = 'TechnicallyCompletedAt') THEN
        ALTER TABLE "ServiceOrders" ADD COLUMN "TechnicallyCompletedAt" TIMESTAMP;
        RAISE NOTICE 'Added TechnicallyCompletedAt to ServiceOrders';
    END IF;
END $$;

-- Add ServiceCount if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ServiceOrders' AND column_name = 'ServiceCount') THEN
        ALTER TABLE "ServiceOrders" ADD COLUMN "ServiceCount" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added ServiceCount to ServiceOrders';
    END IF;
END $$;

-- Add ActualCompletionDate if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ServiceOrders' AND column_name = 'ActualCompletionDate') THEN
        ALTER TABLE "ServiceOrders" ADD COLUMN "ActualCompletionDate" TIMESTAMP;
        RAISE NOTICE 'Added ActualCompletionDate to ServiceOrders';
    END IF;
END $$;

-- Add CompletedDispatchCount if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ServiceOrders' AND column_name = 'CompletedDispatchCount') THEN
        ALTER TABLE "ServiceOrders" ADD COLUMN "CompletedDispatchCount" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added CompletedDispatchCount to ServiceOrders';
    END IF;
END $$;

-- =============================================
-- 3. Initialize ServiceCount for existing Service Orders
-- This counts the number of ServiceOrderJobs per ServiceOrder
-- =============================================
UPDATE "ServiceOrders" so
SET "ServiceCount" = (
    SELECT COUNT(*) 
    FROM "ServiceOrderJobs" soj 
    WHERE soj."ServiceOrderId" = so."Id"
)
WHERE "ServiceCount" = 0 OR "ServiceCount" IS NULL;

-- =============================================
-- 4. Initialize CompletedDispatchCount for existing Service Orders
-- Count dispatches that are in a completed-like status
-- =============================================
UPDATE "ServiceOrders" so
SET "CompletedDispatchCount" = (
    SELECT COUNT(*) 
    FROM "Dispatches" d 
    WHERE d."ServiceOrderId" = so."Id" 
      AND (d."IsDeleted" = FALSE OR d."IsDeleted" IS NULL)
      AND (
          LOWER(d."Status") LIKE '%completed%' 
          OR LOWER(d."Status") LIKE '%finished%' 
          OR LOWER(d."Status") LIKE '%done%'
          OR LOWER(d."Status") LIKE '%closed%'
      )
)
WHERE "CompletedDispatchCount" = 0 OR "CompletedDispatchCount" IS NULL;

-- =============================================
-- 5. Verification
-- =============================================
SELECT 'Dispatches.IsDeleted' as column_check, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'Dispatches' AND column_name = 'IsDeleted') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'ServiceOrders.TechnicallyCompletedAt', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'ServiceOrders' AND column_name = 'TechnicallyCompletedAt') 
            THEN 'EXISTS' ELSE 'MISSING' END
UNION ALL
SELECT 'ServiceOrders.ServiceCount', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'ServiceOrders' AND column_name = 'ServiceCount') 
            THEN 'EXISTS' ELSE 'MISSING' END
UNION ALL
SELECT 'ServiceOrders.ActualCompletionDate', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'ServiceOrders' AND column_name = 'ActualCompletionDate') 
            THEN 'EXISTS' ELSE 'MISSING' END
UNION ALL
SELECT 'ServiceOrders.CompletedDispatchCount', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'ServiceOrders' AND column_name = 'CompletedDispatchCount') 
            THEN 'EXISTS' ELSE 'MISSING' END;
