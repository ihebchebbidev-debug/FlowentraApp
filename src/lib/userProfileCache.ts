import { useEffect, useState } from 'react';
import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';

export interface UserProfile {
  name: string;
  picture?: string;
}

const cache = new Map<string, UserProfile>();
const pending = new Map<string, Promise<UserProfile>>();
const subs = new Map<string, Set<() => void>>();

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function extract(data: any): UserProfile {
  const u = data?.data || data || {};
  const first = u.firstName || u.FirstName || '';
  const last = u.lastName || u.LastName || '';
  const full = `${first} ${last}`.trim();
  const name =
    full ||
    (typeof u.name === 'string' && u.name.trim()) ||
    (typeof u.email === 'string' && u.email.trim()) ||
    '';
  const picture =
    u.profilePictureUrl || u.ProfilePictureUrl || u.profilePicture || u.avatar || undefined;
  return { name, picture: picture || undefined };
}

function notify(id: string) {
  subs.get(id)?.forEach(cb => cb());
}

export function getCachedUserProfile(id: string | number | null | undefined): UserProfile | undefined {
  if (id == null) return undefined;
  return cache.get(String(id).trim());
}

export function fetchUserProfile(rawId: string | number): Promise<UserProfile> {
  const id = String(rawId).trim();
  const existing = cache.get(id);
  if (existing) return Promise.resolve(existing);
  const inflight = pending.get(id);
  if (inflight) return inflight;

  const p = (async (): Promise<UserProfile> => {
    const urls = [`${API_URL}/api/Auth/user/${id}`, `${API_URL}/api/Users/${id}`];
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
        if (!res.ok) continue;
        const data = await res.json();
        const profile = extract(data);
        if (profile.name) {
          cache.set(id, profile);
          notify(id);
          return profile;
        }
      } catch {
        // try next
      }
    }
    const fallback: UserProfile = { name: `User #${id}` };
    cache.set(id, fallback);
    notify(id);
    return fallback;
  })();

  pending.set(id, p);
  p.finally(() => pending.delete(id));
  return p;
}

/** React hook: returns cached profile and triggers a fetch when needed. */
export function useUserProfile(
  id: string | number | null | undefined,
): UserProfile | undefined {
  const key = id != null ? String(id).trim() : '';
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!key || !isNumericId(key)) return;
    if (!cache.has(key)) fetchUserProfile(key);
    let set = subs.get(key);
    if (!set) {
      set = new Set();
      subs.set(key, set);
    }
    const cb = () => setTick(t => t + 1);
    set.add(cb);
    return () => {
      set!.delete(cb);
      if (set!.size === 0) subs.delete(key);
    };
  }, [key]);

  if (!key) return undefined;
  return cache.get(key);
}

/** Seed the cache from data already known on the client (e.g. list payloads). */
export function primeUserProfile(
  id: string | number | null | undefined,
  profile: Partial<UserProfile>,
): void {
  if (id == null) return;
  const key = String(id).trim();
  if (!key) return;
  const current = cache.get(key);
  const next: UserProfile = {
    name: profile.name || current?.name || '',
    picture: profile.picture ?? current?.picture,
  };
  if (!next.name && !next.picture) return;
  cache.set(key, next);
  notify(key);
}
