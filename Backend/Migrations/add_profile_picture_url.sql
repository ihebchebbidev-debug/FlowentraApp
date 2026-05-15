-- Migration: Add ProfilePictureUrl to MainAdminUsers and Users tables
-- Run this on your Neon database before deploying the backend

-- Add to MainAdminUsers table (admin profile picture)
ALTER TABLE "MainAdminUsers" 
ADD COLUMN IF NOT EXISTS "ProfilePictureUrl" VARCHAR(500) NULL;

-- Add to Users table (regular user profile picture)
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "ProfilePictureUrl" VARCHAR(500) NULL;
