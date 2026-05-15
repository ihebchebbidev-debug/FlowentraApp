import type { PluginManifest } from "@/modules/shared/plugins/types";

export const hrPlugin: PluginManifest = {
  code: "PL0013HR",
  moduleKey: "hr",
  category: "hr",
  nameI18nKey: "hr:plugin.name",
  descriptionI18nKey: "hr:plugin.description",
  icon: "UserCog",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["hr"],
};

export default hrPlugin;
