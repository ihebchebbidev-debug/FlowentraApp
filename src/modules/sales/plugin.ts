import type { PluginManifest } from "@/modules/shared/plugins/types";

export const salesPlugin: PluginManifest = {
  code: "PL0002SALES",
  moduleKey: "sales",
  category: "crm",
  nameI18nKey: "sales:plugin.name",
  descriptionI18nKey: "sales:plugin.description",
  icon: "TrendingUp",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0001CONTACTS"],
  routes: [],
  sidebarKeys: ["sales"],
};

export default salesPlugin;
