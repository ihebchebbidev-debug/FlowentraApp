import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CloudDownload,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react";
import { useOffline } from "@/contexts/OfflineContext";
import { useTranslation } from "react-i18next";

const OFFLINE_SYNC_CENTER_DISMISSED_KEY = "offline-sync-center-dismissed-v1";

const formatDate = (value?: string): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const OfflineSyncCenter: React.FC = () => {
  const { t } = useTranslation("settings");
  const {
    enabled,
    online,
    syncing,
    hydrating,
    pendingCount,
    lastSyncAt,
    lastError,
    lastSyncDetail,
    syncNow,
    hydrateNow,
  } = useOffline();
  const [expanded, setExpanded] = React.useState(false);
  const [showSyncDetail, setShowSyncDetail] = React.useState(false);
  const [visible, setVisible] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(OFFLINE_SYNC_CENTER_DISMISSED_KEY) !== "true";
  });

  const close = () => {
    localStorage.setItem(OFFLINE_SYNC_CENTER_DISMISSED_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  const isWorking = syncing || hydrating;
  const hasError = !!lastError;
  const queueEmpty = pendingCount === 0;

  // Status config
  const statusConfig = enabled
    ? { icon: CloudOff, label: t("syncDashboard.offlineMode", "Offline Mode"), color: "text-warning", bg: "bg-warning/10" }
    : online
      ? hasError
        ? { icon: AlertCircle, label: t("syncDashboard.syncError", "Sync Error"), color: "text-destructive", bg: "bg-destructive/10" }
        : { icon: Cloud, label: t("syncDashboard.connected", "Connected"), color: "text-success", bg: "bg-success/10" }
      : { icon: WifiOff, label: t("syncDashboard.disconnected", "Disconnected"), color: "text-destructive", bg: "bg-destructive/10" };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[340px]">
      <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
        {/* Header */}
        <button
          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md ${statusConfig.bg}`}>
              <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground leading-none">
                {t("syncDashboard.title", "Sync Center")}
              </p>
              <p className={`text-xs mt-0.5 ${statusConfig.color}`}>
                {statusConfig.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
                {pendingCount}
              </Badge>
            )}
            {isWorking && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); close(); }}
              aria-label={t("common.close", "Close")}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 -mr-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </button>

        {/* Expanded panel */}
        {expanded && (
          <div className="border-t border-border">
            {/* Sync progress indicator */}
            {isWorking && (
              <div className="px-4 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground">
                    {syncing
                      ? t("syncDashboard.syncing", "Syncing changes…")
                      : t("syncDashboard.caching", "Updating cache…")}
                  </span>
                </div>
                <Progress value={undefined} className="h-1" />
              </div>
            )}

            {/* Status details */}
            <div className="px-4 py-3 space-y-2.5">
              {/* Connection */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  {online
                    ? <Wifi className="h-3 w-3 text-success" />
                    : <WifiOff className="h-3 w-3 text-destructive" />}
                  {t("syncDashboard.connection", "Connection")}
                </span>
                <span className={`font-medium ${online ? "text-success" : "text-destructive"}`}>
                  {online ? t("syncDashboard.online", "Online") : t("syncDashboard.offline", "Offline")}
                </span>
              </div>

              {/* Last sync */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {t("syncDashboard.lastSync", "Last sync")}
                </span>
                <span className="font-medium text-foreground">{formatDate(lastSyncAt)}</span>
              </div>

              {/* Pending queue */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  {queueEmpty
                    ? <CheckCircle2 className="h-3 w-3 text-success" />
                    : <Clock className="h-3 w-3 text-warning" />}
                  {t("syncDashboard.pendingQueue", "Pending")}
                </span>
                <span className={`font-medium ${queueEmpty ? "text-success" : "text-warning"}`}>
                  {queueEmpty
                    ? t("syncDashboard.allSynced", "All synced")
                    : t("syncDashboard.operationsWaiting", "{{count}} operation(s)", { count: pendingCount })}
                </span>
              </div>
            </div>

            {/* Error section */}
            {hasError && (
              <>
                <Separator />
                <div className="px-4 py-3">
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/5 border border-destructive/20">
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-destructive leading-snug">{lastError}</p>
                      {lastSyncDetail &&
                        ((lastSyncDetail.failedOperations?.length ?? 0) > 0 ||
                          (lastSyncDetail.binaryFailures?.length ?? 0) > 0 ||
                          lastSyncDetail.httpStatus != null ||
                          lastSyncDetail.httpBody ||
                          lastSyncDetail.fatalError) && (
                        <button
                          type="button"
                          onClick={() => setShowSyncDetail((v) => !v)}
                          className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showSyncDetail ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {t("syncDashboard.syncOverlay.reportTitle", "View details")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error details */}
                  {showSyncDetail && lastSyncDetail && (
                    <div className="mt-2 rounded-md border border-border bg-muted/30 p-2.5 text-[11px] space-y-2 max-h-48 overflow-auto">
                      {lastSyncDetail.httpStatus != null && (
                        <p className="text-warning font-medium">
                          {t("syncDashboard.syncOverlay.httpTitle", { status: lastSyncDetail.httpStatus })}
                        </p>
                      )}
                      {lastSyncDetail.httpBody && (
                        <pre className="whitespace-pre-wrap break-words rounded bg-background p-2 font-mono text-[10px] text-muted-foreground border border-border">
                          {lastSyncDetail.httpBody}
                        </pre>
                      )}
                      {lastSyncDetail.fatalError && (
                        <p className="font-mono text-destructive text-[10px]">{lastSyncDetail.fatalError}</p>
                      )}
                      {(lastSyncDetail.binaryFailures ?? []).map((row) => (
                        <div key={`b-${row.opId}`} className="border-t border-border pt-2">
                          <span className="font-mono text-[10px] text-muted-foreground">{row.method}</span>{" "}
                          <span className="break-all text-foreground">{row.endpoint}</span>
                          <p className="text-destructive mt-0.5">{row.error}</p>
                        </div>
                      ))}
                      {(lastSyncDetail.failedOperations ?? []).map((row) => (
                        <div key={row.opId} className="border-t border-border pt-2 space-y-0.5">
                          <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                            <span className="font-mono">{row.opId}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {row.status}
                            </Badge>
                          </div>
                          <p className="font-mono text-[10px] break-all text-muted-foreground">
                            {row.method} {row.endpoint}
                          </p>
                          <p className="text-destructive text-[10px]">
                            {row.error || t("syncDashboard.syncOverlay.noServerMessage")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="px-4 py-3 flex items-center gap-2">
              <Button
                onClick={() => void syncNow()}
                disabled={!online || syncing || enabled}
                size="sm"
                className="h-8 gap-1.5 flex-1"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing
                  ? t("syncDashboard.syncingBtn", "Syncing…")
                  : t("syncDashboard.syncNowBtn", "Sync Now")}
              </Button>
              <Button
                onClick={() => void hydrateNow()}
                disabled={!online || hydrating}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 flex-1"
              >
                <CloudDownload className={`h-3.5 w-3.5 ${hydrating ? "animate-pulse" : ""}`} />
                {hydrating
                  ? t("syncDashboard.cachingBtn", "Caching…")
                  : t("syncDashboard.refreshCacheBtn", "Refresh Cache")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
