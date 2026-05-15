-- =============================================
-- Workflow Processed Entities Tracking Table
-- Migration: 18_workflow_processed_entities.sql
-- =============================================

-- Table: WorkflowProcessedEntities
-- Tracks which entities have been processed by state-based polling
-- to prevent duplicate workflow executions
CREATE TABLE IF NOT EXISTS "WorkflowProcessedEntities" (
    "Id" SERIAL PRIMARY KEY,
    "TriggerId" INTEGER NOT NULL REFERENCES "WorkflowTriggers"("Id") ON DELETE CASCADE,
    "EntityType" VARCHAR(30) NOT NULL,
    "EntityId" INTEGER NOT NULL,
    "ProcessedStatus" VARCHAR(50),
    "ProcessedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ExecutionId" INTEGER REFERENCES "WorkflowExecutions"("Id") ON DELETE SET NULL
);

-- Unique constraint to prevent duplicate processing of the same entity by the same trigger for the same status
CREATE UNIQUE INDEX IF NOT EXISTS "idx_workflow_processed_unique" 
ON "WorkflowProcessedEntities" ("TriggerId", "EntityType", "EntityId", "ProcessedStatus");

-- Index for quick lookups during polling
CREATE INDEX IF NOT EXISTS "idx_workflow_processed_entity" 
ON "WorkflowProcessedEntities" ("EntityType", "EntityId");

-- Index for trigger-based lookups
CREATE INDEX IF NOT EXISTS "idx_workflow_processed_trigger" 
ON "WorkflowProcessedEntities" ("TriggerId");

-- Cleanup old processed entries (older than 30 days) - can be run periodically
-- DELETE FROM "WorkflowProcessedEntities" WHERE "ProcessedAt" < NOW() - INTERVAL '30 days';

COMMENT ON TABLE "WorkflowProcessedEntities" IS 'Tracks processed entities by state-based polling to prevent duplicate workflow executions';
