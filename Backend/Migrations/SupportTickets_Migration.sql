-- =====================================================
-- Support Tickets table for issue reporting
-- Run this migration on each tenant database
-- =====================================================

CREATE TABLE IF NOT EXISTS "SupportTickets" (
    "Id"            SERIAL PRIMARY KEY,
    "Title"         VARCHAR(300)  NOT NULL,
    "Description"   TEXT          NOT NULL,
    "Urgency"       VARCHAR(20),
    "Category"      VARCHAR(50),
    "CurrentPage"   VARCHAR(500),
    "RelatedUrl"    VARCHAR(1000),
    "Tenant"        VARCHAR(100)  NOT NULL DEFAULT '',
    "UserEmail"     VARCHAR(255),
    "Status"        VARCHAR(20)   NOT NULL DEFAULT 'open',
    "CreatedAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupportTicketAttachments" (
    "Id"                SERIAL PRIMARY KEY,
    "SupportTicketId"   INT           NOT NULL REFERENCES "SupportTickets"("Id") ON DELETE CASCADE,
    "FileName"          VARCHAR(500)  NOT NULL,
    "FilePath"          VARCHAR(1000),
    "FileSize"          BIGINT        NOT NULL DEFAULT 0,
    "ContentType"       VARCHAR(200),
    "UploadedAt"        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_SupportTickets_Tenant" ON "SupportTickets" ("Tenant");
CREATE INDEX IF NOT EXISTS "IX_SupportTickets_Status" ON "SupportTickets" ("Status");
CREATE INDEX IF NOT EXISTS "IX_SupportTicketAttachments_TicketId" ON "SupportTicketAttachments" ("SupportTicketId");
