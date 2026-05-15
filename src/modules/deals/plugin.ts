import type { PluginManifest } from "@/modules/shared/plugins/types";

export const dealsPlugin: PluginManifest = {
  code: "PL0003DEALS",
  moduleKey: "deals",
  category: "crm",
  nameI18nKey: "deals:plugin.name",
  descriptionI18nKey: "deals:plugin.description",
  icon: "Handshake",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0001CONTACTS"],
  routes: [],
  sidebarKeys: ["deals"],
};

export default dealsPlugin;
