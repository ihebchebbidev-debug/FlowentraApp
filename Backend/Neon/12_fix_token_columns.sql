-- Migration: Fix Token Column Sizes
-- Date: 2024-12-02
-- Description: Increase AccessToken and RefreshToken column sizes to TEXT to accommodate JWT tokens

-- Fix MainAdminUsers token columns
ALTER TABLE "MainAdminUsers" 
ALTER COLUMN "AccessToken" TYPE TEXT,
ALTER COLUMN "RefreshToken" TYPE TEXT;

-- Fix Users token columns
ALTER TABLE "Users" 
ALTER COLUMN "AccessToken" TYPE TEXT,
ALTER COLUMN "RefreshToken" TYPE TEXT;

-- Verify the changes for MainAdminUsers
SELECT 'MainAdminUsers' as table_name, column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'MainAdminUsers' 
AND column_name IN ('AccessToken', 'RefreshToken');

-- Verify the changes for Users
SELECT 'Users' as table_name, column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'Users' 
AND column_name IN ('AccessToken', 'RefreshToken');
