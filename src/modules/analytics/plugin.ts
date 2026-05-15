import type { PluginManifest } from "@/modules/shared/plugins/types";

export const analyticsPlugin: PluginManifest = {
  code: "PL0040ANALYTICS",
  moduleKey: "analytics",
  category: "analytics",
  nameI18nKey: "analytics:plugin.name",
  descriptionI18nKey: "analytics:plugin.description",
  icon: "BarChart3",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["analytics"],
};

export default analyticsPlugin;
