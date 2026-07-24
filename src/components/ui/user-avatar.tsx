import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import defaultAvatar1 from '@/assets/default-avatar-1.png';
import defaultAvatar2 from '@/assets/default-avatar-2.png';
import defaultAvatar3 from '@/assets/default-avatar-3.png';

import { API_URL } from '@/config/api';

const DEFAULT_AVATARS = [defaultAvatar1, defaultAvatar2, defaultAvatar3];

/** Pick a consistent default avatar based on a seed (user id, name, etc.) */
export function getDefaultAvatar(seed: string | number): string {
  const hash = String(seed).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return DEFAULT_AVATARS[hash % DEFAULT_AVATARS.length];
}

// ---------------------------------------------------------------------------
// URL resolution + dedup cache
//
// Resolving the same backend-relative path on every render across dozens of
// lists is wasteful and — when the same user appears in multiple places — it
// also causes the browser to issue separate <img> requests because each call
// site gets its own React subtree. We memoize the resolved URL so identical
// inputs always return the *same* string reference (good for memoization
// upstream), and we keep a tiny in-memory loader registry so a profile picture
// is only fetched once per session.
// ---------------------------------------------------------------------------

const resolveCache = new Map<string, string>();

/** Resolve profile picture URL — handles relative paths and absolute URLs.
 *  Memoized: identical inputs return the same string reference. */
export function resolveProfilePicUrl(url?: string | null): string {
  if (!url) return '';
  const cached = resolveCache.get(url);
  if (cached !== undefined) return cached;

  let resolved: string;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) {
    resolved = url;
  } else if (url.startsWith('doc:')) {
    const docId = url.replace('doc:', '');
    resolved = `${API_URL}/api/Documents/download/${docId}`;
  } else {
    resolved = `${API_URL}/${url.replace(/^\//, '')}`;
  }
  resolveCache.set(url, resolved);
  return resolved;
}

// Track which resolved URLs have already been fetched (or failed) so repeated
// mounts don't trigger duplicate network requests on poorly-cached responses.
type LoadStatus = 'pending' | 'loaded' | 'error';
const loadRegistry = new Map<string, LoadStatus>();
const loadWaiters = new Map<string, Set<(s: LoadStatus) => void>>();

function notify(url: string, status: LoadStatus) {
  loadRegistry.set(url, status);
  const waiters = loadWaiters.get(url);
  if (waiters) {
    for (const w of waiters) w(status);
    loadWaiters.delete(url);
  }
}

/** Preload a profile picture exactly once per session. */
export function preloadProfilePicture(rawUrl?: string | null): void {
  const url = resolveProfilePicUrl(rawUrl);
  if (!url || loadRegistry.has(url)) return;
  loadRegistry.set(url, 'pending');
  const img = new Image();
  img.onload = () => notify(url, 'loaded');
  img.onerror = () => notify(url, 'error');
  img.src = url;
}

function useImageStatus(url: string): LoadStatus | undefined {
  const [status, setStatus] = useState<LoadStatus | undefined>(() =>
    url ? loadRegistry.get(url) : undefined,
  );
  useEffect(() => {
    if (!url) return;
    const current = loadRegistry.get(url);
    if (current === 'loaded' || current === 'error') {
      setStatus(current);
      return;
    }
    if (!current) preloadProfilePicture(url);
    let waiters = loadWaiters.get(url);
    if (!waiters) {
      waiters = new Set();
      loadWaiters.set(url, waiters);
    }
    const cb = (s: LoadStatus) => setStatus(s);
    waiters.add(cb);
    return () => {
      waiters?.delete(cb);
    };
  }, [url]);
  return status;
}

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  seed?: string | number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'h-5 w-5',
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const textSizes = {
  xs: 'text-px-10',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function UserAvatar({ src, name, seed, size = 'md', className = '' }: UserAvatarProps) {
  const resolvedUrl = useMemo(() => resolveProfilePicUrl(src), [src]);
  const fallbackSeed = seed ?? name ?? 'user';
  const defaultImg = useMemo(() => getDefaultAvatar(fallbackSeed), [fallbackSeed]);
  const status = useImageStatus(resolvedUrl);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // If the cached image previously failed to load, skip straight to the
  // default avatar so we don't issue another doomed request.
  const showDefault = !resolvedUrl || status === 'error';
  const displaySrc = showDefault ? defaultImg : resolvedUrl;

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage
        src={displaySrc}
        alt={name || 'User'}
        className="object-cover"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          notify(resolvedUrl, 'error');
          (e.target as HTMLImageElement).src = defaultImg;
        }}
        onLoad={() => {
          if (resolvedUrl && !showDefault) notify(resolvedUrl, 'loaded');
        }}
      />
      <AvatarFallback className={`${textSizes[size]} bg-primary/10 text-primary font-medium`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

