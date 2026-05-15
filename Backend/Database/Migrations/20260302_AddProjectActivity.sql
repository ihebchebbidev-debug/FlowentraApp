-- =====================================================
-- Project Activity table for activity timeline
-- Run this migration on each tenant database
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_ProjectId" ON "ProjectActivities" ("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_CreatedDate" ON "ProjectActivities" ("CreatedDate" DESC);
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_ActionType" ON "ProjectActivities" ("ActionType");
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_CreatedBy" ON "ProjectActivities" ("CreatedBy");
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_ProjectId_CreatedDate" ON "ProjectActivities" ("ProjectId", "CreatedDate" DESC);

-- Add comment
COMMENT ON TABLE "ProjectActivities" IS 'Stores project activity timeline for audit and tracking';
COMMENT ON COLUMN "ProjectActivities"."ActionType" IS 'Action type: created, updated, task_added, task_completed, member_added, member_removed, status_changed, document_uploaded, note_added';
COMMENT ON COLUMN "ProjectActivities"."RelatedEntityType" IS 'Type of related entity: Task, Note, Document, TeamMember, etc.';
