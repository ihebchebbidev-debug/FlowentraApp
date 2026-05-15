-- Migration: Create SupportTicketComments and SupportTicketLinks tables
BEGIN;

CREATE TABLE IF NOT EXISTS "SupportTicketComments" (
    "Id"                SERIAL PRIMARY KEY,
    "SupportTicketId"   INT           NOT NULL REFERENCES "SupportTickets"("Id") ON DELETE CASCADE,
    "Author"            VARCHAR(255)  NOT NULL DEFAULT '',
    "AuthorEmail"       VARCHAR(255),
    "Text"              TEXT          NOT NULL,
    "IsInternal"        BOOLEAN       NOT NULL DEFAULT FALSE,
    "CreatedAt"         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupportTicketLinks" (
    "Id"                SERIAL PRIMARY KEY,
    "SourceTicketId"    INT           NOT NULL REFERENCES "SupportTickets"("Id") ON DELETE CASCADE,
    "TargetTicketId"    INT           NOT NULL REFERENCES "SupportTickets"("Id") ON DELETE CASCADE,
    "LinkType"          VARCHAR(30)   NOT NULL DEFAULT 'related',
    "CreatedAt"         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE("SourceTicketId", "TargetTicketId", "LinkType")
);

CREATE INDEX IF NOT EXISTS "IX_SupportTicketComments_TicketId" ON "SupportTicketComments" ("SupportTicketId");
CREATE INDEX IF NOT EXISTS "IX_SupportTicketLinks_Source" ON "SupportTicketLinks" ("SourceTicketId");
CREATE INDEX IF NOT EXISTS "IX_SupportTicketLinks_Target" ON "SupportTicketLinks" ("TargetTicketId");

COMMIT;
