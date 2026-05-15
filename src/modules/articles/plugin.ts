import type { PluginManifest } from "@/modules/shared/plugins/types";

export const articlesPlugin: PluginManifest = {
  code: "PL0007ARTICLES",
  moduleKey: "articles",
  category: "finance",
  nameI18nKey: "articles:plugin.name",
  descriptionI18nKey: "articles:plugin.description",
  icon: "Package",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["articles"],
};

export default articlesPlugin;
