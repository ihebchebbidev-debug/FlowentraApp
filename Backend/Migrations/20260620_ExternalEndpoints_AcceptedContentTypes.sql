-- =====================================================================
-- Add the missing "AcceptedContentTypes" column to "ExternalEndpoints".
-- The EF model (ExternalEndpoint.cs) declares this property but the
-- live DB table was never migrated, causing 42703 errors on SELECT/INSERT:
--   column e.AcceptedContentTypes does not exist
-- Comma-separated accepted content types: "json","xml","form","any".
-- Idempotent & safe to run multiple times. PostgreSQL.
-- =====================================================================

ALTER TABLE "ExternalEndpoints"
    ADD COLUMN IF NOT EXISTS "AcceptedContentTypes" varchar(100) NOT NULL DEFAULT 'any';
