import type { EntityStatusConfig } from './types';

// ============================================================================
// SALE STATUS CONFIGURATION
// Source of truth: src/modules/sales/types.ts
// Backend: FlowServiceBackendOnlyFinal-main/Modules/Sales/Models/Sale.cs
// ============================================================================

export const saleStatusConfig: EntityStatusConfig = {
  entityType: 'sale',
  entityLabelKey: 'entity.sale',
  defaultStatus: 'created',

  statuses: [
    { id: 'created',            translationKey: 'statusFlow.created',            workflowTranslationKey: 'status.sale.created',            color: 'default',     isTerminal: false, aliases: ['draft', 'new_offer'] },
    { id: 'in_progress',        translationKey: 'statusFlow.inProgress',         workflowTranslationKey: 'status.sale.in_progress',        color: 'primary',     isTerminal: false, aliases: ['sent', 'accepted', 'won'] },
    { id: 'invoiced',           translationKey: 'statusFlow.invoiced',           workflowTranslationKey: 'status.sale.invoiced',           color: 'info',        isTerminal: false },
    { id: 'partially_invoiced', translationKey: 'statusFlow.partiallyInvoiced',  workflowTranslationKey: 'status.sale.partially_invoiced', color: 'warning',     isTerminal: false },
    { id: 'closed',             translationKey: 'statusFlow.closed',             workflowTranslationKey: 'status.sale.closed',             color: 'success',     isTerminal: true, aliases: ['completed'] },
    { id: 'cancelled',          translationKey: 'statusFlow.cancelled',          workflowTranslationKey: 'status.sale.cancelled',          color: 'destructive', isTerminal: true, isNegative: true, aliases: ['lost'] },
  ],

  workflow: {
    // Happy path: Created → In Progress → Invoiced → Closed
    steps: ['created', 'in_progress', 'invoiced', 'closed'],
    terminalStatuses: ['closed', 'cancelled'],
    branchStatuses: {
      // After 'in_progress', can go to invoiced OR partially_invoiced
      in_progress: ['invoiced', 'partially_invoiced'],
      // After 'partially_invoiced', next is invoiced
      partially_invoiced: ['invoiced'],
    },
  },
};
