// Types for the docs translation layer.
//
// The English content in ../guides/* and DocumentationPage.tsx stays the single
// source of truth. A locale file only supplies *overrides*, keyed by the English
// source text (workflow name, rule title, status name, screenshot src, route).
// Anything a locale does not translate falls back to English automatically, so
// translations can be filled in progressively without ever breaking the page.

export type GuideWorkflowOverride = {
  name?: string;
  /** Same length/order as the English steps. Missing entries fall back. */
  steps?: (string | undefined)[];
};

export type GuideRuleOverride = {
  title?: string;
  detail?: string;
};

export type GuideOverride = {
  purpose?: string;
  /** Keyed by the English workflow name. */
  workflows?: Record<string, GuideWorkflowOverride>;
  /** Keyed by the English rule title. */
  rules?: Record<string, GuideRuleOverride>;
  /** Keyed by the status name (status names are code values, kept as-is). */
  statuses?: Record<string, string>;
  /** Same length/order as the English list. */
  integrations?: (string | undefined)[];
  /** Same length/order as the English list. */
  gotchas?: (string | undefined)[];
};

export type GuideOverrideMap = Record<string, GuideOverride>;

export type ModuleDocOverride = {
  name?: string;
  description?: string;
  /** Same length/order as the English features list. */
  features?: (string | undefined)[];
  /** Keyed by route path. */
  routes?: Record<string, string>;
};

export type ModuleDocOverrideMap = Record<string, ModuleDocOverride>;

export type ShotOverride = {
  caption?: string;
  details?: (string | undefined)[];
  whatYouCanDo?: (string | undefined)[];
  fieldsActions?: (string | undefined)[];
};

/** Keyed by screenshot `src`. */
export type ShotOverrideMap = Record<string, ShotOverride>;

export type NavItemOverride = { label?: string; description?: string };

/** Keyed by route path. */
export type NavOverrideMap = Record<string, NavItemOverride>;

export type DocsLocalePack = {
  /** Category label overrides, keyed by the English category name. */
  categories?: Record<string, string>;
  modules?: ModuleDocOverrideMap;
  guides?: GuideOverrideMap;
  shots?: ShotOverrideMap;
  nav?: NavOverrideMap;
};
