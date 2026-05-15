import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Clock3, Database, MinusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  loadPersistedHydrationRun,
  type PersistedHydrationModule,
  type PersistedHydrationRun,
} from "@/services/offline/hydrationRunPersistence";

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

function ModuleRowIcon({ m }: { m: PersistedHydrationModule }) {
  switch (m.status) {
    case "done":
      return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />;
    case "skipped":
      return <MinusCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />;
    default:
      return <Clock3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />;
  }
}

type Props = {
  /** "default" = full card; "compact" = slimmer for Sync dashboard */
  variant?: "default" | "compact";
  className?: string;
};

export function HydrationLastRunPanel({ variant = "default", className }: Props) {
  const { t } = useTranslation("settings");
  const [run, setRun] = useState<PersistedHydrationRun | null>(() => loadPersistedHydrationRun());

  const refresh = useCallback(() => {
    setRun(loadPersistedHydrationRun());
  }, []);

  useEffect(() => {
    const onDone = () => refresh();
    window.addEventListener("offline:hydration-cycle-finished", onDone);
    return () => window.removeEventListener("offline:hydration-cycle-finished", onDone);
  }, [refresh]);

  const errorModules = run?.modules.filter((m) => m.status === "error") ?? [];
  const hasIssues = !!(run?.fatalError || (run?.modulesFailed ?? 0) > 0 || errorModules.length > 0);

  if (variant === "compact") {
    if (!run) {
      return (
        <div className={cn("rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-xs text-muted-foreground", className)}>
          {t("syncDashboard.hydrationLastRun.compactNoRun")}
        </div>
      );
    }
    return (
      <div
        className={cn(
          "rounded-lg border px-4 py-3 text-xs space-y-2",
          hasIssues ? "border-destructive/30 bg-destructive/[0.04]" : "border-border bg-card/50",
          className
        )}
      >
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <span className="font-medium text-foreground">{t("syncDashboard.hydrationLastRun.compactTitle")}</span>
          <Badge variant={hasIssues ? "destructive" : "secondary"} className="text-[10px]">
            {formatElapsed(run.totalDurationMs)}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {t("syncDashboard.hydrationLastRun.compactFinished", {
            time: new Date(run.finishedAt).toLocaleString(),
          })}
        </p>
        {run.fatalError ? <p className="text-destructive font-mono break-words">{run.fatalError}</p> : null}
        {errorModules.length > 0 ? (
          <ul className="space-y-1 text-destructive">
            {errorModules.slice(0, 4).map((m) => (
              <li key={m.id} className="truncate font-mono text-[10px]" title={m.error}>
                {t(m.labelKey)}: {m.error || "—"}
              </li>
            ))}
            {errorModules.length > 4 ? (
              <li className="text-muted-foreground">{t("syncDashboard.hydrationLastRun.moreErrors", { count: errorModules.length - 4 })}</li>
            ) : null}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          {t("syncDashboard.hydrationLastRun.title")}
        </CardTitle>
        <CardDescription>{t("syncDashboard.hydrationLastRun.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!run ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("syncDashboard.hydrationLastRun.noRun")}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline" className="font-normal gap-1">
                <Clock3 className="h-3 w-3" />
                {t("syncDashboard.hydrationLastRun.finishedAt")}: {new Date(run.finishedAt).toLocaleString()}
              </Badge>
              <Badge variant="secondary" className="font-normal tabular-nums">
                {t("syncDashboard.hydrationLastRun.totalTime")}: {formatElapsed(run.totalDurationMs)}
              </Badge>
              {run.modulesFailed > 0 ? (
                <Badge variant="destructive" className="font-normal">
                  {t("syncDashboard.hydrationLastRun.modulesFailed")}: {run.modulesFailed}
                </Badge>
              ) : (
                <Badge variant="success" className="font-normal">
                  {t("syncDashboard.hydrationLastRun.allModulesOk")}
                </Badge>
              )}
            </div>
            {run.fatalError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
                <p className="font-semibold text-destructive mb-1">{t("syncDashboard.hydrationLastRun.fatalTitle")}</p>
                <p className="font-mono text-destructive break-words">{run.fatalError}</p>
              </div>
            ) : null}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {t("syncDashboard.hydrationLastRun.moduleTableTitle")}
              </h4>
              <ScrollArea className="h-[min(45vh,320px)] pr-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1.5 pr-2 font-medium">{t("syncDashboard.hydrationLastRun.colModule")}</th>
                      <th className="py-1.5 pr-2 font-medium w-[72px]">{t("syncDashboard.hydrationLastRun.colDuration")}</th>
                      <th className="py-1.5 font-medium">{t("syncDashboard.hydrationLastRun.colStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.modules.map((m) => (
                      <tr
                        key={m.id}
                        className={cn(
                          "border-b border-border/40 align-top",
                          m.status === "error" && "bg-destructive/[0.04]"
                        )}
                      >
                        <td className="py-2 pr-2">
                          <div className="flex items-start gap-2">
                            <ModuleRowIcon m={m} />
                            <span className="font-medium leading-snug">{t(m.labelKey)}</span>
                          </div>
                          {m.error ? (
                            <p className="mt-1 ml-5 font-mono text-[10px] text-destructive break-words">{m.error}</p>
                          ) : null}
                        </td>
                        <td className="py-2 pr-2 tabular-nums text-muted-foreground whitespace-nowrap">
                          {formatModuleDuration(m.durationMs)}
                        </td>
                        <td className="py-2">
                          <Badge variant={m.status === "error" ? "destructive" : "outline"} className="text-[10px] h-5">
                            {m.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
