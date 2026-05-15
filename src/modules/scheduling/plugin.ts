import type { PluginManifest } from "@/modules/shared/plugins/types";

export const schedulingPlugin: PluginManifest = {
  code: "PL0023SCHEDULING",
  moduleKey: "scheduling",
  category: "field",
  nameI18nKey: "scheduling:plugin.name",
  descriptionI18nKey: "scheduling:plugin.description",
  icon: "CalendarDays",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0015FIELD"],
  routes: [],
  sidebarKeys: ["scheduling"],
};

export default schedulingPlugin;
