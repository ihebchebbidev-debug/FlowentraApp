import type { PluginManifest } from "@/modules/shared/plugins/types";

export const authPlugin: PluginManifest = {
  code: "PL0035AUTH",
  moduleKey: "auth",
  category: "system",
  nameI18nKey: "auth:plugin.name",
  descriptionI18nKey: "auth:plugin.description",
  icon: "Lock",
  version: "1.0.0",
  isCore: true,
  dependencies: [],
  routes: [],
  sidebarKeys: ["auth"],
};

export default authPlugin;
