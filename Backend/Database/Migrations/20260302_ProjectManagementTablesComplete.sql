-- =====================================================
-- Combined Migration: ProjectNotes & ProjectActivity
-- Date: March 2, 2026
-- Run this on each Neon tenant database
-- =====================================================

-- =====================================================
-- Project Notes table for project-level notes
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

CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_ProjectId" ON "ProjectNotes" ("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_CreatedDate" ON "ProjectNotes" ("CreatedDate" DESC);
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_CreatedBy" ON "ProjectNotes" ("CreatedBy");

-- =====================================================
-- Project Activity table for activity timeline
-- =====================================================

CREATE TABLE IF NOT EXISTS "ProjectActivities" (
    "Id"                    SERIAL PRIMARY KEY,
    "ProjectId"             INT             NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "ActionType"            VARCHAR(50)     NOT NULL,
    "Description"           VARCHAR(500)    NOT NULL,
    "Details"               VARCHAR(1000)   NULL,
    "CreatedDate"           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "CreatedBy"             VARCHAR(255)    NOT NULL,
    "RelatedEntityId"       INT             NULL,
    "RelatedEntityType"     VARCHAR(100)    NULL
);

CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_ProjectId" ON "ProjectActivities" ("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_CreatedDate" ON "ProjectActivities" ("CreatedDate" DESC);
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_ActionType" ON "ProjectActivities" ("ActionType");
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_CreatedBy" ON "ProjectActivities" ("CreatedBy");
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_ProjectId_CreatedDate" ON "ProjectActivities" ("ProjectId", "CreatedDate" DESC);

-- =====================================================
-- Migration complete
-- =====================================================
