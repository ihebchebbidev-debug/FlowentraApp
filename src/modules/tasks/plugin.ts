import type { PluginManifest } from "@/modules/shared/plugins/types";

export const tasksPlugin: PluginManifest = {
  code: "PL0011TASKS",
  moduleKey: "tasks",
  category: "system",
  nameI18nKey: "tasks:plugin.name",
  descriptionI18nKey: "tasks:plugin.description",
  icon: "CheckSquare",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0037LOOKUPS"],
  routes: [],
  sidebarKeys: ["tasks"],
};

export default tasksPlugin;
