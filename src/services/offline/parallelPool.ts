/**
 * Bounded parallel async queue (hydration prefetch + offline binary replay).
 */

export async function runPool<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
  options?: { signal?: AbortSignal },
): Promise<void> {
  if (!items.length) return;
  const signal = options?.signal;
  const queue = [...items];
  const n = Math.max(1, Math.min(concurrency, items.length));
  async function runWorker(): Promise<void> {
    for (;;) {
      if (signal?.aborted) break;
      const item = queue.shift();
      if (item === undefined) break;
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: n }, () => runWorker()));
}
