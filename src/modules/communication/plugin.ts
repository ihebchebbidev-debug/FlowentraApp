import type { PluginManifest } from "@/modules/shared/plugins/types";

export const communicationPlugin: PluginManifest = {
  code: "PL0027COMMUNICATION",
  moduleKey: "communication",
  category: "comms",
  nameI18nKey: "communication:plugin.name",
  descriptionI18nKey: "communication:plugin.description",
  icon: "MessageSquare",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["communication"],
};

export default communicationPlugin;
