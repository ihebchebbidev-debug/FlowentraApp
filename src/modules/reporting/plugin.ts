import type { PluginManifest } from "@/modules/shared/plugins/types";

/**
 * Reporting owns every cross-module dashboard (/dashboard/reporting/*).
 * When it is deactivated no workspace shows its dashboard entry, and the
 * reporting routes themselves are gated off — regardless of which business
 * modules are active.
 */
export const reportingPlugin: PluginManifest = {
  code: "PL0046REPORTING",
  moduleKey: "reporting",
  category: "analytics",
  nameI18nKey: "reporting:plugin.name",
  descriptionI18nKey: "reporting:plugin.description",
  icon: "BarChart3",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["reporting"],
};

export default reportingPlugin;
