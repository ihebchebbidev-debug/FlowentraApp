import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { OfflineSyncLastDetail } from "@/services/offline/types";
import {
  getPendingCount,
  getLastSyncAt,
  getLastSyncError,
  getLastSyncDetail,
  getOfflineEnabled,
  setOfflineEnabled,
  syncNow,
  dropExcludedFromOfflineQueue,
} from "@/services/offline/syncEngine";
import { isBrowserOnline, onConnectivityChange } from "@/services/offline/connectivity";
import { runOfflineHydration } from "@/services/offline/hydrationOrchestrator";
import { requestPersistedHydrationStorage } from "@/services/offline/offlineStoragePolicy";
import { queryClient } from "@/lib/queryClient";

interface OfflineContextValue {
  enabled: boolean;
  online: boolean;
  syncing: boolean;
  hydrating: boolean;
  pendingCount: number;
  lastSyncAt?: string;
  lastError?: string;
  /** Structured report from the last sync (per-operation errors, HTTP body, etc.). */
  lastSyncDetail: OfflineSyncLastDetail | null;
  setEnabled: (enabled: boolean) => void;
  refreshState: () => Promise<void>;
  syncNow: () => Promise<void>;
  /** Re-download cached API data for the current tenant (while online). */
  hydrateNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabledState] = useState<boolean>(getOfflineEnabled());
  const [online, setOnline] = useState<boolean>(isBrowserOnline());
  const [syncing, setSyncing] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | undefined>(getLastSyncAt());
  const [lastError, setLastError] = useState<string | undefined>(getLastSyncError());
  const [lastSyncDetail, setLastSyncDetail] = useState<OfflineSyncLastDetail | null>(() => getLastSyncDetail());
  const previousOnlineRef = useRef<boolean>(isBrowserOnline());
  const syncInFlightRef = useRef<boolean>(false);
  const hydrationInFlightRef = useRef<boolean>(false);

  const refreshState = useCallback(async () => {
    setPendingCount(await getPendingCount());
    setLastSyncAt(getLastSyncAt());
    const error = getLastSyncError();
    setLastError(error && error.trim().length ? error : undefined);
    setLastSyncDetail(getLastSyncDetail());
  }, []);

  const doSync = useCallback(async (trigger: "manual" | "reconnect" | "manual-online" = "manual") => {
    // Hard lock: while explicit offline mode is ON, sync can only run
    // via switching back to online mode (manual-online trigger).
    if (enabled && trigger !== "manual-online") return;
    if (syncInFlightRef.current || !isBrowserOnline()) return;
    syncInFlightRef.current = true;
    let beforePending = 0;
    try {
      beforePending = await getPendingCount();
    } catch {
      beforePending = 0;
    }
    try {
      window.dispatchEvent(
        new CustomEvent("offline:sync-cycle-started", {
          detail: {
            trigger,
            beforePending,
          },
        })
      );
    } catch {
      // Ignore telemetry dispatch failures
    }
    setSyncing(true);
    try {
      try {
        await syncNow();
      } catch {
        /* syncNow persists lastError + lastSyncDetail; rethrow not needed */
      }
      // Refetch only queries that are currently active (mounted) — avoids a full-cache refetch storm.
      await queryClient.invalidateQueries({ refetchType: "active" });
    } finally {
      try {
        let afterPending = 0;
        try {
          afterPending = await getPendingCount();
        } catch {
          afterPending = 0;
        }
        const nextLastSyncAt = getLastSyncAt();
        const nextError = getLastSyncError();
        try {
          await refreshState();
        } catch {
          // Ignore refresh errors, keep unlock guarantee.
        }
        const nextDetail = getLastSyncDetail();
        try {
          window.dispatchEvent(
            new CustomEvent("offline:sync-cycle-finished", {
              detail: {
                trigger,
                beforePending,
                afterPending,
                lastSyncAt: nextLastSyncAt,
                lastError: nextError,
                lastSyncDetail: nextDetail,
              },
            })
          );
        } catch {
          // Ignore telemetry dispatch failures
        }
      } finally {
        setSyncing(false);
        syncInFlightRef.current = false;
      }
    }
  }, [enabled, refreshState]);

  /** Keeps connectivity handler stable: avoid re-subscribing on every offline-toggle / doSync identity change. */
  const offlineModeEnabledRef = useRef<boolean>(enabled);
  offlineModeEnabledRef.current = enabled;
  const doSyncRef = useRef(doSync);
  doSyncRef.current = doSync;

  const runHydrationCycle = useCallback(async () => {
    if (hydrationInFlightRef.current || !isBrowserOnline()) return;
    hydrationInFlightRef.current = true;
    let modulesFailed = 0;
    void requestPersistedHydrationStorage();
    try {
      window.dispatchEvent(
        new CustomEvent("offline:hydration-cycle-started", {
          detail: { scopeKey: "pending" },
        })
      );
    } catch {
      // ignore
    }
    setHydrating(true);
    try {
      const result = await runOfflineHydration();
      modulesFailed = result.modulesFailed;
    } finally {
      setHydrating(false);
      hydrationInFlightRef.current = false;
      try {
        window.dispatchEvent(
          new CustomEvent("offline:hydration-cycle-finished", {
            detail: { modulesFailed },
          })
        );
      } catch {
        // ignore
      }
      try {
        await queryClient.invalidateQueries({ refetchType: "active" });
      } catch {
        // ignore
      }
    }
  }, []);

  const hydrateNow = useCallback(async () => {
    await runHydrationCycle();
  }, [runHydrationCycle]);

  const setEnabled = useCallback(
    (value: boolean) => {
      const wasEnabled = enabled;
      setOfflineEnabled(value);
      setEnabledState(value);
      // Entering offline mode while online: prefetch all modules into IndexedDB (tenant-scoped).
      if (!wasEnabled && value && isBrowserOnline()) {
        void runHydrationCycle();
      }
      // User switched from offline mode to online mode while online:
      // run sync and let the app open deep sync diagnostics page.
      if (wasEnabled && !value && isBrowserOnline()) {
        void doSync("manual-online");
      }
    },
    [enabled, doSync, runHydrationCycle]
  );

  useEffect(() => {
    void (async () => {
      const removed = await dropExcludedFromOfflineQueue();
      if (removed > 0) void refreshState();
    })();
  }, [refreshState]);

  useEffect(() => {
    void refreshState();
    const cleanup = onConnectivityChange((state) => {
      setOnline(state);
      const wasOnline = previousOnlineRef.current;
      previousOnlineRef.current = state;
      // In explicit offline mode, do not auto-sync on reconnect.
      // User must switch back to online mode to start syncing.
      if (!wasOnline && state && !offlineModeEnabledRef.current) {
        void doSyncRef.current("reconnect");
      }
    });
    return cleanup;
  }, [refreshState]);

  useEffect(() => {
    const handler = () => {
      void refreshState();
    };
    window.addEventListener("offline:queue-updated", handler);
    return () => window.removeEventListener("offline:queue-updated", handler);
  }, [refreshState]);

  // No automatic sync while offline mode is enabled.
  // Sync starts only when user explicitly switches to online mode
  // or manually triggers it from UI actions wired to syncNow().

  const value = useMemo<OfflineContextValue>(
    () => ({
      enabled,
      online,
      syncing,
      hydrating,
      pendingCount,
      lastSyncAt,
      lastError,
      lastSyncDetail,
      setEnabled,
      refreshState,
      syncNow: doSync,
      hydrateNow,
    }),
    [enabled, online, syncing, hydrating, pendingCount, lastSyncAt, lastError, lastSyncDetail, setEnabled, refreshState, doSync, hydrateNow]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

export const useOffline = (): OfflineContextValue => {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error("useOffline must be used within OfflineProvider");
  return ctx;
};
