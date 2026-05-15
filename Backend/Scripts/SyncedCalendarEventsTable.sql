-- Run this SQL to create the SyncedCalendarEvents table
-- Execute in your PostgreSQL database (Neon)

CREATE TABLE IF NOT EXISTS "SyncedCalendarEvents" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ConnectedEmailAccountId" UUID NOT NULL REFERENCES "ConnectedEmailAccounts"("Id") ON DELETE CASCADE,
    "ExternalId" VARCHAR(255) NOT NULL,
    "Title" TEXT NOT NULL DEFAULT '',
    "Description" TEXT,
    "Location" VARCHAR(500),
    "StartTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "EndTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "IsAllDay" BOOLEAN NOT NULL DEFAULT FALSE,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    "OrganizerEmail" VARCHAR(255),
    "Attendees" TEXT, -- JSON array
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("ConnectedEmailAccountId", "ExternalId")
);

CREATE INDEX IF NOT EXISTS idx_synced_calendar_events_account ON "SyncedCalendarEvents"("ConnectedEmailAccountId");
CREATE INDEX IF NOT EXISTS idx_synced_calendar_events_start ON "SyncedCalendarEvents"("StartTime");
