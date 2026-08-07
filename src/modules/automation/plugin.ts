import type { PluginManifest } from "@/modules/shared/plugins/types";

export const automationPlugin: PluginManifest = {
  code: "PL0042AUTOMATION",
  moduleKey: "automation",
  category: "system",
  nameI18nKey: "automation:plugin.name",
  descriptionI18nKey: "automation:plugin.description",
  icon: "Zap",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["automation"],
};

export default automationPlugin;
