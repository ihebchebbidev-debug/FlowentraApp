/**
 * Hidden DB Console — /dashboard/settings/db-console & /db-console
 * Password-gated (Zaleyo2026), no nav link, sessionStorage unlock.
 * SQL editor: CodeMirror 6 + PostgreSQL dialect with table/column autocomplete from DB_SCHEMA.
 * Export: CSV / JSON / Excel / SQL INSERTs / clipboard TSV.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "@/config/api";
import { getCurrentTenant, VIEW_ALL_SENTINEL } from "@/utils/tenant";
import { getAuthToken } from "@/utils/apiHeaders";
import { tenantsApi, type Tenant } from "@/services/api/tenantsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2, Play, Lock, Database, Download, Trash2, Settings2,
  Copy, FileJson, FileSpreadsheet, FileCode2, ClipboardCopy, Table2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { DB_SCHEMA } from "@/modules/settings/data/dbSchema.generated";
import * as XLSX from "xlsx";

const PASSWORD = "Zaleyo2026";
const UNLOCK_KEY = "db-console:unlocked";
const HISTORY_KEY = "db-console:history";
const TENANT_KEY = "db-console:tenant";
const URL_KEY = "db-console:apiUrl";

type Mode = "read" | "write";
type Row = Record<string, unknown>;
type ExecResult = {
  success: boolean;
  columns?: string[];
  rows?: Row[];
  rowsAffected?: number;
  durationMs?: number;
  error?: string;
};

// Build { TableName: ["col1", "col2", ...] } once for CodeMirror SQL completion.
const SCHEMA_MAP: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {};
  for (const t of DB_SCHEMA) m[t.name] = t.columns.map(c => c.name);
  return m;
})();
const TABLE_NAMES = Object.keys(SCHEMA_MAP).sort();

function tsStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function DbConsolePage() {
  const [unlocked, setUnlocked] = useState<boolean>(() => sessionStorage.getItem(UNLOCK_KEY) === "1");
  const [pwd, setPwd] = useState("");
  const [sqlText, setSqlText] = useState<string>(
    () => localStorage.getItem("db-console:lastSql") || 'SELECT current_database(), current_user, now();'
  );
  const [mode, setMode] = useState<Mode>("read");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExecResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSchema, setShowSchema] = useState(true);
  const [schemaFilter, setSchemaFilter] = useState("");
  const [tenant, setTenant] = useState<string>(() => {
    const stored = localStorage.getItem(TENANT_KEY);
    const detected = getCurrentTenant();
    const initial = stored || detected || "";
    // Never start in the view-all sentinel — backend rejects __all__ on this
    // endpoint (403 without a MainAdmin JWT, 400 because X-Target-Tenant is
    // numeric-only). Force the user to pick a real tenant slug.
    return initial === VIEW_ALL_SENTINEL ? "" : initial;
  });
  const [apiUrl, setApiUrl] = useState<string>(() => localStorage.getItem(URL_KEY) || API_URL);
  const [tenantList, setTenantList] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  });
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const sqlRef = useRef(sqlText);
  sqlRef.current = sqlText;

  useEffect(() => { localStorage.setItem("db-console:lastSql", sqlText); }, [sqlText]);
  useEffect(() => { localStorage.setItem(TENANT_KEY, tenant); }, [tenant]);
  useEffect(() => { localStorage.setItem(URL_KEY, apiUrl); }, [apiUrl]);

  // Load active tenants once unlocked so the user can pick from a dropdown
  // instead of typing a slug. Requires a logged-in MainAdminUser session.
  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    setTenantsLoading(true);
    setTenantsError(null);
    tenantsApi
      .list()
      .then((all) => {
        if (cancelled) return;
        const active = all.filter((t) => t.isActive);
        setTenantList(active);
        // Auto-select a sensible default if nothing usable is set.
        setTenant((curr) => {
          if (curr && curr !== VIEW_ALL_SENTINEL && active.some((t) => t.slug === curr)) {
            return curr;
          }
          const fallback = active.find((t) => t.isDefault) ?? active[0];
          return fallback?.slug ?? curr;
        });
      })
      .catch((e: any) => {
        if (cancelled) return;
        setTenantsError(
          e?.response?.data?.message || e?.message || "Failed to load tenants"
        );
      })
      .finally(() => {
        if (!cancelled) setTenantsLoading(false);
      });
    return () => { cancelled = true; };
  }, [unlocked]);

  // Track theme class changes on <html>.
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const tryUnlock = () => {
    if (pwd === PASSWORD) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      setUnlocked(true);
      setPwd("");
    } else {
      toast({ title: "Invalid password", variant: "destructive" });
    }
  };

  const lock = () => {
    sessionStorage.removeItem(UNLOCK_KEY);
    setUnlocked(false);
    setResult(null);
  };

  const run = async () => {
    const trimmed = sqlRef.current.trim();
    if (!trimmed) return;
    // Hard-block invalid tenant states so the request never reaches the
    // backend with __all__ (→403) or an empty slug (→default DB only).
    if (!tenant || tenant === VIEW_ALL_SENTINEL) {
      toast({
        title: "Pick a tenant first",
        description: "DB Console runs against one tenant DB at a time. Open Connection and choose one.",
        variant: "destructive",
      });
      setShowSettings(true);
      return;
    }
    if (mode === "write") {
      const verb = trimmed.split(/\s+/)[0].toUpperCase();
      if (["UPDATE", "DELETE"].includes(verb) && !/\bWHERE\b/i.test(trimmed)) {
        if (!confirm(`${verb} without WHERE will affect ALL rows. Continue?`)) return;
      }
    }
    setRunning(true);
    setResult(null);
    const t0 = performance.now();
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-DB-Console-Pass": PASSWORD,
      };
      // Single-tenant scoping: only X-Tenant (slug). DO NOT send
      // X-Target-Tenant — that header is reserved for view-all mutations
      // and must be a numeric Tenant.Id, not a slug.
      headers["X-Tenant"] = tenant;
      // Forward auth so middleware can read MainAdmin claims and the
      // request isn't anonymously throttled by upstream auth gates.
      const token = getAuthToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const base = (apiUrl || API_URL).replace(/\/$/, "");
      const res = await fetch(`${base}/api/sqlconsole/execute`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sql: trimmed, mode }),
      });
      const ct = res.headers.get("content-type") || "";
      const data: ExecResult = ct.includes("application/json")
        ? await res.json()
        : { success: false, error: `${res.status} ${res.statusText}: ${await res.text()}` };
      if (!res.ok && !data.error) data.error = `HTTP ${res.status}`;
      setResult({ ...data, durationMs: data.durationMs ?? Math.round(performance.now() - t0) });
      if (data.success) {
        const next = [trimmed, ...history.filter(h => h !== trimmed)].slice(0, 30);
        setHistory(next);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      }
    } catch (e: any) {
      setResult({ success: false, error: e?.message || "Network error" });
    } finally {
      setRunning(false);
    }
  };

  // Stable ref so the keymap can call latest run().
  const runRef = useRef(run);
  runRef.current = run;

  const extensions = useMemo(() => [
    sql({
      dialect: PostgreSQL,
      schema: SCHEMA_MAP,
      tables: TABLE_NAMES.map(name => ({
        label: name,
        type: "table",
        boost: 99,
      })),
      upperCaseKeywords: true,
    }),
    keymap.of([
      { key: "Mod-Enter", preventDefault: true, run: () => { runRef.current(); return true; } },
    ]),
  ], []);

  const cols = useMemo(
    () => result?.columns || (result?.rows?.[0] ? Object.keys(result.rows[0]) : []),
    [result]
  );

  const tableNameFromSql = (): string => {
    const m = sqlRef.current.match(/\bFROM\s+"?([A-Za-z_][\w]*)"?/i)
          || sqlRef.current.match(/\bUPDATE\s+"?([A-Za-z_][\w]*)"?/i)
          || sqlRef.current.match(/\bINTO\s+"?([A-Za-z_][\w]*)"?/i);
    return m?.[1] || "result";
  };

  // ------- Exporters -------
  const expCsv = () => {
    if (!result?.rows?.length) return;
    const esc = (v: unknown) => {
      const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(","), ...result.rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv" }), `query-${tsStamp()}.csv`);
  };
  const expJson = () => {
    if (!result?.rows?.length) return;
    downloadBlob(
      new Blob([JSON.stringify(result.rows, null, 2)], { type: "application/json" }),
      `query-${tsStamp()}.json`
    );
  };
  const expXlsx = () => {
    if (!result?.rows?.length) return;
    const ws = XLSX.utils.json_to_sheet(result.rows, { header: cols });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "result");
    XLSX.writeFile(wb, `query-${tsStamp()}.xlsx`);
  };
  const expSqlInserts = () => {
    if (!result?.rows?.length) return;
    const table = tableNameFromSql();
    const fmt = (v: unknown): string => {
      if (v == null) return "NULL";
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (v instanceof Date) return `'${v.toISOString()}'`;
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `'${s.replace(/'/g, "''")}'`;
    };
    const stmts = result.rows.map(r =>
      `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(", ")}) VALUES (${cols.map(c => fmt(r[c])).join(", ")});`
    ).join("\n");
    downloadBlob(new Blob([stmts], { type: "text/plain" }), `inserts-${tsStamp()}.sql`);
  };
  const copyTsv = async () => {
    if (!result?.rows?.length) return;
    const cell = (v: unknown) => v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v).replace(/\t|\n/g, " ");
    const tsv = [cols.join("\t"), ...result.rows.map(r => cols.map(c => cell(r[c])).join("\t"))].join("\n");
    try { await navigator.clipboard.writeText(tsv); toast({ title: "Copied to clipboard" }); }
    catch { toast({ title: "Copy failed", variant: "destructive" }); }
  };
  const copySql = async () => {
    try { await navigator.clipboard.writeText(sqlText); toast({ title: "SQL copied" }); }
    catch { toast({ title: "Copy failed", variant: "destructive" }); }
  };

  const insertTable = (name: string) => {
    setSqlText(`SELECT * FROM "${name}" LIMIT 100;`);
    setTimeout(() => editorRef.current?.view?.focus(), 0);
  };

  const filteredTables = useMemo(() => {
    const q = schemaFilter.trim().toLowerCase();
    return q ? TABLE_NAMES.filter(t => t.toLowerCase().includes(q)) : TABLE_NAMES;
  }, [schemaFilter]);

  // ── App-themed tokens (uses semantic design system) ──
  const shellClass = "min-h-screen w-full bg-background text-foreground";
  const panelClass =
    "relative rounded-lg border border-border bg-card text-card-foreground shadow-[var(--shadow-card)]";

  if (!unlocked) {
    return (
      <div className={`${shellClass} relative flex items-center justify-center p-6`}>
        <div className={`${panelClass} w-full max-w-sm p-7 space-y-5`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md border border-border bg-primary/10 grid place-items-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">DB Console</h1>
              <p className="text-[11px] text-muted-foreground">Restricted access</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Enter access password to continue.</p>
          <Input
            type="password" value={pwd} onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === "Enter" && tryUnlock()}
            placeholder="••••••••" autoFocus
            className="font-mono tracking-widest"
          />
          <Button className="w-full" onClick={tryUnlock}>Unlock</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${shellClass} relative`}>
      <div className="relative z-10 p-4 md:p-6 space-y-4 max-w-full">
      {/* ── Top bar ───────────────────────────────────────── */}
      <div className={`${panelClass} flex items-center justify-between gap-2 flex-wrap px-4 py-3`}>
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-md border border-border bg-primary/10 grid place-items-center">
            <Database className="h-4 w-4 text-primary" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">DB Console</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">postgres · live</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-mono text-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${tenant ? "bg-success" : "bg-warning"}`} />
            {tenant || "no tenant"}
          </span>
          <span className="hidden md:inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-mono text-muted-foreground">
            {TABLE_NAMES.length} tables
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden text-[11px] font-medium bg-muted">
            <button
              className={`px-3 py-1.5 transition ${mode === "read"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("read")}
            >READ</button>
            <button
              className={`px-3 py-1.5 transition ${mode === "write"
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("write")}
            >WRITE</button>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowSchema(s => !s)}>
            <Table2 className="h-3 w-3 mr-1" />Schema
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowSettings(s => !s)}>
            <Settings2 className="h-3 w-3 mr-1" />Connection
          </Button>
          <Button size="sm" variant="outline" onClick={lock}>
            <Lock className="h-3 w-3 mr-1" />Lock
          </Button>
        </div>
      </div>

      {showSettings && (
        <div className={`${panelClass} p-4 space-y-3`}>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--neon)]/80">// connection</div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-mono">API URL</label>
              <Input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.flowentra.app"
                className="bg-black/40 border-white/10 font-mono text-xs focus-visible:ring-[var(--neon)]/40 focus-visible:border-[var(--neon)]/40" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">
                Tenant{tenantsLoading ? " (loading…)" : ""}
              </label>
              {tenantList.length > 0 ? (
                <Select value={tenant || undefined} onValueChange={setTenant}>
                  <SelectTrigger className="h-9 bg-black/40 border-white/10 font-mono text-xs focus:ring-[var(--neon)]/40">
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantList.map((t) => (
                      <SelectItem key={t.id} value={t.slug}>
                        {t.companyName}
                        <span className="text-muted-foreground ml-2 text-[11px]">
                          {t.slug}{t.isDefault ? " · default" : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value.trim().toLowerCase())}
                  placeholder="krossier"
                  className="bg-black/40 border-white/10 font-mono text-xs focus-visible:ring-[var(--neon)]/40 focus-visible:border-[var(--neon)]/40"
                />
              )}
              {tenantsError && (
                <p className="text-[11px] text-rose-400">
                  Couldn't load tenants ({tenantsError}). Type the slug manually.
                </p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Values are stored locally in your browser and sent only to the API URL above.
          </p>
        </div>
      )}

      <div className={`grid gap-4 ${showSchema ? "md:grid-cols-[240px_1fr]" : "grid-cols-1"}`}>
        {showSchema && (
          <div className={`${panelClass} p-2 space-y-2 max-h-[70vh] flex flex-col`}>
            <div className="px-2 pt-1 pb-0.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--neon)]/70">
              // schema
            </div>
            <Input
              value={schemaFilter} onChange={e => setSchemaFilter(e.target.value)}
              placeholder="Filter tables…"
              className="h-7 text-xs bg-black/40 border-white/10 font-mono focus-visible:ring-[var(--neon)]/40 focus-visible:border-[var(--neon)]/40"
            />
            <div className="overflow-auto flex-1 -mx-1 px-1">
              {filteredTables.map(t => (
                <button
                  key={t} onClick={() => insertTable(t)}
                  title={`${SCHEMA_MAP[t].length} columns — click to query`}
                  className="group flex w-full items-center justify-between gap-2 text-left px-2 py-1 text-[12px] font-mono rounded hover:bg-[var(--neon)]/10 hover:text-[var(--neon)] text-slate-300 transition"
                >
                  <span className="truncate">
                    <span className="text-slate-500 group-hover:text-[var(--neon)]/60">▸ </span>{t}
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{SCHEMA_MAP[t].length}</span>
                </button>
              ))}
              {filteredTables.length === 0 && (
                <p className="text-[11px] text-slate-500 p-2 font-mono">No tables match.</p>
              )}
            </div>
          </div>
        )}

        <div className={`${panelClass} p-3`}>
          <div className="rounded-lg overflow-hidden border border-white/10 ring-1 ring-[var(--neon)]/10 shadow-[0_0_40px_-20px_var(--neon-soft)]">
            <CodeMirror
              ref={editorRef}
              value={sqlText}
              onChange={setSqlText}
              extensions={extensions}
              theme={oneDark}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                bracketMatching: true,
                autocompletion: true,
                closeBrackets: true,
                indentOnInput: true,
              }}
              minHeight="180px"
              maxHeight="420px"
              style={{ fontSize: 13 }}
              placeholder='SELECT * FROM "Contacts" LIMIT 100;'
            />
          </div>
          <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-slate-300">⌘/Ctrl</kbd>
              <span className="mx-1">+</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-slate-300">Enter</kbd>
              <span className="mx-2 text-slate-600">·</span>
              mode <span className={mode === "write" ? "text-rose-300" : "text-[var(--neon)]"}>{mode}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={copySql} className="text-slate-300 hover:text-white hover:bg-white/5">
                <Copy className="h-3 w-3 mr-1" />Copy SQL
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setSqlText(""); setResult(null); }} className="text-slate-300 hover:text-white hover:bg-white/5">
                <Trash2 className="h-3 w-3 mr-1" />Clear
              </Button>
              <Button
                size="sm"
                onClick={run}
                disabled={running || !sqlText.trim()}
                className="bg-[var(--neon)] text-black font-semibold hover:bg-[var(--neon)]/90 shadow-[0_0_18px_-4px_var(--neon-soft)] disabled:opacity-40 disabled:shadow-none"
              >
                {running ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                Run
              </Button>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className={`${panelClass} p-3 space-y-2`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-xs font-mono">
              {result.success ? (
                <Badge className="bg-[var(--neon)]/15 text-[var(--neon)] border-[var(--neon)]/30 shadow-[0_0_12px_-4px_var(--neon-soft)]">● OK</Badge>
              ) : (
                <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30">● ERROR</Badge>
              )}
              <span className="text-slate-400 tabular-nums">{result.durationMs ?? 0}<span className="text-slate-600 ml-0.5">ms</span></span>
              {typeof result.rowsAffected === "number" && (
                <span className="text-slate-400">{result.rowsAffected} row(s) affected</span>
              )}
              {result.rows && <span className="text-slate-400 tabular-nums">{result.rows.length} row(s)</span>}
            </div>
            {result.rows && result.rows.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-white/10 bg-black/30 text-slate-200 hover:bg-white/5 hover:text-white"><Download className="h-3 w-3 mr-1" />Export</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={expCsv}><FileSpreadsheet className="h-3.5 w-3.5 mr-2" />CSV (.csv)</DropdownMenuItem>
                  <DropdownMenuItem onClick={expXlsx}><FileSpreadsheet className="h-3.5 w-3.5 mr-2" />Excel (.xlsx)</DropdownMenuItem>
                  <DropdownMenuItem onClick={expJson}><FileJson className="h-3.5 w-3.5 mr-2" />JSON (.json)</DropdownMenuItem>
                  <DropdownMenuItem onClick={expSqlInserts}><FileCode2 className="h-3.5 w-3.5 mr-2" />SQL INSERTs (.sql)</DropdownMenuItem>
                  <DropdownMenuItem onClick={copyTsv}><ClipboardCopy className="h-3.5 w-3.5 mr-2" />Copy as TSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {result.error && (
            <pre className="text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 p-3 rounded-md overflow-auto whitespace-pre-wrap font-mono">{result.error}</pre>
          )}

          {result.rows && result.rows.length > 0 && (
            <div className="overflow-auto border border-white/10 rounded-lg max-h-[55vh] bg-black/30">
              <table className="w-full text-[12px] font-mono border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                  <tr>{cols.map(c => (
                    <th key={c} className="text-left px-2.5 py-2 bg-[#0d1411] border-b border-white/10 text-[10px] uppercase tracking-wider text-[var(--neon)]/80 font-semibold">{c}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr key={i} className="hover:bg-[var(--neon)]/[0.04] transition-colors">
                      {cols.map(c => {
                        const v = r[c];
                        const s = v == null ? <span className="text-slate-600 italic">NULL</span>
                                : typeof v === "object" ? JSON.stringify(v)
                                : String(v);
                        return <td key={c} className="px-2.5 py-1.5 border-b border-white/5 align-top max-w-[420px] truncate text-slate-200" title={typeof s === "string" ? s : ""}>{s}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className={`${panelClass} p-3`}>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--neon)]/70 mb-2">// history</div>
          <div className="space-y-1 max-h-48 overflow-auto">
            {history.map((h, i) => (
              <button key={i} onClick={() => setSqlText(h)}
                className="group flex items-center gap-2 w-full text-left text-[12px] font-mono px-2 py-1 rounded hover:bg-[var(--neon)]/10 hover:text-[var(--neon)] text-slate-400 truncate transition">
                <span className="text-slate-600 group-hover:text-[var(--neon)]/60">$</span>
                <span className="truncate">{h}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
