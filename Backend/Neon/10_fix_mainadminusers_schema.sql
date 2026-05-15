-- =====================================================
-- Migration: Fix MainAdminUsers Schema Mismatch
-- Date: 2025-12-02
-- Description: Adds missing columns to MainAdminUsers table
-- that are expected by the C# Entity Framework model
-- =====================================================

-- Add missing columns to MainAdminUsers table
ALTER TABLE "MainAdminUsers" 
ADD COLUMN IF NOT EXISTS "AccessToken" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "RefreshToken" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "TokenExpiresAt" TIMESTAMP;

-- Add other potentially missing columns based on model
ALTER TABLE "MainAdminUsers"
ADD COLUMN IF NOT EXISTS "PhoneNumber" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "Country" VARCHAR(2),
ADD COLUMN IF NOT EXISTS "Industry" VARCHAR(100) DEFAULT '',
ADD COLUMN IF NOT EXISTS "CompanyName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "CompanyWebsite" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "PreferencesJson" TEXT,
ADD COLUMN IF NOT EXISTS "UpdatedAt" TIMESTAMP;

-- Ensure OnboardingCompleted column exists with correct default
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' AND column_name = 'OnboardingCompleted'
    ) THEN
        ALTER TABLE "MainAdminUsers" ADD COLUMN "OnboardingCompleted" BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Rename columns if needed (for compatibility between EF migration and manual SQL)
-- Check if old column names exist and rename them
DO $$
BEGIN
    -- Rename CreatedDate to CreatedAt if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' AND column_name = 'CreatedDate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' AND column_name = 'CreatedAt'
    ) THEN
        ALTER TABLE "MainAdminUsers" RENAME COLUMN "CreatedDate" TO "CreatedAt";
    END IF;
    
    -- Rename LastLoginDate to LastLoginAt if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' AND column_name = 'LastLoginDate'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' AND column_name = 'LastLoginAt'
    ) THEN
        ALTER TABLE "MainAdminUsers" RENAME COLUMN "LastLoginDate" TO "LastLoginAt";
    END IF;
END $$;

-- Add CreatedAt if it doesn't exist at all
ALTER TABLE "MainAdminUsers"
ADD COLUMN IF NOT EXISTS "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add LastLoginAt if it doesn't exist at all  
ALTER TABLE "MainAdminUsers"
ADD COLUMN IF NOT EXISTS "LastLoginAt" TIMESTAMP;

-- Set default for Country column if needed
UPDATE "MainAdminUsers" SET "Country" = 'US' WHERE "Country" IS NULL;

-- Make Country NOT NULL after setting defaults
DO $$
BEGIN
    -- Only alter if the column allows NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MainAdminUsers' 
        AND column_name = 'Country' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE "MainAdminUsers" ALTER COLUMN "Country" SET NOT NULL;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "idx_mainadminusers_email" ON "MainAdminUsers"("Email");
CREATE INDEX IF NOT EXISTS "idx_mainadminusers_isactive" ON "MainAdminUsers"("IsActive");
CREATE INDEX IF NOT EXISTS "idx_mainadminusers_createdat" ON "MainAdminUsers"("CreatedAt");

-- Verify the table structure
DO $$
DECLARE
    missing_columns TEXT := '';
    required_columns TEXT[] := ARRAY['Id', 'Email', 'PasswordHash', 'FirstName', 'LastName', 
                                      'PhoneNumber', 'Country', 'Industry', 'AccessToken', 
                                      'RefreshToken', 'TokenExpiresAt', 'CreatedAt', 'UpdatedAt',
                                      'IsActive', 'LastLoginAt', 'CompanyName', 'CompanyWebsite',
                                      'PreferencesJson', 'OnboardingCompleted'];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'MainAdminUsers' AND column_name = col
        ) THEN
            missing_columns := missing_columns || col || ', ';
        END IF;
    END LOOP;
    
    IF missing_columns != '' THEN
        RAISE NOTICE 'Warning: Still missing columns in MainAdminUsers: %', missing_columns;
    ELSE
        RAISE NOTICE 'Success: All required columns exist in MainAdminUsers table';
    END IF;
END $$;

-- Show current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'MainAdminUsers' 
ORDER BY ordinal_position;
