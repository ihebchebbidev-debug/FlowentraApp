import type { PluginManifest } from "@/modules/shared/plugins/types";

export const preferencesPlugin: PluginManifest = {
  code: "PL0044PREFERENCES",
  moduleKey: "preferences",
  category: "system",
  nameI18nKey: "preferences:plugin.name",
  descriptionI18nKey: "preferences:plugin.description",
  icon: "Sliders",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["preferences"],
};

export default preferencesPlugin;
