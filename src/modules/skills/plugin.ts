import type { PluginManifest } from "@/modules/shared/plugins/types";

export const skillsPlugin: PluginManifest = {
  code: "PL0014SKILLS",
  moduleKey: "skills",
  category: "hr",
  nameI18nKey: "skills:plugin.name",
  descriptionI18nKey: "skills:plugin.description",
  icon: "Star",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["skills"],
};

export default skillsPlugin;
