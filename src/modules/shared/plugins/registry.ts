/**
 * Plugin Registry — Auto-discovery of all module manifests.
 *
 * Each module exports a PluginManifest from `src/modules/<module>/plugin.ts`.
 * Vite eagerly imports them at build time — no runtime cost.
 */
import type { PluginManifest, PluginCategory } from './types';

// Eager glob: pulls every module's plugin.ts into the bundle at build time.
const modules = import.meta.glob<{ default?: PluginManifest } & Record<string, PluginManifest>>(
  '/src/modules/**/plugin.ts',
  { eager: true }
);

const _registry = new Map<string, PluginManifest>();

for (const [path, mod] of Object.entries(modules)) {
  // Prefer default export, fall back to first named PluginManifest export.
  const manifest =
    mod.default ??
    (Object.values(mod).find(
      (v): v is PluginManifest =>
        !!v && typeof v === 'object' && typeof (v as PluginManifest).code === 'string'
    ) as PluginManifest | undefined);

  if (!manifest) {
    if (import.meta.env.DEV) {
      console.warn(`[plugins] No manifest exported from ${path}`);
    }
    continue;
  }

  if (_registry.has(manifest.code)) {
    if (import.meta.env.DEV) {
      console.warn(
        `[plugins] Duplicate plugin code "${manifest.code}" at ${path} — ignored.`
      );
    }
    continue;
  }
  _registry.set(manifest.code, manifest);
}

// ───────────── Public API ─────────────

export function getAllPlugins(): PluginManifest[] {
  return Array.from(_registry.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function getPluginByCode(code: string): PluginManifest | undefined {
  return _registry.get(code);
}

export function getPluginsByCategory(category: PluginCategory): PluginManifest[] {
  return getAllPlugins().filter((p) => p.category === category);
}

export function getPluginByModuleKey(moduleKey: string): PluginManifest | undefined {
  return getAllPlugins().find((p) => p.moduleKey === moduleKey);
}

/**
 * Returns plugin codes that depend on the given code AND are present in the
 * registry. Used for cascade-disable warnings.
 */
export function getDependentsOf(code: string): PluginManifest[] {
  return getAllPlugins().filter((p) => p.dependencies.includes(code));
}

export const ALL_PLUGIN_CODES = (): string[] => getAllPlugins().map((p) => p.code);

// ───────────── Graph helpers (transitive) ─────────────

/**
 * All codes this plugin needs, directly or transitively.
 * Enabling a plugin must enable this whole set.
 */
export function getTransitiveDependencies(code: string): string[] {
  const out = new Set<string>();
  const walk = (c: string) => {
    const m = getPluginByCode(c);
    if (!m) return;
    for (const dep of m.dependencies) {
      if (out.has(dep)) continue;
      out.add(dep);
      walk(dep);
    }
  };
  walk(code);
  out.delete(code);
  return Array.from(out);
}

/**
 * All codes that break if this plugin goes off, directly or transitively.
 * Disabling a plugin must disable this whole set (cascade).
 */
export function getTransitiveDependents(code: string): string[] {
  const out = new Set<string>();
  const walk = (c: string) => {
    for (const dep of getDependentsOf(c)) {
      if (out.has(dep.code)) continue;
      out.add(dep.code);
      walk(dep.code);
    }
  };
  walk(code);
  out.delete(code);
  return Array.from(out);
}

/** Codes referenced as dependencies but not present in the registry. */
export function getUnknownDependencies(): { code: string; missing: string[] }[] {
  const all = getAllPlugins();
  const known = new Set(all.map((p) => p.code));
  return all
    .map((p) => ({ code: p.code, missing: p.dependencies.filter((d) => !known.has(d)) }))
    .filter((r) => r.missing.length > 0);
}

/** Returns cycles found in the dependency graph (empty array = acyclic). */
export function getDependencyCycles(): string[][] {
  const cycles: string[][] = [];
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];

  const visit = (code: string) => {
    const s = state.get(code) ?? 0;
    if (s === 1) {
      cycles.push([...stack.slice(stack.indexOf(code)), code]);
      return;
    }
    if (s === 2) return;
    state.set(code, 1);
    stack.push(code);
    for (const dep of getPluginByCode(code)?.dependencies ?? []) visit(dep);
    stack.pop();
    state.set(code, 2);
  };

  for (const p of getAllPlugins()) visit(p.code);
  return cycles;
}

if (import.meta.env.DEV) {
  const unknown = getUnknownDependencies();
  if (unknown.length) console.error('[plugins] Unknown dependency codes:', unknown);
  const cycles = getDependencyCycles();
  if (cycles.length) console.error('[plugins] Dependency cycles detected:', cycles);
}
