/**
 * Plugin Registry — Type definitions
 *
 * Each module in the platform exports a PluginManifest from its top-level
 * plugin.ts file. The shared registry auto-discovers them via Vite glob.
 */

export type PluginCategory =
  | 'crm'
  | 'field'
  | 'hr'
  | 'finance'
  | 'system'
  | 'comms'
  | 'analytics';

export interface PluginManifest {
  /** Immutable identifier, e.g. "PL0002SALES". Never change once assigned. */
  code: string;
  /** Stable folder/key under src/modules (e.g. "sales", "field/dispatches"). */
  moduleKey: string;
  category: PluginCategory;
  /** i18n key resolving to the human-readable plugin name. */
  nameI18nKey: string;
  /** i18n key resolving to a one-paragraph description. */
  descriptionI18nKey: string;
  /** lucide-react icon name (e.g. "TrendingUp"). */
  icon: string;
  version: string;
  /** Core plugins cannot be disabled (system, settings, auth). */
  isCore: boolean;
  /** Plugin codes that must remain enabled for this one to function. */
  dependencies: string[];
  /** Routes owned by this plugin (used for route-gate redirects). */
  routes: string[];
  /** Sidebar item keys/titles owned by this plugin. */
  sidebarKeys: string[];
}

export interface PluginActivation {
  code: string;
  isEnabled: boolean;
  updatedAt?: string;
}

export interface PluginRuntimeState {
  manifest: PluginManifest;
  isEnabled: boolean;
  /** True if this plugin is disabled because a dependency is disabled. */
  hasBrokenDependency: boolean;
  /** Codes of plugins that depend on this one and are still enabled. */
  enabledDependents: string[];
}

export interface PluginToggleRequest {
  isEnabled: boolean;
  /** Cascade dependents off / dependency chain on instead of 409 conflict. */
  cascade?: boolean;
}

export interface PluginBulkToggleRequest {
  codes: string[];
  isEnabled: boolean;
  cascade?: boolean;
}

export interface PluginStats {
  active: number;
  total: number;
}
