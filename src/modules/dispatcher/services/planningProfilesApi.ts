// Planning Profiles API service.
// Tries the real backend (/api/planning-profiles); falls back to localStorage so
// the planning board works in preview environments where the backend isn't reachable.
import { apiFetch } from '@/services/api/apiClient';
import {
  DEFAULT_PLANNING_SETTINGS,
  type CreatePlanningProfileDto,
  type PlanningProfile,
  type UpdatePlanningProfileDto,
} from '../types/planningProfile';

const STORAGE_KEY = 'planning_profiles_v1';
const ACTIVE_KEY = 'planning_profiles_active_v1';
const BASE = '/api/planning-profiles';

function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('user');
    if (raw) return String((JSON.parse(raw) as { id?: string | number }).id ?? 'me');
  } catch { /* noop */ }
  return 'me';
}

function readLocal(): PlanningProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlanningProfile[]) : [];
  } catch { return []; }
}
function writeLocal(list: PlanningProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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
    localStorage.setItem(ACTIVE_KEY, def.id);
  }
  return def;
}

async function tryBackend<T>(fn: () => Promise<{ data: T | null; status: number; error?: string }>): Promise<T | null> {
  try {
    const res = await fn();
    if (res.status >= 200 && res.status < 300 && res.data) return res.data;
    return null;
  } catch { return null; }
}

export const planningProfilesApi = {
  async list(): Promise<PlanningProfile[]> {
    const remote = await tryBackend<PlanningProfile[]>(() => apiFetch<PlanningProfile[]>(BASE));
    if (remote) { writeLocal(remote); return remote; }
    const local = readLocal();
    if (local.length === 0) { ensureDefaultProfile(); return readLocal(); }
    return local;
  },

  async getActive(): Promise<PlanningProfile> {
    const remote = await tryBackend<PlanningProfile>(() => apiFetch<PlanningProfile>(`${BASE}/active`));
    if (remote) return remote;
    const activeId = localStorage.getItem(ACTIVE_KEY);
    const list = readLocal();
    const found = activeId ? list.find(p => p.id === activeId) : null;
    return found ?? ensureDefaultProfile();
  },

  async setActive(id: string): Promise<void> {
    // Mirror to localStorage regardless of backend success so the fallback path
    // (used when the backend is unreachable) stays consistent on next read.
    await tryBackend<unknown>(() => apiFetch(`${BASE}/active/${id}`, { method: 'PUT' }));
    localStorage.setItem(ACTIVE_KEY, id);
  },

  async create(dto: CreatePlanningProfileDto): Promise<PlanningProfile> {
    const remote = await tryBackend<PlanningProfile>(() => apiFetch<PlanningProfile>(BASE, {
      method: 'POST', body: JSON.stringify(dto),
    }));
    if (remote) return remote;
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

  async update(id: string, dto: UpdatePlanningProfileDto): Promise<PlanningProfile> {
    // A `local-` id only ever existed client-side (e.g. the auto-created Default
    // profile) and was never persisted — a PUT would 404. Persist it as a CREATE
    // instead, then swap the temporary id for the real one everywhere.
    if (id.startsWith('local-')) {
      const existing = readLocal().find(p => p.id === id);
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
      const created = await tryBackend<PlanningProfile>(() => apiFetch<PlanningProfile>(BASE, {
        method: 'POST', body: JSON.stringify(createBody),
      }));
      if (created) {
        const next = readLocal().filter(p => p.id !== id);
        next.push(created);
        writeLocal(next);
        if (localStorage.getItem(ACTIVE_KEY) === id) localStorage.setItem(ACTIVE_KEY, created.id);
        return created;
      }
      // Backend unreachable — keep it local (recreate the entry if it was lost).
      const list = readLocal();
      const idx = list.findIndex(p => p.id === id);
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

    const remote = await tryBackend<PlanningProfile>(() => apiFetch<PlanningProfile>(`${BASE}/${id}`, {
      method: 'PUT', body: JSON.stringify(dto),
    }));
    if (remote) return remote;
    const list = readLocal();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) {
      // Backend unreachable and the profile isn't cached locally — persist it
      // locally instead of throwing so the user's edit is never silently lost.
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

  async remove(id: string): Promise<void> {
    await tryBackend<unknown>(() => apiFetch(`${BASE}/${id}`, { method: 'DELETE' }));
    const list = readLocal().filter(p => p.id !== id);
    writeLocal(list);
    if (localStorage.getItem(ACTIVE_KEY) === id) {
      localStorage.removeItem(ACTIVE_KEY);
    }
  },

  async duplicate(id: string, newName: string): Promise<PlanningProfile> {
    const list = await this.list();
    const src = list.find(p => p.id === id);
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
