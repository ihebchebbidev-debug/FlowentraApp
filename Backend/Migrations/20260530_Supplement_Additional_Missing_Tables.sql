-- =====================================================================
-- Supplement: Additional Missing Tables (idempotent — safe to re-run)
-- Date: 2026-05-30
-- Covers tables not included in 20260530_Comprehensive_Missing_Tables.sql
-- Run AFTER the Comprehensive migration.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 1: Planning — technician_status_history
--   snake_case pattern: id (lowercase), "TenantId" (quoted PascalCase)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS technician_status_history (
    id             SERIAL      PRIMARY KEY,
    "TenantId"     INTEGER     NOT NULL DEFAULT 0,
    technician_id  INTEGER     NOT NULL,
    status         VARCHAR(50) NOT NULL,
    changed_from   VARCHAR(50),
    changed_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    changed_by     INTEGER,
    reason         TEXT,
    metadata       JSONB
);
CREATE INDEX IF NOT EXISTS "IX_technician_status_history_tech"
    ON technician_status_history (technician_id);
CREATE INDEX IF NOT EXISTS "IX_technician_status_history_TenantId"
    ON technician_status_history ("TenantId");

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 2: Projects — remaining tables
--   PascalCase: no [Table] annotation → EF uses class name as table name
-- ─────────────────────────────────────────────────────────────────────

