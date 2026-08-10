import type { EntityStatusConfig } from './types';

// ============================================================================
// DISPATCH STATUS CONFIGURATION
// Source of truth: src/modules/field/service-orders/entities/dispatches/types.ts
// Backend: FlowServiceBackendOnlyFinal-main/Modules/Dispatches/Models/Dispatch.cs
// StatusFlow: DispatchStatusFlow.tsx
//
// WORKFLOW: assigned → confirmed/rejected → in_progress → completed
// Dispatches are created directly as 'assigned'. 'pending'/'planned' are kept
// as legacy statuses so old records still render, but they are not part of the
// active workflow.
// ============================================================================

export const dispatchStatusConfig: EntityStatusConfig = {
  entityType: 'dispatch',
  entityLabelKey: 'entity.dispatch',
  defaultStatus: 'assigned',

  statuses: [
    { id: 'pending',    translationKey: 'dispatches.statuses.pending',    workflowTranslationKey: 'status.dispatch.pending',    color: 'default',     isTerminal: false },
    { id: 'planned',    translationKey: 'dispatches.statuses.planned',    workflowTranslationKey: 'status.dispatch.planned',    color: 'info',        isTerminal: false },
    { id: 'assigned',   translationKey: 'dispatches.statuses.assigned',   workflowTranslationKey: 'status.dispatch.assigned',   color: 'info',        isTerminal: false },
    // id kept as 'confirmed' for backend/workflow compatibility; label is "Confirmed".
    { id: 'confirmed',  translationKey: 'dispatches.statuses.confirmed',  workflowTranslationKey: 'status.dispatch.confirmed',  color: 'primary',     isTerminal: false },
    { id: 'rejected',   translationKey: 'dispatches.statuses.rejected',   workflowTranslationKey: 'status.dispatch.rejected',   color: 'destructive', isTerminal: true,  isNegative: true },
    { id: 'in_progress', translationKey: 'dispatches.statuses.in_progress', workflowTranslationKey: 'status.dispatch.in_progress', color: 'primary', isTerminal: false },
    { id: 'completed',  translationKey: 'dispatches.statuses.completed',  workflowTranslationKey: 'status.dispatch.completed',  color: 'success',     isTerminal: true },
    { id: 'cancelled',  translationKey: 'dispatches.statuses.cancelled',  workflowTranslationKey: 'status.dispatch.cancelled',  color: 'destructive', isTerminal: true, isNegative: true },
  ],

  workflow: {
    // Happy path: Assigned → Confirmed → In Progress → Completed
    steps: ['assigned', 'confirmed', 'in_progress', 'completed'],
    terminalStatuses: ['completed', 'cancelled', 'rejected'],
    branchStatuses: {
      assigned: ['rejected', 'cancelled'],  // Technician can reject, or dispatch cancelled
      confirmed: ['cancelled'],             // Confirmed work can still be cancelled
      in_progress: ['cancelled'],           // Active work can be cancelled too
    },
  },
};
