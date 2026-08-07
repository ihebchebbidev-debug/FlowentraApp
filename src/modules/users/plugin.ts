import type { PluginManifest } from "@/modules/shared/plugins/types";

export const usersPlugin: PluginManifest = {
  code: "PL0043USERS",
  moduleKey: "users",
  category: "system",
  nameI18nKey: "users:plugin.name",
  descriptionI18nKey: "users:plugin.description",
  icon: "User",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["users"],
};

export default usersPlugin;
