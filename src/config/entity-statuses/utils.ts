// ============================================================================
// Shared Status Color & Translation Utilities
// Derives CSS classes and translation keys from the centralized config.
// Use these instead of hardcoded getStatusColor/getStatusBadge functions.
// ============================================================================

import { entityStatusConfigs, getStatusById } from './index';
import type { EntityType, StatusColor, StatusDefinition } from './types';

// ---------------------------------------------------------------------------
// CSS class map: StatusColor → Tailwind classes for badge/pill rendering
// Uses semantic design tokens where possible, with dark mode support.
// ---------------------------------------------------------------------------
const statusColorClasses: Record<StatusColor, string> = {
  default:     'bg-muted text-muted-foreground border-muted',
  primary:     'bg-primary/10 text-primary border-primary/20',
  success:     'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  warning:     'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  destructive: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  info:        'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  muted:       'bg-muted/50 text-muted-foreground border-muted',
};

// ---------------------------------------------------------------------------
// Solid color map: StatusColor → solid background Tailwind classes
// Used by planning board blocks, calendar chips, and other prominent indicators.
// ---------------------------------------------------------------------------
const statusSolidColorClasses: Record<StatusColor, { bg: string; text: string }> = {
  default:     { bg: 'bg-muted',      text: 'text-muted-foreground' },
  primary:     { bg: 'bg-primary',    text: 'text-primary-foreground' },
  success:     { bg: 'bg-green-500',  text: 'text-green-50' },
  warning:     { bg: 'bg-amber-500',  text: 'text-amber-50' },
  destructive: { bg: 'bg-red-500',    text: 'text-red-50' },
  info:        { bg: 'bg-blue-500',   text: 'text-blue-50' },
  muted:       { bg: 'bg-muted',      text: 'text-muted-foreground' },
};

// Dot indicator colors (for filter chips, legend dots, etc.)
const statusDotColors: Record<StatusColor, string> = {
  default:     'bg-gray-500',
  primary:     'bg-primary',
  success:     'bg-green-500',
  warning:     'bg-amber-500',
  destructive: 'bg-red-500',
  info:        'bg-blue-500',
  muted:       'bg-gray-400',
};

const DEFAULT_CLASS = statusColorClasses.default;
const DEFAULT_SOLID = statusSolidColorClasses.default;

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Get CSS badge classes for a given entity status, derived from centralized config.
 * @example getStatusColorClass('offer', 'accepted') → "bg-green-500/10 text-green-700 ..."
 */
export function getStatusColorClass(entityType: EntityType, statusId: string): string {
  const config = entityStatusConfigs[entityType];
  if (!config) return DEFAULT_CLASS;
  const status = getStatusById(config, statusId);
  if (!status) return DEFAULT_CLASS;
  return statusColorClasses[status.color] ?? DEFAULT_CLASS;
}

/**
 * Get CSS badge classes directly from a StatusColor value.
 * Useful when you already have the color from config.
 */
export function getColorClasses(color: StatusColor): string {
  return statusColorClasses[color] ?? DEFAULT_CLASS;
}

/**
 * Get the module-scoped translation key for a status.
 * @example getStatusTranslationKey('offer', 'draft') → "status.draft"
 */
export function getStatusTranslationKey(entityType: EntityType, statusId: string): string {
  const config = entityStatusConfigs[entityType];
  if (!config) return statusId;
  const status = getStatusById(config, statusId);
  return status?.translationKey ?? statusId;
}

/**
 * Get the workflow-scoped translation key for a status.
 * @example getStatusWorkflowKey('offer', 'draft') → "status.offer.draft"
 */
export function getStatusWorkflowKey(entityType: EntityType, statusId: string): string {
  const config = entityStatusConfigs[entityType];
  if (!config) return statusId;
  const status = getStatusById(config, statusId);
  return status?.workflowTranslationKey ?? statusId;
}

/**
 * Universal status color resolver — tries all entity configs to find a match.
 * Useful in cross-entity views (global search, dashboards) where entity type is unknown.
 */
export function getUniversalStatusColorClass(statusId: string): string {
  const normalizedId = statusId?.toLowerCase();
  for (const config of Object.values(entityStatusConfigs)) {
    // Direct ID match
    const directMatch = config.statuses.find(s => s.id === normalizedId);
    if (directMatch) return statusColorClasses[directMatch.color] ?? DEFAULT_CLASS;
    // Alias match
    const aliasMatch = config.statuses.find(s => s.aliases?.includes(normalizedId));
    if (aliasMatch) return statusColorClasses[aliasMatch.color] ?? DEFAULT_CLASS;
  }
  return DEFAULT_CLASS;
}

/**
 * Get solid background CSS classes for planning board blocks and calendar chips.
 * Returns { bg, text } for prominent color indicators.
 * @example getStatusSolidClasses('dispatch', 'pending') → { bg: 'bg-amber-500', text: 'text-amber-50' }
 */
export function getStatusSolidClasses(entityType: EntityType, statusId: string): { bg: string; text: string } {
  const config = entityStatusConfigs[entityType];
  if (!config) return DEFAULT_SOLID;
  const status = getStatusById(config, statusId);
  if (!status) return DEFAULT_SOLID;
  return statusSolidColorClasses[status.color] ?? DEFAULT_SOLID;
}

/**
 * Get a dot/indicator color class for a status.
 * @example getStatusDotColor('dispatch', 'assigned') → "bg-primary"
 */
export function getStatusDotColor(entityType: EntityType, statusId: string): string {
  const config = entityStatusConfigs[entityType];
  if (!config) return statusDotColors.default;
  const status = getStatusById(config, statusId);
  if (!status) return statusDotColors.default;
  return statusDotColors[status.color] ?? statusDotColors.default;
}
