-- Extend PlannedLineEntries to support kind='material' (article + quantity + unit price).
-- All new columns are nullable; existing 'time' and 'expense' rows are unaffected.
ALTER TABLE "PlannedLineEntries"
    ADD COLUMN IF NOT EXISTS "ArticleId"   INT           NULL,
    ADD COLUMN IF NOT EXISTS "ArticleName" VARCHAR(200)  NULL,
    ADD COLUMN IF NOT EXISTS "Quantity"    DECIMAL(18,3) NULL,
    ADD COLUMN IF NOT EXISTS "UnitPrice"   DECIMAL(18,2) NULL,
    ADD COLUMN IF NOT EXISTS "Unit"        VARCHAR(20)   NULL;