import type { PluginManifest } from "@/modules/shared/plugins/types";

export const documentsPlugin: PluginManifest = {
  code: "PL0012DOCUMENTS",
  moduleKey: "documents",
  category: "system",
  nameI18nKey: "documents:plugin.name",
  descriptionI18nKey: "documents:plugin.description",
  icon: "Folder",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["documents"],
};

export default documentsPlugin;
