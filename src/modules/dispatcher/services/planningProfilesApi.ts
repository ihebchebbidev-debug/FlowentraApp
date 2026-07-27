// Planning Profiles API service.
// Talks to /api/planning-profiles. Uses a localStorage mirror (per-tenant + per-user
// namespaced) as a resiliency fallback for preview environments where the backend
// isn't reachable. IMPORTANT: keys MUST include tenantId:userId so profiles never
// leak across tenants/users on a shared browser.
import { toast } from 'sonner';
import { apiFetch } from '@/services/api/apiClient';
import { getActiveCompanyId } from '@/utils/targetTenant';
import {
  DEFAULT_PLANNING_SETTINGS,
  type CreatePlanningProfileDto,
  type PlanningProfile,
  type UpdatePlanningProfileDto,
} from '../types/planningProfile';

const BASE = '/api/planning-profiles';

function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('user');
    if (raw) return String((JSON.parse(raw) as { id?: string | number }).id ?? 'me');
  } catch { /* noop */ }
  return 'me';
}

// Namespace the local mirror by tenant + user so switching companies or users
// on a shared browser never surfaces someone else's profiles / visibleUserIds /
// requiredSkillIds. Keys look like: planning_profiles_v2:<tenantId>:<userId>
function scope(): string {
  const tenant = getActiveCompanyId() ?? 'anon';
  return `${tenant}:${getCurrentUserId()}`;
}
function storageKey(): string { return `planning_profiles_v2:${scope()}`; }
function activeKey(): string { return `planning_profiles_active_v2:${scope()}`; }

function readLocal(): PlanningProfile[] {
  try {
    const raw = localStorage.getItem(storageKey());
    return raw ? (JSON.parse(raw) as PlanningProfile[]) : [];
  } catch { return []; }
}
function writeLocal(list: PlanningProfile[]) {
  localStorage.setItem(storageKey(), JSON.stringify(list));
}

