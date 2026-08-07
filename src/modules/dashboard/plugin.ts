import type { PluginManifest } from "@/modules/shared/plugins/types";

export const dashboardPlugin: PluginManifest = {
  code: "PL0036DASHBOARD",
  moduleKey: "dashboard",
  category: "system",
  nameI18nKey: "dashboard:plugin.name",
  descriptionI18nKey: "dashboard:plugin.description",
  icon: "Home",
  version: "1.0.0",
  isCore: true,
  dependencies: [],
  routes: [],
  sidebarKeys: ["dashboard"],
};

export default dashboardPlugin;
