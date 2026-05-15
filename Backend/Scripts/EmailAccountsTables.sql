-- ============================================================
-- Email Accounts Module — Gmail & Outlook OAuth
-- Run this SQL against your Neon PostgreSQL database
-- ============================================================

-- Connected email/calendar accounts (one per provider per user)
CREATE TABLE IF NOT EXISTS "ConnectedEmailAccounts" (
    "Id"                                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"                                INTEGER NOT NULL,
    "Handle"                                VARCHAR(255) NOT NULL,
    "Provider"                              VARCHAR(50) NOT NULL,
    "AccessToken"                           TEXT NOT NULL,
    "RefreshToken"                          TEXT NOT NULL,
    "Scopes"                                TEXT,
    "SyncStatus"                            VARCHAR(50) NOT NULL DEFAULT 'not_synced',
    "LastSyncedAt"                          TIMESTAMPTZ,
    "AuthFailedAt"                          TIMESTAMPTZ,
    "EmailVisibility"                       VARCHAR(50) NOT NULL DEFAULT 'share_everything',
    "CalendarVisibility"                    VARCHAR(50) NOT NULL DEFAULT 'share_everything',
    "ContactAutoCreationPolicy"             VARCHAR(50) NOT NULL DEFAULT 'sent_and_received',
    "IsEmailSyncEnabled"                    BOOLEAN NOT NULL DEFAULT TRUE,
    "IsCalendarSyncEnabled"                 BOOLEAN NOT NULL DEFAULT TRUE,
    "ExcludeGroupEmails"                    BOOLEAN NOT NULL DEFAULT FALSE,
    "ExcludeNonProfessionalEmails"          BOOLEAN NOT NULL DEFAULT FALSE,
    "IsCalendarContactAutoCreationEnabled"  BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt"                             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"                             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one account per provider per user per email
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ConnectedEmailAccounts_User_Handle_Provider" 
    ON "ConnectedEmailAccounts" ("UserId", "Handle", "Provider");

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS "IX_ConnectedEmailAccounts_UserId" 
    ON "ConnectedEmailAccounts" ("UserId");

-- Blocklist items per connected account
CREATE TABLE IF NOT EXISTS "EmailBlocklistItems" (
    "Id"                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ConnectedEmailAccountId"   UUID NOT NULL REFERENCES "ConnectedEmailAccounts"("Id") ON DELETE CASCADE,
    "Handle"                    VARCHAR(255) NOT NULL,
    "CreatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: no duplicate blocklist entries per account
CREATE UNIQUE INDEX IF NOT EXISTS "IX_EmailBlocklistItems_Account_Handle" 
    ON "EmailBlocklistItems" ("ConnectedEmailAccountId", "Handle");

-- Index for fast account lookups
CREATE INDEX IF NOT EXISTS "IX_EmailBlocklistItems_AccountId" 
    ON "EmailBlocklistItems" ("ConnectedEmailAccountId");
