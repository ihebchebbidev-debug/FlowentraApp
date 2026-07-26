import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, CalendarClock,
  CheckCircle2, ChevronDown, ChevronRight, CircleDot, Clock, Filter,
  Pause, Play, RefreshCw, Search, Square, StopCircle, XCircle, Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  PROCESSES, WORKSPACE_LABELS, type ProcessDefinition, type ProcessRun as UiProcessRun, type ProcessStatus, type WorkspaceId,
} from "@/modules/system/services/processesMock";
import {
  listSchedules, upsertSchedule, setEnabled as apiSetEnabled, setPaused as apiSetPaused,
  runNow as apiRunNow, listRuns as apiListRuns, resetFailures as apiResetFailures,
  stopRun as apiStopRun,
  listRunningKeys, overlay, REAL_HANDLER_KEYS, ProcessesApiError, type ProcessSchedule,
} from "@/modules/system/services/processesService";
import { ProcessesAutopilotDemo } from "@/modules/system/components/onboarding/ProcessesAutopilotDemo";
import { localizeProcess } from "@/modules/system/utils/processesI18n";
import { getProcessExplanation } from "@/modules/system/utils/processExplanations";
import { usePermissions } from "@/hooks/usePermissions";
import type { TFunction } from "i18next";


const STATUS_ICONS: Record<ProcessStatus, any> = {
  idle: CircleDot,
  running: Activity,
  paused: Pause,
  failed: XCircle,
  blocked: AlertTriangle,
};