function ensureDefaultProfile(): PlanningProfile {
  const list = readLocal();
  let def = list.find(p => p.name === 'Default');
  if (!def) {
    def = {
      id: `local-${Date.now()}`,
      ownerUserId: getCurrentUserId(),
      name: 'Default',
      description: 'Auto-created default planning profile',
      icon: 'CalendarDays',
      isShared: false,
      visibleUserIds: [],
      settings: { ...DEFAULT_PLANNING_SETTINGS },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(def);
    writeLocal(list);
    localStorage.setItem(activeKey(), def.id);
  }
  return def;
}

// Distinguish "endpoint not deployed / unreachable" (silent fallback OK) from
// "backend returned a real error" (surface to the user — silently degrading here
// is what caused the cross-tenant leak in the first place: users thought edits
// saved but they were only local).
async function tryBackend<T>(
  fn: () => Promise<{ data: T | null; status: number; error?: string }>,
  opts: { surface?: boolean; label?: string } = {},
): Promise<T | null> {
  const { surface = true, label = 'planning profile' } = opts;
  try {
    const res = await fn();
    if (res.status >= 200 && res.status < 300 && res.data) return res.data;
    // 404/501 = endpoint missing → silent fallback. Anything else is a real error.
    const missing = res.status === 404 || res.status === 501 || res.status === 0;
    if (!missing && surface && res.status !== 401 && res.status !== 403) {
      toast.error(`Failed to sync ${label}${res.error ? `: ${res.error}` : ''}`);
    }
    return null;
  } catch (err) {
    if (surface) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to sync ${label}: ${message}`);
    }
    return null;
  }
}

// Coerce a profile coming back from the backend (or cache) into a stable shape so
// the board ALWAYS finds `settings` as a plain object.
function normalizeProfile<T extends { settings?: unknown; Settings?: unknown }>(raw: T): T {
  if (!raw || typeof raw !== 'object') return raw;
  let s: any = (raw as any).settings ?? (raw as any).Settings ?? {};
  if (typeof s === 'string') { try { s = JSON.parse(s); } catch { s = {}; } }
  if (!s || typeof s !== 'object') s = {};
  (raw as any).settings = { ...DEFAULT_PLANNING_SETTINGS, ...s };
  delete (raw as any).Settings;
  return raw;
}

export const planningProfilesApi = {
  async list(): Promise<PlanningProfile[]> {
    const remote = await tryBackend<PlanningProfile[]>(
      () => apiFetch<PlanningProfile[]>(BASE),
      { label: 'planning profiles' },
    );
    if (remote) { const norm = remote.map(normalizeProfile); writeLocal(norm); return norm; }
    const local = readLocal();
    if (local.length === 0) { ensureDefaultProfile(); return readLocal(); }
    return local.map(normalizeProfile);
  },

  async getActive(): Promise<PlanningProfile> {
    const remote = await tryBackend<PlanningProfile>(
      () => apiFetch<PlanningProfile>(`${BASE}/active`),
      { surface: false }, // Active lookup is best-effort on every load; don't spam toasts.
    );
    if (remote) return normalizeProfile(remote);
    const activeId = localStorage.getItem(activeKey());
    const list = readLocal();
    const found = activeId ? list.find(p => String(p.id) === activeId) : null;
    return normalizeProfile(found ?? ensureDefaultProfile());
  },

  async setActive(rawId: string): Promise<void> {
    const id = String(rawId);
    await tryBackend<unknown>(
      () => apiFetch(`${BASE}/active/${id}`, { method: 'PUT' }),
      { label: 'active planning profile' },
    );
    localStorage.setItem(activeKey(), id);
  },

  async create(dto: CreatePlanningProfileDto): Promise<PlanningProfile> {
    const remote = await tryBackend<PlanningProfile>(
      () => apiFetch<PlanningProfile>(BASE, { method: 'POST', body: JSON.stringify(dto) }),
      { label: 'planning profile' },
    );
    if (remote) return normalizeProfile(remote);
    const profile: PlanningProfile = {
      id: `local-${Date.now()}`,
      ownerUserId: getCurrentUserId(),
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
      isShared: dto.isShared ?? false,
      visibleUserIds: dto.visibleUserIds,
      requiredSkillIds: dto.requiredSkillIds,
      settings: dto.settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const list = readLocal();
    list.push(profile);
    writeLocal(list);
    return profile;
  },

  async update(rawId: string, dto: UpdatePlanningProfileDto): Promise<PlanningProfile> {
    const id = String(rawId);
    if (id.startsWith('local-')) {
      const existing = readLocal().find(p => String(p.id) === id);
      const merged = { ...(existing ?? {}), ...dto } as PlanningProfile;
      const createBody: CreatePlanningProfileDto = {
        name: merged.name ?? 'Default',
        description: merged.description,
        color: merged.color,
        icon: merged.icon,
        isShared: merged.isShared ?? false,
        visibleUserIds: merged.visibleUserIds ?? [],
        requiredSkillIds: merged.requiredSkillIds,
        settings: merged.settings ?? { ...DEFAULT_PLANNING_SETTINGS },
      };
      const created = await tryBackend<PlanningProfile>(
        () => apiFetch<PlanningProfile>(BASE, { method: 'POST', body: JSON.stringify(createBody) }),
        { label: 'planning profile' },
      );
      if (created) {
        const norm = normalizeProfile(created);
        const next = readLocal().filter(p => String(p.id) !== id);
        next.push(norm);
        writeLocal(next);
        if (localStorage.getItem(activeKey()) === id) localStorage.setItem(activeKey(), String(norm.id));
        return norm;
      }
      const list = readLocal();
      const idx = list.findIndex(p => String(p.id) === id);
      if (idx === -1) {
        const local = {
          id,
          ownerUserId: getCurrentUserId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...createBody,
        } as PlanningProfile;
        list.push(local);
        writeLocal(list);
        return local;
      }
      list[idx] = { ...list[idx], ...dto, updatedAt: new Date().toISOString() } as PlanningProfile;
      writeLocal(list);
      return list[idx];
    }

    const remote = await tryBackend<PlanningProfile>(
      () => apiFetch<PlanningProfile>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
      { label: 'planning profile' },
    );
    if (remote) {
      const norm = normalizeProfile(remote);
      const list = readLocal();
      const idx = list.findIndex(p => String(p.id) === id);
      if (idx !== -1) list[idx] = norm;
      else list.push(norm);
      writeLocal(list);
      return norm;
    }
    const list = readLocal();
    const idx = list.findIndex(p => String(p.id) === id);
    if (idx === -1) {
      const local = {
        id,
        ownerUserId: getCurrentUserId(),
        name: dto.name ?? 'Default',
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        isShared: dto.isShared ?? false,
        visibleUserIds: dto.visibleUserIds ?? [],
        requiredSkillIds: dto.requiredSkillIds,
        settings: dto.settings ?? { ...DEFAULT_PLANNING_SETTINGS },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as PlanningProfile;
      list.push(local);
      writeLocal(list);
      return local;
    }
    list[idx] = { ...list[idx], ...dto, updatedAt: new Date().toISOString() } as PlanningProfile;
    writeLocal(list);
    return list[idx];
  },

  async remove(rawId: string): Promise<void> {
    const id = String(rawId);
    await tryBackend<unknown>(
      () => apiFetch(`${BASE}/${id}`, { method: 'DELETE' }),
      { label: 'planning profile' },
    );
    const list = readLocal().filter(p => String(p.id) !== id);
    writeLocal(list);
    if (localStorage.getItem(activeKey()) === id) {
      localStorage.removeItem(activeKey());
    }
  },

  async duplicate(rawId: string, newName: string): Promise<PlanningProfile> {
    const id = String(rawId);
    const list = await this.list();
    const src = list.find(p => String(p.id) === id);
    if (!src) throw new Error('Profile not found');
    return this.create({
      name: newName,
      description: src.description,
      color: src.color,
      icon: src.icon,
      isShared: false,
      visibleUserIds: [...src.visibleUserIds],
      requiredSkillIds: src.requiredSkillIds ? [...src.requiredSkillIds] : undefined,
      settings: { ...src.settings },
    });
  },
};

// Clear the local mirror when the tenant/company switches so nothing from the
// previous tenant's cache bleeds into the new one before the backend responds.
if (typeof window !== 'undefined') {
  window.addEventListener('flowentra:target-tenant-changed', () => {
    // Drop stale in-memory reads by touching localStorage keys? Nothing to do —
    // storageKey()/activeKey() now resolve to the NEW scope on next call. The old
    // scope's entries can safely remain (they'll be reused if the user switches back).
  });
}
