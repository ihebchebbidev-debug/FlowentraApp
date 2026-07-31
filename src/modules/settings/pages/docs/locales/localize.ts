import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleDoc, ModuleScreenshot } from "../../DocumentationPage";
import type { ModuleGuide } from "../types";
import type { DocsLocalePack } from "./types";
import { FR_DOCS } from "./fr";

/**
 * Locale packs, keyed by i18n language prefix. English is the source content
 * itself, so it has no pack. Any locale without a pack renders English.
 */
const PACKS: Record<string, DocsLocalePack> = {
  fr: FR_DOCS,
};

function usePack(): DocsLocalePack | undefined {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "en").toLowerCase().split("-")[0];
  return PACKS[lang];
}

/** Merge an override list positionally onto the English list. */
function mergeList(base: string[] | undefined, over: (string | undefined)[] | undefined): string[] | undefined {
  if (!base) return base;
  if (!over) return base;
  return base.map((value, i) => over[i] ?? value);
}

/** Translate a category label (falls back to the English label). */
export function useCategoryLabel(): (category: string) => string {
  const pack = usePack();
  return useCallback((category: string) => pack?.categories?.[category] ?? category, [pack]);
}

/** MODULES with localized name / description / features / route labels. */
export function useLocalizedModules(modules: ModuleDoc[]): ModuleDoc[] {
  const pack = usePack();
  return useMemo(() => {
    if (!pack?.modules) return modules;
    return modules.map((m) => {
      const o = pack.modules?.[m.key];
      if (!o) return m;
      return {
        ...m,
        name: o.name ?? m.name,
        description: o.description ?? m.description,
        features: mergeList(m.features, o.features) ?? m.features,
        routes: o.routes
          ? m.routes.map((r) => ({ ...r, label: o.routes?.[r.path] ?? r.label }))
          : m.routes,
      };
    });
  }, [modules, pack]);
}

/**
 * A single module guide with localized prose.
 *
 * When a locale has no translated `purpose` but does translate the module
 * description, the description is used as the guide purpose so the page header
 * is never a mix of two languages.
 */
export function useLocalizedGuide(
  key: string | undefined,
  guide: ModuleGuide | undefined
): ModuleGuide | undefined {
  const pack = usePack();
  return useMemo(() => {
    if (!guide || !key || !pack) return guide;
    const o = pack.guides?.[key];
    const fallbackPurpose = pack.modules?.[key]?.description;
    return {
      ...guide,
      purpose: o?.purpose ?? fallbackPurpose ?? guide.purpose,
      workflows: guide.workflows.map((w) => {
        const wo = o?.workflows?.[w.name];
        if (!wo) return w;
        return { name: wo.name ?? w.name, steps: mergeList(w.steps, wo.steps) ?? w.steps };
      }),
      rules: guide.rules.map((r) => {
        const ro = o?.rules?.[r.title];
        if (!ro) return r;
        return { title: ro.title ?? r.title, detail: ro.detail ?? r.detail };
      }),
      statuses: guide.statuses?.map((s) => ({
        ...s,
        meaning: o?.statuses?.[s.name] ?? s.meaning,
      })),
      integrations: mergeList(guide.integrations, o?.integrations),
      gotchas: mergeList(guide.gotchas, o?.gotchas),
    };
  }, [guide, key, pack]);
}

/** Screenshot captions and bullet lists, localized where available. */
export function useLocalizedShots(shots: ModuleScreenshot[]): ModuleScreenshot[] {
  const pack = usePack();
  return useMemo(() => {
    if (!pack?.shots) return shots;
    return shots.map((s) => {
      const o = pack.shots?.[s.src];
      if (!o) return s;
      return {
        ...s,
        caption: o.caption ?? s.caption,
        details: mergeList(s.details, o.details),
        whatYouCanDo: mergeList(s.whatYouCanDo, o.whatYouCanDo),
        fieldsActions: mergeList(s.fieldsActions, o.fieldsActions),
      };
    });
  }, [shots, pack]);
}

/** Navigation-map label/description overrides, keyed by route path. */
export function useDocsNavLabel(): (path: string, label: string, description?: string) => {
  label: string;
  description?: string;
} {
  const pack = usePack();
  return useCallback(
    (path: string, label: string, description?: string) => {
      const o = pack?.nav?.[path];
      return { label: o?.label ?? label, description: o?.description ?? description };
    },
    [pack]
  );
}
