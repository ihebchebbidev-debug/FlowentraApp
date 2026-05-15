import { apiFetch, API_URL } from '@/services/api/apiClient';
import { dashboardApi } from './dashboardApi';
import type { Dashboard } from '../types';

const BASE = '/api/Dashboards';
const SHARE_STORAGE_KEY = 'dashboard-share-links';

export interface SharedDashboardInfo {
  shareToken: string;
  publicUrl: string;
  isPublic: boolean;
  expiresAt?: string;
}

interface StoredShareEntry {
  token: string;
  dashboardId: number;
  dashboard: Dashboard;
  createdAt: string;
}

// ─── LocalStorage helpers for share links ───
function loadSharedLinks(): StoredShareEntry[] {
  try {
    const raw = localStorage.getItem(SHARE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSharedLinks(entries: StoredShareEntry[]) {
  localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(entries));
}

function generateToken(): string {
  const chars = 'abcdef0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export const dashboardShareApi = {
  /** Generate or retrieve a share token for a dashboard, optionally with a data snapshot */
  async generateShareLink(dashboardId: number, dataSnapshot?: Record<string, any>): Promise<SharedDashboardInfo> {
    // Try backend first
    try {
      const { data, error } = await apiFetch<{ success: boolean; data: SharedDashboardInfo }>(
        `${BASE}/${dashboardId}/share`,
        {
          method: 'POST',
          body: dataSnapshot ? JSON.stringify({ dataSnapshot }) : undefined,
          headers: dataSnapshot ? { 'Content-Type': 'application/json' } : undefined,
        }
      );
      if (!error && data?.data) return data.data;
    } catch {
      // Fall through to local
    }

    // Local fallback: store the full dashboard with snapshot in localStorage
    const entries = loadSharedLinks();

    // Check if a share already exists for this dashboard
    const existing = entries.find(e => e.dashboardId === dashboardId);
    if (existing) {
      // Update the snapshot
      if (dataSnapshot) {
        existing.dashboard.dataSnapshot = dataSnapshot;
        existing.dashboard.snapshotAt = new Date().toISOString();
        saveSharedLinks(entries);
      }
      return {
        shareToken: existing.token,
        publicUrl: `${window.location.origin}/public/dashboards/${existing.token}`,
        isPublic: true,
      };
    }

    // Create new share entry
    let dashboard: Dashboard;
    try {
      dashboard = await dashboardApi.getById(dashboardId);
    } catch {
      throw new Error('Dashboard not found');
    }

    if (dataSnapshot) {
      dashboard.dataSnapshot = dataSnapshot;
      dashboard.snapshotAt = new Date().toISOString();
    }

    const token = generateToken();
    entries.push({
      token,
      dashboardId,
      dashboard: { ...dashboard },
      createdAt: new Date().toISOString(),
    });
    saveSharedLinks(entries);

    return {
      shareToken: token,
      publicUrl: `${window.location.origin}/public/dashboards/${token}`,
      isPublic: true,
    };
  },

  /** Revoke (disable) sharing for a dashboard */
  async revokeShareLink(dashboardId: number): Promise<void> {
    try {
      const { error } = await apiFetch<void>(
        `${BASE}/${dashboardId}/share`,
        { method: 'DELETE' }
      );
      if (!error) {
        // Also clean local entry
        const entries = loadSharedLinks().filter(e => e.dashboardId !== dashboardId);
        saveSharedLinks(entries);
        return;
      }
    } catch {
      // Fall through to local
    }

    // Local fallback
    const entries = loadSharedLinks().filter(e => e.dashboardId !== dashboardId);
    saveSharedLinks(entries);
  },

  /** Fetch a dashboard by its public share token (NO auth required) */
  async getByShareToken(token: string): Promise<Dashboard> {
    // Try backend first
    try {
      const url = `${API_URL}${BASE}/public/${token}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Fall through to local
    }

    // Local fallback: look up token in localStorage
    const entries = loadSharedLinks();
    const entry = entries.find(e => e.token === token);
    if (!entry) {
      throw new Error('Dashboard not found or link expired');
    }
    return entry.dashboard;
  },
};
