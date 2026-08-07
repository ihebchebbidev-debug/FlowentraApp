import type { PluginManifest } from "@/modules/shared/plugins/types";

export const systemPlugin: PluginManifest = {
  code: "PL0033SYSTEM",
  moduleKey: "system",
  category: "system",
  nameI18nKey: "system:plugin.name",
  descriptionI18nKey: "system:plugin.description",
  icon: "Server",
  version: "1.0.0",
  isCore: true,
  dependencies: [],
  routes: [],
  sidebarKeys: ["system"],
};

export default systemPlugin;
