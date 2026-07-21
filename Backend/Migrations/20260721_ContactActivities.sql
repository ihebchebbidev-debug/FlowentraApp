-- =====================================================================
-- Contact Activity Feed
-- 2026-07-21
--
-- Adds the ContactActivities audit-log table used by the "Activity" tab on
-- the contact detail page. Rows are inserted automatically by the Offers,
-- Sales, ServiceOrders, Dispatches, Installations and ContactNotes services
-- so the frontend can render a unified chronological feed per contact.
-- Idempotent: safe to re-run.
-- =====================================================================

CREATE TABLE IF NOT EXISTS "ContactActivities" (
    "Id"                SERIAL       PRIMARY KEY,
    "TenantId"          INTEGER      NOT NULL DEFAULT 0,
    "ContactId"         INTEGER      NOT NULL,
    "Type"              VARCHAR(60)  NOT NULL,
    "RelatedEntityType" VARCHAR(40)  NULL,
    "RelatedEntityId"   INTEGER      NULL,
    "Description"       VARCHAR(500) NULL,
    "Metadata"          TEXT         NULL,
    "CreatedAt"         TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CreatedBy"         VARCHAR(100) NULL
);

CREATE INDEX IF NOT EXISTS "IX_ContactActivities_Contact_CreatedAt"
    ON "ContactActivities" ("TenantId", "ContactId", "CreatedAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_ContactActivities_Related"
    ON "ContactActivities" ("TenantId", "RelatedEntityType", "RelatedEntityId");
