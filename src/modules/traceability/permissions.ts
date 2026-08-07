import type { PermissionModule } from '@/types/permissions';
import type { ActivitySource } from './types';

/**
 * Map each traceability activity source to the permission module that
 * governs whether the current user is allowed to see events from it.
 */
export const SOURCE_TO_MODULE: Record<ActivitySource, PermissionModule> = {
  sales: 'sales',
  offers: 'offers',
  deals: 'deals',
  invoices: 'sales',
  purchases: 'purchases',
  service: 'service_orders',
  dispatches: 'dispatches',
  articles: 'articles',
  hr: 'hr',
  contacts: 'contacts',
  settings: 'settings',
};
