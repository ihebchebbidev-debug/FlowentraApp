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
    // Created → User can immediately choose: Accept OR Reject
    // No intermediate "Sent" step
    steps: ['draft'],
    terminalStatuses: ['accepted', 'declined', 'cancelled'],
    branchStatuses: {
      // From draft, user can directly accept or reject
      draft: ['accepted', 'declined'],
      // For backward compatibility: old offers with "sent" status can also accept/reject
      sent: ['accepted', 'declined'],
    },
  },
};
