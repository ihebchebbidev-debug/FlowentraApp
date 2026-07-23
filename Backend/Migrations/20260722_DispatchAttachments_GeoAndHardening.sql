-- Dispatch attachments: geotag columns for mobile-captured photos, and index for
-- lookup by dispatch. Previous upload path silently discarded lat/long because
-- the columns did not exist.
ALTER TABLE "Attachments"
    ADD COLUMN IF NOT EXISTS "Latitude"  DOUBLE PRECISION NULL,
    ADD COLUMN IF NOT EXISTS "Longitude" DOUBLE PRECISION NULL;

CREATE INDEX IF NOT EXISTS "IX_Attachments_Dispatch"
    ON "Attachments" ("TenantId", "DispatchId");