-- TaskComments — FK → ProjectTasks
CREATE TABLE IF NOT EXISTS "TaskComments" (
    "Id"          SERIAL       PRIMARY KEY,
    "TenantId"    INTEGER      NOT NULL DEFAULT 0,
    "TaskId"      INTEGER      NOT NULL,
    "Comment"     TEXT         NOT NULL,
    "CreatedDate" TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CreatedBy"   VARCHAR(100) NOT NULL,
    CONSTRAINT "FK_TaskComments_ProjectTasks"
        FOREIGN KEY ("TaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_TaskComments_TaskId"   ON "TaskComments"("TaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskComments_TenantId" ON "TaskComments"("TenantId");

-- ProjectNotes — FK → Projects
CREATE TABLE IF NOT EXISTS "ProjectNotes" (
    "Id"           SERIAL        PRIMARY KEY,
    "TenantId"     INTEGER       NOT NULL DEFAULT 0,
    "ProjectId"    INTEGER       NOT NULL,
    "Content"      VARCHAR(5000) NOT NULL,
    "CreatedDate"  TIMESTAMP     NOT NULL DEFAULT NOW(),
    "CreatedBy"    VARCHAR(255)  NOT NULL,
    "ModifiedDate" TIMESTAMP,
    "ModifiedBy"   VARCHAR(255),
    CONSTRAINT "FK_ProjectNotes_Projects"
        FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_ProjectId" ON "ProjectNotes"("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_TenantId"  ON "ProjectNotes"("TenantId");

-- ProjectActivities — FK → Projects
CREATE TABLE IF NOT EXISTS "ProjectActivities" (
    "Id"                SERIAL        PRIMARY KEY,
    "TenantId"          INTEGER       NOT NULL DEFAULT 0,
    "ProjectId"         INTEGER       NOT NULL,
    "ActionType"        VARCHAR(50)   NOT NULL,
    "Description"       VARCHAR(500)  NOT NULL,
    "Details"           VARCHAR(1000),
    "CreatedDate"       TIMESTAMP     NOT NULL DEFAULT NOW(),
    "CreatedBy"         VARCHAR(255)  NOT NULL,
    "RelatedEntityId"   INTEGER,
    "RelatedEntityType" VARCHAR(100),
    CONSTRAINT "FK_ProjectActivities_Projects"
        FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_ProjectId" ON "ProjectActivities"("ProjectId");
CREATE INDEX IF NOT EXISTS "IX_ProjectActivities_TenantId"  ON "ProjectActivities"("TenantId");

-- ProjectSettings — global per-tenant config, no FK to Projects
CREATE TABLE IF NOT EXISTS "ProjectSettings" (
    "Id"           SERIAL   PRIMARY KEY,
    "TenantId"     INTEGER  NOT NULL DEFAULT 0,
    "SettingsJson" TEXT     NOT NULL DEFAULT '{}',
    "UpdatedAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedBy"    VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_ProjectSettings_TenantId" ON "ProjectSettings"("TenantId");

-- RecurringTasks — template records
CREATE TABLE IF NOT EXISTS "RecurringTasks" (
    "Id"                SERIAL       PRIMARY KEY,
    "TenantId"          INTEGER      NOT NULL DEFAULT 0,
    "ProjectTaskId"     INTEGER,
    "DailyTaskId"       INTEGER,
    "RecurrenceType"    VARCHAR(50)  NOT NULL DEFAULT 'daily',
    "DaysOfWeek"        VARCHAR(50),
    "DayOfMonth"        INTEGER,
    "MonthOfYear"       INTEGER,
    "Interval"          INTEGER      NOT NULL DEFAULT 1,
    "StartDate"         TIMESTAMP    NOT NULL,
    "EndDate"           TIMESTAMP,
    "MaxOccurrences"    INTEGER,
    "OccurrenceCount"   INTEGER      NOT NULL DEFAULT 0,
    "NextOccurrence"    TIMESTAMP,
    "LastGeneratedDate" TIMESTAMP,
    "IsActive"          BOOLEAN      NOT NULL DEFAULT TRUE,
    "IsPaused"          BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedDate"       TIMESTAMP    NOT NULL DEFAULT NOW(),
    "CreatedBy"         VARCHAR(100) NOT NULL DEFAULT '',
    "ModifiedDate"      TIMESTAMP,
    "ModifiedBy"        VARCHAR(100),
    CONSTRAINT "FK_RecurringTasks_ProjectTasks"
        FOREIGN KEY ("ProjectTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_RecurringTasks_DailyTasks"
        FOREIGN KEY ("DailyTaskId") REFERENCES "DailyTasks"("Id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "IX_RecurringTasks_TenantId"      ON "RecurringTasks"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_RecurringTasks_ProjectTaskId" ON "RecurringTasks"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "IX_RecurringTasks_DailyTaskId"   ON "RecurringTasks"("DailyTaskId");
CREATE INDEX IF NOT EXISTS "IX_RecurringTasks_NextOccurrence" ON "RecurringTasks"("NextOccurrence")
    WHERE "IsActive" = TRUE AND "IsPaused" = FALSE;

-- RecurringTaskLogs — audit trail of generated tasks
CREATE TABLE IF NOT EXISTS "RecurringTaskLogs" (
    "Id"                     SERIAL       PRIMARY KEY,
    "TenantId"               INTEGER      NOT NULL DEFAULT 0,
    "RecurringTaskId"        INTEGER      NOT NULL,
    "GeneratedProjectTaskId" INTEGER,
    "GeneratedDailyTaskId"   INTEGER,
    "GeneratedDate"          TIMESTAMP    NOT NULL DEFAULT NOW(),
    "ScheduledFor"           TIMESTAMP    NOT NULL,
    "Status"                 VARCHAR(20)  NOT NULL DEFAULT 'created',
    "Notes"                  VARCHAR(500),
    CONSTRAINT "FK_RecurringTaskLogs_RecurringTasks"
        FOREIGN KEY ("RecurringTaskId") REFERENCES "RecurringTasks"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_RecurringTaskLogs_RecurringTaskId"
    ON "RecurringTaskLogs"("RecurringTaskId");
CREATE INDEX IF NOT EXISTS "IX_RecurringTaskLogs_TenantId"
    ON "RecurringTaskLogs"("TenantId");

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 3: Shared — EntityFormDocuments
--   Extends BaseEntityWithSoftDelete (Id, CreatedAt, UpdatedAt,
--   CreatedBy, ModifiedBy, IsDeleted, DeletedAt, DeletedBy)
--   FK → DynamicForms (created below if not yet existing)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DynamicForms" (
    "Id"               SERIAL        PRIMARY KEY,
    "TenantId"         INTEGER       NOT NULL DEFAULT 0,
    "NameEn"           VARCHAR(200)  NOT NULL,
    "NameFr"           VARCHAR(200)  NOT NULL,
    "DescriptionEn"    VARCHAR(1000),
    "DescriptionFr"    VARCHAR(1000),
    "Status"           INTEGER       NOT NULL DEFAULT 0,
    "Version"          INTEGER       NOT NULL DEFAULT 1,
    "Category"         VARCHAR(100),
    "IsPublic"         BOOLEAN       NOT NULL DEFAULT FALSE,
    "PublicSlug"       VARCHAR(200),
    "Fields"           JSONB         NOT NULL DEFAULT '[]',
    "ThankYouSettings" JSONB,
    "CreatedUser"      VARCHAR(100),
    "ModifyUser"       VARCHAR(100),
    "CreatedAt"        TIMESTAMP     NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMP,
    "CreatedBy"        VARCHAR(100),
    "ModifiedBy"       VARCHAR(100),
    "IsDeleted"        BOOLEAN       NOT NULL DEFAULT FALSE,
    "DeletedAt"        TIMESTAMP,
    "DeletedBy"        VARCHAR(100),
    "IsActive"         BOOLEAN       NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS "IX_DynamicForms_TenantId"   ON "DynamicForms"("TenantId")
    WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_DynamicForms_PublicSlug" ON "DynamicForms"("PublicSlug")
    WHERE "IsPublic" = TRUE AND "IsDeleted" = FALSE;

CREATE TABLE IF NOT EXISTS "DynamicFormResponses" (
    "Id"                 SERIAL        PRIMARY KEY,
    "TenantId"           INTEGER       NOT NULL DEFAULT 0,
    "FormId"             INTEGER       NOT NULL,
    "FormVersion"        INTEGER       NOT NULL DEFAULT 1,
    "EntityType"         VARCHAR(50),
    "EntityId"           VARCHAR(100),
    "Responses"          JSONB         NOT NULL DEFAULT '{}',
    "Notes"              VARCHAR(2000),
    "SubmitterName"      VARCHAR(200),
    "SubmitterEmail"     VARCHAR(200),
    "IsPublicSubmission" BOOLEAN       NOT NULL DEFAULT FALSE,
    "SubmittedBy"        VARCHAR(100)  NOT NULL DEFAULT '',
    "SubmittedAt"        TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_DynamicFormResponses_DynamicForms"
        FOREIGN KEY ("FormId") REFERENCES "DynamicForms"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_DynamicFormResponses_FormId"   ON "DynamicFormResponses"("FormId");
CREATE INDEX IF NOT EXISTS "IX_DynamicFormResponses_TenantId" ON "DynamicFormResponses"("TenantId");

CREATE TABLE IF NOT EXISTS "EntityFormDocuments" (
    "Id"          SERIAL       PRIMARY KEY,
    "TenantId"    INTEGER      NOT NULL DEFAULT 0,
    "EntityType"  VARCHAR(50)  NOT NULL,
    "EntityId"    INTEGER      NOT NULL,
    "FormId"      INTEGER      NOT NULL,
    "FormVersion" INTEGER      NOT NULL DEFAULT 1,
    "Title"       VARCHAR(200),
    "Status"      INTEGER      NOT NULL DEFAULT 0,
    "Responses"   JSONB        NOT NULL DEFAULT '{}',
    "CreatedAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP,
    "CreatedBy"   VARCHAR(100),
    "ModifiedBy"  VARCHAR(100),
    "IsDeleted"   BOOLEAN      NOT NULL DEFAULT FALSE,
    "DeletedAt"   TIMESTAMP,
    "DeletedBy"   VARCHAR(100),
    CONSTRAINT "FK_EntityFormDocuments_DynamicForms"
        FOREIGN KEY ("FormId") REFERENCES "DynamicForms"("Id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "IX_EntityFormDocuments_TenantId"
    ON "EntityFormDocuments"("TenantId") WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_EntityFormDocuments_Entity"
    ON "EntityFormDocuments"("TenantId", "EntityType", "EntityId")
    WHERE "IsDeleted" = FALSE;
CREATE INDEX IF NOT EXISTS "IX_EntityFormDocuments_FormId"
    ON "EntityFormDocuments"("FormId");

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 4: Shared — SystemLogs
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SystemLogs" (
    "Id"          SERIAL        PRIMARY KEY,
    "TenantId"    INTEGER       NOT NULL DEFAULT 0,
    "Timestamp"   TIMESTAMP     NOT NULL DEFAULT NOW(),
    "Level"       VARCHAR(20)   NOT NULL DEFAULT 'info',
    "Message"     TEXT          NOT NULL,
    "Module"      VARCHAR(100)  NOT NULL,
    "Action"      VARCHAR(50)   NOT NULL DEFAULT 'other',
    "UserId"      VARCHAR(100),
    "UserName"    VARCHAR(200),
    "EntityType"  VARCHAR(100),
    "EntityId"    VARCHAR(100),
    "Details"     TEXT,
    "IpAddress"   VARCHAR(45),
    "UserAgent"   TEXT,
    "Metadata"    JSONB
);
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_TenantId"   ON "SystemLogs"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Timestamp"  ON "SystemLogs"("Timestamp" DESC);
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Level"      ON "SystemLogs"("Level");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Module"     ON "SystemLogs"("Module");
