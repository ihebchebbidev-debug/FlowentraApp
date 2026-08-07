import type { PluginManifest } from "@/modules/shared/plugins/types";

export const externalPlugin: PluginManifest = {
  code: "PL0030EXTERNAL",
  moduleKey: "external",
  category: "system",
  nameI18nKey: "external:plugin.name",
  descriptionI18nKey: "external:plugin.description",
  icon: "Webhook",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["external"],
};

export default externalPlugin;
