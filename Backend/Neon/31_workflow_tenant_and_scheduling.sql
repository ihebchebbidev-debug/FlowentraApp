-- =============================================
-- Workflow tables: TenantId + scheduling columns
-- Migration: 31_workflow_tenant_and_scheduling.sql
-- =============================================
-- 1) Add TenantId to every workflow table so that the EF Core
--    global query filters & SaveChanges stamping that all six
--    models declare via ITenantEntity actually have a column
--    to read/write. Default 0 keeps any pre-existing rows valid
--    (tenant 0 = "legacy / system" bucket).
-- 2) Add ResumeAt + WaitingNodeId on WorkflowExecutions so the
--    polling service can resume long delays.
-- =============================================

-- ----- TenantId columns -----
ALTER TABLE "WorkflowDefinitions"      ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WorkflowTriggers"         ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WorkflowExecutions"       ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WorkflowExecutionLogs"    ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WorkflowApprovals"        ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WorkflowProcessedEntities" ADD COLUMN IF NOT EXISTS "TenantId" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "idx_workflow_definitions_tenant"        ON "WorkflowDefinitions"      ("TenantId");
CREATE INDEX IF NOT EXISTS "idx_workflow_triggers_tenant"           ON "WorkflowTriggers"         ("TenantId");
CREATE INDEX IF NOT EXISTS "idx_workflow_executions_tenant"         ON "WorkflowExecutions"       ("TenantId");
CREATE INDEX IF NOT EXISTS "idx_workflow_execution_logs_tenant"     ON "WorkflowExecutionLogs"    ("TenantId");
CREATE INDEX IF NOT EXISTS "idx_workflow_approvals_tenant"          ON "WorkflowApprovals"        ("TenantId");
CREATE INDEX IF NOT EXISTS "idx_workflow_processed_entities_tenant" ON "WorkflowProcessedEntities" ("TenantId");

-- ----- Delay scheduling columns on WorkflowExecutions -----
ALTER TABLE "WorkflowExecutions" ADD COLUMN IF NOT EXISTS "ResumeAt"      TIMESTAMP NULL;
ALTER TABLE "WorkflowExecutions" ADD COLUMN IF NOT EXISTS "WaitingNodeId" VARCHAR(50) NULL;

-- Partial index so the polling sweep can cheaply find executions ready to resume.
CREATE INDEX IF NOT EXISTS "idx_workflow_executions_resume_due"
    ON "WorkflowExecutions" ("ResumeAt")
    WHERE "Status" = 'waiting_delay' AND "ResumeAt" IS NOT NULL;

COMMENT ON COLUMN "WorkflowExecutions"."ResumeAt"      IS 'When a long-running delay node should resume execution.';
COMMENT ON COLUMN "WorkflowExecutions"."WaitingNodeId" IS 'The node ID the execution is currently parked on (delay/approval).';