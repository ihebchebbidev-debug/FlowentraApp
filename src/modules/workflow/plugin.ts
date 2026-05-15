import type { PluginManifest } from "@/modules/shared/plugins/types";

export const workflowPlugin: PluginManifest = {
  code: "PL0031WORKFLOW",
  moduleKey: "workflow",
  category: "system",
  nameI18nKey: "workflow:plugin.name",
  descriptionI18nKey: "workflow:plugin.description",
  icon: "GitBranch",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["workflow"],
};

export default workflowPlugin;
