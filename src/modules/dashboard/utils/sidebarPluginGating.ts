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
  services: 'PL0016SERVICEORDERS',
  'time-expenses': 'PL0021TIMEEXPENSES',
  planner: 'PL0024DISPATCHER',
  // Finance
  purchases: 'PL0025PURCHASES',
  // Comms
  emails: 'PL0028EMAILCALENDAR',
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

