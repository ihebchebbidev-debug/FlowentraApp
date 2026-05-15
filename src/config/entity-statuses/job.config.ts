import type { EntityStatusConfig } from './types';

// ============================================================================
// JOB STATUS CONFIGURATION
// Source of truth: src/modules/field/service-orders/entities/jobs/types.ts
// Jobs are work items within a Service Order
// ============================================================================

export const jobStatusConfig: EntityStatusConfig = {
  entityType: 'job',
  entityLabelKey: 'entity.job',
  defaultStatus: 'unscheduled',

  statuses: [
    { id: 'unscheduled', translationKey: 'statuses.unscheduled', workflowTranslationKey: 'status.job.unscheduled', color: 'warning',     isTerminal: false },
    { id: 'ready',       translationKey: 'statuses.ready',       workflowTranslationKey: 'status.job.ready',       color: 'info',        isTerminal: false },
    { id: 'dispatched',  translationKey: 'statuses.dispatched',  workflowTranslationKey: 'status.job.dispatched',  color: 'primary',     isTerminal: false },
    { id: 'cancelled',   translationKey: 'statuses.cancelled',   workflowTranslationKey: 'status.job.cancelled',   color: 'destructive', isTerminal: true, isNegative: true },
  ],

  workflow: {
    // Happy path: Unscheduled → Ready → Dispatched
    steps: ['unscheduled', 'ready', 'dispatched'],
    terminalStatuses: ['dispatched', 'cancelled'],
  },
};
