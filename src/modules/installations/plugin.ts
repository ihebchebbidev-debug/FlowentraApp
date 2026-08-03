import type { PluginManifest } from "@/modules/shared/plugins/types";

/**
 * Installations — equipment installed at a customer site.
 * Needs Field (service orders/dispatches operate on installations),
 * and Articles (an installation always references an article/equipment).
 * Contacts comes in transitively through Field.
 */
export const installationsPlugin: PluginManifest = {
  code: "PL0018INSTALLATIONS",
  moduleKey: "installations",
  category: "field",
  nameI18nKey: "field:plugin.installations.name",
  descriptionI18nKey: "field:plugin.installations.description",
  icon: "Wrench",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0015FIELD", "PL0007ARTICLES"],
  routes: ["/dashboard/field/installations"],
  sidebarKeys: ["installations"],
};

export default installationsPlugin;
