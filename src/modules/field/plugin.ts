import type { PluginManifest } from "@/modules/shared/plugins/types";

export const fieldPlugin: PluginManifest = {
  code: "PL0015FIELD",
  moduleKey: "field",
  category: "field",
  nameI18nKey: "field:plugin.name",
  descriptionI18nKey: "field:plugin.description",
  icon: "Wrench",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0001CONTACTS"],
  routes: [],
  sidebarKeys: ["field"],
};

export default fieldPlugin;
