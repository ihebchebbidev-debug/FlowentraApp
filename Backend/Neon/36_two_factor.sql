-- =====================================================
-- Two-Factor Authentication columns
-- Adds TwoFactorEnabled + TwoFactorEnabledAt to both
-- MainAdminUsers and Users tables. Idempotent.
-- =====================================================

-- MainAdminUsers -----------------------------------------
ALTER TABLE "MainAdminUsers"
    ADD COLUMN IF NOT EXISTS "TwoFactorEnabled" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "MainAdminUsers"
    ADD COLUMN IF NOT EXISTS "TwoFactorEnabledAt" TIMESTAMP WITH TIME ZONE NULL;

-- Users --------------------------------------------------
ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "TwoFactorEnabled" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "TwoFactorEnabledAt" TIMESTAMP WITH TIME ZONE NULL;