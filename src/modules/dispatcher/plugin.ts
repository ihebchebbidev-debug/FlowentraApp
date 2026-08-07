import type { PluginManifest } from "@/modules/shared/plugins/types";

export const dispatcherPlugin: PluginManifest = {
  code: "PL0024DISPATCHER",
  moduleKey: "dispatcher",
  category: "field",
  nameI18nKey: "dispatcher:plugin.name",
  descriptionI18nKey: "dispatcher:plugin.description",
  icon: "Map",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0015FIELD", "PL0037LOOKUPS"],
  routes: [],
  sidebarKeys: ["dispatcher"],
};

export default dispatcherPlugin;
