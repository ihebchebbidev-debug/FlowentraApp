-- ============================================================
-- Synced Emails Table — stores emails fetched from Gmail/Outlook
-- Run this SQL against your Neon PostgreSQL database
-- ============================================================

CREATE TABLE IF NOT EXISTS "SyncedEmails" (
    "Id"                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ConnectedEmailAccountId"   UUID NOT NULL REFERENCES "ConnectedEmailAccounts"("Id") ON DELETE CASCADE,
    "ExternalId"                VARCHAR(255) NOT NULL,       -- Gmail message ID or Outlook message ID
    "ThreadId"                  VARCHAR(255),                -- Gmail thread ID or Outlook conversation ID
    "Subject"                   TEXT NOT NULL DEFAULT '',
    "Snippet"                   TEXT,                        -- Short preview text
    "FromEmail"                 VARCHAR(255) NOT NULL DEFAULT '',
    "FromName"                  VARCHAR(255),
    "ToEmails"                  TEXT,                        -- JSON array of recipients
    "CcEmails"                  TEXT,                        -- JSON array of CC
    "BccEmails"                 TEXT,                        -- JSON array of BCC
    "BodyPreview"               TEXT,                        -- First ~200 chars of body
    "IsRead"                    BOOLEAN NOT NULL DEFAULT FALSE,
    "IsStarred"                 BOOLEAN NOT NULL DEFAULT FALSE,
    "HasAttachments"            BOOLEAN NOT NULL DEFAULT FALSE,
    "Labels"                    TEXT,                        -- JSON array of labels/folders
    "ReceivedAt"                TIMESTAMPTZ NOT NULL,
    "CreatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: no duplicate external IDs per account
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SyncedEmails_Account_ExternalId"
    ON "SyncedEmails" ("ConnectedEmailAccountId", "ExternalId");

-- Index for fast account lookups ordered by date
CREATE INDEX IF NOT EXISTS "IX_SyncedEmails_AccountId_ReceivedAt"
    ON "SyncedEmails" ("ConnectedEmailAccountId", "ReceivedAt" DESC);

-- Index for search
CREATE INDEX IF NOT EXISTS "IX_SyncedEmails_Subject"
    ON "SyncedEmails" USING gin (to_tsvector('english', "Subject"));
