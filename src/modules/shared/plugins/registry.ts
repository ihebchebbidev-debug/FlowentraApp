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
