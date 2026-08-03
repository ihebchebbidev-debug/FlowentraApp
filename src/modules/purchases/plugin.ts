import type { PluginManifest } from "@/modules/shared/plugins/types";

export const purchasesPlugin: PluginManifest = {
  code: "PL0025PURCHASES",
  moduleKey: "purchases",
  category: "finance",
  nameI18nKey: "purchases:plugin.name",
  descriptionI18nKey: "purchases:plugin.description",
  icon: "ShoppingCart",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0001CONTACTS", "PL0007ARTICLES"],
  routes: [],
  sidebarKeys: ["purchases"],
};

export default purchasesPlugin;
