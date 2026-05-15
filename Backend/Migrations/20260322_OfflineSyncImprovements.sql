-- Migration: Add Offline Sync Tracking and Improvements
-- Date: 2026-03-22
-- Purpose: Improve offline sync reliability, error tracking, and diagnostics

-- ============================================
-- 1. Add SyncFailureLog table for better debugging
-- ============================================
CREATE TABLE IF NOT EXISTS public."SyncFailureLog" (
    "Id" SERIAL PRIMARY KEY,
    "DeviceId" VARCHAR(255) NOT NULL,
    "UserId" INT,
    "OpId" VARCHAR(255) NOT NULL,
    "EntityType" VARCHAR(100),
    "Status" VARCHAR(50),
    "ErrorMessage" TEXT,
    "HttpStatus" INT,
    "HttpBody" TEXT,
    "Endpoint" VARCHAR(500),
    "Method" VARCHAR(10),
    "Timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Resolved" BOOLEAN DEFAULT FALSE,
    "ResolvedAt" TIMESTAMP WITH TIME ZONE,
    "Tenant" VARCHAR(255)
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS "IX_SyncFailureLog_DeviceId_Timestamp" 
    ON public."SyncFailureLog"("DeviceId", "Timestamp" DESC);
CREATE INDEX IF NOT EXISTS "IX_SyncFailureLog_UserId_Timestamp" 
    ON public."SyncFailureLog"("UserId", "Timestamp" DESC);
CREATE INDEX IF NOT EXISTS "IX_SyncFailureLog_EntityType" 
    ON public."SyncFailureLog"("EntityType");
CREATE INDEX IF NOT EXISTS "IX_SyncFailureLog_Status" 
    ON public."SyncFailureLog"("Status");

-- ============================================
-- 2. Add SyncPerformanceLog table for monitoring
-- ============================================
CREATE TABLE IF NOT EXISTS public."SyncPerformanceLog" (
    "Id" SERIAL PRIMARY KEY,
    "DeviceId" VARCHAR(255) NOT NULL,
    "UserId" INT,
    "SyncDuration" BIGINT NOT NULL,  -- milliseconds
    "OperationsAttempted" INT NOT NULL,
    "OperationsSucceeded" INT NOT NULL,
    "OperationsFailed" INT NOT NULL,
    "BytesSent" BIGINT,
    "BytesReceived" BIGINT,
    "Timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Tenant" VARCHAR(255),
    "NetworkType" VARCHAR(50)  -- "4G", "5G", "WiFi", "Unknown"
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS "IX_SyncPerformanceLog_DeviceId_Timestamp" 
    ON public."SyncPerformanceLog"("DeviceId", "Timestamp" DESC);
CREATE INDEX IF NOT EXISTS "IX_SyncPerformanceLog_UserId_Timestamp" 
    ON public."SyncPerformanceLog"("UserId", "Timestamp" DESC);

-- ============================================
-- 3. Add TokenRefreshLog table for auth debugging
-- ============================================
CREATE TABLE IF NOT EXISTS public."TokenRefreshLog" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INT NOT NULL,
    "Reason" VARCHAR(100),  -- "sync_pre_check", "403_error", "expiry_detected", etc.
    "Success" BOOLEAN NOT NULL,
    "ErrorMessage" TEXT,
    "Timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Tenant" VARCHAR(255),
    "DeviceId" VARCHAR(255)
);

-- Create index for monitoring auth issues
CREATE INDEX IF NOT EXISTS "IX_TokenRefreshLog_UserId_Timestamp" 
    ON public."TokenRefreshLog"("UserId", "Timestamp" DESC);
CREATE INDEX IF NOT EXISTS "IX_TokenRefreshLog_Success" 
    ON public."TokenRefreshLog"("Success");

-- ============================================
-- 4. Create views for monitoring and debugging
-- ============================================

-- View: Recent sync failures
CREATE OR REPLACE VIEW public."v_RecentSyncFailures" AS
SELECT 
    "DeviceId",
    "EntityType",
    "Status",
    COUNT(*) as "FailureCount",
    MAX("Timestamp") as "LastFailure",
    ARRAY_AGG(DISTINCT "ErrorMessage" ORDER BY "ErrorMessage") as "ErrorMessages"
FROM public."SyncFailureLog"
WHERE "Resolved" = FALSE 
  AND "Timestamp" > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY "DeviceId", "EntityType", "Status"
ORDER BY MAX("Timestamp") DESC;

-- View: Sync performance statistics
CREATE OR REPLACE VIEW public."v_SyncPerformanceStats" AS
SELECT 
    DATE_TRUNC('hour', "Timestamp") as "Hour",
    COUNT(*) as "SyncAttempts",
    AVG("SyncDuration")::BIGINT as "AvgDuration",
    MAX("SyncDuration") as "MaxDuration",
    MIN("SyncDuration") as "MinDuration",
    AVG("OperationsSucceeded") as "AvgOpsSucceeded",
    AVG("OperationsFailed") as "AvgOpsFailed",
    SUM(CASE WHEN "OperationsFailed" > 0 THEN 1 ELSE 0 END) as "FailedSyncs",
    ROUND(100.0 * SUM(CASE WHEN "OperationsFailed" = 0 THEN 1 ELSE 0 END) 
        / COUNT(*), 2) as "SuccessRate"
FROM public."SyncPerformanceLog"
WHERE "Timestamp" > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', "Timestamp")
ORDER BY "Hour" DESC;

-- View: Auth issues last 24 hours
CREATE OR REPLACE VIEW public."v_AuthIssuesRecent" AS
SELECT 
    "UserId",
    "Reason",
    COUNT(*) as "AttemptCount",
    SUM(CASE WHEN "Success" = TRUE THEN 1 ELSE 0 END) as "Successes",
    SUM(CASE WHEN "Success" = FALSE THEN 1 ELSE 0 END) as "Failures",
    MAX("Timestamp") as "LastAttempt",
    ARRAY_AGG(DISTINCT "ErrorMessage" ORDER BY "ErrorMessage") as "Errors"
FROM public."TokenRefreshLog"
WHERE "Timestamp" > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY "UserId", "Reason"
ORDER BY MAX("Timestamp") DESC;

-- ============================================
-- 5. Add columns to existing tables for better tracking
-- ============================================

-- Add to SupportTicket if not exists
ALTER TABLE public."SupportTickets" ADD COLUMN IF NOT EXISTS "SyncedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE public."SupportTickets" ADD COLUMN IF NOT EXISTS "OfflineDeviceId" VARCHAR(255);
ALTER TABLE public."SupportTickets" ADD COLUMN IF NOT EXISTS "SyncVersion" INT DEFAULT 1;

-- Add to SupportTicketComment if not exists
ALTER TABLE public."SupportTicketComments" ADD COLUMN IF NOT EXISTS "SyncedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE public."SupportTicketComments" ADD COLUMN IF NOT EXISTS "OfflineDeviceId" VARCHAR(255);

-- Create index for sync tracking
CREATE INDEX IF NOT EXISTS "IX_SupportTickets_SyncedAt" 
    ON public."SupportTickets"("SyncedAt");
CREATE INDEX IF NOT EXISTS "IX_SupportTickets_OfflineDeviceId" 
    ON public."SupportTickets"("OfflineDeviceId");

-- ============================================
-- 6. Store procedure for cleanup old logs
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_sync_logs(days_to_keep INT DEFAULT 30)
RETURNS TABLE(deleted_failures BIGINT, deleted_performance BIGINT, deleted_tokens BIGINT) AS $$
DECLARE
    v_deleted_failures BIGINT;
    v_deleted_performance BIGINT;
    v_deleted_tokens BIGINT;
BEGIN
    -- Delete old failure logs
    DELETE FROM public."SyncFailureLog"
    WHERE "Timestamp" < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL
      AND "Resolved" = TRUE;
    GET DIAGNOSTICS v_deleted_failures = ROW_COUNT;
    
    -- Delete old performance logs (keep longer for statistics)
    DELETE FROM public."SyncPerformanceLog"
    WHERE "Timestamp" < CURRENT_TIMESTAMP - ((days_to_keep * 2) || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted_performance = ROW_COUNT;
    
    -- Delete old token refresh logs
    DELETE FROM public."TokenRefreshLog"
    WHERE "Timestamp" < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted_tokens = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted_failures, v_deleted_performance, v_deleted_tokens;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Grant permissions (optional - adjust for your role)
-- ============================================
-- GRANT SELECT ON public."SyncFailureLog" TO app_user;
-- GRANT INSERT ON public."SyncFailureLog" TO app_user;
-- GRANT SELECT ON public."SyncPerformanceLog" TO app_user;
-- GRANT INSERT ON public."SyncPerformanceLog" TO app_user;
-- GRANT SELECT ON public."TokenRefreshLog" TO app_user;
-- GRANT INSERT ON public."TokenRefreshLog" TO app_user;
-- GRANT EXECUTE ON FUNCTION public.cleanup_sync_logs TO app_user;

-- ============================================
-- 8. Comments for documentation
-- ============================================
COMMENT ON TABLE public."SyncFailureLog" IS 'Logs all offline sync failures for debugging and monitoring';
COMMENT ON TABLE public."SyncPerformanceLog" IS 'Tracks offline sync performance metrics for analytics';
COMMENT ON TABLE public."TokenRefreshLog" IS 'Logs token refresh attempts for auth troubleshooting';
COMMENT ON FUNCTION public.cleanup_sync_logs IS 'Removes old sync logs older than specified days (default 30)';
