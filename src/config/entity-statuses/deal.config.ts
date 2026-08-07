import type { EntityStatusConfig } from './types';

// ============================================================================
// DEAL STATUS CONFIGURATION
// Source of truth: src/modules/deals/lib/dealStages.ts
// Backend: Backend/Modules/Deals/Models/Deal.cs (the "Stage" property)
// NOTE: deals store their pipeline state in `stage`, not `status`.
// ============================================================================

export const dealStatusConfig: EntityStatusConfig = {
  entityType: 'deal',
  entityLabelKey: 'entity.deal',
  defaultStatus: 'lead',

  statuses: [
    { id: 'lead', translationKey: 'status.lead', workflowTranslationKey: 'status.deal.lead', color: 'default', isTerminal: false, aliases: ['new'] },
    { id: 'qualified', translationKey: 'status.qualified', workflowTranslationKey: 'status.deal.qualified', color: 'info', isTerminal: false },
    { id: 'proposal', translationKey: 'status.proposal', workflowTranslationKey: 'status.deal.proposal', color: 'primary', isTerminal: false },
    { id: 'negotiation', translationKey: 'status.negotiation', workflowTranslationKey: 'status.deal.negotiation', color: 'warning', isTerminal: false },
    { id: 'won', translationKey: 'status.won', workflowTranslationKey: 'status.deal.won', color: 'success', isTerminal: true, aliases: ['closed_won'] },
    { id: 'lost', translationKey: 'status.lost', workflowTranslationKey: 'status.deal.lost', color: 'destructive', isTerminal: true, isNegative: true, aliases: ['closed_lost'] },
  ],

  workflow: {
    steps: ['lead', 'qualified', 'proposal', 'negotiation'],
    terminalStatuses: ['won', 'lost'],
    branchStatuses: {
      // At any open stage the deal can be won or lost
      negotiation: ['won', 'lost'],
      proposal: ['won', 'lost'],
      qualified: ['won', 'lost'],
      lead: ['won', 'lost'],
    },
  },
};
