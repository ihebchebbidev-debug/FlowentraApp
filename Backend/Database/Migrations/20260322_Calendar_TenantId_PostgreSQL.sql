-- Add TenantId to calendar tables for ITenantEntity + global query filter.
-- Without "TenantId", GET /api/Calendar/events, /api/Calendar/event-types, and
-- event detail/attendees/reminders can return HTTP 500 (column does not exist).
--
-- If you have not run Migrations/multi_tenancy_migration.sql, run this (or that script).
-- Safe to run multiple times.

BEGIN;

ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "event_types" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "event_attendees" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "event_reminders" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "IX_calendar_events_TenantId" ON "calendar_events" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_event_types_TenantId" ON "event_types" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_event_attendees_TenantId" ON "event_attendees" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_event_reminders_TenantId" ON "event_reminders" ("TenantId");

COMMIT;
