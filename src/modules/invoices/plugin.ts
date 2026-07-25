import type { PluginManifest } from "@/modules/shared/plugins/types";

export const invoicesPlugin: PluginManifest = {
  code: "PL0004INVOICES",
  moduleKey: "invoices",
  category: "crm",
  nameI18nKey: "invoices:plugin.name",
  descriptionI18nKey: "invoices:plugin.description",
  icon: "Receipt",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0001CONTACTS", "PL0002SALES"],
  routes: [],
  sidebarKeys: ["invoices"],
};

export default invoicesPlugin;
