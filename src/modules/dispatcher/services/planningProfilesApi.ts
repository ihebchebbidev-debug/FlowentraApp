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
    const ok = await tryBackend<unknown>(() => apiFetch(`${BASE}/active/${id}`, { method: 'PUT' }));
    if (!ok) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.setItem(ACTIVE_KEY, id);
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
    const remote = await tryBackend<PlanningProfile>(() => apiFetch<PlanningProfile>(`${BASE}/${id}`, {
      method: 'PUT', body: JSON.stringify(dto),
    }));
    if (remote) return remote;
    const list = readLocal();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Profile not found');
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
