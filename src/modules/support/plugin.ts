import type { PluginManifest } from "@/modules/shared/plugins/types";

export const supportPlugin: PluginManifest = {
  code: "PL0006SUPPORT",
  moduleKey: "support",
  category: "comms",
  nameI18nKey: "support:plugin.name",
  descriptionI18nKey: "support:plugin.description",
  icon: "LifeBuoy",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["support"],
};

export default supportPlugin;
