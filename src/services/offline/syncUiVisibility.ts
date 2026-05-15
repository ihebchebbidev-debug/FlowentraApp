import type { OfflineSyncLastDetail } from "./types";

/** Matches `shouldSkipOfflineQueueForEndpoint` without importing syncEngine (avoids cycles). */
function pathHasSystemLogs(endpoint: string): boolean {
  const path = endpoint.split("?")[0].toLowerCase();
  return path.includes("/systemlogs");
}

/**
 * Hide client telemetry / system log rows from all sync UIs (queue, overlay, last run, server history table).
 */
export function isHiddenFromSyncUi(item: { entityType?: string; endpoint?: string }): boolean {
  if ((item.entityType || "").toLowerCase() === "system_log") return true;
  return pathHasSystemLogs(item.endpoint || "");
}

/**
 * Strip system-log–only noise from the last sync report for display (storage keeps raw JSON).
 */
export function sanitizeOfflineSyncLastDetailForUi(detail: OfflineSyncLastDetail | null): OfflineSyncLastDetail | null {
  if (!detail) return null;

  const failedOperations = (detail.failedOperations ?? []).filter((f) => !isHiddenFromSyncUi(f));
  const binaryFailures = (detail.binaryFailures ?? []).filter((f) => !isHiddenFromSyncUi(f));

  let httpStatus = detail.httpStatus;
  let httpBody = detail.httpBody;
  if (httpBody && /systemlogs/i.test(httpBody)) {
    httpStatus = undefined;
    httpBody = undefined;
  }

  let summary = (detail.summary ?? "").trim();
  if (summary && /systemlogs/i.test(summary)) {
    summary = summary
      .split(" · ")
      .filter((p) => !/systemlogs/i.test(p))
      .join(" · ")
      .trim();
  }

  let fatalError = detail.fatalError;
  if (fatalError && /systemlogs/i.test(fatalError)) fatalError = undefined;

  const hasVisibleError =
    failedOperations.length > 0 ||
    binaryFailures.length > 0 ||
    httpStatus != null ||
    (httpBody && httpBody.length > 0) ||
    !!fatalError ||
    summary.length > 0;

  const syncedCount = detail.syncedCount;
  const failedCount = failedOperations.length + binaryFailures.length;

  if (!hasVisibleError && syncedCount == null) return null;

  return {
    ...detail,
    failedOperations,
    binaryFailures: binaryFailures.length ? binaryFailures : undefined,
    httpStatus,
    httpBody,
    fatalError,
    summary: summary || "",
    failedCount: failedCount > 0 ? failedCount : undefined,
    syncedCount,
  };
}
