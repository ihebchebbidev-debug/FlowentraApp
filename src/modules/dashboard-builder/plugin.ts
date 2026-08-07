import type { PluginManifest } from "@/modules/shared/plugins/types";

export const dashboardBuilderPlugin: PluginManifest = {
  code: "PL0039DASHBLDR",
  moduleKey: "dashboard-builder",
  category: "analytics",
  nameI18nKey: "dashboard-builder:plugin.name",
  descriptionI18nKey: "dashboard-builder:plugin.description",
  icon: "LayoutDashboard",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["dashboard-builder"],
};

export default dashboardBuilderPlugin;
