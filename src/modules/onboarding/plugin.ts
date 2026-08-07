import type { PluginManifest } from "@/modules/shared/plugins/types";

export const onboardingPlugin: PluginManifest = {
  code: "PL0045ONBOARDING",
  moduleKey: "onboarding",
  category: "system",
  nameI18nKey: "onboarding:plugin.name",
  descriptionI18nKey: "onboarding:plugin.description",
  icon: "Rocket",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["onboarding"],
};

export default onboardingPlugin;
