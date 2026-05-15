-- =====================================================
-- Projects Module Tables
-- =====================================================

-- Projects Table
CREATE TABLE IF NOT EXISTS "Projects" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Description" VARCHAR(1000),
    "ContactId" INTEGER,
    "OwnerId" INTEGER NOT NULL,
    "OwnerName" VARCHAR(255) NOT NULL,
    "TeamMembers" VARCHAR(1000),
    "Budget" DECIMAL(18,2),
    "Currency" VARCHAR(3),
    "Status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "Type" VARCHAR(50) NOT NULL DEFAULT 'service',
    "Priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "Progress" INTEGER NOT NULL DEFAULT 0,
    "StartDate" TIMESTAMP,
    "EndDate" TIMESTAMP,
    "ActualStartDate" TIMESTAMP,
    "ActualEndDate" TIMESTAMP,
    "Tags" VARCHAR(1000),
    "IsArchived" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "ModifiedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE SET NULL
);

-- Project Columns Table
CREATE TABLE IF NOT EXISTS "ProjectColumns" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectId" INTEGER NOT NULL,
    "Title" VARCHAR(255) NOT NULL,
    "Color" VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    "Position" INTEGER NOT NULL,
    "IsDefault" BOOLEAN NOT NULL DEFAULT FALSE,
    "TaskLimit" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE
);

-- Project Tasks Table
CREATE TABLE IF NOT EXISTS "ProjectTasks" (
    "Id" SERIAL PRIMARY KEY,
    "Title" VARCHAR(255) NOT NULL,
    "Description" VARCHAR(2000),
    "ProjectId" INTEGER NOT NULL,
    "ContactId" INTEGER,
    "AssigneeId" INTEGER,
    "AssigneeName" VARCHAR(255),
    "Status" VARCHAR(50) NOT NULL DEFAULT 'todo',
    "Priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "ColumnId" INTEGER NOT NULL,
    "Position" INTEGER NOT NULL,
    "ParentTaskId" INTEGER,
    "DueDate" TIMESTAMP,
    "StartDate" TIMESTAMP,
    "EstimatedHours" DECIMAL(18,2),
    "ActualHours" DECIMAL(18,2),
    "Tags" VARCHAR(1000),
    "Attachments" VARCHAR(2000),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CompletedAt" TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "ModifiedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("ColumnId") REFERENCES "ProjectColumns"("Id") ON DELETE RESTRICT,
    FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE SET NULL,
    FOREIGN KEY ("ParentTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE SET NULL
);

-- Daily Tasks Table
CREATE TABLE IF NOT EXISTS "DailyTasks" (
    "Id" SERIAL PRIMARY KEY,
    "Title" VARCHAR(255) NOT NULL,
    "Description" VARCHAR(2000),
    "UserId" INTEGER NOT NULL,
    "UserName" VARCHAR(255) NOT NULL,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'todo',
    "Priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "Position" INTEGER NOT NULL,
    "DueDate" TIMESTAMP,
    "EstimatedHours" DECIMAL(18,2),
    "ActualHours" DECIMAL(18,2),
    "Tags" VARCHAR(1000),
    "Attachments" VARCHAR(2000),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CompletedAt" TIMESTAMP,
    "CreatedBy" VARCHAR(255),
    "ModifiedBy" VARCHAR(255),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Task Comments Table
CREATE TABLE IF NOT EXISTS "TaskComments" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectTaskId" INTEGER,
    "DailyTaskId" INTEGER,
    "Content" VARCHAR(2000) NOT NULL,
    "AuthorId" INTEGER NOT NULL,
    "AuthorName" VARCHAR(255) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY ("ProjectTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("DailyTaskId") REFERENCES "DailyTasks"("Id") ON DELETE CASCADE
);

-- Task Attachments Table
CREATE TABLE IF NOT EXISTS "TaskAttachments" (
    "Id" SERIAL PRIMARY KEY,
    "ProjectTaskId" INTEGER,
    "DailyTaskId" INTEGER,
    "FileName" VARCHAR(255) NOT NULL,
    "OriginalFileName" VARCHAR(255) NOT NULL,
    "FileUrl" VARCHAR(500) NOT NULL,
    "MimeType" VARCHAR(100),
    "FileSize" BIGINT NOT NULL,
    "UploadedBy" INTEGER NOT NULL,
    "UploadedByName" VARCHAR(255) NOT NULL,
    "UploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Caption" VARCHAR(500),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY ("ProjectTaskId") REFERENCES "ProjectTasks"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("DailyTaskId") REFERENCES "DailyTasks"("Id") ON DELETE CASCADE
);

-- Indexes for Projects
CREATE INDEX IF NOT EXISTS "idx_projects_contact" ON "Projects"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "Projects"("Status");
CREATE INDEX IF NOT EXISTS "idx_projectcolumns_project" ON "ProjectColumns"("ProjectId");
CREATE INDEX IF NOT EXISTS "idx_projecttasks_project" ON "ProjectTasks"("ProjectId");
CREATE INDEX IF NOT EXISTS "idx_projecttasks_column" ON "ProjectTasks"("ColumnId");
CREATE INDEX IF NOT EXISTS "idx_projecttasks_contact" ON "ProjectTasks"("ContactId");
CREATE INDEX IF NOT EXISTS "idx_dailytasks_user" ON "DailyTasks"("UserId");
CREATE INDEX IF NOT EXISTS "idx_taskcomments_projecttask" ON "TaskComments"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "idx_taskcomments_dailytask" ON "TaskComments"("DailyTaskId");
