import type { PluginManifest } from "@/modules/shared/plugins/types";

export const settingsPlugin: PluginManifest = {
  code: "PL0034SETTINGS",
  moduleKey: "settings",
  category: "system",
  nameI18nKey: "settings:plugin.name",
  descriptionI18nKey: "settings:plugin.description",
  icon: "Settings",
  version: "1.0.0",
  isCore: true,
  dependencies: [],
  routes: [],
  sidebarKeys: ["settings"],
};

export default settingsPlugin;
