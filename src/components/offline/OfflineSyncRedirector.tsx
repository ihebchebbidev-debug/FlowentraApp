import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type SyncCycleDetail = {
  trigger?: "manual" | "reconnect" | "manual-online";
  beforePending?: number;
  afterPending?: number;
  lastSyncAt?: string;
  lastError?: string;
};

export function OfflineSyncRedirector() {
  const navigate = useNavigate();

  useEffect(() => {
    const startedHandler = (event: Event) => {
      const custom = event as CustomEvent<SyncCycleDetail>;
      const detail = custom.detail || {};
      const trigger = detail.trigger;
      const hadQueuedItems = (detail.beforePending ?? 0) > 0;
      if (!hadQueuedItems) return;
      if (trigger !== "reconnect" && trigger !== "manual-online") return;
      navigate("/dashboard/settings/sync?inspectSync=1");
    };
    const finishedHandler = (event: Event) => {
      const custom = event as CustomEvent<SyncCycleDetail>;
      const detail = custom.detail || {};
      // Keep route in sync page after completion; data refreshes there automatically.
      if ((detail.beforePending ?? 0) > 0 && (detail.trigger === "reconnect" || detail.trigger === "manual-online")) {
        navigate("/dashboard/settings/sync?inspectSync=1");
      }
    };

    window.addEventListener("offline:sync-cycle-started", startedHandler as EventListener);
    window.addEventListener("offline:sync-cycle-finished", finishedHandler as EventListener);
    return () => {
      window.removeEventListener("offline:sync-cycle-started", startedHandler as EventListener);
      window.removeEventListener("offline:sync-cycle-finished", finishedHandler as EventListener);
    };
  }, [navigate]);

  return null;
}
