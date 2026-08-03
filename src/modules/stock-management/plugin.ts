import type { PluginManifest } from "@/modules/shared/plugins/types";

export const stockManagementPlugin: PluginManifest = {
  code: "PL0009STOCK",
  moduleKey: "stock-management",
  category: "finance",
  nameI18nKey: "stock-management:plugin.name",
  descriptionI18nKey: "stock-management:plugin.description",
  icon: "Warehouse",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0007ARTICLES", "PL0037LOOKUPS"],
  routes: [],
  sidebarKeys: ["stock-management"],
};

export default stockManagementPlugin;
