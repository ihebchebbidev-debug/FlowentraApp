import type { PluginManifest } from "@/modules/shared/plugins/types";

export const dynamicFormsPlugin: PluginManifest = {
  code: "PL0032DYNAMICFORMS",
  moduleKey: "dynamic-forms",
  category: "system",
  nameI18nKey: "dynamic-forms:plugin.name",
  descriptionI18nKey: "dynamic-forms:plugin.description",
  icon: "FormInput",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["dynamic-forms"],
};

export default dynamicFormsPlugin;
