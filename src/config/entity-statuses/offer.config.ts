import type { EntityStatusConfig } from './types';

// ============================================================================
// OFFER STATUS CONFIGURATION
// Source of truth: src/modules/offers/types.ts
// Backend: FlowServiceBackendOnlyFinal-main/Modules/Offers/Models/Offer.cs
// ============================================================================

export const offerStatusConfig: EntityStatusConfig = {
  entityType: 'offer',
  entityLabelKey: 'entity.offer',
  defaultStatus: 'draft',

  statuses: [
    { id: 'draft', translationKey: 'status.draft', workflowTranslationKey: 'status.offer.draft', color: 'info', isTerminal: false, aliases: ['created'] },
    { id: 'sent', translationKey: 'status.sent', workflowTranslationKey: 'status.offer.sent', color: 'info', isTerminal: false, aliases: ['pending', 'negotiation'] },
    { id: 'accepted', translationKey: 'status.accepted', workflowTranslationKey: 'status.offer.accepted', color: 'success', isTerminal: true, aliases: ['won'] },
    { id: 'declined', translationKey: 'status.declined', workflowTranslationKey: 'status.offer.declined', color: 'destructive', isTerminal: true, isNegative: true, aliases: ['rejected', 'expired', 'lost'] },
    { id: 'modified', translationKey: 'status.modified', workflowTranslationKey: 'status.offer.modified', color: 'info', isTerminal: false },
    { id: 'cancelled', translationKey: 'status.cancelled', workflowTranslationKey: 'status.offer.cancelled', color: 'destructive', isTerminal: true, isNegative: true },
  ],

  workflow: {
    // Full pipeline rendered inline: Draft → Sent → Accepted (Declined shown as branch)
    steps: ['draft', 'sent', 'accepted'],
    terminalStatuses: ['accepted', 'declined', 'cancelled'],
    branchStatuses: {
      draft: ['accepted', 'declined'],
      sent: ['accepted', 'declined'],
    },
  },
};
