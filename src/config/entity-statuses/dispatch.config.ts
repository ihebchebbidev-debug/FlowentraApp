import type { EntityStatusConfig } from './types';

// ============================================================================
// DISPATCH STATUS CONFIGURATION
// Source of truth: src/modules/field/service-orders/entities/dispatches/types.ts
// Backend: FlowServiceBackendOnlyFinal-main/Modules/Dispatches/Models/Dispatch.cs
// StatusFlow: DispatchStatusFlow.tsx
//
// WORKFLOW: pending → planned → confirmed/rejected → in_progress → completed
// ============================================================================

export const dispatchStatusConfig: EntityStatusConfig = {
  entityType: 'dispatch',
  entityLabelKey: 'entity.dispatch',
  defaultStatus: 'pending',

  statuses: [
    { id: 'pending',    translationKey: 'dispatches.statuses.pending',    workflowTranslationKey: 'status.dispatch.pending',    color: 'default',     isTerminal: false },
    { id: 'planned',    translationKey: 'dispatches.statuses.planned',    workflowTranslationKey: 'status.dispatch.planned',    color: 'info',        isTerminal: false },
    { id: 'confirmed',  translationKey: 'dispatches.statuses.confirmed',  workflowTranslationKey: 'status.dispatch.confirmed',  color: 'primary',     isTerminal: false },
    { id: 'rejected',   translationKey: 'dispatches.statuses.rejected',   workflowTranslationKey: 'status.dispatch.rejected',   color: 'destructive', isTerminal: false, isNegative: true },
    { id: 'in_progress', translationKey: 'dispatches.statuses.in_progress', workflowTranslationKey: 'status.dispatch.in_progress', color: 'primary', isTerminal: false },
    { id: 'completed',  translationKey: 'dispatches.statuses.completed',  workflowTranslationKey: 'status.dispatch.completed',  color: 'success',     isTerminal: true },
    { id: 'cancelled',  translationKey: 'dispatches.statuses.cancelled',  workflowTranslationKey: 'status.dispatch.cancelled',  color: 'destructive', isTerminal: true, isNegative: true },
  ],

  workflow: {
    // Happy path: Pending → Planned → Confirmed → In Progress → Completed
    steps: ['planned', 'confirmed', 'in_progress', 'completed'],
    terminalStatuses: ['completed', 'cancelled'],
    branchStatuses: {
      planned: ['rejected'], // Rejection branches from planned stage
    },
  },
};
