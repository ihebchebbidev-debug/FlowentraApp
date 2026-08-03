/**
 * Single source of truth for hiding workspace navigation entries whose module
 * is deactivated for the tenant.
 *
 * Rules (identical on desktop and mobile):
 *  1. A module/child with a `pluginCode` is rendered only when that plugin is
 *     effectively enabled (its whole dependency chain must be on).
 *  2. A parent with `children` is hidden when every child is hidden.
 *  3. A workspace is hidden when it has no visible module left.
 *  4. Entries without a `pluginCode` are always visible (dashboards, reporting,
 *     traceability, settings...).
 */
import type { Workspace, WorkspaceModule } from '../components/workspaces.config';

export type IsEnabledFn = (code: string | undefined | null) => boolean;

export function visibleWorkspaceModules(
  modules: WorkspaceModule[] | undefined,
  isEnabled: IsEnabledFn
): WorkspaceModule[] {
  if (!modules) return [];
  const out: WorkspaceModule[] = [];
  for (const m of modules) {
    if (m.pluginCode && !isEnabled(m.pluginCode)) continue;
    if (m.children && m.children.length > 0) {
      const children = visibleWorkspaceModules(m.children, isEnabled);
      if (children.length === 0) continue;
      out.push({ ...m, children });
      continue;
    }
    out.push(m);
  }
  return out;
}

export function visibleWorkspaces(
  workspaces: Workspace[],
  isEnabled: IsEnabledFn
): Workspace[] {
  const out: Workspace[] = [];
  for (const ws of workspaces) {
    const modules = visibleWorkspaceModules(ws.modules, isEnabled);
    // Workspaces that only expose a landing page (no gated modules) stay visible.
    if (ws.modules.length > 0 && modules.length === 0) continue;
    out.push({ ...ws, modules });
  }
  return out;
}

/** First reachable URL for a workspace once gating is applied. */
export function workspaceEntryUrl(
  ws: Workspace,
  isEnabled: IsEnabledFn
): string {
  const modules = visibleWorkspaceModules(ws.modules, isEnabled);
  const landing = ws.modules.find((m) => m.url === ws.landingUrl);
  const landingVisible = !landing || modules.some((m) => m.key === landing.key);
  if (landingVisible) return ws.landingUrl;
  const first = modules[0];
  if (!first) return ws.landingUrl;
  return first.children?.[0]?.url ?? first.url;
}
