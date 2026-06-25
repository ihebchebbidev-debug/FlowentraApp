-- Auto-incident tracking columns for SupportTickets
-- Run on each tenant database

ALTER TABLE "SupportTickets" ADD COLUMN IF NOT EXISTS "Source" VARCHAR(20) NOT NULL DEFAULT 'manual';
ALTER TABLE "SupportTickets" ADD COLUMN IF NOT EXISTS "ErrorFingerprint" VARCHAR(64);
ALTER TABLE "SupportTickets" ADD COLUMN IF NOT EXISTS "SystemLogId" INT;
ALTER TABLE "SupportTickets" ADD COLUMN IF NOT EXISTS "OccurrenceCount" INT NOT NULL DEFAULT 1;
ALTER TABLE "SupportTickets" ADD COLUMN IF NOT EXISTS "LastOccurredAt" TIMESTAMPTZ;
ALTER TABLE "SupportTickets" ADD COLUMN IF NOT EXISTS "IncidentType" VARCHAR(50);
ALTER TABLE "SupportTickets" ADD COLUMN IF NOT EXISTS "Module" VARCHAR(100);

CREATE INDEX IF NOT EXISTS "IX_SupportTickets_ErrorFingerprint"
    ON "SupportTickets" ("ErrorFingerprint")
    WHERE "ErrorFingerprint" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "IX_SupportTickets_Source"
    ON "SupportTickets" ("Source");
