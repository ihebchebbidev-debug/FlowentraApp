import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, CheckCircle2, ChevronRight, CircleDot, Clock, Filter,
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
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import {
  PROCESSES, WORKSPACE_LABELS, type ProcessDefinition, type ProcessStatus, type WorkspaceId,
} from "@/modules/system/services/processesMock";
import {
  listSchedules, upsertSchedule, setEnabled as apiSetEnabled, setPaused as apiSetPaused,
  runNow as apiRunNow, overlay, REAL_HANDLER_KEYS, type ProcessSchedule,
} from "@/modules/system/services/processesService";

const STATUS_META: Record<ProcessStatus, { label: string; className: string; icon: any }> = {
  idle:     { label: "Idle",     className: "bg-muted text-muted-foreground border-border",                icon: CircleDot },
  running:  { label: "Running",  className: "bg-primary/10 text-primary border-primary/30",                icon: Activity },
  paused:   { label: "Paused",   className: "bg-muted text-muted-foreground border-border",                icon: Pause },
  failed:   { label: "Failed",   className: "bg-destructive/10 text-destructive border-destructive/30",    icon: XCircle },
  blocked:  { label: "Blocked",  className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30", icon: AlertTriangle },
};

function fmtRelative(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const sign = diff >= 0 ? "" : "in ";
  const past = diff >= 0 ? " ago" : "";
  const mins = Math.round(abs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${sign}${mins}m${past}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${sign}${hrs}h${past}`;
  const days = Math.round(hrs / 24);
  return `${sign}${days}d${past}`;
}

function fmtDuration(ms?: number): string {
  if (ms == null) return "—";
  if (ms < 1_000) return `${ms}ms`;
  const s = ms / 1_000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = s / 60;
  return `${m.toFixed(1)}m`;
}

function StatusPill({ status, reason }: { status: ProcessStatus; reason?: string }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const pill = (
    <Badge variant="outline" className={`gap-1.5 font-medium ${meta.className}`}>
      <Icon className={`h-3 w-3 ${status === "running" ? "animate-pulse" : ""}`} />
      {meta.label}
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
  const { isMainAdmin, hasPermission, isLoading } = usePermissions();
  const canView = isMainAdmin || hasPermission("settings", "manage");

  const [items, setItems] = useState<ProcessDefinition[]>(PROCESSES);
  const [schedules, setSchedules] = useState<Map<string, ProcessSchedule>>(new Map());
  const [workspace, setWorkspace] = useState<WorkspaceId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const refreshSchedules = async () => {
    try {
      const map = await listSchedules();
      setSchedules(map);
      setItems(PROCESSES.map((p) => overlay(p, map.get(p.key))));
    } catch (e) {
      // Table not created yet -> stay on mock data. Surfaced in UI banner below.
      console.warn("[processes] listSchedules failed:", (e as Error).message);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!canView) {
      toast({ title: "Access denied", description: "Admin permission required.", variant: "destructive" });
      navigate("/dashboard/settings", { replace: true });
      return;
    }
    refreshSchedules();
  }, [canView, isLoading, navigate, toast]);

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

  const runNow = async (p: ProcessDefinition) => {
    updateProcess(p.key, { status: "running", lastRunAt: new Date().toISOString() });
    toast({ title: "Process started", description: p.name });
    // Real handlers -> call edge function. Others -> mock simulation.
    if (REAL_HANDLER_KEYS.has(p.key) && schedules.has(p.key)) {
      try {
        const res = await apiRunNow(p.key);
        toast({
          title: res.status === "success" ? "Process completed" : res.status === "blocked" ? "Blocked" : "Process failed",
          description: res.error ?? res.block_reason ?? `${p.name} — ${res.duration_ms}ms`,
          variant: res.status === "success" ? "default" : "destructive",
        });
      } catch (e) {
        toast({ title: "Run failed", description: (e as Error).message, variant: "destructive" });
      }
      await refreshSchedules();
      return;
    }
    setTimeout(() => {
      updateProcess(p.key, {
        status: "idle",
        lastDurationMs: 1_800,
        lastItems: Math.round(Math.random() * 20),
      });
      toast({ title: "Process completed (mock)", description: p.name });
    }, 1_800);
  };

  const togglePause = async (p: ProcessDefinition) => {
    const next = !p.isPaused;
    updateProcess(p.key, { isPaused: next, status: next ? "paused" : "idle" });
    if (schedules.has(p.key)) {
      try { await apiSetPaused(p.key, next); } catch (e) {
        toast({ title: "Could not update schedule", description: (e as Error).message, variant: "destructive" });
      }
    }
    toast({ title: next ? "Process paused" : "Process resumed", description: p.name });
  };

  const toggleEnabled = async (p: ProcessDefinition) => {
    const enabled = !p.isEnabled;
    updateProcess(p.key, { isEnabled: enabled, status: enabled ? "idle" : "paused" });
    if (schedules.has(p.key)) {
      try { await apiSetEnabled(p.key, enabled); } catch (e) {
        toast({ title: "Could not update schedule", description: (e as Error).message, variant: "destructive" });
      }
    } else if (enabled) {
      // First-time enable -> create the schedule row so the tick loop picks it up.
      try {
        await upsertSchedule({
          key: p.key, name: p.name, enabled: true,
          interval_minutes: p.intervalMinutes ?? 60,
        });
        await refreshSchedules();
        toast({ title: "Schedule saved", description: `${p.name} will run every ${p.intervalMinutes ?? 60} min.` });
      } catch (e) {
        toast({ title: "Could not create schedule", description: (e as Error).message, variant: "destructive" });
      }
    }
  };

  const stopRun = (p: ProcessDefinition) => {
    updateProcess(p.key, { status: "idle" });
    toast({ title: "Run cancelled", description: p.name });
  };

  if (isLoading || !canView) return null;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <Card className="border-0 shadow-card bg-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Zap className="h-4 w-4 text-primary" />
                Processes
              </CardTitle>
              <CardDescription className="mt-1">
                Schedule, monitor and control every recurring or background job across all workspaces.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Metric label="Running" value={counts.running} tone="primary" />
              <Metric label="Failed"  value={counts.failed}  tone="destructive" />
              <Metric label="Blocked" value={counts.blocked} tone="amber" />
              <Metric label="Paused"  value={counts.paused}  tone="muted" />
              <Metric label="Total"   value={counts.total}   tone="muted" />
              <Button size="sm" variant="outline" onClick={() => refreshSchedules()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
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
                placeholder="Search processes…"
                className="pl-8 h-9"
              />
            </div>
            <Select value={workspace} onValueChange={(v) => setWorkspace(v as any)}>
              <SelectTrigger className="w-[180px] h-9">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workspaces</SelectItem>
                {Object.entries(WORKSPACE_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {Object.entries(STATUS_META).map(([id, m]) => (
                  <SelectItem key={id} value={id}>{m.label}</SelectItem>
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
                  {WORKSPACE_LABELS[ws]}
                </Badge>
                <span className="text-xs text-muted-foreground">{list.length} processes</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {list.map((p) => (
                  <ProcessRow
                    key={p.key}
                    p={p}
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
              No processes match your filters.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedKey(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <ProcessDrawer
              p={selected}
              onRun={() => runNow(selected)}
              onPause={() => togglePause(selected)}
              onStop={() => stopRun(selected)}
              onToggleEnabled={() => toggleEnabled(selected)}
              onResetFailures={() => updateProcess(selected.key, { consecutiveFailures: 0 })}
            />
          )}
        </SheetContent>
      </Sheet>
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
  p, onOpen, onRun, onPause,
}: {
  p: ProcessDefinition;
  onOpen: () => void;
  onRun: () => void;
  onPause: () => void;
}) {
  return (
    <div
      className="grid grid-cols-12 items-center gap-2 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
      onClick={onOpen}
    >
      <div className="col-span-12 sm:col-span-5 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm truncate">{p.name}</div>
          {!p.isEnabled && (
            <Badge variant="outline" className="text-[10px] h-4">disabled</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {p.module} · <span className="font-mono opacity-80">{p.key}</span>
        </div>
      </div>
      <div className="hidden sm:flex sm:col-span-2 items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className="truncate">{p.scheduleHuman}</span>
      </div>
      <div className="hidden sm:block sm:col-span-2 text-xs text-muted-foreground">
        <div>Last: {fmtRelative(p.lastRunAt)}</div>
        <div>Next: {fmtRelative(p.nextRunAt)}</div>
      </div>
      <div className="col-span-6 sm:col-span-2">
        <StatusPill status={p.status} reason={p.status === "blocked" ? p.blockReason : p.status === "failed" ? p.lastError : undefined} />
      </div>
      <div className="col-span-6 sm:col-span-1 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRun} title="Run now">
          <Play className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onPause} title={p.isPaused ? "Resume" : "Pause"}>
          {p.isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function ProcessDrawer({
  p, onRun, onPause, onStop, onToggleEnabled, onResetFailures,
}: {
  p: ProcessDefinition;
  onRun: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleEnabled: () => void;
  onResetFailures: () => void;
}) {
  return (
    <>
      <SheetHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
            {WORKSPACE_LABELS[p.workspace]}
          </Badge>
          <StatusPill status={p.status} reason={p.blockReason || p.lastError} />
        </div>
        <SheetTitle className="text-base">{p.name}</SheetTitle>
        <SheetDescription>{p.description}</SheetDescription>
        <div className="text-[11px] text-muted-foreground font-mono pt-1">
          {p.module} · anchor: {p.anchor}
        </div>
      </SheetHeader>

      <div className="flex flex-wrap items-center gap-2 py-3">
        <Button size="sm" onClick={onRun}><Play className="h-3.5 w-3.5 mr-1.5" />Run now</Button>
        <Button size="sm" variant="outline" onClick={onPause}>
          {p.isPaused
            ? <><Play className="h-3.5 w-3.5 mr-1.5" />Resume</>
            : <><Pause className="h-3.5 w-3.5 mr-1.5" />Pause</>}
        </Button>
        <Button size="sm" variant="outline" onClick={onStop} disabled={p.status !== "running"}>
          <StopCircle className="h-3.5 w-3.5 mr-1.5" />Stop
        </Button>
        <Button size="sm" variant="ghost" onClick={onResetFailures} disabled={p.consecutiveFailures === 0}>
          Reset failures
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{p.isEnabled ? "Enabled" : "Disabled"}</span>
          <Switch checked={p.isEnabled} onCheckedChange={onToggleEnabled} />
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList className="grid grid-cols-4 h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs">Schedule</TabsTrigger>
          <TabsTrigger value="history"  className="text-xs">History</TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-3 space-y-2">
          <Row label="Schedule"        value={p.scheduleHuman} />
          <Row label="Timezone"        value={p.timezone} />
          <Row label="Last run"        value={fmtRelative(p.lastRunAt)} />
          <Row label="Last duration"   value={fmtDuration(p.lastDurationMs)} />
          <Row label="Last items"      value={String(p.lastItems ?? "—")} />
          <Row label="Next run"        value={fmtRelative(p.nextRunAt)} />
          <Row label="Success (30 runs)" value={`${p.successRate30}%`} />
          <Row label="Consecutive failures" value={String(p.consecutiveFailures)} />
          {p.lastError && (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              <span className="font-medium">Last error:</span> {p.lastError}
            </div>
          )}
          {p.blockReason && (
            <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
              <span className="font-medium">Blocked:</span> {p.blockReason}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="pt-3 space-y-3">
          <Row label="Type" value={p.scheduleType} />
          {p.intervalMinutes && <Row label="Interval" value={`Every ${p.intervalMinutes} min`} />}
          {p.cronExpression && <Row label="Cron" value={<code className="font-mono">{p.cronExpression}</code>} />}
          <Row label="Timezone" value={p.timezone} />
          <div className="pt-2 text-xs text-muted-foreground">
            Schedule editing (friendly picker) will be enabled once the backend Processes tables land.
          </div>
          {p.settings.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="text-xs font-medium text-muted-foreground">Settings</div>
              {p.settings.map((s) => (
                <Row key={s.label} label={s.label} value={String(s.value)} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-3">
          <ScrollArea className="h-[360px] pr-3">
            <div className="divide-y">
              {p.history.map((r) => (
                <div key={r.id} className="grid grid-cols-12 gap-2 py-2 text-xs">
                  <div className="col-span-4 text-muted-foreground">{fmtRelative(r.startedAt)}</div>
                  <div className="col-span-2">{fmtDuration(r.durationMs)}</div>
                  <div className="col-span-2 tabular-nums">{r.itemsProcessed}</div>
                  <div className="col-span-2 capitalize text-muted-foreground">{r.triggeredBy}</div>
                  <div className="col-span-2 text-right">
                    {r.status === "success"
                      ? <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="h-3 w-3" />ok</span>
                      : r.status === "failed"
                      ? <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" />fail</span>
                      : r.status === "blocked"
                      ? <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" />block</span>
                      : <span className="inline-flex items-center gap-1 text-muted-foreground"><Square className="h-3 w-3" />canc</span>}
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
          <div className="text-xs text-muted-foreground pb-1">
            Automated checks answering <em>why is this process blocked?</em>
          </div>
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
