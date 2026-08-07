/**
 * Shared handling for synthetic 503 responses when offline cache misses (fetch guard / axios no-cache adapter).
 */

export type OfflineNoCacheBody = {
  offline?: boolean;
  cached?: boolean;
  message?: string;
};

export async function parseOfflineNoCacheBody(response: Response): Promise<OfflineNoCacheBody | null> {
  if (response.status !== 503) return null;
  return (await response.json().catch(() => null)) as OfflineNoCacheBody | null;
}

export function isOfflineNoCache503(body: OfflineNoCacheBody | null): boolean {
  return body?.offline === true && body?.cached === false;
}

/**
 * Call after `parseOfflineNoCacheBody` when the happy path still needs `response.json()`.
 * For 503, the body was already consumed — use `offline?.message` instead of reading again.
 */
export async function throwIfNotOkAfterOfflineCheck(
  response: Response,
  offline: OfflineNoCacheBody | null,
  defaultMessage: string
): Promise<void> {
  if (response.ok) return;
  if (response.status === 503) {
    throw new Error(offline?.message || defaultMessage);
  }
  const error = await response.json().catch(() => ({ message: defaultMessage }));
  throw new Error((error as { message?: string }).message || defaultMessage);
}
