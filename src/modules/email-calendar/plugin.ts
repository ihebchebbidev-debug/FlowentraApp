import type { PluginManifest } from "@/modules/shared/plugins/types";

export const emailCalendarPlugin: PluginManifest = {
  code: "PL0028EMAILCALENDAR",
  moduleKey: "email-calendar",
  category: "comms",
  nameI18nKey: "email-calendar:plugin.name",
  descriptionI18nKey: "email-calendar:plugin.description",
  icon: "Mail",
  version: "1.0.0",
  isCore: false,
  dependencies: [],
  routes: [],
  sidebarKeys: ["email-calendar"],
};

export default emailCalendarPlugin;
