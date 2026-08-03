import type { PluginManifest } from "@/modules/shared/plugins/types";

export const paymentsPlugin: PluginManifest = {
  code: "PL0026PAYMENTS",
  moduleKey: "payments",
  category: "finance",
  nameI18nKey: "payments:plugin.name",
  descriptionI18nKey: "payments:plugin.description",
  icon: "CreditCard",
  version: "1.0.0",
  isCore: false,
  dependencies: ["PL0004INVOICES"],
  routes: [],
  sidebarKeys: ["payments"],
};

export default paymentsPlugin;
