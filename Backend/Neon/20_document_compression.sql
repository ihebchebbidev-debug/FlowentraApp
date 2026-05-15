-- Migration: Add document compression support
-- Date: February 7, 2026
-- Description: Add compression-related columns to Documents table for storing compression metadata

-- Add compression columns to Documents table
ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS "OriginalFileSize" bigint NULL;
ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS "IsCompressed" boolean NOT NULL DEFAULT false;
ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS "CompressionRatio" numeric(5,2) NULL;
ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS "CompressionMethod" character varying(50) NOT NULL DEFAULT 'none';

-- Create index for compressed files lookup
CREATE INDEX IF NOT EXISTS "IX_Documents_IsCompressed" ON "Documents" ("IsCompressed");

-- Create index for compression method
CREATE INDEX IF NOT EXISTS "IX_Documents_CompressionMethod" ON "Documents" ("CompressionMethod");

-- Add comment to document compression columns
COMMENT ON COLUMN "Documents"."OriginalFileSize" IS 'Original file size before compression (bytes)';
COMMENT ON COLUMN "Documents"."IsCompressed" IS 'Whether the file is compressed on disk (gzip)';
COMMENT ON COLUMN "Documents"."CompressionRatio" IS 'Compression ratio percentage: (OriginalSize - CompressedSize) / OriginalSize * 100';
COMMENT ON COLUMN "Documents"."CompressionMethod" IS 'Compression method used (gzip, deflate, none)';

-- Migration info log
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260207000000_AddDocumentCompression', '8.0.0')
ON CONFLICT DO NOTHING;
