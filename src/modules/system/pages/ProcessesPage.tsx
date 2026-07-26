import { useEffect, useMemo, useRef, useState } from "react";
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
  paused:  "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  failed:  "bg-destructive/10 text-destructive border-destructive/30",
  blocked: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

// Colored left-border rail so the row's state is legible at a glance,
// without hunting for the pill on the right.
const STATUS_RAIL: Record<ProcessStatus, string> = {
  idle:    "border-l-transparent",
  running: "border-l-primary",
  paused:  "border-l-amber-500",
  failed:  "border-l-destructive",
  blocked: "border-l-amber-500",
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

/**
 * Turn a raw backend error string into a human-readable diagnosis.
 * We keep the raw text available (users can expand it) but surface
 * a clean title + actionable hint for the common cases.
 *
 * Handles:
 *  - "Failed after N attempts: <inner>"  → strips the retry wrapper
 *  - Postgres SQLSTATE codes (23514, 23505, 23503, 23502, 42P01, 42703, 40001, 57014, 08006)
 *  - .NET timeouts / cancellations
 *  - Missing handler registration
 *  - HTTP status codes (401/403/404/5xx)
 */
type ParsedError = {
  title: string;
  hint?: string;
  constraint?: string;
  attempts?: number;
  raw: string;
};

function humanizeError(raw: string, t: TFunction): ParsedError {
  const out: ParsedError = { title: raw, raw };

  // Peel off "Failed after N attempts:" wrapper
  const wrap = raw.match(/^Failed after (\d+) attempts?:\s*(.+)$/is);
  const inner = wrap ? wrap[2].trim() : raw;
  if (wrap) out.attempts = Number(wrap[1]);

  // Postgres SQLSTATE — 5 digits at the start, or "SQLSTATE: XXXXX"
  const pg = inner.match(/(?:^|\s|:)(23514|23505|23503|23502|42P01|42703|40001|57014|08006|08003)\b/i);
  const constraint = inner.match(/constraint\s+"([^"]+)"/i)?.[1]
                  ?? inner.match(/relation\s+"([^"]+)"/i)?.[1];
  if (constraint) out.constraint = constraint;

  if (pg) {
    const code = pg[1].toUpperCase();
    switch (code) {
      case "23514":
        out.title = t("errors.check_violation", { defaultValue: "Data validation failed (check constraint)" });
        out.hint  = constraint
          ? t("errors.check_violation_hint_named", { defaultValue: `A row violated the "${constraint}" rule. The allowed values or ranges for that column don't include what the process tried to write.`, name: constraint })
          : t("errors.check_violation_hint", { defaultValue: "A row violated a database check rule." });
        break;
      case "23505":
        out.title = t("errors.unique_violation", { defaultValue: "Duplicate value not allowed" });
        out.hint  = t("errors.unique_violation_hint", { defaultValue: "The process tried to insert a value that already exists in a unique column." });
        break;
      case "23503":
        out.title = t("errors.fk_violation", { defaultValue: "Related record is missing" });
        out.hint  = t("errors.fk_violation_hint", { defaultValue: "A foreign key points to a row that no longer exists." });
        break;
      case "23502":
        out.title = t("errors.not_null", { defaultValue: "Required field is empty" });
        out.hint  = t("errors.not_null_hint", { defaultValue: "A column that cannot be NULL was left empty." });
        break;
      case "42P01":
        out.title = t("errors.undef_table", { defaultValue: "Database table not found" });
        out.hint  = t("errors.undef_table_hint", { defaultValue: "A migration may not have run. Restart the backend or check the schema." });
        break;
      case "42703":
        out.title = t("errors.undef_column", { defaultValue: "Database column not found" });
        out.hint  = t("errors.undef_column_hint", { defaultValue: "The code references a column that doesn't exist. A migration is likely out of sync." });
        break;
      case "40001":
        out.title = t("errors.serialization", { defaultValue: "Concurrent update conflict" });
        out.hint  = t("errors.serialization_hint", { defaultValue: "Two transactions touched the same rows. This usually retries automatically." });
        break;
      case "57014":
        out.title = t("errors.canceled", { defaultValue: "Query canceled (timeout)" });
        out.hint  = t("errors.canceled_hint", { defaultValue: "The database statement was aborted, likely due to a timeout." });
        break;
      case "08006":
      case "08003":
        out.title = t("errors.conn_lost", { defaultValue: "Database connection lost" });
        out.hint  = t("errors.conn_lost_hint", { defaultValue: "The connection to Postgres dropped mid-query." });
        break;
    }
    return out;
  }

  if (/no handler registered|handler.*not.*found/i.test(inner)) {
    out.title = t("errors.no_handler", { defaultValue: "No backend handler registered" });
    out.hint  = t("errors.no_handler_hint", { defaultValue: "The scheduler picked this process up but no C# handler is wired for its key." });
    return out;
  }
  if (/TaskCanceled|OperationCanceled|was canceled/i.test(inner)) {
    out.title = t("errors.op_canceled", { defaultValue: "Operation canceled" });
    out.hint  = t("errors.op_canceled_hint", { defaultValue: "The run was stopped — by an operator, a timeout, or a shutdown." });
    return out;
  }
  if (/Timeout|TimedOut/i.test(inner)) {
    out.title = t("errors.timeout", { defaultValue: "Operation timed out" });
    return out;
  }
  const http = inner.match(/\b(401|403|404|408|409|429|5\d\d)\b/);
  if (http) {
    const code = http[1];
    out.title = t("errors.http", { defaultValue: `HTTP ${code} from downstream service`, code });
    if (code === "401" || code === "403") out.hint = t("errors.http_auth_hint", { defaultValue: "Authentication or authorization failed." });
    else if (code === "404") out.hint = t("errors.http_404_hint", { defaultValue: "The target resource wasn't found." });
    else if (code === "429") out.hint = t("errors.http_429_hint", { defaultValue: "Rate limited by the downstream service." });
    else if (code.startsWith("5")) out.hint = t("errors.http_5xx_hint", { defaultValue: "Downstream service returned a server error." });
    return out;
  }

  // Nothing matched — trim the "DETAIL: Detail redacted..." noise Postgres adds
  out.title = inner.replace(/\s*DETAIL:\s*Detail redacted[^.]*\.?\s*/gi, "").trim() || inner;
  return out;
}

