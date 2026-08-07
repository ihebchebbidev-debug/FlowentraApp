import { toast } from "sonner";

export interface BulkDeleteOptions<T> {
  ids: string[];
  items: T[];
  getId: (item: T) => string;
  deleteOne: (id: string) => Promise<unknown>;
  /** Max concurrent DELETE requests. Default 5. */
  concurrency?: number;
  /** Called once with the array of failed IDs so caller can restore them. */
  onFailures?: (failedIds: string[]) => void;
  /** i18n strings */
  successMsg?: (count: number) => string;
  partialMsg?: (success: number, failed: number) => string;
  errorMsg?: () => string;
}

export interface BulkDeleteResult {
  success: number;
  failed: number;
  failedIds: string[];
  /** First failure's error message — useful for surfacing 400-blocked deletions. */
  firstError?: string;
}

/**
 * Run per-item DELETE requests in parallel batches.
 * Returns counts and failed IDs so the caller can restore them in UI state.
 */
export async function runBulkDelete<T>(opts: BulkDeleteOptions<T>): Promise<BulkDeleteResult> {
  const {
    ids,
    deleteOne,
    concurrency = 5,
    onFailures,
    successMsg = (n) => `${n} item${n === 1 ? '' : 's'} deleted`,
    partialMsg = (s, f) => `${s} deleted, ${f} failed`,
    errorMsg = () => 'Delete failed',
  } = opts;

  const failedIds: string[] = [];
  let success = 0;
  let firstError: string | undefined;

  // Process in chunks of `concurrency`
  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    const results = await Promise.allSettled(chunk.map((id) => deleteOne(id)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        success++;
      } else {
        failedIds.push(chunk[idx]);
        if (!firstError) {
          const reason = r.reason;
          firstError = reason instanceof Error ? reason.message : (typeof reason === 'string' ? reason : undefined);
        }
      }
    });
  }

  const failed = failedIds.length;
  if (failed > 0) onFailures?.(failedIds);

  // Prefer the backend's actual reason (e.g. "Cannot delete purchase order PO-001:
  // it is referenced by one or more supplier invoices") over a generic message.
  const detailed = firstError && firstError.length < 200 ? firstError : null;
  if (failed === 0 && success > 0) {
    toast.success(successMsg(success));
  } else if (success > 0 && failed > 0) {
    toast.error(detailed ? `${partialMsg(success, failed)} — ${detailed}` : partialMsg(success, failed));
  } else if (failed > 0 && success === 0) {
    toast.error(detailed ?? errorMsg());
  }

  return { success, failed, failedIds, firstError };
}

/**
 * Restore previously-removed rows back into a list at (or near) their original
 * positions. Used by optimistic delete handlers when the server rejects the
 * request — putting the row back at the END of the list confuses users who
 * scrolled past it. This preserves the user's mental model.
 */
export function restoreRowsAtOriginalIndex<T>(
  current: T[],
  toRestore: { row: T; idx: number }[],
): T[] {
  const next = [...current];
  // Sort ascending so each splice index remains valid relative to the partially-restored list.
  const ordered = [...toRestore].sort((a, b) => a.idx - b.idx);
  for (const { row, idx } of ordered) {
    next.splice(Math.min(idx, next.length), 0, row);
  }
  return next;
}
