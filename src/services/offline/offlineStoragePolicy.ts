/**
 * Ask the browser for persistent storage so offline caches are less likely to be evicted
 * (especially Safari / WebKit). Safe to call multiple times.
 */
export async function requestPersistedHydrationStorage(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
