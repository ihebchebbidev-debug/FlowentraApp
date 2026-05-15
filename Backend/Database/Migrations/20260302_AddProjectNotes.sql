-- =====================================================
-- Project Notes table for project-level notes
-- Run this migration on each tenant database
-- =====================================================

CREATE TABLE IF NOT EXISTS "ProjectNotes" (
    "Id"            SERIAL PRIMARY KEY,
    "ProjectId"     INT             NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "Content"       TEXT            NOT NULL,
    "CreatedDate"   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "CreatedBy"     VARCHAR(255)    NOT NULL,
    "ModifiedDate"  TIMESTAMPTZ     NULL,
    "ModifiedBy"    VARCHAR(255)    NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_ProjectId" ON "ProjectNotes" ("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_CreatedDate" ON "ProjectNotes" ("CreatedDate" DESC);
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_CreatedBy" ON "ProjectNotes" ("CreatedBy");

-- Add comment
COMMENT ON TABLE "ProjectNotes" IS 'Stores project-level notes and comments for collaboration';
COMMENT ON COLUMN "ProjectNotes"."Content" IS 'Note content (up to 5000 characters)';
