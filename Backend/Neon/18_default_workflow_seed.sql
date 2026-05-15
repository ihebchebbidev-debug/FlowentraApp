-- =============================================
-- Default Business Workflow Seed Data
-- Migration: 18_default_workflow_seed.sql
-- =============================================
-- This creates the default business workflow that handles:
-- Offer accepted → Sale created
-- Sale in_progress (with services) → Service Order created
-- Service Order scheduled → Dispatches created
-- Dispatch in_progress → Service Order in_progress
-- Dispatch technically_completed → Service Order (partially/technically) completed

-- =============================================
-- CLEANUP: Remove existing default workflow data
-- =============================================

-- First, delete triggers associated with the default workflow
DELETE FROM "WorkflowTriggers" 
WHERE "WorkflowId" IN (
    SELECT "Id" FROM "WorkflowDefinitions" 
    WHERE "Name" = 'Default Business Workflow'
);

-- Delete execution logs for any executions of the default workflow
DELETE FROM "WorkflowExecutionLogs" 
WHERE "ExecutionId" IN (
    SELECT "Id" FROM "WorkflowExecutions" 
    WHERE "WorkflowId" IN (
        SELECT "Id" FROM "WorkflowDefinitions" 
        WHERE "Name" = 'Default Business Workflow'
    )
);

-- Delete approvals for any executions of the default workflow
DELETE FROM "WorkflowApprovals" 
WHERE "ExecutionId" IN (
    SELECT "Id" FROM "WorkflowExecutions" 
    WHERE "WorkflowId" IN (
        SELECT "Id" FROM "WorkflowDefinitions" 
        WHERE "Name" = 'Default Business Workflow'
    )
);

-- Delete executions of the default workflow
DELETE FROM "WorkflowExecutions" 
WHERE "WorkflowId" IN (
    SELECT "Id" FROM "WorkflowDefinitions" 
    WHERE "Name" = 'Default Business Workflow'
);

-- Finally, delete the default workflow definition itself
DELETE FROM "WorkflowDefinitions" 
WHERE "Name" = 'Default Business Workflow';

-- =============================================
-- INSERT: Create fresh default workflow
-- =============================================

