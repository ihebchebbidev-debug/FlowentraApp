import type { PluginManifest } from "@/modules/shared/plugins/types";

export const aiAssistantPlugin: PluginManifest = {
  code: "PL0041AIASSISTANT",
  moduleKey: "ai-assistant",
  category: "analytics",
  nameI18nKey: "ai-assistant:plugin.name",
  descriptionI18nKey: "ai-assistant:plugin.description",
  icon: "Sparkles",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["ai-assistant"],
};

export default aiAssistantPlugin;
