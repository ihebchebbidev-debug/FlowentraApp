// ============================================================================
// Workflow Entity Statuses - Re-exports from centralized config
// This file serves as the workflow module's interface to the centralized
// entity status configuration. It maps the centralized config to the
// StatusOption format used by workflow components.
//
// HOW TO ADD/REMOVE STATUSES:
// 1. Edit the config file in src/config/entity-statuses/<entity>.config.ts
// 2. Add/remove entries in the `statuses` array and `workflow.steps`
// 3. Add translations in the module's locale files
// 4. Everything else (workflow module, StatusFlow components) updates automatically
// ============================================================================

import {
  entityStatusConfigs,
  type EntityType as CentralEntityType,
  type EntityStatusConfig,
  type StatusDefinition,
} from '@/config/entity-statuses';

export interface StatusOption {
  value: string;
  labelKey: string;  // Translation key (workflow namespace flat format)
  name?: string;     // Display name from backend (optional)
  color?: string;    // Semantic color
  isTerminal?: boolean;
}

// Convert centralized StatusDefinition[] to workflow StatusOption[]
function toStatusOptions(config: EntityStatusConfig): StatusOption[] {
  return config.statuses.map((s: StatusDefinition) => ({
    value: s.id,
    labelKey: s.workflowTranslationKey,
    color: s.color,
    isTerminal: s.isTerminal,
  }));
}

// ============================================================================
// STATUS OPTIONS - Derived from centralized config (auto-updates)
// ============================================================================
export const offerStatuses: StatusOption[] = toStatusOptions(entityStatusConfigs.offer);
export const saleStatuses: StatusOption[] = toStatusOptions(entityStatusConfigs.sale);
export const serviceOrderStatuses: StatusOption[] = toStatusOptions(entityStatusConfigs.service_order);
export const dispatchStatuses: StatusOption[] = toStatusOptions(entityStatusConfigs.dispatch);

// Re-export EntityType (workflow module only uses these 4)
export type EntityType = 'offer' | 'sale' | 'service_order' | 'dispatch';

export const entityTypes: { value: EntityType; labelKey: string }[] = [
  { value: 'offer', labelKey: 'entity.offer' },
  { value: 'sale', labelKey: 'entity.sale' },
  { value: 'service_order', labelKey: 'entity.serviceOrder' },
  { value: 'dispatch', labelKey: 'entity.dispatch' },
];

// ============================================================================
// LOOKUP HELPERS - All driven by centralized config map (no switch statements)
// ============================================================================

export const getStatusesByEntityType = (entityType: EntityType): StatusOption[] => {
  const config = entityStatusConfigs[entityType];
  return config ? toStatusOptions(config) : [];
};

export const getEntityTypeFromNodeType = (nodeType: string): EntityType | null => {
  if (nodeType.includes('offer')) return 'offer';
  if (nodeType.includes('sale')) return 'sale';
  if (nodeType.includes('service-order')) return 'service_order';
  if (nodeType.includes('dispatch')) return 'dispatch';
  return null;
};

export const getWorkflowSteps = (entityType: EntityType): string[] => {
  return entityStatusConfigs[entityType]?.workflow.steps ?? [];
};

export const getTerminalStatuses = (entityType: EntityType): string[] => {
  return entityStatusConfigs[entityType]?.workflow.terminalStatuses ?? [];
};

export const getBranchStatuses = (entityType: EntityType): Record<string, string[]> => {
  return entityStatusConfigs[entityType]?.workflow.branchStatuses ?? {};
};

// Node type configurations for the workflow builder
export const statusTriggerNodes = [
  'offer-status-trigger',
  'sale-status-trigger', 
  'service-order-status-trigger',
  'dispatch-status-trigger'
] as const;

export const statusActionNodes = [
  'update-offer-status',
  'update-sale-status',
  'update-service-order-status',
  'update-dispatch-status',
] as const;

// Non-status action nodes (communication, approvals) — separate from status actions
export const communicationActionNodes = [
  'send-notification',
  'send-workflow-email',
  'request-approval',
] as const;

export type StatusTriggerNodeType = typeof statusTriggerNodes[number];
export type StatusActionNodeType = typeof statusActionNodes[number];
