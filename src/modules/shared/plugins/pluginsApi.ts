/**
 * Plugin REST client.
 *
 * All endpoints are tenant-scoped server-side. The backend treats absence of
 * a row as "enabled" (default-on), so the GET response only contains rows
 * that have been explicitly toggled. The hook merges this with the manifest
 * registry to produce the full state.
 */
import { apiFetch } from '@/services/api/apiClient';
import type {
  PluginActivation,
  PluginStats,
  PluginToggleRequest,
  PluginBulkToggleRequest,
} from './types';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    return ((payload as ApiEnvelope<T>).data ?? (payload as unknown as T)) as T;
  }
  return payload as T;
}

async function get<T>(endpoint: string): Promise<T> {
  const res = await apiFetch<unknown>(endpoint, { method: 'GET' });
  if (res.error) throw new Error(res.error);
  return unwrap<T>(res.data);
}

async function send<T>(endpoint: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const res = await apiFetch<unknown>(endpoint, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.error) throw new Error(res.error);
  return unwrap<T>(res.data);
}

/** Marker error so callers can distinguish "API missing" from "API said empty". */
export class PluginsApiUnavailableError extends Error {
  constructor(public cause?: unknown) {
    super('Plugins API is unavailable');
    this.name = 'PluginsApiUnavailableError';
  }
}

export const pluginsApi = {
  async list(): Promise<PluginActivation[]> {
    try {
      const data = await get<PluginActivation[]>('/api/plugins');
      return Array.isArray(data) ? data : [];
    } catch (err) {
      // API missing / 400 / 404 / network down → silent fallback.
      // Returning [] lets the query succeed so React Query caches it with
      // staleTime and stops refetching. Default-on semantics in usePlugins
      // ensure all modules remain accessible when activations can't be loaded.
      if (import.meta.env.DEV) {
        console.warn('[plugins] GET /api/plugins failed — defaulting to all-enabled.', err);
      }
      return [];
    }
  },

  async toggle(code: string, isEnabled: boolean): Promise<PluginActivation> {
    const body: PluginToggleRequest = { isEnabled };
    return send<PluginActivation>(`/api/plugins/${encodeURIComponent(code)}`, 'PATCH', body);
  },

  async bulkToggle(codes: string[], isEnabled: boolean): Promise<PluginActivation[]> {
    const body: PluginBulkToggleRequest = { codes, isEnabled };
    const data = await send<PluginActivation[]>('/api/plugins/bulk', 'POST', body);
    return Array.isArray(data) ? data : [];
  },

  async stats(): Promise<PluginStats> {
    try {
      return await get<PluginStats>('/api/plugins/stats');
    } catch {
      return { active: 0, total: 0 };
    }
  },
};
