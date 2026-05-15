-- =============================================
-- Workflow Automation Tables
-- Migration: 17_workflow_automation.sql
-- =============================================

-- Table: WorkflowDefinitions
-- Stores the visual workflow definitions created by users
CREATE TABLE IF NOT EXISTS "WorkflowDefinitions" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Nodes" JSONB NOT NULL DEFAULT '[]',
    "Edges" JSONB NOT NULL DEFAULT '[]',
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "Version" INTEGER NOT NULL DEFAULT 1,
    "CreatedBy" VARCHAR(100),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP,
    "ModifiedBy" VARCHAR(100),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "idx_workflow_definitions_active" ON "WorkflowDefinitions" ("IsActive") WHERE "IsDeleted" = false;
CREATE INDEX IF NOT EXISTS "idx_workflow_definitions_created" ON "WorkflowDefinitions" ("CreatedAt" DESC);

-- Table: WorkflowTriggers
-- Stores registered triggers that listen for status changes
CREATE TABLE IF NOT EXISTS "WorkflowTriggers" (
    "Id" SERIAL PRIMARY KEY,
    "WorkflowId" INTEGER NOT NULL REFERENCES "WorkflowDefinitions"("Id") ON DELETE CASCADE,
    "NodeId" VARCHAR(50) NOT NULL,
    "EntityType" VARCHAR(30) NOT NULL, -- 'offer', 'sale', 'service_order', 'dispatch'
    "FromStatus" VARCHAR(50), -- NULL means 'any'
    "ToStatus" VARCHAR(50), -- NULL means 'any'
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_workflow_triggers_entity" ON "WorkflowTriggers" ("EntityType", "IsActive");
CREATE INDEX IF NOT EXISTS "idx_workflow_triggers_workflow" ON "WorkflowTriggers" ("WorkflowId");

-- Table: WorkflowExecutions
-- Tracks each execution of a workflow
CREATE TABLE IF NOT EXISTS "WorkflowExecutions" (
    "Id" SERIAL PRIMARY KEY,
    "WorkflowId" INTEGER NOT NULL REFERENCES "WorkflowDefinitions"("Id"),
    "TriggerEntityType" VARCHAR(30) NOT NULL,
    "TriggerEntityId" INTEGER NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'waiting_approval', 'completed', 'failed', 'cancelled'
    "CurrentNodeId" VARCHAR(50),
    "Context" JSONB NOT NULL DEFAULT '{}',
    "Error" VARCHAR(1000),
    "StartedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CompletedAt" TIMESTAMP,
    "TriggeredBy" VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS "idx_workflow_executions_status" ON "WorkflowExecutions" ("Status");
CREATE INDEX IF NOT EXISTS "idx_workflow_executions_workflow" ON "WorkflowExecutions" ("WorkflowId");
CREATE INDEX IF NOT EXISTS "idx_workflow_executions_started" ON "WorkflowExecutions" ("StartedAt" DESC);

-- Table: WorkflowExecutionLogs
-- Detailed logs for each step in an execution
CREATE TABLE IF NOT EXISTS "WorkflowExecutionLogs" (
    "Id" SERIAL PRIMARY KEY,
    "ExecutionId" INTEGER NOT NULL REFERENCES "WorkflowExecutions"("Id") ON DELETE CASCADE,
    "NodeId" VARCHAR(50) NOT NULL,
    "NodeType" VARCHAR(50) NOT NULL,
    "Status" VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed', 'skipped'
    "Input" JSONB,
    "Output" JSONB,
    "Error" VARCHAR(500),
    "Duration" INTEGER, -- milliseconds
    "Timestamp" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_workflow_logs_execution" ON "WorkflowExecutionLogs" ("ExecutionId");

-- Table: WorkflowApprovals
-- Tracks approval requests for workflows that require them
CREATE TABLE IF NOT EXISTS "WorkflowApprovals" (
    "Id" SERIAL PRIMARY KEY,
    "ExecutionId" INTEGER NOT NULL REFERENCES "WorkflowExecutions"("Id") ON DELETE CASCADE,
    "NodeId" VARCHAR(50) NOT NULL,
    "Title" VARCHAR(200) NOT NULL,
    "Message" VARCHAR(1000),
    "ApproverRole" VARCHAR(50) NOT NULL, -- 'manager', 'admin', 'dispatcher'
    "ApprovedById" VARCHAR(100),
    "Status" VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
    "ResponseNote" VARCHAR(500),
    "TimeoutHours" INTEGER NOT NULL DEFAULT 24,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "RespondedAt" TIMESTAMP,
    "ExpiresAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_workflow_approvals_status" ON "WorkflowApprovals" ("Status") WHERE "Status" = 'pending';
CREATE INDEX IF NOT EXISTS "idx_workflow_approvals_execution" ON "WorkflowApprovals" ("ExecutionId");

-- =============================================
-- Comments for documentation
-- =============================================
COMMENT ON TABLE "WorkflowDefinitions" IS 'Stores visual workflow definitions created in the workflow builder';
COMMENT ON TABLE "WorkflowTriggers" IS 'Registered triggers that listen for entity status changes';
COMMENT ON TABLE "WorkflowExecutions" IS 'Tracks each execution instance of a workflow';
COMMENT ON TABLE "WorkflowExecutionLogs" IS 'Detailed step-by-step logs for workflow executions';
COMMENT ON TABLE "WorkflowApprovals" IS 'Approval requests for workflows requiring manual approval';
