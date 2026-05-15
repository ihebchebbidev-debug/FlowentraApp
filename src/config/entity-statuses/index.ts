// ============================================================================
// Centralized Entity Status Configuration
// Single source of truth for all entity statuses, workflow steps, and translations
// Import from here across the entire application
// ============================================================================

export * from './types';
export * from './utils';
export { offerStatusConfig } from './offer.config';
export { saleStatusConfig } from './sale.config';
export { serviceOrderStatusConfig } from './service-order.config';
export { dispatchStatusConfig } from './dispatch.config';
export { jobStatusConfig } from './job.config';

import type { EntityStatusConfig, EntityType } from './types';
import { offerStatusConfig } from './offer.config';
import { saleStatusConfig } from './sale.config';
import { serviceOrderStatusConfig } from './service-order.config';
import { dispatchStatusConfig } from './dispatch.config';
import { jobStatusConfig } from './job.config';

/** Map of all entity status configs by entity type */
export const entityStatusConfigs: Record<EntityType, EntityStatusConfig> = {
  offer: offerStatusConfig,
  sale: saleStatusConfig,
  service_order: serviceOrderStatusConfig,
  dispatch: dispatchStatusConfig,
  job: jobStatusConfig,
};

/** Get status config for an entity type */
export function getEntityStatusConfig(entityType: EntityType): EntityStatusConfig {
  return entityStatusConfigs[entityType];
}

/** Get all statuses for an entity type (for dropdowns, filters, etc.) */
export function getStatusesForEntity(entityType: EntityType) {
  return entityStatusConfigs[entityType]?.statuses ?? [];
}

/** Get workflow steps for an entity type */
export function getWorkflowStepsForEntity(entityType: EntityType) {
  return entityStatusConfigs[entityType]?.workflow.steps ?? [];
}

/** Get terminal statuses for an entity type */
export function getTerminalStatusesForEntity(entityType: EntityType) {
  return entityStatusConfigs[entityType]?.workflow.terminalStatuses ?? [];
}

/** Supported entity types list */
export const allEntityTypes: EntityType[] = ['offer', 'sale', 'service_order', 'dispatch', 'job'];

// Re-export new helper functions for convenience
export { normalizeStatus, getWorkflowPosition, getActiveStatuses, getPositiveTerminalStatuses, getNegativeStatuses } from './types';
export { getUniversalStatusColorClass, getStatusSolidClasses, getStatusDotColor } from './utils';
