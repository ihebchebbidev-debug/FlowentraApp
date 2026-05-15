import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Database,
  Loader2,
  MinusCircle,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { OfflineSyncLastDetail } from "@/services/offline/types";
import { getLastSyncDetail, getPendingCount, getPendingSyncGroups, type PendingSyncGroup } from "@/services/offline/syncEngine";
import {
  getHydrationSnapshot,
  type HydrationModuleSnapshot,
  type HydrationRunSnapshot,
} from "@/services/offline/hydrationOrchestrator";
import { getCurrentTenant } from "@/utils/tenant";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type OverlayMode = "sync" | "hydration" | null;

type SyncCycleDetail = {
  trigger?: "manual" | "reconnect" | "manual-online";
  beforePending?: number;
  afterPending?: number;
  lastSyncDetail?: OfflineSyncLastDetail | null;
};

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs.toString().padStart(2, "0")}s`;
}

function formatModuleDuration(ms?: number): string {
  if (ms == null || ms < 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return formatElapsed(ms);
}

function ModuleStatusIcon({ status }: { status: HydrationModuleSnapshot["status"] }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />;
    case "running":
      return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />;
    case "error":
      return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />;
    case "skipped":
      return <MinusCircle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />;
    default:
      return <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />;
  }
}

export function OfflineSyncLoadingOverlay() {
  const { t } = useTranslation("settings");
  const [mode, setMode] = useState<OverlayMode>(null);
  const [initialPending, setInitialPending] = useState(0);
  const [currentPending, setCurrentPending] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [groups, setGroups] = useState<PendingSyncGroup[]>([]);
  const [hydrationModules, setHydrationModules] = useState<HydrationModuleSnapshot[]>([]);
  const [hydrationStartedAt, setHydrationStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [syncDetail, setSyncDetail] = useState<OfflineSyncLastDetail | null>(null);
  /** Set when hydration run completes (before overlay auto-closes). */
  const [hydrationWallMs, setHydrationWallMs] = useState<number | null>(null);
  const [hydrationCompletedWithIssues, setHydrationCompletedWithIssues] = useState(false);
  const [hydrationFatalDone, setHydrationFatalDone] = useState<string | null>(null);

  const tenant = typeof window !== "undefined" ? getCurrentTenant() : null;

  useEffect(() => {
    if (!mode) setHydrationStartedAt(null);
  }, [mode]);

  useEffect(() => {
    if (mode !== "hydration" || !hydrationStartedAt) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [mode, hydrationStartedAt]);

  useEffect(() => {
    let pollTimer: number | null = null;

    const clearPoll = () => {
      if (pollTimer != null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const startSyncPoll = () => {
      clearPoll();
      pollTimer = window.setInterval(async () => {
        try {
          const [pending, grouped] = await Promise.all([getPendingCount(), getPendingSyncGroups()]);
          setCurrentPending(pending);
          setGroups(grouped);
          if (pending === 0) setStatusText(t("syncDashboard.syncOverlay.statusFinalizing"));
          else setStatusText(t("syncDashboard.syncOverlay.statusSyncing"));
        } catch {
          // Keep current UI state if read fails transiently.
        }
      }, 450);
    };

    const onSyncStarted = async (event: Event) => {
      const custom = event as CustomEvent<SyncCycleDetail>;
      const detail = custom.detail || {};
      if (detail.trigger !== "reconnect" && detail.trigger !== "manual-online") return;
      const before = Math.max(0, detail.beforePending ?? 0);
      if (before <= 0) return;
      const grouped = await getPendingSyncGroups().catch(() => []);
      setMode("sync");
      setInitialPending(before);
      setCurrentPending(before);
      setGroups(grouped);
      setSyncDetail(null);
      setStatusText(t("syncDashboard.syncOverlay.statusSyncing"));
      startSyncPoll();
    };

    const onSyncFinished = (event: Event) => {
      const custom = event as CustomEvent<SyncCycleDetail>;
      const detail = custom.detail || {};
      if (detail.trigger !== "reconnect" && detail.trigger !== "manual-online") return;
      clearPoll();
      setCurrentPending(Math.max(0, detail.afterPending ?? 0));
      const report = detail.lastSyncDetail ?? getLastSyncDetail();
      setSyncDetail(report ?? null);
      setStatusText(t("syncDashboard.syncOverlay.statusCompleted"));
      const hasIssue =
        !!report &&
        ((report.failedOperations?.length ?? 0) > 0 ||
          (report.binaryFailures?.length ?? 0) > 0 ||
          report.httpStatus != null ||
          !!report.httpBody ||
          !!report.fatalError ||
          !!report.summary?.trim());
      window.setTimeout(() => setMode(null), hasIssue ? 5200 : 650);
    };

    const onHydrationStarted = () => {
      setHydrationStartedAt(Date.now());
      setNowTick(Date.now());
      setHydrationWallMs(null);
      setHydrationCompletedWithIssues(false);
      setHydrationFatalDone(null);
      setMode("hydration");
      setHydrationModules(getHydrationSnapshot().modules.map((m) => ({ ...m })));
      setStatusText(t("syncDashboard.hydrationOverlay.statusRunning"));
    };

    const onHydrationFinished = () => {
      clearPoll();
      const snap = getHydrationSnapshot();
      setHydrationModules(snap.modules.map((m) => ({ ...m })));
      const hasModuleErrors = snap.modules.some((m) => m.status === "error");
      const hasIssues = Boolean(snap.fatalError || hasModuleErrors);
      setHydrationCompletedWithIssues(hasIssues);
      setHydrationFatalDone(snap.fatalError ?? null);
      setHydrationWallMs(snap.totalDurationMs ?? null);
      setStatusText(
        hasIssues
          ? t("syncDashboard.hydrationOverlay.statusCompletedIssues")
          : t("syncDashboard.hydrationOverlay.statusCompleted")
      );
      const dismissMs = hasIssues ? 12000 : 2200;
      window.setTimeout(() => {
        setMode(null);
        setHydrationWallMs(null);
        setHydrationCompletedWithIssues(false);
        setHydrationFatalDone(null);
      }, dismissMs);
    };

    const onHydrationProgress = (event: Event) => {
      const ce = event as CustomEvent<HydrationRunSnapshot>;
      const detail = ce.detail;
      if (detail?.modules?.length) {
        setHydrationModules(detail.modules.map((m) => ({ ...m })));
        if (detail.running) {
          setStatusText(t("syncDashboard.hydrationOverlay.statusRunning"));
        } else {
          setStatusText(t("syncDashboard.hydrationOverlay.statusFinalizing"));
        }
      } else {
        const snap = getHydrationSnapshot();
        setHydrationModules(snap.modules.map((m) => ({ ...m })));
      }
    };

    window.addEventListener("offline:sync-cycle-started", onSyncStarted as EventListener);
    window.addEventListener("offline:sync-cycle-finished", onSyncFinished as EventListener);
    window.addEventListener("offline:hydration-cycle-started", onHydrationStarted);
    window.addEventListener("offline:hydration-cycle-finished", onHydrationFinished);
    window.addEventListener("offline:hydration-progress", onHydrationProgress);
    return () => {
      clearPoll();
      window.removeEventListener("offline:sync-cycle-started", onSyncStarted as EventListener);
      window.removeEventListener("offline:sync-cycle-finished", onSyncFinished as EventListener);
      window.removeEventListener("offline:hydration-cycle-started", onHydrationStarted);
      window.removeEventListener("offline:hydration-cycle-finished", onHydrationFinished);
      window.removeEventListener("offline:hydration-progress", onHydrationProgress);
    };
  }, [t]);

  const syncProgress = useMemo(() => {
    if (!initialPending) return 5;
    const done = Math.max(0, initialPending - currentPending);
    const pct = Math.round((done / initialPending) * 100);
    return Math.max(5, Math.min(100, pct));
  }, [initialPending, currentPending]);

  const hydrationProgress = useMemo(() => {
    if (!hydrationModules.length) return 8;
    let doneW = 0;
    let totalW = 0;
    for (const m of hydrationModules) {
      if (m.status === "skipped") {
        doneW += 1;
        totalW += 1;
      } else {
        const tot = Math.max(1, m.total);
        doneW += Math.min(m.done, tot);
        totalW += tot;
      }
    }
    if (!totalW) return 8;
    const pct = Math.round((doneW / totalW) * 100);
    return Math.max(8, Math.min(100, pct));
  }, [hydrationModules]);

  const hydrationStats = useMemo(() => {
    const mods = hydrationModules;
    const done = mods.filter((m) => m.status === "done").length;
    const running = mods.filter((m) => m.status === "running").length;
    const error = mods.filter((m) => m.status === "error").length;
    const pending = mods.filter((m) => m.status === "pending").length;
    const skipped = mods.filter((m) => m.status === "skipped").length;
    const total = mods.length;
    /** Modules that have finished (success, skipped, or error) — excludes pending/running. */
    const finished = done + skipped + error;
    return { done, running, error, pending, skipped, total, finished };
  }, [hydrationModules]);

  const elapsedMs = hydrationStartedAt ? nowTick - hydrationStartedAt : 0;

  const syncReportHasIssues = Boolean(
    syncDetail &&
      ((syncDetail.failedOperations?.length ?? 0) > 0 ||
        (syncDetail.binaryFailures?.length ?? 0) > 0 ||
        syncDetail.httpStatus != null ||
        !!syncDetail.httpBody ||
        !!syncDetail.fatalError ||
        !!syncDetail.summary?.trim())
  );

  if (!mode) return null;

  const isHydration = mode === "hydration";
  const title = isHydration ? t("syncDashboard.hydrationOverlay.title") : t("syncDashboard.syncOverlay.title");
  const progress = isHydration ? hydrationProgress : syncProgress;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-background/85 backdrop-blur-md p-4 sm:p-6"
      role="alertdialog"
      aria-busy="true"
      aria-live="polite"
      aria-labelledby="offline-overlay-title"
      aria-describedby="offline-overlay-desc"
    >
      <Card className="relative w-full max-w-2xl overflow-hidden border-border/60 shadow-2xl ring-1 ring-border/40">
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20",
            isHydration && "animate-pulse"
          )}
        />
        <CardHeader className="space-y-3 pb-2 pt-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-muted/50",
                  isHydration ? "text-primary" : "text-muted-foreground"
                )}
              >
                {isHydration ? <Database className="h-5 w-5" /> : <RefreshCw className="h-5 w-5 animate-spin" />}
              </div>
              <div className="space-y-1">
                <CardTitle id="offline-overlay-title" className="text-lg font-semibold tracking-tight sm:text-xl">
                  {title}
                </CardTitle>
                <CardDescription id="offline-overlay-desc" className="text-[13px] leading-relaxed">
                  {isHydration ? t("syncDashboard.hydrationOverlay.subtitle") : t("syncDashboard.syncOverlay.subtitle")}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {isHydration ? (
                <>
                  <Badge variant="outline" className="gap-1 font-normal">
                    <WifiOff className="h-3 w-3" />
                    {t("syncDashboard.hydrationOverlay.modeBadge")}
                  </Badge>
                  {tenant ? (
                    <Badge variant="secondary" className="max-w-[200px] truncate font-mono text-[11px]">
                      {t("syncDashboard.hydrationOverlay.tenantBadge", { tenant })}
                    </Badge>
                  ) : null}
                  {hydrationWallMs != null ? (
                    <Badge variant="secondary" className="font-normal tabular-nums">
                      {t("syncDashboard.hydrationOverlay.totalWallTime", { time: formatElapsed(hydrationWallMs) })}
                    </Badge>
                  ) : hydrationStartedAt ? (
                    <Badge variant="ghost" className="font-normal tabular-nums text-muted-foreground">
                      {t("syncDashboard.hydrationOverlay.elapsed", { time: formatElapsed(elapsedMs) })}
                    </Badge>
                  ) : null}
                </>
              ) : (
                <Badge variant="outline" className="gap-1 font-normal">
                  <RefreshCw className="h-3 w-3" />
                  {t("syncDashboard.syncOverlay.modeBadge")}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-end justify-between gap-3 text-sm">
              <p className="font-medium text-foreground">{statusText}</p>
              <span className="tabular-nums text-sm font-semibold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2.5" />
            <p className="text-xs text-muted-foreground">
              {!isHydration && currentPending > 0
                ? t("syncDashboard.syncOverlay.remaining", { count: currentPending })
                : !isHydration
                  ? t("syncDashboard.syncOverlay.almostDone")
                  : hydrationCompletedWithIssues
                    ? t("syncDashboard.hydrationOverlay.hintIssues")
                    : t("syncDashboard.hydrationOverlay.hint")}
            </p>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-4 px-4 pb-6 pt-4 sm:px-8">
          {!isHydration && syncDetail ? (
            <div className="flex flex-wrap gap-2 text-[11px]">
              {syncDetail.syncedCount != null ? (
                <Badge variant="success" className="font-normal">
                  {t("syncDashboard.syncOverlay.statSynced")} · {syncDetail.syncedCount}
                </Badge>
              ) : null}
              {syncDetail.failedCount != null && syncDetail.failedCount > 0 ? (
                <Badge variant="destructive" className="font-normal">
                  {t("syncDashboard.syncOverlay.statFailed")} · {syncDetail.failedCount}
                </Badge>
              ) : null}
            </div>
          ) : null}

          {isHydration && hydrationModules.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-[11px]">
              {hydrationStats.done > 0 ? (
                <Badge variant="success" className="font-normal">
                  {t("syncDashboard.hydrationOverlay.statDone")} · {hydrationStats.done}
                </Badge>
              ) : null}
              {hydrationStats.running > 0 ? (
                <Badge variant="info" className="font-normal">
                  {t("syncDashboard.hydrationOverlay.statRunning")} · {hydrationStats.running}
                </Badge>
              ) : null}
              {hydrationStats.pending > 0 ? (
                <Badge variant="outline" className="font-normal">
                  {t("syncDashboard.hydrationOverlay.statPending")} · {hydrationStats.pending}
                </Badge>
              ) : null}
              {hydrationStats.error > 0 ? (
                <Badge variant="destructive" className="font-normal">
                  {t("syncDashboard.hydrationOverlay.statError")} · {hydrationStats.error}
                </Badge>
              ) : null}
              {hydrationStats.skipped > 0 ? (
                <Badge variant="ghost" className="font-normal">
                  {t("syncDashboard.hydrationOverlay.statSkipped")} · {hydrationStats.skipped}
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isHydration ? t("syncDashboard.hydrationOverlay.detailsTitle") : t("syncDashboard.syncOverlay.detailsTitle")}
              </h4>
              {isHydration && hydrationModules.length > 0 ? (
                <span className="text-[11px] text-muted-foreground">
                  {t("syncDashboard.hydrationOverlay.modulesCount", {
                    done: hydrationStats.finished,
                    total: hydrationStats.total,
                  })}
                </span>
              ) : null}
            </div>

            {isHydration ? (
              hydrationModules.length === 0 ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-8">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                    <p className="text-sm text-muted-foreground">{t("syncDashboard.hydrationOverlay.noDetails")}</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[min(50vh,26rem)] pr-3">
                  <ul className="space-y-2 pb-1">
                    {hydrationModules.map((m) => {
                      const pct =
                        m.status === "skipped"
                          ? 100
                          : m.total
                            ? Math.min(100, Math.round((m.done / m.total) * 100))
                            : m.status === "done"
                              ? 100
                              : 0;
                      const stepLabel =
                        m.total > 1
                          ? t("syncDashboard.hydrationOverlay.moduleSteps", { done: m.done, total: m.total })
                          : null;
                      return (
                        <li
                          key={m.id}
                          className={cn(
                            "rounded-lg border border-border/50 bg-card/50 p-3 transition-colors",
                            m.status === "running" && "border-primary/30 bg-primary/[0.03] shadow-sm",
                            m.status === "error" && "border-destructive/40 bg-destructive/[0.04]"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <ModuleStatusIcon status={m.status} />
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium leading-tight">{t(m.labelKey)}</span>
                                <span
                                  className={cn(
                                    "shrink-0 text-xs font-medium",
                                    m.status === "error" && "text-destructive",
                                    m.status === "done" && "text-emerald-600",
                                    m.status === "running" && "text-primary",
                                    (m.status === "pending" || m.status === "skipped") && "text-muted-foreground"
                                  )}
                                >
                                  {m.status === "running"
                                    ? t("syncDashboard.hydrationOverlay.stateRunning")
                                    : m.status === "done"
                                      ? t("syncDashboard.hydrationOverlay.stateDone")
                                      : m.status === "error"
                                        ? t("syncDashboard.hydrationOverlay.stateError")
                                        : m.status === "skipped"
                                          ? t("syncDashboard.hydrationOverlay.stateSkipped")
                                          : t("syncDashboard.hydrationOverlay.statePending")}
                                </span>
                              </div>
                              {stepLabel ? (
                                <p className="text-[11px] text-muted-foreground">{stepLabel}</p>
                              ) : null}
                              {(m.status === "done" || m.status === "error" || m.status === "skipped") &&
                              m.durationMs != null ? (
                                <p className="text-[10px] tabular-nums text-muted-foreground">
                                  {t("syncDashboard.hydrationOverlay.moduleTiming", {
                                    time: formatModuleDuration(m.durationMs),
                                  })}
                                </p>
                              ) : null}
                              <Progress value={pct} className="h-1.5" />
                              {m.error ? (
                                <p
                                  className="break-words rounded-md bg-destructive/10 px-2 py-1.5 font-mono text-[11px] leading-snug text-destructive"
                                  title={m.error}
                                >
                                  {m.error}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              )
            ) : groups.length === 0 && !syncDetail ? (
              <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-6 text-center text-xs text-muted-foreground">
                {t("syncDashboard.syncOverlay.noDetails")}
              </div>
            ) : (
              <div className="space-y-4">
                {groups.length > 0 ? (
                  <ScrollArea className="h-[min(40vh,20rem)] pr-3">
                    <ul className="space-y-3">
                      {groups.map((group) => (
                        <li key={group.entityType} className="rounded-lg border border-border/40 bg-muted/10 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2 font-medium">
                            <span className="truncate">{group.entityType}</span>
                            <Badge variant="secondary">{group.count}</Badge>
                          </div>
                          <ul className="mt-2 space-y-1 text-muted-foreground">
                            {group.sampleEndpoints.map((ep) => (
                              <li key={`${group.entityType}-${ep}`} className="truncate font-mono text-[11px]" title={ep}>
                                {ep}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                ) : null}

                {syncDetail ? (
                  <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("syncDashboard.syncOverlay.reportTitle")}
                    </h5>
                    {syncDetail.summary ? (
                      <p
                        className={cn(
                          "text-sm leading-relaxed",
                          syncReportHasIssues ? "text-destructive" : "text-foreground"
                        )}
                      >
                        {syncDetail.summary}
                      </p>
                    ) : null}
                    {syncDetail.fatalError ? (
                      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                        <p className="text-[11px] font-semibold uppercase text-destructive">
                          {t("syncDashboard.syncOverlay.fatalTitle")}
                        </p>
                        <p className="mt-1 font-mono text-xs text-destructive">{syncDetail.fatalError}</p>
                      </div>
                    ) : null}
                    {syncDetail.httpStatus != null ? (
                      <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
                        <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                          {t("syncDashboard.syncOverlay.httpTitle", { status: syncDetail.httpStatus })}
                        </p>
                        {syncDetail.httpBody ? (
                          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-background/80 p-2 font-mono text-[10px] leading-snug text-muted-foreground">
                            {syncDetail.httpBody}
                          </pre>
                        ) : null}
                      </div>
                    ) : null}
                    {(syncDetail.binaryFailures?.length ?? 0) > 0 ? (
                      <div>
                        <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                          {t("syncDashboard.syncOverlay.binaryFailuresTitle")}
                        </p>
                        <ul className="space-y-2">
                          {syncDetail.binaryFailures!.map((row) => (
                            <li
                              key={`bin-${row.opId}`}
                              className="rounded-lg border border-border/50 bg-card/80 p-2 text-[11px]"
                            >
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-mono text-[10px] text-muted-foreground">
                                <span className="text-foreground">{row.method}</span>
                                <span className="min-w-0 break-all">{row.endpoint}</span>
                              </div>
                              <p className="mt-1 text-destructive">{row.error || row.status}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {(syncDetail.failedOperations?.length ?? 0) > 0 ? (
                      <div>
                        <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                          {t("syncDashboard.syncOverlay.serverRejectedTitle")}
                        </p>
                        <ul className="space-y-2">
                          {(syncDetail.failedOperations ?? []).map((row) => (
                            <li
                              key={row.opId}
                              className="rounded-lg border border-destructive/25 bg-destructive/[0.06] p-3 text-[11px]"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-mono text-[10px] text-muted-foreground">{row.opId}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {row.status}
                                </Badge>
                              </div>
                              {row.entityType ? (
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {t("syncDashboard.syncOverlay.entityType")}: {row.entityType}
                                </p>
                              ) : null}
                              <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                                <span className="text-foreground">{row.method}</span>{" "}
                                <span className="break-all">{row.endpoint}</span>
                              </div>
                              <p className="mt-2 font-mono text-xs leading-snug text-destructive">
                                {row.error || t("syncDashboard.syncOverlay.noServerMessage")}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {isHydration && hydrationFatalDone ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-1">
              <p className="text-[11px] font-semibold uppercase text-destructive">
                {t("syncDashboard.hydrationOverlay.fatalTitle")}
              </p>
              <p className="text-xs font-mono text-destructive break-words">{hydrationFatalDone}</p>
            </div>
          ) : null}

          {isHydration ? (
            <p className="border-t pt-4 text-[12px] leading-relaxed text-muted-foreground">
              {hydrationCompletedWithIssues
                ? t("syncDashboard.hydrationOverlay.footerNoteIssues")
                : t("syncDashboard.hydrationOverlay.footerNote")}
            </p>
          ) : syncReportHasIssues ? (
            <p className="border-t pt-4 text-[12px] leading-relaxed text-muted-foreground">
              {t("syncDashboard.syncOverlay.syncCenterDetailHint")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
