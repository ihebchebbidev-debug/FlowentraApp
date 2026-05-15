-- =====================================================
-- Migration: Create SystemLogs Table for Application Logging
-- Date: 2024-12-03
-- Description: Persistent system logs with 7-day retention
--              Tracks all CRUD operations, auth events, and errors
-- =====================================================

-- Create SystemLogs table
CREATE TABLE IF NOT EXISTS "SystemLogs" (
    "Id" SERIAL PRIMARY KEY,
    "Timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "Level" VARCHAR(20) NOT NULL CHECK ("Level" IN ('info', 'warning', 'error', 'success')),
    "Message" TEXT NOT NULL,
    "Module" VARCHAR(100) NOT NULL,
    "Action" VARCHAR(50) NOT NULL DEFAULT 'other' CHECK ("Action" IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'other')),
    "UserId" VARCHAR(100),
    "UserName" VARCHAR(200),
    "EntityType" VARCHAR(100),
    "EntityId" VARCHAR(100),
    "Details" TEXT,
    "IpAddress" VARCHAR(45),
    "UserAgent" TEXT,
    "Metadata" JSONB
);

-- =====================================================
-- Create indexes for efficient querying
-- =====================================================

-- Primary timestamp index (descending for recent logs first)
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Timestamp" ON "SystemLogs" ("Timestamp" DESC);

-- Filter indexes
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Level" ON "SystemLogs" ("Level");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Module" ON "SystemLogs" ("Module");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_UserId" ON "SystemLogs" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Action" ON "SystemLogs" ("Action");

-- Composite index for entity lookups
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_EntityType_EntityId" ON "SystemLogs" ("EntityType", "EntityId");

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Level_Module_Timestamp" ON "SystemLogs" ("Level", "Module", "Timestamp" DESC);

-- =====================================================
-- Cleanup function for 7-day retention
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_system_logs(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "SystemLogs" WHERE "Timestamp" < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup action
    INSERT INTO "SystemLogs" ("Timestamp", "Level", "Message", "Module", "Action")
    VALUES (NOW(), 'info', 'System logs cleanup: Deleted ' || deleted_count || ' logs older than ' || days_to_keep || ' days', 'SystemLogs', 'delete');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Optional: Enable pg_cron for automatic daily cleanup
-- Run these commands if pg_cron extension is available:
-- =====================================================

-- Enable pg_cron extension (requires superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 3:00 AM UTC
-- SELECT cron.schedule('cleanup-system-logs', '0 3 * * *', 'SELECT cleanup_old_system_logs(7)');

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule:
-- SELECT cron.unschedule('cleanup-system-logs');

-- =====================================================
-- Verify table creation
-- =====================================================

SELECT 'SystemLogs table created successfully' AS status;

SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns 
WHERE table_name = 'SystemLogs'
ORDER BY ordinal_position;

-- =====================================================
-- Insert initial log entry to verify everything works
-- =====================================================

INSERT INTO "SystemLogs" ("Timestamp", "Level", "Message", "Module", "Action")
VALUES (NOW(), 'info', 'SystemLogs table initialized successfully', 'System', 'create');

-- Show the initial entry
SELECT * FROM "SystemLogs" ORDER BY "Timestamp" DESC LIMIT 1;
