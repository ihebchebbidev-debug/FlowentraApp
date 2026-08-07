import { apiFetch } from '@/services/api/apiClient';
import type { Dashboard, DashboardCreateDto, DashboardUpdateDto } from '../types';

const BASE = '/api/Dashboards';
const STORAGE_KEY = 'dashboard-builder-data';

// ─── LocalStorage fallback when backend is unavailable ───
function loadLocal(): Dashboard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocal(dashboards: Dashboard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
}

let useLocalFallback = false;

export const dashboardApi = {
  async getAll(): Promise<Dashboard[]> {
    if (useLocalFallback) return loadLocal();
    try {
      const { data, error } = await apiFetch<Dashboard[]>(BASE);
      if (error) {
        // Backend not ready — switch to localStorage
        useLocalFallback = true;
        return loadLocal();
      }
      return data ?? [];
    } catch {
      useLocalFallback = true;
      return loadLocal();
    }
  },

  async getById(id: number): Promise<Dashboard> {
    if (useLocalFallback) {
      const all = loadLocal();
      const found = all.find(d => d.id === id);
      if (!found) throw new Error('Not found');
      return found;
    }
    const { data, error } = await apiFetch<Dashboard>(`${BASE}/${id}`);
    if (error) throw new Error(error);
    return data!;
  },

  async create(dto: DashboardCreateDto): Promise<Dashboard> {
    if (useLocalFallback) {
      const all = loadLocal();
      const newDash: Dashboard = {
        id: Date.now(),
        name: dto.name,
        description: dto.description,
        templateKey: (dto.templateKey as Dashboard['templateKey']) || 'custom',
        isDefault: false,
        isShared: dto.isShared ?? false,
        sharedWithRoles: dto.sharedWithRoles,
        createdBy: 0,
        widgets: dto.widgets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      all.push(newDash);
      saveLocal(all);
      return newDash;
    }
    const { data, error } = await apiFetch<Dashboard>(BASE, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (error) throw new Error(error);
    return data!;
  },

  async update(id: number, dto: DashboardUpdateDto): Promise<Dashboard> {
    if (useLocalFallback) {
      const all = loadLocal();
      const idx = all.findIndex(d => d.id === id);
      if (idx === -1) throw new Error('Not found');
      all[idx] = { ...all[idx], ...dto, updatedAt: new Date().toISOString() } as Dashboard;
      saveLocal(all);
      return all[idx];
    }
    const { data, error } = await apiFetch<Dashboard>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    if (error) throw new Error(error);
    return data!;
  },

  async delete(id: number): Promise<void> {
    if (useLocalFallback) {
      const all = loadLocal().filter(d => d.id !== id);
      saveLocal(all);
      return;
    }
    const { error } = await apiFetch<void>(`${BASE}/${id}`, {
      method: 'DELETE',
    });
    if (error) throw new Error(error);
  },

  async duplicate(id: number, name: string): Promise<Dashboard> {
    if (useLocalFallback) {
      const all = loadLocal();
      const source = all.find(d => d.id === id);
      if (!source) throw new Error('Not found');
      const dup: Dashboard = {
        ...source,
        id: Date.now(),
        name,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      all.push(dup);
      saveLocal(all);
      return dup;
    }
    const { data, error } = await apiFetch<Dashboard>(`${BASE}/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (error) throw new Error(error);
    return data!;
  },

  /** Reset fallback flag (e.g. when backend becomes available) */
  resetFallback() {
    useLocalFallback = false;
  },

  get isUsingFallback() {
    return useLocalFallback;
  },
};