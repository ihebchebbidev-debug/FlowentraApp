-- ============================================================================
-- DISPATCH STATUS WORKFLOW UPDATE SCRIPT
-- Updates dispatch statuses and service order cascade logic
-- 
-- NEW DISPATCH FLOW: pending → planned → confirmed/rejected → in_progress → completed
-- 
-- SERVICE ORDER CASCADE RULES:
-- 1. If at least one dispatch is in_progress → Service Order = in_progress
-- 2. If at least one dispatch is completed AND there are more than one dispatch → Service Order = partially_completed
-- 3. If service order has ONE dispatch that is completed → Service Order = technically_completed
-- 4. If dispatch is rejected → Service Order = ready_for_planning
--
-- Run this against your PostgreSQL database
-- ============================================================================

-- Step 1: Update the Dispatch status enum/check constraint
-- (Adjust if using enum type vs check constraint)

-- Option A: If using a CHECK constraint
ALTER TABLE "Dispatches" DROP CONSTRAINT IF EXISTS "Dispatches_Status_Check";
ALTER TABLE "Dispatches" ADD CONSTRAINT "Dispatches_Status_Check" 
  CHECK ("Status" IN ('pending', 'planned', 'confirmed', 'rejected', 'in_progress', 'completed', 'cancelled'));

-- Step 2: Migrate existing dispatch statuses to new values
UPDATE "Dispatches" SET "Status" = 'planned' WHERE "Status" = 'assigned';
UPDATE "Dispatches" SET "Status" = 'confirmed' WHERE "Status" = 'acknowledged';
UPDATE "Dispatches" SET "Status" = 'in_progress' WHERE "Status" IN ('en_route', 'on_site');
UPDATE "Dispatches" SET "Status" = 'completed' WHERE "Status" = 'technically_completed';

-- Step 3: Update workflow trigger configurations for new dispatch statuses
UPDATE "WorkflowTriggers" 
SET "ToStatus" = 'confirmed' 
WHERE "EntityType" = 'dispatch' AND "ToStatus" = 'assigned';

UPDATE "WorkflowTriggers" 
SET "ToStatus" = 'completed' 
WHERE "EntityType" = 'dispatch' AND "ToStatus" = 'technically_completed';

-- Step 4: Insert new triggers for rejected dispatch handling
INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
SELECT 
  wt."WorkflowId",
  'trigger-dispatch-rejected',
  'dispatch',
  NULL,
  'rejected',
  true,
  NOW()
FROM "WorkflowTriggers" wt
WHERE wt."EntityType" = 'dispatch' AND wt."ToStatus" = 'confirmed'
LIMIT 1;

-- ============================================================================
-- VERIFY CHANGES
-- ============================================================================
SELECT 'Dispatch Statuses After Migration:' as info;
SELECT DISTINCT "Status", COUNT(*) as count FROM "Dispatches" GROUP BY "Status" ORDER BY "Status";

SELECT 'Workflow Triggers for Dispatch:' as info;
SELECT "Id", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive" 
FROM "WorkflowTriggers" 
WHERE "EntityType" = 'dispatch' 
ORDER BY "Id";
