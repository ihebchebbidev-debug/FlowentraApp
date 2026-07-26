import "./localStorageShim";
import { describe, it, expect } from "vitest";
import { PROCESSES } from "../processesMock";
import { REAL_HANDLER_KEYS } from "../processesService";
import en from "../../locale/processes.en.json";
import fr from "../../locale/processes.fr.json";

/**
 * The process catalog is linked across three places by convention only:
 * the catalog entry (processesMock), the handler allowlist (processesService),
 * and the localized name/description in both locale files. A mismatch used to
 * fail silently — the process simply never rendered. These tests make the
 * linkage explicit so adding a new process fails loudly if a step is missed.
 */
const catalogKeys = new Set(PROCESSES.map((p) => p.key));

describe("processes catalog integrity", () => {
  it("every allowlisted handler key exists in the catalog", () => {
    const missing = [...REAL_HANDLER_KEYS].filter((k) => !catalogKeys.has(k));
    expect(missing).toEqual([]);
  });

  it("has no duplicate catalog keys", () => {
    expect(catalogKeys.size).toBe(PROCESSES.length);
  });

  it("every rendered process has en + fr name and description", () => {
    const items = { en: (en as Record<string, any>).items ?? {}, fr: (fr as Record<string, any>).items ?? {} };
    const gaps: string[] = [];
    for (const key of REAL_HANDLER_KEYS) {
      for (const lang of ["en", "fr"] as const) {
        const entry = items[lang][key];
        if (!entry?.name) gaps.push(`${lang}.items.${key}.name`);
        if (!entry?.description) gaps.push(`${lang}.items.${key}.description`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it("en and fr locale files expose the same key structure", () => {
    const flat = (o: unknown, prefix = ""): string[] =>
      typeof o === "object" && o !== null && !Array.isArray(o)
        ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flat(v, prefix ? `${prefix}.${k}` : k))
        : [prefix];
    const a = new Set(flat(en));
    const b = new Set(flat(fr));
    expect([...a].filter((k) => !b.has(k))).toEqual([]);
    expect([...b].filter((k) => !a.has(k))).toEqual([]);
  });
});