/**
 * Presents an error with a clean title, optional hint, and an expandable
 * raw view. Compact by default so it fits inside row-level panels.
 */
function ErrorMessage({
  t, raw, tone = "error", compact = false,
}: { t: TFunction; raw: string; tone?: "error" | "warn"; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const parsed = humanizeError(raw, t);
  const showRawToggle = parsed.title !== parsed.raw;
  const toneCls = tone === "warn"
    ? "text-amber-800 dark:text-amber-300"
    : "text-destructive";
  return (
    <div className={`${compact ? "text-xs" : "text-sm"} ${toneCls}`}>
      <div className="font-medium break-words">{parsed.title}</div>
      {parsed.hint && (
        <div className="mt-0.5 opacity-80 break-words">{parsed.hint}</div>
      )}
      {(parsed.attempts != null || parsed.constraint) && (
        <div className="mt-0.5 text-[11px] opacity-70">
          {parsed.constraint && <span className="mr-3">{t("errors.constraint", { defaultValue: "Constraint" })}: <code className="font-mono">{parsed.constraint}</code></span>}
          {parsed.attempts != null && <span>{t("errors.attempts_made", { defaultValue: "Attempts" })}: {parsed.attempts}</span>}
        </div>
      )}
      {showRawToggle && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-[11px] underline opacity-70 hover:opacity-100"
        >
          {open
            ? t("errors.hide_raw", { defaultValue: "Hide technical details" })
            : t("errors.show_raw", { defaultValue: "Show technical details" })}
        </button>
      )}
      {open && (
        <pre className="mt-1 max-h-40 overflow-auto rounded bg-background/50 p-2 text-[11px] font-mono whitespace-pre-wrap break-words border border-current/10">
          {parsed.raw}
        </pre>
      )}
    </div>
  );
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

/**
 * Rich "why is this blocked / failing" panel. Surfaces every signal we get
 * from the backend so operators can diagnose without opening the drawer:
 * attempt vs. max retries, next retry countdown, missing handler, and the
 * full error / block reason text.
 */
function BlockDetails({
  t, p,
}: { t: TFunction; p: ProcessDefinition }) {
  const isBlocked = p.status === "blocked";
  const isFailed  = p.status === "failed";
  if (!isBlocked && !isFailed && !p.lastError && !p.blockReason) return null;

  const tone = isBlocked
    ? "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300"
    : "border-destructive/30 bg-destructive/5 text-destructive";
  const Icon = isBlocked ? AlertTriangle : XCircle;
  const title = isBlocked
    ? t("block_details.title_blocked", { defaultValue: "Blocked — needs attention" })
    : t("block_details.title_failing", { defaultValue: "Failing — will retry" });

  const attempt = p.lastAttempt ?? 0;
  const maxRetries = p.maxRetries ?? 3;
  const attemptsExhausted = attempt > 0 && attempt >= maxRetries;
  const reason = p.blockReason || p.lastError;

  return (
    <div className={`mt-2 rounded-md border p-2.5 text-xs ${tone}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{title}</div>
          {reason && (
            <div className="mt-1.5">
              <ErrorMessage t={t} raw={reason} tone={isBlocked ? "warn" : "error"} compact />
            </div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {p.hasHandler === false && (
              <div className="col-span-full">
                <span className="opacity-70">{t("block_details.handler", { defaultValue: "Handler" })}:</span>{" "}
                <span className="font-medium">{t("block_details.handler_missing", { defaultValue: "not registered on server" })}</span>
              </div>
            )}
            {attempt > 0 && (
              <div>
                <span className="opacity-70">{t("block_details.attempt", { defaultValue: "Attempt" })}:</span>{" "}
                <span className="font-medium tabular-nums">{attempt}/{maxRetries}</span>
              </div>
            )}
            {p.consecutiveFailures > 0 && (
              <div>
                <span className="opacity-70">{t("labels.consecutive_failures")}:</span>{" "}
                <span className="font-medium tabular-nums">{p.consecutiveFailures}</span>
              </div>
            )}
            {p.nextRetryAt && !attemptsExhausted && (
              <div>
                <span className="opacity-70">{t("block_details.next_retry", { defaultValue: "Next retry" })}:</span>{" "}
                <span className="font-medium">{fmtRelative(t, p.nextRetryAt)}</span>
              </div>
            )}
            {attemptsExhausted && (
              <div className="col-span-full">
                <span className="opacity-70">{t("block_details.status", { defaultValue: "Status" })}:</span>{" "}
                <span className="font-medium">
                  {t("block_details.retries_exhausted", {
                    defaultValue: "Retries exhausted — auto-run paused. Use “Reset failures” to re-arm.",
                  })}
                </span>
              </div>
            )}
            {p.lastRunAt && (
              <div>
                <span className="opacity-70">{t("block_details.since", { defaultValue: "Since" })}:</span>{" "}
                <span className="font-medium">{fmtRelative(t, p.lastRunAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function ProcessesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation("processes");
  const { isMainAdmin } = usePermissions();
  // Only MainAdmin can run, pause, stop, enable/disable, or reconfigure processes.
  // The backend's RequireAdmin() gate only accepts the MainAdmin claim, so surfacing
  // the "processes.manage" role permission here would show enabled controls that 403
  // on every action. Keep FE and BE in lockstep.
  const canManage = isMainAdmin;
  // True until the first schedule fetch settles. Without this the page painted
  // the raw catalog (all idle / 100% success) as if it were live server data.
  const [isLoading, setIsLoading] = useState(true);


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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyUpdatedAt, setHistoryUpdatedAt] = useState<number | null>(null);
  // Set when the drawer poll keeps receiving an identical payload while the
  // process is reported in-flight — i.e. we are almost certainly reading a
  // cached response rather than live state.
  const [historyStale, setHistoryStale] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [accessError, setAccessError] = useState<{ status: number; message: string } | null>(null);
  // True when the latest poll failed for a non-auth reason: the rows on screen
  // are the last good snapshot, not live data.
  const [stale, setStale] = useState(false);

  const toggleExpanded = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

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

  // Last server snapshot, kept in refs so re-localizing never needs a refetch
  // and never clobbers live state with raw catalog defaults.
  const schedulesRef = useRef<Map<string, ProcessSchedule>>(new Map());
  const runningRef = useRef<Set<string>>(new Set());

  // Re-localize when language changes — re-apply the live overlay, don't reset
  // to the bare catalog (that used to blank out status/errors for up to 15s).
  useEffect(() => {
    if (accessError) return;
    setItems(reliableCatalog.map((p) => overlay(p, schedulesRef.current.get(p.key), runningRef.current, fmtSchedule)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reliableCatalog]);

  const refreshSchedules = async (hard = false) => {
    try {
      const [map, running] = await Promise.all([listSchedules(hard), listRunningKeys(hard)]);
      schedulesRef.current = map;
      runningRef.current = running;
      setSchedules(map);
      setItems(reliableCatalog.map((p) => overlay(p, map.get(p.key), running, fmtSchedule)));
      setAccessError(null);
      setStale(false);
    } catch (e) {
      const err = e as ProcessesApiError;
      if (err?.status === 401 || err?.status === 403) {
        setAccessError({ status: err.status, message: err.message || "Access denied" });
        setSchedules(new Map());
        setItems([]);
        setStale(false);
      } else {
        // Keep showing the last good snapshot, but tell the operator it's stale.
        setStale(true);
        console.warn("[processes] listSchedules failed:", (e as Error).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Always call the newest closure from timers so polling never reads a stale
  // catalog/formatter captured when the interval was created.
  const refreshSchedulesRef = useRef(refreshSchedules);
  refreshSchedulesRef.current = refreshSchedules;

  // While the drawer is open the operator is watching one process live, so the
  // list poll tightens from 15s to 5s; it relaxes again when the drawer closes.
  const drawerOpen = selectedKey != null;

  useEffect(() => {
    const tick = (hard = false) => void refreshSchedulesRef.current(hard);
    tick();
    // Poll only while the tab is visible — background tabs don't need live
    // status and the request loop was firing regardless. Also re-fetch
    // immediately when the tab becomes visible again so the operator never
    // stares at stale data after switching back.
    let timer: number | null = null;
    const start = () => {
      if (timer != null) return;
      timer = window.setInterval(() => tick(), drawerOpen ? 5_000 : 15_000);
    };
    const stop = () => {
      if (timer != null) { window.clearInterval(timer); timer = null; }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
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
  }, [drawerOpen]);


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
    const prevStatus = p.status;
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
      // Revert the optimistic "running" pill — otherwise a failed request plus a
      // failed refresh leaves the row spinning forever.
      updateProcess(p.key, { status: prevStatus });
      toast({ title: t("toast.run_failed_title"), description: (e as Error).message, variant: "destructive" });
    }
    await refreshSchedules();
    if (selectedKey === p.key) {
      try {
        setLiveHistory(await apiListRuns(p.key, 30));
        setHistoryError(null);
      } catch (e) {
        setHistoryError((e as Error).message);
      }
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
    // Match overlay()'s authoritative mapping: a disabled-but-not-paused schedule
    // renders as "idle", not "paused" — otherwise the pill flashes wrong until the
    // next refresh resolves it.
    updateProcess(p.key, { isEnabled: enabled, status: "idle" });
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
          // Intent is unambiguous when enabling from the UI: don't inherit a
          // server-side "paused" default that would leave the job never running.
          paused: enabled ? false : undefined,
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

  // Imperative hard-refresh handle wired to the drawer's refresh button.
  const hardRefreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    setHistoryStale(false);
    setHistoryUpdatedAt(null);
    if (!selectedKey) {
      setLiveHistory(null);
      setHistoryError(null);
      setHistoryLoading(false);
      setHistoryRefreshing(false);
      hardRefreshRef.current = () => {};
      return;
    }
    if (!REAL_HANDLER_KEYS.has(selectedKey)) {
      // No backend handler exists for this key — there is nothing to fetch.
      setLiveHistory([]);
      setHistoryError(null);
      setHistoryLoading(false);
      setHistoryRefreshing(false);
      hardRefreshRef.current = () => {};
      return;
    }
    // NOTE: history is fetched even when no schedule row exists yet. Manual
    // "Run now" writes run rows without creating a schedule, so gating on the
    // schedule map hid real history behind an empty list.
    let cancelled = false;
    let timer: number | null = null;
    let lastSignature: string | null = null;
    let unchangedWhileRunning = 0;

    // Identity of the payload: if this string does not move while the process
    // is reported in-flight, we are being served a cached response.
    const signature = (rows: UiProcessRun[]) =>
      rows.map((r) => `${r.id}:${r.status}:${r.finishedAt ?? ""}:${r.itemsProcessed}`).join("|");

    const isRunningNow = (rows: UiProcessRun[]) =>
      runningRef.current.has(selectedKey) || rows.some((r) => r.status === "running");

    const load = async (mode: "initial" | "poll" | "hard") => {
      if (mode === "initial") setHistoryLoading(true);
      else setHistoryRefreshing(true);
      try {
        const rows = await apiListRuns(selectedKey, 30, mode === "hard");
        if (cancelled) return;
        const sig = signature(rows);
        if (sig === lastSignature && isRunningNow(rows)) {
          unchangedWhileRunning += 1;
        } else {
          unchangedWhileRunning = 0;
          setHistoryStale(false);
        }
        lastSignature = sig;
        setLiveHistory(rows);
        setHistoryUpdatedAt(Date.now());
        setHistoryError(null);

        // Fallback ladder: three identical polls while the run is supposedly
        // in flight → retry with a cache-busted, no-store request (and refresh
        // the schedule row the same way). If that still returns the same body,
        // tell the operator the view may be stale instead of pretending it's live.
        if (unchangedWhileRunning >= 3) {
          if (mode !== "hard") {
            unchangedWhileRunning = 0;
            void refreshSchedulesRef.current(true);
            await load("hard");
            return;
          }
          setHistoryStale(true);
        }
      } catch (e) {
        if (cancelled) return;
        // Keep whatever we already showed, but say why it may be out of date
        // instead of silently rendering an empty history.
        setHistoryError((e as Error).message);
      } finally {
        if (cancelled) return;
        if (mode === "initial") setHistoryLoading(false);
        else setHistoryRefreshing(false);
      }
    };

    // Self-scheduling poll: 3s while the run is in flight (the operator is
    // watching it move), 10s once it settles. Pauses on a hidden tab.
    const schedule = () => {
      if (cancelled) return;
      const fast = runningRef.current.has(selectedKey);
      timer = window.setTimeout(async () => {
        if (document.visibilityState === "visible") await load("poll");
        schedule();
      }, fast ? 3_000 : 10_000);
    };

    hardRefreshRef.current = () => {
      void refreshSchedulesRef.current(true);
      void load("hard");
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void load("poll");
    };
    document.addEventListener("visibilitychange", onVisibility);

    void load("initial").then(schedule);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer != null) window.clearTimeout(timer);
      hardRefreshRef.current = () => {};
    };
  }, [selectedKey]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-6" aria-busy="true">
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted/60 animate-pulse" />
        ))}
      </div>
    );
  }

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
              {stale && !accessError && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {t("stale_banner", {
                    defaultValue:
                      "Showing the last known state — the server didn't respond to the latest refresh.",
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
                    onStop={() => stopRun(p)}
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
              historyLoading={historyLoading}
              historyRefreshing={historyRefreshing}
              historyUpdatedAt={historyUpdatedAt}
              historyStale={historyStale}
              onHardRefresh={() => hardRefreshRef.current()}
              historyError={historyError}
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
  t, p, expanded, canManage, onToggleExpand, onOpen, onRun, onPause, onStop,
}: {
  t: TFunction;
  p: ProcessDefinition;
  expanded: boolean;
  canManage: boolean;
  onToggleExpand: () => void;
  onOpen: () => void;
  onRun: () => void;
  onPause: () => void;
  onStop: () => void;
}) {
  const explanation = getProcessExplanation(p.key, t);
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div>
      <div
        className={`grid grid-cols-12 items-start gap-2 border-l-4 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors ${STATUS_RAIL[p.status]}`}
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
          <StatusPill t={t} status={p.status} reason={p.blockReason || p.lastError} />
        </div>
        <div className="col-span-6 sm:col-span-1 flex items-center justify-end gap-1" onClick={stop}>
          <RowActions
            t={t}
            p={p}
            canManage={canManage}
            onRun={onRun}
            onPause={onPause}
            onStop={onStop}
          />
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

        {(p.status === "blocked" || p.status === "failed") && (
          <div className="col-span-12" onClick={stop}>
            <BlockDetails t={t} p={p} />
          </div>
        )}
      </div>
      {expanded && explanation && (
        <div
          className="grid gap-3 border-t bg-muted/30 px-4 py-3 sm:grid-cols-3"
          onClick={stop}
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

/**
 * State-aware row controls. Only shows the buttons that make sense for the
 * current status, so operators aren't guessing whether Play means "start" or
 * "resume", and Pause never appears next to a job that isn't actually running
 * on a schedule.
 *   running        → Stop (destructive)
 *   paused         → Resume (primary green)
 *   disabled       → Enable-hint (Play, outline) — clicking runs it once ad-hoc
 *   idle / failed / blocked → Run now (primary) + Pause (outline)
 */
function RowActions({
  t, p, canManage, onRun, onPause, onStop,
}: {
  t: TFunction;
  p: ProcessDefinition;
  canManage: boolean;
  onRun: () => void;
  onPause: () => void;
  onStop: () => void;
}) {
  const lockedTitle = t("actions.locked_tooltip", {
    defaultValue: "Only the main administrator can perform this action",
  });

  if (p.status === "running") {
    return (
      <Button
        size="sm"
        variant="destructive"
        className="h-7 gap-1.5 px-2"
        onClick={onStop}
        disabled={!canManage}
        title={canManage ? t("actions.stop") : lockedTitle}
      >
        <StopCircle className="h-3.5 w-3.5" />
        <span className="text-xs">{t("actions.stop")}</span>
      </Button>
    );
  }

  if (p.isPaused) {
    return (
      <Button
        size="sm"
        className="h-7 gap-1.5 px-2 bg-primary hover:bg-primary/90"
        onClick={onPause}
        disabled={!canManage}
        title={canManage ? t("actions.resume") : lockedTitle}
      >
        <Play className="h-3.5 w-3.5" />
        <span className="text-xs">{t("actions.resume")}</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-primary hover:bg-primary/10"
        onClick={onRun}
        disabled={!canManage}
        title={canManage ? t("actions.run_now") : lockedTitle}
      >
        <Play className="h-3.5 w-3.5" />
      </Button>
      {p.isEnabled && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-amber-600 hover:bg-amber-500/10"
          onClick={onPause}
          disabled={!canManage}
          title={canManage ? t("actions.pause") : lockedTitle}
        >
          <Pause className="h-3.5 w-3.5" />
        </Button>
      )}
    </>
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


/**
 * Live polling indicator for the history tab: says whether the panel is
 * currently fetching, how fresh the data is, and offers a hard refresh that
 * bypasses every cache layer when the poll appears to be serving stale data.
 */
function LiveStatusBar({
  t, refreshing, updatedAt, stale, running, onHardRefresh,
}: {
  t: TFunction;
  refreshing: boolean;
  updatedAt: number | null;
  stale: boolean;
  running: boolean;
  onHardRefresh: () => void;
}) {
  // Re-render every second so "updated 12s ago" actually counts up.
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const seconds = updatedAt == null ? null : Math.max(0, Math.round((Date.now() - updatedAt) / 1000));

  return (
    <div className="mb-2 space-y-2">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground" aria-live="polite">
          {refreshing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
              {t("live.updating")}
            </>
          ) : (
            <>
              <span
                className={`h-1.5 w-1.5 rounded-full ${stale ? "bg-amber-500" : "bg-primary"} ${running && !stale ? "animate-pulse" : ""}`}
                aria-hidden="true"
              />
              {seconds == null
                ? t("live.waiting")
                : t("live.updated_ago", { count: seconds })}
              <span className="text-muted-foreground/70">
                · {running ? t("live.interval_fast") : t("live.interval_normal")}
              </span>
            </>
          )}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-[11px]"
          onClick={onHardRefresh}
          disabled={refreshing}
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          {t("live.hard_refresh")}
        </Button>
      </div>
      {stale && (
        <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-700 dark:text-amber-400">
          {t("live.stale_warning")}
        </div>
      )}
    </div>
  );
}

function ProcessDrawer({
  t, p, liveHistory, historyLoading, historyRefreshing, historyUpdatedAt, historyStale,
  onHardRefresh, historyError, hasSchedule, stopEnabled, canManage,
  onRun, onPause, onStop, onToggleEnabled, onResetFailures, onSaveInterval,
}: {
  t: TFunction;
  p: ProcessDefinition;
  liveHistory: UiProcessRun[] | null;
  historyLoading: boolean;
  historyRefreshing: boolean;
  historyUpdatedAt: number | null;
  historyStale: boolean;
  onHardRefresh: () => void;
  historyError: string | null;
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
  // Only real server rows are shown. The catalog's `history` is design-time
  // sample data — falling back to it made the tab look populated with runs that
  // never happened.
  const history = liveHistory ?? [];
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

      <BlockDetails t={t} p={p} />

      <div className="flex flex-wrap items-center gap-2 py-3">
        {p.status === "running" ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onStop}
            disabled={!stopEnabled || !canManage}
            title={canManage ? t("stop_tooltip") : lockedTitle}
          >
            <StopCircle className="h-3.5 w-3.5 mr-1.5" />{t("actions.stop")}
          </Button>
        ) : (
          <Button size="sm" onClick={onRun} disabled={!canManage} title={canManage ? undefined : lockedTitle}>
            <Play className="h-3.5 w-3.5 mr-1.5" />{t("actions.run_now")}
          </Button>
        )}

        {p.status !== "running" && (
          <Button
            size="sm"
            variant={p.isPaused ? "default" : "outline"}
            onClick={onPause}
            disabled={!canManage || !p.isEnabled}
            title={canManage ? undefined : lockedTitle}
          >
            {p.isPaused
              ? <><Play className="h-3.5 w-3.5 mr-1.5" />{t("actions.resume")}</>
              : <><Pause className="h-3.5 w-3.5 mr-1.5" />{t("actions.pause")}</>}
          </Button>
        )}

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
          {/* Error and block reason are surfaced by the <BlockDetails /> panel
              rendered at the top of the drawer — no need to repeat them here. */}
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
          <LiveStatusBar
            t={t}
            refreshing={historyRefreshing || historyLoading}
            updatedAt={historyUpdatedAt}
            stale={historyStale}
            running={p.status === "running"}
            onHardRefresh={onHardRefresh}
          />
          {historyError && (
            <div className="mb-2 rounded border border-destructive/30 bg-destructive/5 p-2">
              <ErrorMessage t={t} raw={historyError} tone="error" compact />
            </div>
          )}
          <ScrollArea className="h-[360px] pr-3">
            {historyLoading && history.length === 0 && (
              <div className="space-y-2 py-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-6 rounded bg-muted/60 animate-pulse" />)}
              </div>
            )}
            {!historyLoading && history.length === 0 && !historyError && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {t("history_empty", { defaultValue: "No runs recorded yet. Use “Run now” to execute this process." })}
              </div>
            )}
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
                    <div className={`col-span-12 mt-1 rounded border p-2 ${r.status === "blocked" ? "border-amber-500/30 bg-amber-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                      <ErrorMessage t={t} raw={r.error} tone={r.status === "blocked" ? "warn" : "error"} compact />
                    </div>
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
