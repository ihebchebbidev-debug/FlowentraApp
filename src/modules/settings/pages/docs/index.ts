import type { ModuleGuide, ModuleGuideMap } from "./types";
import { SALES_CYCLE_GUIDES } from "./guides/sales-cycle";
import { INVENTORY_GUIDES } from "./guides/inventory";
import { FIELD_SERVICE_GUIDES } from "./guides/field-service";
import { ADMIN_GUIDES } from "./guides/administration";
import { PLATFORM_GUIDES } from "./guides/platform";
import { SYSTEM_EXTRA_GUIDES } from "./guides/system-extra";

export * from "./types";
export { NAVIGATION_MAP } from "./navigationMap";
export type { NavGroupDoc } from "./navigationMap";

/** All hand-audited module guides, merged into one lookup. */
export const MODULE_GUIDES: ModuleGuideMap = {
  ...SALES_CYCLE_GUIDES,
  ...INVENTORY_GUIDES,
  ...FIELD_SERVICE_GUIDES,
  ...ADMIN_GUIDES,
  ...PLATFORM_GUIDES,
  ...SYSTEM_EXTRA_GUIDES,
};

export function getModuleGuide(key: string): ModuleGuide | undefined {
  return MODULE_GUIDES[key];
}

/** Number of modules that have a written guide (used for coverage stats). */
export const GUIDE_COUNT = Object.keys(MODULE_GUIDES).length;

/** Flattened search corpus for a guide — used by the docs search box. */
export function guideSearchText(guide: ModuleGuide): string {
  return [
    guide.purpose,
    ...guide.workflows.flatMap((w) => [w.name, ...w.steps]),
    ...guide.rules.flatMap((r) => [r.title, r.detail]),
    ...(guide.statuses ?? []).flatMap((s) => [s.name, s.meaning]),
    ...(guide.integrations ?? []),
    ...(guide.gotchas ?? []),
  ]
    .join(" ")
    .toLowerCase();
}
