import type { EntityStatusConfig } from './types';

// ============================================================================
// INVOICE STATUS CONFIGURATION
// Source of truth: src/modules/invoices/types.ts
// Backend: Backend/Modules/Invoices/Controllers/InvoicesController.cs
// ============================================================================

export const invoiceStatusConfig: EntityStatusConfig = {
  entityType: 'invoice',
  entityLabelKey: 'entity.invoice',
  defaultStatus: 'draft',

  statuses: [
    { id: 'draft',  translationKey: 'status.draft',  workflowTranslationKey: 'status.invoice.draft',  color: 'default',     isTerminal: false },
    { id: 'posted', translationKey: 'status.posted', workflowTranslationKey: 'status.invoice.posted', color: 'info',        isTerminal: false },
    { id: 'paid',   translationKey: 'status.paid',   workflowTranslationKey: 'status.invoice.paid',   color: 'success',     isTerminal: true },
    { id: 'void',   translationKey: 'status.void',   workflowTranslationKey: 'status.invoice.void',   color: 'destructive', isTerminal: true, isNegative: true },
  ],

  workflow: {
    steps: ['draft', 'posted', 'paid'],
    terminalStatuses: ['paid', 'void'],
    branchStatuses: {
      posted: ['void'],
    },
  },
};
