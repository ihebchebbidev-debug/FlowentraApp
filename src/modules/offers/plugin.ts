import type { PluginManifest } from "@/modules/shared/plugins/types";

export const offersPlugin: PluginManifest = {
  code: "PL0005OFFERS",
  moduleKey: "offers",
  category: "finance",
  nameI18nKey: "offers:plugin.name",
  descriptionI18nKey: "offers:plugin.description",
  icon: "FileText",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0001CONTACTS", "PL0007ARTICLES", "PL0037LOOKUPS"],
  routes: [],
  sidebarKeys: ["offers"],
};

export default offersPlugin;
