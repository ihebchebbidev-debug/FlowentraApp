import type { PluginManifest } from "@/modules/shared/plugins/types";

export const projectsPlugin: PluginManifest = {
  code: "PL0004PROJECTS",
  moduleKey: "projects",
  category: "crm",
  nameI18nKey: "projects:plugin.name",
  descriptionI18nKey: "projects:plugin.description",
  icon: "Briefcase",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0001CONTACTS"],
  routes: [],
  sidebarKeys: ["projects"],
};

export default projectsPlugin;
