import type { PluginManifest } from "@/modules/shared/plugins/types";

export const inventoryServicesPlugin: PluginManifest = {
  code: "PL0008INVSERVICES",
  moduleKey: "inventory-services",
  category: "finance",
  nameI18nKey: "inventory-services:plugin.name",
  descriptionI18nKey: "inventory-services:plugin.description",
  icon: "Boxes",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0007ARTICLES", "PL0037LOOKUPS"],
  routes: [],
  sidebarKeys: ["inventory-services"],
};

export default inventoryServicesPlugin;
