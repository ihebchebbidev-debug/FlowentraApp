-- ============================================================
-- Synced Email Attachments Table — stores attachment metadata
-- Actual file content is fetched on-demand from Gmail/Outlook
-- Run this SQL against your Neon PostgreSQL database
-- ============================================================

CREATE TABLE IF NOT EXISTS "SyncedEmailAttachments" (
    "Id"                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SyncedEmailId"             UUID NOT NULL REFERENCES "SyncedEmails"("Id") ON DELETE CASCADE,
    "ExternalAttachmentId"      VARCHAR(500) NOT NULL,       -- Gmail attachmentId or Outlook attachment id
    "FileName"                  VARCHAR(255) NOT NULL DEFAULT '',
    "ContentType"               VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    "Size"                      BIGINT NOT NULL DEFAULT 0,
    "CreatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by email
CREATE INDEX IF NOT EXISTS "IX_SyncedEmailAttachments_SyncedEmailId"
    ON "SyncedEmailAttachments" ("SyncedEmailId");
