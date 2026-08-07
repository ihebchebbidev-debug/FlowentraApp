import type { PluginManifest } from "@/modules/shared/plugins/types";

export const lookupsPlugin: PluginManifest = {
  code: "PL0037LOOKUPS",
  moduleKey: "lookups",
  category: "system",
  nameI18nKey: "lookups:plugin.name",
  descriptionI18nKey: "lookups:plugin.description",
  icon: "Database",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["lookups"],
};

export default lookupsPlugin;
