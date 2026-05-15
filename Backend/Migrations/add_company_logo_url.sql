-- Migration: Add CompanyLogoUrl to MainAdminUsers
-- Run this on your database before deploying the backend

ALTER TABLE "MainAdminUsers" 
ADD COLUMN IF NOT EXISTS "CompanyLogoUrl" VARCHAR(500) NULL;
