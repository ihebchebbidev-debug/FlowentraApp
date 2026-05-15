-- Migration: Add ExternalUrl and ResourceType to Documents table
-- Run this against the Neon/Postgres database

ALTER TABLE "Documents"
ADD COLUMN IF NOT EXISTS "ExternalUrl" varchar(2000);

ALTER TABLE "Documents"
ADD COLUMN IF NOT EXISTS "ResourceType" varchar(50);

-- Optional: backfill ResourceType based on existing FilePath values that look like URLs
UPDATE "Documents"
SET "ResourceType" = CASE
  WHEN "FilePath" IS NOT NULL AND ("FilePath" LIKE 'http%' OR "FilePath" LIKE 'https%') THEN 'link'
  ELSE 'file'
END
WHERE "ResourceType" IS NULL;

-- Optional: move URL-like FilePath values into ExternalUrl (careful: backup first)
-- Uncomment to run if you want to migrate existing URL entries to ExternalUrl
-- UPDATE "Documents"
-- SET "ExternalUrl" = "FilePath", "FilePath" = ''
-- WHERE "FilePath" IS NOT NULL AND ("FilePath" LIKE 'http%' OR "FilePath" LIKE 'https%');
