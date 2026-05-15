-- =====================================================
-- Migration: User AI Settings (Keys + Preferences)
-- Date: 2025-02-13
-- Description: Tables for storing per-user OpenRouter
--   API keys (with fallback priority) and AI preferences.
--
-- NOTE: UserId + UserType together identify the user.
--   MainAdminUser always has Id=1, UserType='MainAdminUser'
--   Regular Users have Id>=1, UserType='RegularUser'
--   No FK constraint because UserId references two tables.
-- =====================================================

-- ─── Drop old tables if they exist (safe re-run) ───
DROP TABLE IF EXISTS "UserAiKeys" CASCADE;
DROP TABLE IF EXISTS "UserAiPreferences" CASCADE;

-- ─── User AI API Keys ───
CREATE TABLE "UserAiKeys" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "UserType" VARCHAR(20) NOT NULL DEFAULT 'MainAdminUser',
    "Label" VARCHAR(100) NOT NULL DEFAULT 'Key',
    "ApiKey" TEXT NOT NULL,
    "Provider" VARCHAR(50) NOT NULL DEFAULT 'openrouter',
    "Priority" INTEGER NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "IX_UserAiKeys_UserId_UserType" ON "UserAiKeys"("UserId", "UserType");
CREATE INDEX "IX_UserAiKeys_Provider" ON "UserAiKeys"("Provider");

-- ─── User AI Preferences ───
CREATE TABLE "UserAiPreferences" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "UserType" VARCHAR(20) NOT NULL DEFAULT 'MainAdminUser',
    "DefaultModel" VARCHAR(200),
    "FallbackModel" VARCHAR(200),
    "DefaultTemperature" DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    "DefaultMaxTokens" INTEGER NOT NULL DEFAULT 1000,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "IX_UserAiPreferences_UserId_UserType" ON "UserAiPreferences"("UserId", "UserType");

-- ─── Insert default preferences for MainAdminUser (Id=1) ───
INSERT INTO "UserAiPreferences" ("UserId", "UserType", "DefaultModel", "DefaultTemperature", "DefaultMaxTokens")
VALUES (1, 'MainAdminUser', NULL, 0.70, 1000)
ON CONFLICT DO NOTHING;

-- ─── Verify ───
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('UserAiKeys', 'UserAiPreferences')
ORDER BY table_name;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'UserAiKeys'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'UserAiPreferences'
ORDER BY ordinal_position;
