import type { PluginManifest } from "@/modules/shared/plugins/types";

export const notificationsPlugin: PluginManifest = {
  code: "PL0029NOTIFICATIONS",
  moduleKey: "notifications",
  category: "system",
  nameI18nKey: "notifications:plugin.name",
  descriptionI18nKey: "notifications:plugin.description",
  icon: "Bell",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["notifications"],
};

export default notificationsPlugin;