-- Insert the default workflow definition
INSERT INTO "WorkflowDefinitions" (
    "Name",
    "Description",
    "Nodes",
    "Edges",
    "IsActive",
    "Version",
    "CreatedBy",
    "CreatedAt",
    "IsDeleted"
) VALUES (
    'Default Business Workflow',
    'Standard workflow: Offer → Sale → Service Order → Dispatch with automatic status cascading',
    '[
        {
            "id": "trigger-offer-accepted",
            "type": "offer-status-trigger",
            "position": {"x": 100, "y": 100},
            "data": {
                "label": "Offer Accepted",
                "type": "offer-status-trigger",
                "description": "Triggers when an offer is accepted",
                "fromStatus": null,
                "toStatus": "accepted"
            }
        },
        {
            "id": "action-create-sale",
            "type": "sale",
            "position": {"x": 400, "y": 100},
            "data": {
                "label": "Create Sale",
                "type": "sale",
                "description": "Automatically create a sale from the accepted offer",
                "config": {"autoCreate": true, "copyFromOffer": true}
            }
        },
        {
            "id": "trigger-sale-in-progress",
            "type": "sale-status-trigger",
            "position": {"x": 100, "y": 250},
            "data": {
                "label": "Sale In Progress",
                "type": "sale-status-trigger",
                "description": "Triggers when a sale starts processing",
                "fromStatus": "created",
                "toStatus": "in_progress"
            }
        },
        {
            "id": "condition-has-services",
            "type": "if-else",
            "position": {"x": 400, "y": 250},
            "data": {
                "label": "Has Service Items?",
                "type": "if-else",
                "description": "Check if the sale contains at least one service item",
                "config": {
                    "conditionData": {
                        "field": "sale.items",
                        "operator": "contains",
                        "value": "service",
                        "checkField": "type"
                    }
                }
            }
        },
        {
            "id": "action-create-service-order",
            "type": "service-order",
            "position": {"x": 700, "y": 200},
            "data": {
                "label": "Create Service Order",
                "type": "service-order",
                "description": "Create a service order for the service items",
                "config": {"autoCreate": true, "copyServicesFromSale": true, "initialStatus": "pending"}
            }
        },
        {
            "id": "trigger-service-order-scheduled",
            "type": "service-order-status-trigger",
            "position": {"x": 100, "y": 400},
            "data": {
                "label": "Service Order Scheduled",
                "type": "service-order-status-trigger",
                "description": "Triggers when a service order is scheduled",
                "fromStatus": "pending",
                "toStatus": "scheduled"
            }
        },
        {
            "id": "action-create-dispatches",
            "type": "dispatch",
            "position": {"x": 400, "y": 400},
            "data": {
                "label": "Create Dispatches",
                "type": "dispatch",
                "description": "Create dispatch entries for each service",
                "config": {"autoCreate": true, "createPerService": true, "initialStatus": "planned"}
            }
        },
        {
            "id": "trigger-dispatch-in-progress",
            "type": "dispatch-status-trigger",
            "position": {"x": 100, "y": 550},
            "data": {
                "label": "Dispatch In Progress",
                "type": "dispatch-status-trigger",
                "description": "Triggers when a dispatch starts",
                "fromStatus": null,
                "toStatus": "in_progress"
            }
        },
        {
            "id": "action-service-order-in-progress",
            "type": "update-service-order-status",
            "position": {"x": 400, "y": 550},
            "data": {
                "label": "Service Order → In Progress",
                "type": "update-service-order-status",
                "description": "Update service order status to in progress",
                "config": {"newStatus": "in_progress", "condition": "ifNotAlreadyInProgress"}
            }
        },
        {
            "id": "trigger-dispatch-completed",
            "type": "dispatch-status-trigger",
            "position": {"x": 100, "y": 700},
            "data": {
                "label": "Dispatch Technically Completed",
                "type": "dispatch-status-trigger",
                "description": "Triggers when a dispatch is technically completed",
                "entityType": "dispatch",
                "fromStatus": "in_progress",
                "toStatus": "technically_completed"
            }
        },
        {
            "id": "condition-all-done",
            "type": "if-else",
            "position": {"x": 400, "y": 700},
            "data": {
                "label": "All Dispatches Completed?",
                "type": "if-else",
                "description": "Check if all dispatches for the service order are completed",
                "field": "serviceOrder.dispatches",
                "operator": "all_match",
                "value": "technically_completed,completed",
                "config": {
                    "field": "serviceOrder.dispatches",
                    "operator": "all_match",
                    "value": "technically_completed,completed",
                    "checkField": "status",
                    "conditionData": {
                        "field": "serviceOrder.dispatches",
                        "operator": "all_match",
                        "value": "technically_completed,completed",
                        "checkField": "status"
                    }
                }
            }
        },
        {
            "id": "action-so-tech-complete",
            "type": "update-service-order-status",
            "position": {"x": 700, "y": 650},
            "data": {
                "label": "Service Order → Technically Completed",
                "type": "update-service-order-status",
                "description": "All dispatches done - mark service order as technically completed",
                "entityType": "service_order",
                "actionType": "update-status",
                "config": {"newStatus": "technically_completed"}
            }
        },
        {
            "id": "action-so-partial",
            "type": "update-service-order-status",
            "position": {"x": 700, "y": 780},
            "data": {
                "label": "Service Order → Partially Completed",
                "type": "update-service-order-status",
                "description": "Some dispatches still pending - mark as partially completed",
                "entityType": "service_order",
                "actionType": "update-status",
                "config": {"newStatus": "partially_completed"}
            }
        }
    ]'::jsonb,
    '[
        {"id": "edge-1", "source": "trigger-offer-accepted", "target": "action-create-sale", "type": "smoothstep", "animated": true},
        {"id": "edge-2", "source": "trigger-sale-in-progress", "target": "condition-has-services", "type": "smoothstep", "animated": true},
        {"id": "edge-3", "source": "condition-has-services", "target": "action-create-service-order", "sourceHandle": "yes", "type": "smoothstep", "animated": true, "label": "YES"},
        {"id": "edge-4", "source": "trigger-service-order-scheduled", "target": "action-create-dispatches", "type": "smoothstep", "animated": true},
        {"id": "edge-5", "source": "trigger-dispatch-in-progress", "target": "action-service-order-in-progress", "type": "smoothstep", "animated": true},
        {"id": "edge-6", "source": "trigger-dispatch-completed", "target": "condition-all-done", "type": "smoothstep", "animated": true},
        {"id": "edge-7", "source": "condition-all-done", "target": "action-so-tech-complete", "sourceHandle": "yes", "type": "smoothstep", "animated": true, "label": "YES"},
        {"id": "edge-8", "source": "condition-all-done", "target": "action-so-partial", "sourceHandle": "no", "type": "smoothstep", "animated": true, "label": "NO"}
    ]'::jsonb,
    true,
    1,
    'system',
    NOW(),
    false
);

