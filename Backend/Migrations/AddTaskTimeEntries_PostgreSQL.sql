-- =====================================================
-- PostgreSQL Migration Script: Task Time Tracking Feature
-- For Neon PostgreSQL Database
-- =====================================================

-- Create the TaskTimeEntries table
CREATE TABLE IF NOT EXISTS "TaskTimeEntries" (
    "Id" SERIAL PRIMARY KEY,
    
    -- Foreign keys (one of these should be set)
    "ProjectTaskId" INTEGER NULL,
    "DailyTaskId" INTEGER NULL,
    
    -- User who logged the time
    "UserId" INTEGER NOT NULL,
    "UserName" VARCHAR(100) NULL,
    
    -- Time tracking fields
    "StartTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "EndTime" TIMESTAMP WITH TIME ZONE NULL,
    "Duration" DECIMAL(18,2) NOT NULL DEFAULT 0, -- Duration in minutes
    
    -- Description/Notes
    "Description" TEXT NULL,
    
    -- Billing fields
    "IsBillable" BOOLEAN NOT NULL DEFAULT TRUE,
    "HourlyRate" DECIMAL(18,2) NULL,
    "TotalCost" DECIMAL(18,2) NULL,
    
    -- Work type classification
    "WorkType" VARCHAR(50) NOT NULL DEFAULT 'work',
    
    -- Approval workflow
    "ApprovalStatus" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "ApprovedById" INTEGER NULL,
    "ApprovedDate" TIMESTAMP WITH TIME ZONE NULL,
    "ApprovalNotes" TEXT NULL,
    
    -- Audit fields
    "CreatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedBy" VARCHAR(100) NOT NULL,
    "ModifiedDate" TIMESTAMP WITH TIME ZONE NULL,
    "ModifiedBy" VARCHAR(100) NULL,
    
    -- Foreign key constraints
    CONSTRAINT "FK_TaskTimeEntries_ProjectTasks" FOREIGN KEY ("ProjectTaskId") 
        REFERENCES "ProjectTasks"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_TaskTimeEntries_DailyTasks" FOREIGN KEY ("DailyTaskId") 
        REFERENCES "DailyTasks"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_TaskTimeEntries_Users" FOREIGN KEY ("UserId") 
        REFERENCES "MainAdminUsers"("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_TaskTimeEntries_ApprovedBy" FOREIGN KEY ("ApprovedById") 
        REFERENCES "MainAdminUsers"("Id") ON DELETE NO ACTION,
    
    -- Check constraints
    CONSTRAINT "CK_TaskTimeEntries_TaskReference" CHECK (
        ("ProjectTaskId" IS NOT NULL AND "DailyTaskId" IS NULL) OR 
        ("ProjectTaskId" IS NULL AND "DailyTaskId" IS NOT NULL) OR
        ("ProjectTaskId" IS NULL AND "DailyTaskId" IS NULL)
    ),
    CONSTRAINT "CK_TaskTimeEntries_WorkType" CHECK (
        "WorkType" IN ('work', 'break', 'meeting', 'review', 'travel', 'other')
    ),
    CONSTRAINT "CK_TaskTimeEntries_ApprovalStatus" CHECK (
        "ApprovalStatus" IN ('pending', 'approved', 'rejected')
    )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_ProjectTaskId" ON "TaskTimeEntries"("ProjectTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_DailyTaskId" ON "TaskTimeEntries"("DailyTaskId");
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_UserId" ON "TaskTimeEntries"("UserId");
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_StartTime" ON "TaskTimeEntries"("StartTime");
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_ApprovalStatus" ON "TaskTimeEntries"("ApprovalStatus");
CREATE INDEX IF NOT EXISTS "IX_TaskTimeEntries_CreatedDate" ON "TaskTimeEntries"("CreatedDate");

-- Add EstimatedHours column to ProjectTasks if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ProjectTasks' AND column_name = 'EstimatedHours') THEN
        ALTER TABLE "ProjectTasks" ADD COLUMN "EstimatedHours" DECIMAL(18,2) NULL;
    END IF;
END $$;

-- Add EstimatedHours column to DailyTasks if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'DailyTasks' AND column_name = 'EstimatedHours') THEN
        ALTER TABLE "DailyTasks" ADD COLUMN "EstimatedHours" DECIMAL(18,2) NULL;
    END IF;
END $$;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the table was created correctly:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'TaskTimeEntries';
-- =====================================================
