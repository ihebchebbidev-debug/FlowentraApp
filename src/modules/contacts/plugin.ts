import type { PluginManifest } from "@/modules/shared/plugins/types";

export const contactsPlugin: PluginManifest = {
  code: "PL0001CONTACTS",
  moduleKey: "contacts",
  category: "crm",
  nameI18nKey: "contacts:plugin.name",
  descriptionI18nKey: "contacts:plugin.description",
  icon: "Users",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["contacts"],
};

export default contactsPlugin;
