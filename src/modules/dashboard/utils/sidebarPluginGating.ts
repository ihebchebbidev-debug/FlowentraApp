/**
 * Map sidebar item titles → plugin codes for runtime gating.
 * Sidebar code can call `isSidebarItemEnabled(item.title, isEnabled)` to
 * filter items based on plugin state.
 */
import type { UsePluginsReturn } from '@/modules/shared/plugins';
import { getPluginByCode } from '@/modules/shared/plugins';

const TITLE_TO_PLUGIN: Record<string, string> = {
  // CRM
  contacts: 'PL0001CONTACTS',
  suppliers: 'PL0001CONTACTS',
  sales: 'PL0002SALES',
  deals: 'PL0003DEALS',
  projects: 'PL0004PROJECTS',
  salesoffers: 'PL0005OFFERS',
  offers: 'PL0005OFFERS',
  // Inventory
  articles: 'PL0008INVSERVICES',
  // Calendar / Tasks / Documents
  calendar: 'PL0010CALENDAR',
  todo: 'PL0011TASKS',
  tasks: 'PL0011TASKS',
  documents: 'PL0012DOCUMENTS',
  // HR
  hr: 'PL0013HR',
  // Field
  services: 'PL0015FIELD',
  installations: 'PL0018INSTALLATIONS',
  'time-expenses': 'PL0015FIELD',
  time_tracking: 'PL0015FIELD',
  n: 'PL0015FIELD',
  dispatcher: 'PL0024DISPATCHER',
  planner: 'PL0024DISPATCHER',
  scheduling: 'PL0023SCHEDULING',
  planning: 'PL0023SCHEDULING',
  // Finance
  purchases: 'PL0025PURCHASES',
  invoices: 'PL0004INVOICES',
  payments: 'PL0026PAYMENTS',
  stock: 'PL0009STOCK',
  'stock-management': 'PL0009STOCK',
  // Comms
  emails: 'PL0028EMAILCALENDAR',
  communication: 'PL0027COMMUNICATION',
  notifications: 'PL0029NOTIFICATIONS',
  support: 'PL0006SUPPORT',
  skills: 'PL0014SKILLS',
  analytics: 'PL0040ANALYTICS',
  automation: 'PL0042AUTOMATION',
  'ai-assistant': 'PL0041AIASSISTANT',
  'dashboard-builder': 'PL0039DASHBLDR',
  // System
  external: 'PL0030EXTERNAL',
  workflow: 'PL0031WORKFLOW',
  dynamic_forms: 'PL0032DYNAMICFORMS',
  'dynamic-forms': 'PL0032DYNAMICFORMS',
  lookups: 'PL0037LOOKUPS',
  'website-builder': 'PL0038WEBSITEBLDR',
  // Always-on (do not gate)
  // dashboard, settings, sync_history
};

export function getSidebarPluginCode(title: string | undefined | null): string | undefined {
  if (!title) return undefined;
  return TITLE_TO_PLUGIN[title];
}

export function isSidebarItemEnabled(
  title: string | undefined | null,
  isEnabled: UsePluginsReturn['isEnabled']
): boolean {
  const code = getSidebarPluginCode(title);
  if (!code) return true; // ungated → always show
  return isEnabled(code);
}

/**
 * Route path → plugin code. Used by surfaces that are not the sidebar
 * (command palette quick actions / recents, global search deep links) so a
 * deactivated module never leaks a clickable entry point into the UI.
 * Longest prefix wins.
 */
const PATH_TO_PLUGIN: Record<string, string> = {
  '/dashboard/contacts': 'PL0001CONTACTS',
  '/dashboard/suppliers': 'PL0001CONTACTS',
  '/dashboard/sales': 'PL0002SALES',
  '/dashboard/deals': 'PL0003DEALS',
  '/dashboard/projects': 'PL0004PROJECTS',
  '/dashboard/invoices': 'PL0004INVOICES',
  '/dashboard/offers': 'PL0005OFFERS',
  '/dashboard/sales-offers': 'PL0005OFFERS',
  '/dashboard/support': 'PL0006SUPPORT',
  '/dashboard/articles': 'PL0008INVSERVICES',
  '/dashboard/stock': 'PL0009STOCK',
  '/dashboard/calendar': 'PL0010CALENDAR',
  '/dashboard/tasks': 'PL0011TASKS',
  '/dashboard/todo': 'PL0011TASKS',
  '/dashboard/documents': 'PL0012DOCUMENTS',
  '/dashboard/hr': 'PL0013HR',
  '/dashboard/skills': 'PL0014SKILLS',
  '/dashboard/service-orders': 'PL0015FIELD',
  '/dashboard/services': 'PL0015FIELD',
  '/dashboard/time-expenses': 'PL0015FIELD',
  '/dashboard/installations': 'PL0018INSTALLATIONS',
  '/dashboard/scheduling': 'PL0023SCHEDULING',
  '/dashboard/planning': 'PL0023SCHEDULING',
  '/dashboard/dispatcher': 'PL0024DISPATCHER',
  '/dashboard/planner': 'PL0024DISPATCHER',
  '/dashboard/purchases': 'PL0025PURCHASES',
  '/dashboard/payments': 'PL0026PAYMENTS',
  '/dashboard/communication': 'PL0027COMMUNICATION',
  '/dashboard/emails': 'PL0028EMAILCALENDAR',
  '/dashboard/notifications': 'PL0029NOTIFICATIONS',
  '/dashboard/external': 'PL0030EXTERNAL',
  '/dashboard/workflow': 'PL0031WORKFLOW',
  '/dashboard/dynamic-forms': 'PL0032DYNAMICFORMS',
  '/dashboard/lookups': 'PL0037LOOKUPS',
  '/dashboard/website-builder': 'PL0038WEBSITEBLDR',
  '/dashboard/dashboard-builder': 'PL0039DASHBLDR',
  '/dashboard/analytics': 'PL0040ANALYTICS',
  '/dashboard/ai-assistant': 'PL0041AIASSISTANT',
  '/dashboard/automation': 'PL0042AUTOMATION',
};

export function getPathPluginCode(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '');
  let best: string | undefined;
  for (const prefix of Object.keys(PATH_TO_PLUGIN)) {
    if (clean === prefix || clean.startsWith(prefix + '/')) {
      if (!best || prefix.length > best.length) best = prefix;
    }
  }
  return best ? PATH_TO_PLUGIN[best] : undefined;
}

/** True when the route path belongs to no plugin, or to an enabled one. */
export function isPathEnabled(
  path: string | undefined | null,
  isEnabled: UsePluginsReturn['isEnabled']
): boolean {
  const code = getPathPluginCode(path);
  if (!code) return true;
  return isEnabled(code);
}


/**
 * Returns the plugin manifest's i18n key for a sidebar item title, or
 * undefined if the item isn't owned by a known plugin. Used as a
 * translation fallback so disabled/enabled plugin labels switch language
 * with the rest of the UI.
 */
export function getSidebarPluginNameI18nKey(
  title: string | undefined | null
): string | undefined {
  const code = getSidebarPluginCode(title);
  if (!code) return undefined;
  return getPluginByCode(code)?.nameI18nKey;
}

