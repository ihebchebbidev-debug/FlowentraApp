-- =====================================================
-- Email Verification Module
-- Adds EmailVerified state + verification OTP fields for
-- both MainAdminUsers and Users tables. Reuses existing
-- SMTP infrastructure (ForgotEmailService.SendOtpEmailAsync).
-- =====================================================

-- MainAdminUsers -----------------------------------------
ALTER TABLE "MainAdminUsers"
    ADD COLUMN IF NOT EXISTS "EmailVerified" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "MainAdminUsers"
    ADD COLUMN IF NOT EXISTS "EmailVerifiedAt" TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE "MainAdminUsers"
    ADD COLUMN IF NOT EXISTS "EmailVerifyOtpHash" VARCHAR(128) NULL;

ALTER TABLE "MainAdminUsers"
    ADD COLUMN IF NOT EXISTS "EmailVerifyOtpExpiresAt" TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE "MainAdminUsers"
    ADD COLUMN IF NOT EXISTS "EmailVerifyOtpAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "MainAdminUsers"
    ADD COLUMN IF NOT EXISTS "EmailVerifyOtpLastSentAt" TIMESTAMP WITH TIME ZONE NULL;

-- Users --------------------------------------------------
ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "EmailVerified" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "EmailVerifiedAt" TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "EmailVerifyOtpHash" VARCHAR(128) NULL;

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "EmailVerifyOtpExpiresAt" TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "EmailVerifyOtpAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "EmailVerifyOtpLastSentAt" TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "FirstLoginAt" TIMESTAMP WITH TIME ZONE NULL;

-- Indexes ------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_mainadminusers_emailverified"
    ON "MainAdminUsers"("EmailVerified");
CREATE INDEX IF NOT EXISTS "idx_users_emailverified"
    ON "Users"("EmailVerified");

-- Rollout policy: every existing account starts UNVERIFIED so
-- their next login triggers the verify flow (per product spec).
-- Password reset works even when unverified, so nobody gets locked out.
