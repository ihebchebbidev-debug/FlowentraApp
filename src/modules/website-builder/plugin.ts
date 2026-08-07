import type { PluginManifest } from "@/modules/shared/plugins/types";

export const websiteBuilderPlugin: PluginManifest = {
  code: "PL0038WEBSITEBLDR",
  moduleKey: "website-builder",
  category: "system",
  nameI18nKey: "website-builder:plugin.name",
  descriptionI18nKey: "website-builder:plugin.description",
  icon: "Globe",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["website-builder"],
};

export default websiteBuilderPlugin;
