-- =====================================================
-- SQL Migration Script: Task Time Tracking Feature
-- =====================================================
-- This script creates the TaskTimeEntries table for tracking
-- time spent on both Project Tasks and Daily Tasks
-- 
-- Execute this script on your SQL Server database
-- =====================================================

-- Create the TaskTimeEntries table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TaskTimeEntries]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TaskTimeEntries] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        
        -- Foreign keys (one of these should be set)
        [ProjectTaskId] INT NULL,
        [DailyTaskId] INT NULL,
        
        -- User who logged the time
        [UserId] INT NOT NULL,
        [UserName] NVARCHAR(100) NULL,
        
        -- Time tracking fields
        [StartTime] DATETIME2 NOT NULL,
        [EndTime] DATETIME2 NULL,
        [Duration] DECIMAL(18,2) NOT NULL DEFAULT 0, -- Duration in minutes
        
        -- Description/Notes
        [Description] NVARCHAR(MAX) NULL,
        
        -- Billing fields
        [IsBillable] BIT NOT NULL DEFAULT 1,
        [HourlyRate] DECIMAL(18,2) NULL,
        [TotalCost] DECIMAL(18,2) NULL,
        
        -- Work type classification
        [WorkType] NVARCHAR(50) NOT NULL DEFAULT 'work',
        
        -- Approval workflow
        [ApprovalStatus] NVARCHAR(20) NOT NULL DEFAULT 'pending',
        [ApprovedById] INT NULL,
        [ApprovedDate] DATETIME2 NULL,
        [ApprovalNotes] NVARCHAR(MAX) NULL,
        
        -- Audit fields
        [CreatedDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [CreatedBy] NVARCHAR(100) NOT NULL,
        [ModifiedDate] DATETIME2 NULL,
        [ModifiedBy] NVARCHAR(100) NULL,
        
        -- Constraints
        CONSTRAINT [FK_TaskTimeEntries_ProjectTasks] FOREIGN KEY ([ProjectTaskId]) 
            REFERENCES [dbo].[ProjectTasks]([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_TaskTimeEntries_DailyTasks] FOREIGN KEY ([DailyTaskId]) 
            REFERENCES [dbo].[DailyTasks]([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_TaskTimeEntries_Users] FOREIGN KEY ([UserId]) 
            REFERENCES [dbo].[MainAdminUsers]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TaskTimeEntries_ApprovedBy] FOREIGN KEY ([ApprovedById]) 
            REFERENCES [dbo].[MainAdminUsers]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [CK_TaskTimeEntries_TaskReference] CHECK (
            ([ProjectTaskId] IS NOT NULL AND [DailyTaskId] IS NULL) OR 
            ([ProjectTaskId] IS NULL AND [DailyTaskId] IS NOT NULL) OR
            ([ProjectTaskId] IS NULL AND [DailyTaskId] IS NULL) -- For timers not yet linked
        ),
        CONSTRAINT [CK_TaskTimeEntries_WorkType] CHECK (
            [WorkType] IN ('work', 'break', 'meeting', 'review', 'travel', 'other')
        ),
        CONSTRAINT [CK_TaskTimeEntries_ApprovalStatus] CHECK (
            [ApprovalStatus] IN ('pending', 'approved', 'rejected')
        )
    );
    
    PRINT 'Table TaskTimeEntries created successfully.';
END
ELSE
BEGIN
    PRINT 'Table TaskTimeEntries already exists.';
END
GO

-- Create indexes for better query performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaskTimeEntries_ProjectTaskId' AND object_id = OBJECT_ID('TaskTimeEntries'))
BEGIN
    CREATE INDEX [IX_TaskTimeEntries_ProjectTaskId] ON [dbo].[TaskTimeEntries]([ProjectTaskId]);
    PRINT 'Index IX_TaskTimeEntries_ProjectTaskId created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaskTimeEntries_DailyTaskId' AND object_id = OBJECT_ID('TaskTimeEntries'))
BEGIN
    CREATE INDEX [IX_TaskTimeEntries_DailyTaskId] ON [dbo].[TaskTimeEntries]([DailyTaskId]);
    PRINT 'Index IX_TaskTimeEntries_DailyTaskId created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaskTimeEntries_UserId' AND object_id = OBJECT_ID('TaskTimeEntries'))
BEGIN
    CREATE INDEX [IX_TaskTimeEntries_UserId] ON [dbo].[TaskTimeEntries]([UserId]);
    PRINT 'Index IX_TaskTimeEntries_UserId created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaskTimeEntries_StartTime' AND object_id = OBJECT_ID('TaskTimeEntries'))
BEGIN
    CREATE INDEX [IX_TaskTimeEntries_StartTime] ON [dbo].[TaskTimeEntries]([StartTime]);
    PRINT 'Index IX_TaskTimeEntries_StartTime created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaskTimeEntries_ApprovalStatus' AND object_id = OBJECT_ID('TaskTimeEntries'))
BEGIN
    CREATE INDEX [IX_TaskTimeEntries_ApprovalStatus] ON [dbo].[TaskTimeEntries]([ApprovalStatus]);
    PRINT 'Index IX_TaskTimeEntries_ApprovalStatus created.';
END
GO

-- Add EstimatedHours column to ProjectTasks if it doesn't exist (for time tracking comparison)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProjectTasks]') AND name = 'EstimatedHours')
BEGIN
    ALTER TABLE [dbo].[ProjectTasks]
    ADD [EstimatedHours] DECIMAL(18,2) NULL;
    PRINT 'Column EstimatedHours added to ProjectTasks table.';
END
GO

-- Add EstimatedHours column to DailyTasks if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DailyTasks]') AND name = 'EstimatedHours')
BEGIN
    ALTER TABLE [dbo].[DailyTasks]
    ADD [EstimatedHours] DECIMAL(18,2) NULL;
    PRINT 'Column EstimatedHours added to DailyTasks table.';
END
GO

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the table was created correctly:
-- SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TaskTimeEntries';
-- =====================================================

PRINT '=================================================';
PRINT 'Task Time Tracking migration completed successfully!';
PRINT '=================================================';
