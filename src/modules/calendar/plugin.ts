import type { PluginManifest } from "@/modules/shared/plugins/types";

export const calendarPlugin: PluginManifest = {
  code: "PL0010CALENDAR",
  moduleKey: "calendar",
  category: "system",
  nameI18nKey: "calendar:plugin.name",
  descriptionI18nKey: "calendar:plugin.description",
  icon: "Calendar",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["calendar"],
};

export default calendarPlugin;