const STATUS_CLASSES: Record<ProcessStatus, string> = {
  idle:    "bg-muted text-muted-foreground border-border",
  running: "bg-primary/10 text-primary border-primary/30",
  paused:  "bg-muted text-muted-foreground border-border",
  failed:  "bg-destructive/10 text-destructive border-destructive/30",
  blocked: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

function fmtRelative(t: TFunction, iso?: string): string {
  if (!iso) return t("relative.dash");
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const sign = diff >= 0 ? "" : t("relative.in");
  const past = diff >= 0 ? t("relative.ago") : "";
  const mins = Math.round(abs / 60_000);
  if (mins < 1) return t("relative.just_now");
  if (mins < 60) return `${sign}${mins}${t("relative.m")}${past}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${sign}${hrs}${t("relative.h")}${past}`;
  const days = Math.round(hrs / 24);
  return `${sign}${days}${t("relative.d")}${past}`;
}

function fmtDuration(ms?: number): string {
  if (ms == null) return "—";
  if (ms < 1_000) return `${ms}ms`;
  const s = ms / 1_000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = s / 60;
  return `${m.toFixed(1)}m`;
}

function StatusPill({ t, status, reason }: { t: TFunction; status: ProcessStatus; reason?: string }) {
  const Icon = STATUS_ICONS[status];
  const pill = (
    <Badge variant="outline" className={`gap-1.5 font-medium ${STATUS_CLASSES[status]}`}>
      <Icon className={`h-3 w-3 ${status === "running" ? "animate-pulse" : ""}`} />
      {t(`status.${status}`)}
    </Badge>
  );
  if (!reason) return pill;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild><span>{pill}</span></TooltipTrigger>
        <TooltipContent className="max-w-xs">{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function ProcessesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation("processes");
  const { isMainAdmin, hasPermission } = usePermissions();
  // Only MainAdmin (or roles explicitly granted processes.manage) can run,
  // pause, stop, enable/disable, or reconfigure processes. Everyone else
  // has read-only visibility into the schedules and history.
  const canManage = isMainAdmin || hasPermission("processes", "manage");
  const isLoading = false;


  // Only surface processes that have a real, reliable backend handler.
  const reliableCatalog = useMemo(
    () => PROCESSES.filter((p) => REAL_HANDLER_KEYS.has(p.key)).map((p) => localizeProcess(t, p)),
    [t]
  );

  const [items, setItems] = useState<ProcessDefinition[]>(reliableCatalog);
  const [schedules, setSchedules] = useState<Map<string, ProcessSchedule>>(new Map());
  const [workspace, setWorkspace] = useState<WorkspaceId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [liveHistory, setLiveHistory] = useState<UiProcessRun[] | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [accessError, setAccessError] = useState<{ status: number; message: string } | null>(null);

  const toggleExpanded = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  // Re-localize when language changes.
  useEffect(() => { setItems(reliableCatalog); }, [reliableCatalog]);

  // Localised schedule text so the row never falls back to hardcoded English.
  const fmtSchedule = useMemo(
    () => (minutes: number, paused: boolean, enabled: boolean) =>
      paused
        ? t("schedule_human.every_minutes_paused", { count: minutes })
        : !enabled
        ? t("schedule_human.every_minutes_disabled", { count: minutes })
        : t("schedule_human.every_minutes", { count: minutes }),
    [t]
  );

  const refreshSchedules = async () => {
    try {
      const [map, running] = await Promise.all([listSchedules(), listRunningKeys()]);
      setSchedules(map);
      setItems(reliableCatalog.map((p) => overlay(p, map.get(p.key), running, fmtSchedule)));
      setAccessError(null);
    } catch (e) {
      const err = e as ProcessesApiError;
      if (err?.status === 401 || err?.status === 403) {
        setAccessError({ status: err.status, message: err.message || "Access denied" });
        setSchedules(new Map());
        setItems([]);
      } else {
        console.warn("[processes] listSchedules failed:", (e as Error).message);
      }
    }
  };

  useEffect(() => {
    refreshSchedules();
    // Poll every 15s, but only while the tab is visible — background tabs
    // don't need live status and the request loop was firing regardless.
    // Also re-fetch immediately when the tab becomes visible again so the
    // operator never stares at stale data after switching back.
    let timer: number | null = null;
    const start = () => {
      if (timer != null) return;
      timer = window.setInterval(refreshSchedules, 15_000);
    };
    const stop = () => {
      if (timer != null) { window.clearInterval(timer); timer = null; }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshSchedules();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const counts = useMemo(() => ({
    running: items.filter((i) => i.status === "running").length,
    failed:  items.filter((i) => i.status === "failed").length,
    blocked: items.filter((i) => i.status === "blocked").length,
    paused:  items.filter((i) => i.status === "paused" || !i.isEnabled).length,
    total:   items.length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (workspace !== "all" && p.workspace !== workspace) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (q && !`${p.name} ${p.module} ${p.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, workspace, statusFilter, query]);

  const grouped = useMemo(() => {
    const map = new Map<WorkspaceId, ProcessDefinition[]>();
    filtered.forEach((p) => {
      const arr = map.get(p.workspace) ?? [];
      arr.push(p);
      map.set(p.workspace, arr);
    });
    return map;
  }, [filtered]);

  const selected = selectedKey ? items.find((p) => p.key === selectedKey) ?? null : null;

  const updateProcess = (key: string, patch: Partial<ProcessDefinition>) =>
    setItems((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const denyIfReadOnly = (): boolean => {
    if (canManage) return false;
    toast({
      title: t("toast.read_only_title", { defaultValue: "Read-only access" }),
      description: t("toast.read_only_desc", {
        defaultValue: "Only the main administrator can run, pause, or configure processes.",
      }),
      variant: "destructive",
    });
    return true;
  };

  const runNow = async (p: ProcessDefinition) => {
    if (denyIfReadOnly()) return;
    updateProcess(p.key, { status: "running", lastRunAt: new Date().toISOString() });
    toast({ title: t("toast.started_title"), description: p.name });
    try {
      const res = await apiRunNow(p.key);
      const isSkipped = res.status === "skipped";
      const isSuccess = res.status === "success";
      toast({
        title: isSuccess ? t("toast.completed_title")
             : isSkipped ? t("toast.already_running_title")
             : res.status === "blocked" ? t("toast.blocked_title") : t("toast.failed_title"),
        description: res.error ?? res.block_reason ?? `${p.name} — ${res.duration_ms}ms`,
        variant: isSuccess || isSkipped ? "default" : "destructive",
      });
    } catch (e) {
      toast({ title: t("toast.run_failed_title"), description: (e as Error).message, variant: "destructive" });
    }
    await refreshSchedules();
    if (selectedKey === p.key) {
      try { setLiveHistory(await apiListRuns(p.key, 30)); } catch { /* ignore */ }
    }
  };

  const togglePause = async (p: ProcessDefinition) => {
    if (denyIfReadOnly()) return;
    const next = !p.isPaused;
    const prevPaused = p.isPaused;
    const prevStatus = p.status;
    updateProcess(p.key, { isPaused: next, status: next ? "paused" : "idle" });
    try {
      if (schedules.has(p.key)) {
        await apiSetPaused(p.key, next);
      } else {
        // No schedule row yet — persist one so pausing actually takes effect
        // server-side instead of being a local-only illusion.
        await upsertSchedule({
          key: p.key, name: p.name, paused: next,
          interval_minutes: p.intervalMinutes ?? 60,
        });
      }
      await refreshSchedules();
      toast({ title: next ? t("toast.paused_title") : t("toast.resumed_title"), description: p.name });
    } catch (e) {
      updateProcess(p.key, { isPaused: prevPaused, status: prevStatus });
      toast({ title: t("toast.could_not_update_title"), description: (e as Error).message, variant: "destructive" });
    }
  };

  const toggleEnabled = async (p: ProcessDefinition) => {
    if (denyIfReadOnly()) return;
    const enabled = !p.isEnabled;
    const prevEnabled = p.isEnabled;
    const prevStatus = p.status;
    updateProcess(p.key, { isEnabled: enabled, status: enabled ? "idle" : "paused" });
    if (schedules.has(p.key)) {
      try {
        await apiSetEnabled(p.key, enabled);
        await refreshSchedules();
        toast({
          title: enabled ? t("toast.resumed_title") : t("toast.paused_title"),
          description: p.name,
        });
      } catch (e) {
        updateProcess(p.key, { isEnabled: prevEnabled, status: prevStatus });
        toast({ title: t("toast.could_not_update_title"), description: (e as Error).message, variant: "destructive" });
      }
    } else {
      try {
        await upsertSchedule({
          key: p.key, name: p.name, enabled,
          interval_minutes: p.intervalMinutes ?? 60,
        });
        await refreshSchedules();
        toast({
          title: t("toast.schedule_saved_title"),
          description: t("toast.schedule_saved_desc", { name: p.name, minutes: p.intervalMinutes ?? 60 }),
        });
      } catch (e) {
        updateProcess(p.key, { isEnabled: prevEnabled, status: prevStatus });
        toast({ title: t("toast.could_not_create_title"), description: (e as Error).message, variant: "destructive" });
      }
    }
  };

  const stopRun = async (p: ProcessDefinition) => {
    if (denyIfReadOnly()) return;
    try {
      const stopped = await apiStopRun(p.key);
      await refreshSchedules();
      toast({
        title: stopped ? t("toast.stop_requested_title") : t("toast.stop_nothing_running_title"),
        description: p.name,
      });
    } catch (e) {
      toast({ title: t("toast.could_not_stop_title"), description: (e as Error).message, variant: "destructive" });
    }
  };

  const resetFailures = async (p: ProcessDefinition) => {
    if (denyIfReadOnly()) return;
    if (schedules.has(p.key)) {
      try {
        await apiResetFailures(p.key);
        await refreshSchedules();
        toast({ title: t("toast.failures_cleared_title"), description: p.name });
      } catch (e) {
        toast({ title: t("toast.could_not_reset_title"), description: (e as Error).message, variant: "destructive" });
      }
    } else {
      updateProcess(p.key, { consecutiveFailures: 0 });
    }
  };

  const saveInterval = async (p: ProcessDefinition, intervalMinutes: number) => {
    if (denyIfReadOnly()) return;
    try {
      await upsertSchedule({ key: p.key, name: p.name, interval_minutes: intervalMinutes });
      await refreshSchedules();
      toast({
        title: t("toast.schedule_updated_title"),
        description: t("toast.schedule_updated_desc", { name: p.name, minutes: intervalMinutes }),
      });
    } catch (e) {
      toast({ title: t("toast.could_not_update_title"), description: (e as Error).message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!selectedKey) { setLiveHistory(null); return; }
    if (!REAL_HANDLER_KEYS.has(selectedKey) || !schedules.has(selectedKey)) {
      setLiveHistory(null);
      return;
    }
    let cancelled = false;
    apiListRuns(selectedKey, 30)
      .then((rows) => { if (!cancelled) setLiveHistory(rows); })
      .catch(() => { if (!cancelled) setLiveHistory(null); });
    return () => { cancelled = true; };
  }, [selectedKey, schedules]);

  if (isLoading) return null;

  const wsLabel = (id: WorkspaceId) => t(`workspaces.${id}`, { defaultValue: WORKSPACE_LABELS[id] });

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {accessError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-semibold">
              {accessError.status === 403
                ? t("access_banner.403_title")
                : t("access_banner.401_title")}
            </div>
            <div className="mt-1 text-destructive/90">{t("access_banner.body")}</div>
            <div className="mt-1 text-xs opacity-80">{accessError.message}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <Card className="border-0 shadow-card bg-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Zap className="h-4 w-4 text-primary" />
                {t("title")}
              </CardTitle>
              <CardDescription className="mt-1">{t("description")}</CardDescription>
              {!canManage && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {t("read_only_banner", {
                    defaultValue:
                      "Read-only — only the main administrator can run or configure processes.",
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Metric label={t("metrics.running")} value={counts.running} tone="primary" />
              <Metric label={t("metrics.failed")}  value={counts.failed}  tone="destructive" />
              <Metric label={t("metrics.blocked")} value={counts.blocked} tone="amber" />
              <Metric label={t("metrics.paused")}  value={counts.paused}  tone="muted" />
              <Metric label={t("metrics.total")}   value={counts.total}   tone="muted" />
              <Button size="sm" variant="outline" onClick={() => setDemoOpen(true)} className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                {t("actions.watch_demo")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => refreshSchedules()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                {t("actions.refresh")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Toolbar */}
      <Card className="border-0 shadow-card bg-card">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("toolbar.search_placeholder")}
                className="pl-8 h-9"
              />
            </div>
            <Select value={workspace} onValueChange={(v) => setWorkspace(v as any)}>
              <SelectTrigger className="w-[180px] h-9">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder={t("toolbar.workspace_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("toolbar.all_workspaces")}</SelectItem>
                {Object.keys(WORKSPACE_LABELS).map((id) => (
                  <SelectItem key={id} value={id}>{wsLabel(id as WorkspaceId)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder={t("toolbar.status_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("toolbar.all_status")}</SelectItem>
                {(Object.keys(STATUS_ICONS) as ProcessStatus[]).map((id) => (
                  <SelectItem key={id} value={id}>{t(`status.${id}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grouped list */}
      <div className="flex flex-col gap-4">
        {[...grouped.entries()].map(([ws, list]) => (
          <Card key={ws} className="border-0 shadow-card bg-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
                  {wsLabel(ws)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t("workspace_count", { count: list.length })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {list.map((p) => (
                  <ProcessRow
                    key={p.key}
                    t={t}
                    p={p}
                    expanded={expandedKeys.has(p.key)}
                    canManage={canManage}
                    onToggleExpand={() => toggleExpanded(p.key)}
                    onOpen={() => setSelectedKey(p.key)}
                    onRun={() => runNow(p)}
                    onPause={() => togglePause(p)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="border-0 shadow-card bg-card">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {t("empty")}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedKey(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <ProcessDrawer
              t={t}
              p={selected}
              liveHistory={liveHistory}
              hasSchedule={schedules.has(selected.key)}
              stopEnabled={selected.status === "running"}
              canManage={canManage}
              onRun={() => runNow(selected)}
              onPause={() => togglePause(selected)}
              onStop={() => stopRun(selected)}
              onToggleEnabled={() => toggleEnabled(selected)}
              onResetFailures={() => resetFailures(selected)}
              onSaveInterval={(mins) => saveInterval(selected, mins)}
            />
          )}
        </SheetContent>
      </Sheet>

      <ProcessesAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "primary" | "destructive" | "amber" | "muted" }) {
  const toneCls = {
    primary: "bg-primary/10 text-primary border-primary/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    muted: "bg-muted text-muted-foreground border-border",
  }[tone];
  return (
    <div className={`rounded-md border px-2.5 py-1 text-xs font-medium ${toneCls}`}>
      <span className="opacity-70 mr-1">{label}</span>{value}
    </div>
  );
}

function ProcessRow({
  t, p, expanded, canManage, onToggleExpand, onOpen, onRun, onPause,
}: {
  t: TFunction;
  p: ProcessDefinition;
  expanded: boolean;
  canManage: boolean;
  onToggleExpand: () => void;
  onOpen: () => void;
  onRun: () => void;
  onPause: () => void;
}) {
  // The one line that explains *why* a process is not healthy.
  const issue = p.status === "blocked" ? (p.blockReason || p.lastError)
              : p.status === "failed" ? (p.lastError || p.blockReason)
              : undefined;
  const explanation = getProcessExplanation(p.key, t);
  return (
    <div>
      <div
        className="grid grid-cols-12 items-start gap-2 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
        onClick={onOpen}
      >
        <div className="col-span-12 sm:col-span-5 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium text-sm truncate">{p.name}</div>
            {!p.isEnabled && (
              <Badge variant="outline" className="text-[10px] h-4">{t("status.disabled")}</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {p.module} · <span className="font-mono opacity-80">{p.key}</span>
          </div>
          {issue && (
            <div className="mt-0.5 flex items-start gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="truncate" title={issue}>{issue}</span>
            </div>
          )}
        </div>
        <div className="hidden sm:flex sm:col-span-2 items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="truncate">{p.scheduleHuman}</span>
        </div>
        <div className="hidden sm:block sm:col-span-2 text-xs text-muted-foreground">
          <div>{t("row.last_prefix")} {fmtRelative(t, p.lastRunAt)}</div>
          <div>{t("row.next_prefix")} {fmtRelative(t, p.nextRunAt)}</div>
        </div>
        <div className="col-span-6 sm:col-span-2">
          <StatusPill t={t} status={p.status} reason={issue} />
          {p.consecutiveFailures > 0 && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              {t("labels.consecutive_failures")}: {p.consecutiveFailures}
            </div>
          )}
        </div>
        <div className="col-span-6 sm:col-span-1 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onRun}
            disabled={!canManage}
            title={canManage ? t("actions.run_now") : t("actions.run_now_locked", { defaultValue: "Only the main administrator can run processes" })}
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onPause}
            disabled={!canManage}
            title={!canManage
              ? t("actions.pause_locked", { defaultValue: "Only the main administrator can pause processes" })
              : (p.isPaused ? t("actions.resume") : t("actions.pause"))}
          >
            {p.isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </Button>
          {explanation && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onToggleExpand}
              aria-expanded={expanded}
              aria-label={expanded ? t("actions.hide_details", { defaultValue: "Hide details" }) : t("actions.show_details", { defaultValue: "Show details" })}
              title={expanded ? t("actions.hide_details", { defaultValue: "Hide details" }) : t("actions.show_details", { defaultValue: "Show details" })}
            >
              {expanded
                ? <ChevronDown className="h-3.5 w-3.5" />
                : <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>
      {expanded && explanation && (
        <div
          className="grid gap-3 border-t bg-muted/30 px-4 py-3 sm:grid-cols-3"
          onClick={(e) => e.stopPropagation()}
        >
          <ExplainBlock
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            title={t("explain.when_it_runs", { defaultValue: "When it runs" })}
            body={<p className="text-xs text-muted-foreground">{explanation.whenItRuns}</p>}
          />
          <ExplainBlock
            icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
            title={t("explain.inputs", { defaultValue: "Inputs" })}
            body={
              <ul className="space-y-1 text-xs text-muted-foreground">
                {explanation.inputs.map((line, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            }
          />
          <ExplainBlock
            icon={<ArrowUpFromLine className="h-3.5 w-3.5" />}
            title={t("explain.outputs", { defaultValue: "Outputs" })}
            body={
              <ul className="space-y-1 text-xs text-muted-foreground">
                {explanation.outputs.map((line, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            }
          />
        </div>
      )}
    </div>
  );
}

function ExplainBlock({ icon, title, body }: { icon: React.ReactNode; title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </div>
      {body}
    </div>
  );
}


function ProcessDrawer({
  t, p, liveHistory, hasSchedule, stopEnabled, canManage,
  onRun, onPause, onStop, onToggleEnabled, onResetFailures, onSaveInterval,
}: {
  t: TFunction;
  p: ProcessDefinition;
  liveHistory: UiProcessRun[] | null;
  hasSchedule: boolean;
  stopEnabled: boolean;
  canManage: boolean;
  onRun: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleEnabled: () => void;
  onResetFailures: () => void;
  onSaveInterval: (mins: number) => void;
}) {
  const lockedTitle = t("actions.locked_tooltip", {
    defaultValue: "Only the main administrator can perform this action",
  });
  const [intervalDraft, setIntervalDraft] = useState<number>(p.intervalMinutes ?? 60);
  const history = liveHistory ?? p.history;
  const wsLabel = t(`workspaces.${p.workspace}`, { defaultValue: WORKSPACE_LABELS[p.workspace] });

  return (
    <>
      <SheetHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">{wsLabel}</Badge>
          <StatusPill t={t} status={p.status} reason={p.blockReason || p.lastError} />
        </div>
        <SheetTitle className="text-base">{p.name}</SheetTitle>
        <SheetDescription>{p.description}</SheetDescription>
        <div className="text-[11px] text-muted-foreground font-mono pt-1">
          {p.module} · {t("labels.anchor")} {p.anchor}
        </div>
      </SheetHeader>

      <div className="flex flex-wrap items-center gap-2 py-3">
        <Button size="sm" onClick={onRun} disabled={!canManage} title={canManage ? undefined : lockedTitle}>
          <Play className="h-3.5 w-3.5 mr-1.5" />{t("actions.run_now")}
        </Button>
        <Button size="sm" variant="outline" onClick={onPause} disabled={!canManage} title={canManage ? undefined : lockedTitle}>
          {p.isPaused
            ? <><Play className="h-3.5 w-3.5 mr-1.5" />{t("actions.resume")}</>
            : <><Pause className="h-3.5 w-3.5 mr-1.5" />{t("actions.pause")}</>}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!stopEnabled || !canManage}
          title={canManage ? t("stop_tooltip") : lockedTitle}
        >
          <StopCircle className="h-3.5 w-3.5 mr-1.5" />{t("actions.stop")}
        </Button>

        <Button size="sm" variant="ghost" onClick={onResetFailures} disabled={p.consecutiveFailures === 0 || !canManage} title={canManage ? undefined : lockedTitle}>
          {t("actions.reset_failures")}
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            {p.isEnabled ? t("labels.enabled") : t("labels.disabled")}
          </span>
          <Switch checked={p.isEnabled} onCheckedChange={onToggleEnabled} disabled={!canManage} title={canManage ? undefined : lockedTitle} />
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList className="grid grid-cols-4 h-9">
          <TabsTrigger value="overview" className="text-xs">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs">{t("tabs.schedule")}</TabsTrigger>
          <TabsTrigger value="history"  className="text-xs">{t("tabs.history")}</TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs">{t("tabs.diagnostics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-3 space-y-2">
          <Row label={t("labels.schedule")}      value={p.scheduleHuman} />
          <Row label={t("labels.timezone")}      value={p.timezone} />
          <Row label={t("labels.last_run")}      value={fmtRelative(t, p.lastRunAt)} />
          <Row label={t("labels.last_duration")} value={fmtDuration(p.lastDurationMs)} />
          <Row label={t("labels.last_items")}    value={String(p.lastItems ?? "—")} />
          <Row label={t("labels.next_run")}      value={fmtRelative(t, p.nextRunAt)} />
          <Row label={t("labels.success_rate")}  value={p.successRate30 === undefined ? "—" : `${p.successRate30}%`} />
          <Row label={t("labels.consecutive_failures")} value={String(p.consecutiveFailures)} />
          {p.lastError && (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              <span className="font-medium">{t("labels.last_error")}</span> {p.lastError}
            </div>
          )}
          {p.blockReason && (
            <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
              <span className="font-medium">{t("labels.blocked")}</span> {p.blockReason}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="pt-3 space-y-3">
          <Row label={t("labels.type")} value={p.scheduleType} />
          {p.intervalMinutes && (
            <Row label={t("labels.interval")} value={t("labels.every_minutes", { count: p.intervalMinutes })} />
          )}
          {p.cronExpression && <Row label={t("labels.cron")} value={<code className="font-mono">{p.cronExpression}</code>} />}
          <Row label={t("labels.timezone")} value={p.timezone} />

          {p.scheduleType === "interval" && (
            <div className="flex items-end gap-2 pt-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">{t("labels.new_interval")}</label>
                <Input
                  type="number"
                  min={1}
                  value={intervalDraft}
                  onChange={(e) => setIntervalDraft(Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 mt-1"
                />
              </div>
              <Button
                size="sm"
                onClick={() => onSaveInterval(intervalDraft)}
                disabled={intervalDraft === (p.intervalMinutes ?? 60) || !canManage}
                title={canManage ? undefined : lockedTitle}
              >
                {t("actions.save")}
              </Button>
            </div>
          )}
          {!hasSchedule && (
            <div className="pt-1 text-[11px] text-muted-foreground">
              {t("no_schedule_hint")}
            </div>
          )}

          {p.settings.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="text-xs font-medium text-muted-foreground">{t("labels.settings")}</div>
              {p.settings.map((s) => (
                <Row key={s.label} label={s.label} value={String(s.value)} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-3">
          <ScrollArea className="h-[360px] pr-3">
            <div className="divide-y">
              {history.map((r) => (
                <div key={r.id} className="grid grid-cols-12 gap-2 py-2 text-xs">
                  <div className="col-span-4 text-muted-foreground">{fmtRelative(t, r.startedAt)}</div>
                  <div className="col-span-2">{fmtDuration(r.durationMs)}</div>
                  <div className="col-span-2 tabular-nums">{r.itemsProcessed}</div>
                  <div className="col-span-2 text-muted-foreground">
                    {t(`trigger.${r.triggeredBy}`, { defaultValue: r.triggeredBy })}
                  </div>
                  <div className="col-span-2 text-right">
                    {r.status === "success"
                      ? <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="h-3 w-3" />{t("history_status.ok")}</span>
                      : r.status === "failed"
                      ? <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" />{t("history_status.fail")}</span>
                      : r.status === "blocked"
                      ? <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" />{t("history_status.block")}</span>
                      : r.status === "running"
                      ? <span className="inline-flex items-center gap-1 text-primary"><Activity className="h-3 w-3 animate-pulse" />{t("history_status.running")}</span>
                      : r.status === "skipped"
                      ? <span className="inline-flex items-center gap-1 text-muted-foreground"><CircleDot className="h-3 w-3" />{t("history_status.skipped")}</span>
                      : <span className="inline-flex items-center gap-1 text-muted-foreground"><Square className="h-3 w-3" />{t("history_status.canc")}</span>}
                  </div>
                  {r.error && (
                    <div className="col-span-12 pl-1 text-destructive/80">↳ {r.error}</div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="diagnostics" className="pt-3 space-y-2">
          <div
            className="text-xs text-muted-foreground pb-1"
            dangerouslySetInnerHTML={{ __html: t("diagnostics_intro") }}
          />
          {p.diagnostics.map((d, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border p-2 text-sm">
              {d.ok
                ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <div className="font-medium">{d.label}</div>
                {d.detail && <div className="text-xs text-muted-foreground">{d.detail}</div>}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
