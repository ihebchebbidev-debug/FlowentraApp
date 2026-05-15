-- =====================================================
-- Article Notes Table for Neon PostgreSQL
-- Run this SQL in your Neon database console
-- =====================================================

-- Article Notes Table
CREATE TABLE IF NOT EXISTS "ArticleNotes" (
    "Id" SERIAL PRIMARY KEY,
    "ArticleId" INTEGER NOT NULL,
    "Note" TEXT NOT NULL,
    "CreatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(100) NOT NULL,
    CONSTRAINT "FK_ArticleNotes_Articles" FOREIGN KEY ("ArticleId") 
        REFERENCES "Articles"("Id") ON DELETE CASCADE
);

-- Create index for faster lookups by ArticleId
CREATE INDEX IF NOT EXISTS "idx_article_notes_article_id" ON "ArticleNotes"("ArticleId");

-- Create index for sorting by creation date
CREATE INDEX IF NOT EXISTS "idx_article_notes_created_date" ON "ArticleNotes"("CreatedDate" DESC);

-- =====================================================
-- Alternative: If your Articles table uses lowercase column names
-- Uncomment and use this version instead:
-- =====================================================

-- CREATE TABLE IF NOT EXISTS "article_notes" (
--     "id" SERIAL PRIMARY KEY,
--     "article_id" INTEGER NOT NULL,
--     "note" TEXT NOT NULL,
--     "created_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "created_by" VARCHAR(100) NOT NULL,
--     CONSTRAINT "fk_article_notes_articles" FOREIGN KEY ("article_id") 
--         REFERENCES "articles"("id") ON DELETE CASCADE
-- );
-- 
-- CREATE INDEX IF NOT EXISTS "idx_article_notes_article_id" ON "article_notes"("article_id");
-- CREATE INDEX IF NOT EXISTS "idx_article_notes_created_date" ON "article_notes"("created_date" DESC);

-- =====================================================
-- Sample data (optional - for testing)
-- =====================================================

-- INSERT INTO "ArticleNotes" ("ArticleId", "Note", "CreatedBy") 
-- VALUES 
--     (1, 'This article requires special handling during shipping.', '1'),
--     (1, 'Updated minimum stock level based on Q4 sales forecast.', '1'),
--     (2, 'Supplier confirmed new pricing effective next month.', '1');
