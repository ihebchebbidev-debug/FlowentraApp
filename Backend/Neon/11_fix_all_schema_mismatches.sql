-- =====================================================
-- Migration: Fix All Schema Mismatches
-- Date: 2025-12-02
-- Description: Fixes column name mismatches between 
-- database and Entity Framework models
-- =====================================================

-- ==========================================
-- FIX 1: MainAdminUsers Table
-- ==========================================

-- Rename CreatedDate to CreatedAt if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' AND column_name = 'CreatedDate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' AND column_name = 'CreatedAt'
    ) THEN
        ALTER TABLE "MainAdminUsers" RENAME COLUMN "CreatedDate" TO "CreatedAt";
        RAISE NOTICE 'Renamed CreatedDate to CreatedAt in MainAdminUsers';
    END IF;
END $$;

-- Rename LastLoginDate to LastLoginAt if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' AND column_name = 'LastLoginDate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' AND column_name = 'LastLoginAt'
    ) THEN
        ALTER TABLE "MainAdminUsers" RENAME COLUMN "LastLoginDate" TO "LastLoginAt";
        RAISE NOTICE 'Renamed LastLoginDate to LastLoginAt in MainAdminUsers';
    END IF;
END $$;

-- Add missing columns to MainAdminUsers
ALTER TABLE "MainAdminUsers" 
ADD COLUMN IF NOT EXISTS "AccessToken" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "RefreshToken" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "TokenExpiresAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "PhoneNumber" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "Country" VARCHAR(2) DEFAULT 'US',
ADD COLUMN IF NOT EXISTS "Industry" VARCHAR(100) DEFAULT '',
ADD COLUMN IF NOT EXISTS "CompanyName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "CompanyWebsite" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "PreferencesJson" TEXT,
ADD COLUMN IF NOT EXISTS "UpdatedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "LastLoginAt" TIMESTAMP;

-- Ensure OnboardingCompleted exists
ALTER TABLE "MainAdminUsers"
ADD COLUMN IF NOT EXISTS "OnboardingCompleted" BOOLEAN NOT NULL DEFAULT FALSE;

-- ==========================================
-- FIX 2: Skills Table - Add Level column
-- ==========================================

ALTER TABLE "Skills"
ADD COLUMN IF NOT EXISTS "Level" VARCHAR(20);

-- Rename CreatedDate to CreatedAt in Skills if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Skills' AND column_name = 'CreatedDate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Skills' AND column_name = 'CreatedAt'
    ) THEN
        ALTER TABLE "Skills" RENAME COLUMN "CreatedDate" TO "CreatedAt";
        RAISE NOTICE 'Renamed CreatedDate to CreatedAt in Skills';
    END IF;
END $$;

-- Ensure Skills has all required columns
ALTER TABLE "Skills"
ADD COLUMN IF NOT EXISTS "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "UpdatedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "IsActive" BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN DEFAULT FALSE;

-- ==========================================
-- FIX 3: Users Table (if same issue exists)
-- ==========================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'CreatedDate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'CreatedAt'
    ) THEN
        ALTER TABLE "Users" RENAME COLUMN "CreatedDate" TO "CreatedAt";
        RAISE NOTICE 'Renamed CreatedDate to CreatedAt in Users';
    END IF;
END $$;

-- ==========================================
-- FIX 4: Roles Table (if same issue exists)
-- ==========================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Roles' AND column_name = 'CreatedDate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Roles' AND column_name = 'CreatedAt'
    ) THEN
        ALTER TABLE "Roles" RENAME COLUMN "CreatedDate" TO "CreatedAt";
        RAISE NOTICE 'Renamed CreatedDate to CreatedAt in Roles';
    END IF;
END $$;

-- ==========================================
-- VERIFICATION
-- ==========================================

DO $$
DECLARE
    missing_info TEXT := '';
BEGIN
    -- Check MainAdminUsers.CreatedAt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MainAdminUsers' AND column_name = 'CreatedAt') THEN
        missing_info := missing_info || 'MainAdminUsers.CreatedAt, ';
    END IF;
    
    -- Check Skills.Level
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Skills' AND column_name = 'Level') THEN
        missing_info := missing_info || 'Skills.Level, ';
    END IF;
    
    IF missing_info = '' THEN
        RAISE NOTICE '✅ All schema fixes applied successfully!';
    ELSE
        RAISE WARNING '⚠️ Still missing: %', missing_info;
    END IF;
END $$;

-- Show MainAdminUsers structure
SELECT 'MainAdminUsers columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'MainAdminUsers' 
ORDER BY ordinal_position;

-- Show Skills structure
SELECT 'Skills columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Skills' 
ORDER BY ordinal_position;
