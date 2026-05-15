export const isBrowserOnline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine;

/**
 * Subscribe to browser online/offline. Always reads `navigator.onLine` so we stay
 * consistent if an event ever disagrees with the flag.
 */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  const notify = () => callback(isBrowserOnline());
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}