-- Get the workflow ID for trigger registration
DO $$
DECLARE
    workflow_id INTEGER;
BEGIN
    SELECT "Id" INTO workflow_id FROM "WorkflowDefinitions" WHERE "Name" = 'Default Business Workflow' AND "IsDeleted" = false LIMIT 1;
    
    IF workflow_id IS NOT NULL THEN
        -- Register triggers for the default workflow
        
        -- Trigger: Offer accepted
        INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
        VALUES (workflow_id, 'trigger-offer-accepted', 'offer', NULL, 'accepted', true, NOW());
        
        -- Trigger: Sale in progress
        INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
        VALUES (workflow_id, 'trigger-sale-in-progress', 'sale', 'created', 'in_progress', true, NOW());
        
        -- Trigger: Service order scheduled
        INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
        VALUES (workflow_id, 'trigger-service-order-scheduled', 'service_order', 'pending', 'scheduled', true, NOW());
        
        -- Trigger: Dispatch in progress
        INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
        VALUES (workflow_id, 'trigger-dispatch-in-progress', 'dispatch', NULL, 'in_progress', true, NOW());
        
        -- Trigger: Dispatch technically completed (FromStatus = NULL means any status)
        INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
        VALUES (workflow_id, 'trigger-dispatch-completed', 'dispatch', NULL, 'technically_completed', true, NOW());
        
        -- Trigger: Dispatch completed (also catches 'completed' status)
        INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
        VALUES (workflow_id, 'trigger-dispatch-completed', 'dispatch', NULL, 'completed', true, NOW());
        
        RAISE NOTICE 'Default workflow triggers registered for workflow ID: %', workflow_id;
    ELSE
        RAISE NOTICE 'Default workflow not found, skipping trigger registration';
    END IF;
END $$;

-- =============================================
-- Add new status columns to support the workflow
-- =============================================

-- Add TechnicallyCompletedAt to ServiceOrders if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ServiceOrders' AND column_name = 'TechnicallyCompletedAt') THEN
        ALTER TABLE "ServiceOrders" ADD COLUMN "TechnicallyCompletedAt" TIMESTAMP;
    END IF;
END $$;

-- Add ServiceCount to ServiceOrders if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ServiceOrders' AND column_name = 'ServiceCount') THEN
        ALTER TABLE "ServiceOrders" ADD COLUMN "ServiceCount" INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add ActualCompletionDate to ServiceOrders if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ServiceOrders' AND column_name = 'ActualCompletionDate') THEN
        ALTER TABLE "ServiceOrders" ADD COLUMN "ActualCompletionDate" TIMESTAMP;
    END IF;
END $$;

-- Add CompletedDispatchCount to ServiceOrders if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ServiceOrders' AND column_name = 'CompletedDispatchCount') THEN
        ALTER TABLE "ServiceOrders" ADD COLUMN "CompletedDispatchCount" INTEGER DEFAULT 0;
    END IF;
END $$;

-- =============================================
-- Comments
-- =============================================
COMMENT ON COLUMN "ServiceOrders"."TechnicallyCompletedAt" IS 'Timestamp when all dispatches were technically completed';
COMMENT ON COLUMN "ServiceOrders"."ServiceCount" IS 'Number of service items in this order';
COMMENT ON COLUMN "ServiceOrders"."ActualCompletionDate" IS 'Timestamp when service order reached a completion-like status';
COMMENT ON COLUMN "ServiceOrders"."CompletedDispatchCount" IS 'Count of dispatches in a completion-like status for this service order';
