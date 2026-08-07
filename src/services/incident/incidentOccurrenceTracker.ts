const occurrenceMap = new Map<string, { count: number; firstSeen: number; lastSeen: number }>();

const WINDOWS_MS: Record<string, number> = {
  console_error: 5 * 60_000,
  api_4xx: 60 * 60_000,
  network_error: 10 * 60_000,
  default: 30 * 60_000,
};

export function bumpOccurrence(fingerprint: string, category = 'default'): number {
  const now = Date.now();
  const windowMs = WINDOWS_MS[category] ?? WINDOWS_MS.default;
  const existing = occurrenceMap.get(fingerprint);

  if (!existing || now - existing.firstSeen > windowMs) {
    occurrenceMap.set(fingerprint, { count: 1, firstSeen: now, lastSeen: now });
    return 1;
  }

  existing.count += 1;
  existing.lastSeen = now;
  return existing.count;
}

export function getOccurrenceCount(fingerprint: string): number {
  return occurrenceMap.get(fingerprint)?.count ?? 0;
}

export function pruneOccurrenceTracker(): void {
  const now = Date.now();
  for (const [key, val] of occurrenceMap) {
    if (now - val.lastSeen > 2 * 60 * 60_000) occurrenceMap.delete(key);
  }
}
