import type { PermissionModule } from '@/types/permissions';
import type { ActivitySource } from './types';

/**
 * Map each traceability activity source to the permission module that
 * governs whether the current user is allowed to see events from it.
 *
 * `read_logs` on that module is treated as strictly sufficient; `read`
 * is used as a fallback for modules that don't declare a logs action.
 */
export const SOURCE_TO_MODULE: Record<ActivitySource, PermissionModule> = {
  sales: 'sales',
  offers: 'offers',
  deals: 'deals',
  invoices: 'sales', // customer invoices live under sales
  purchases: 'purchases',
  service: 'service_orders',
  hr: 'hr',
  contacts: 'contacts',
  system: 'audit_logs',
};
