import type { EntityStatusConfig } from './types';

// ============================================================================
// SERVICE ORDER STATUS CONFIGURATION
// Source of truth: src/modules/field/service-orders/types.ts
// Backend: FlowServiceBackendOnlyFinal-main/Modules/ServiceOrders/Models/ServiceOrder.cs
// StatusFlow: ServiceOrderStatusFlow.tsx
//
// WORKFLOW: pending → ready_for_planning → scheduled → in_progress → technically_completed/partially_completed → ready_for_invoice → invoiced → closed
//
// CASCADE RULES (from dispatch status changes):
// 1. If at least one dispatch is in_progress → Service Order = in_progress
// 2. If at least one dispatch is completed (>1 dispatch) → Service Order = partially_completed
// 3. If single dispatch completed OR all dispatches completed → Service Order = technically_completed
// 4. If dispatch is rejected OR all dispatches deleted → Service Order = ready_for_planning
// ============================================================================

export const serviceOrderStatusConfig: EntityStatusConfig = {
  entityType: 'service_order',
  entityLabelKey: 'entity.serviceOrder',
  defaultStatus: 'pending',

  statuses: [
    { id: 'draft',                  translationKey: 'statuses.draft',                  workflowTranslationKey: 'status.serviceOrder.draft',                  color: 'default',     isTerminal: false },
    { id: 'pending',                translationKey: 'statuses.pending',                workflowTranslationKey: 'status.serviceOrder.pending',                color: 'warning',     isTerminal: false },
    { id: 'ready_for_planning',     translationKey: 'statuses.ready_for_planning',     workflowTranslationKey: 'status.serviceOrder.ready_for_planning',     color: 'info',        isTerminal: false },
    { id: 'planned',                translationKey: 'statuses.planned',                workflowTranslationKey: 'status.serviceOrder.planned',                color: 'info',        isTerminal: false },
    { id: 'scheduled',              translationKey: 'statuses.scheduled',              workflowTranslationKey: 'status.serviceOrder.scheduled',              color: 'primary',     isTerminal: false },
    { id: 'in_progress',            translationKey: 'statuses.in_progress',            workflowTranslationKey: 'status.serviceOrder.in_progress',            color: 'primary',     isTerminal: false },
    { id: 'on_hold',                translationKey: 'statuses.on_hold',                workflowTranslationKey: 'status.serviceOrder.on_hold',                color: 'warning',     isTerminal: false },
    { id: 'partially_completed',    translationKey: 'statuses.partially_completed',    workflowTranslationKey: 'status.serviceOrder.partially_completed',    color: 'warning',     isTerminal: false },
    { id: 'technically_completed',  translationKey: 'statuses.technically_completed',  workflowTranslationKey: 'status.serviceOrder.technically_completed',  color: 'success',     isTerminal: false },
    { id: 'ready_for_invoice',      translationKey: 'statuses.ready_for_invoice',      workflowTranslationKey: 'status.serviceOrder.ready_for_invoice',      color: 'warning',     isTerminal: false },
    { id: 'completed',              translationKey: 'statuses.completed',              workflowTranslationKey: 'status.serviceOrder.completed',              color: 'success',     isTerminal: false },
    { id: 'invoiced',               translationKey: 'statuses.invoiced',               workflowTranslationKey: 'status.serviceOrder.invoiced',               color: 'info',        isTerminal: false },
    { id: 'closed',                 translationKey: 'statuses.closed',                 workflowTranslationKey: 'status.serviceOrder.closed',                 color: 'success',     isTerminal: true },
    { id: 'cancelled',              translationKey: 'statuses.cancelled',              workflowTranslationKey: 'status.serviceOrder.cancelled',              color: 'destructive', isTerminal: true, isNegative: true },
  ],

  workflow: {
    // Happy path: Pending → Ready for Planning → Scheduled → In Progress → Technically Completed → Ready for Invoice → Invoiced → Closed
    steps: ['pending', 'ready_for_planning', 'scheduled', 'in_progress', 'technically_completed', 'ready_for_invoice', 'invoiced', 'closed'],
    terminalStatuses: ['closed', 'cancelled'],
    branchStatuses: {
      // From in_progress, can branch to on_hold or partially_completed (based on dispatch status)
      in_progress: ['on_hold', 'partially_completed'],
      // From scheduled, can return to ready_for_planning (if dispatch rejected)
      scheduled: ['ready_for_planning', 'planned'],
    },
  },
};
