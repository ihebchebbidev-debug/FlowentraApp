import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, Search, XCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSyncHistory, retrySyncItem, type SyncHistoryItem } from "@/services/offline/syncDashboardApi";
import { useToast } from "@/hooks/use-toast";
import { HydrationLastRunPanel } from "@/components/offline/HydrationLastRunPanel";

function statusIcon(status: string) {
  if (status === "applied" || status === "duplicate") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "rejected" || status === "conflict") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Clock3 className="h-4 w-4 text-muted-foreground" />;
}

export default function SyncDashboardPage() {
  const { t } = useTranslation("settings");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const pageSize = 20;
  const inspectMode = params.get("inspectSync") === "1";

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["sync-history", status, search, page],
    queryFn: () => getSyncHistory({ status, search, page, pageSize }),
  });

  const retryMutation = useMutation({
    mutationFn: (item: SyncHistoryItem) => retrySyncItem({ deviceId: item.deviceId, opId: item.opId }),
    onSuccess: () => {
      toast({ title: t("syncDashboard.retrySuccess") });
      queryClient.invalidateQueries({ queryKey: ["sync-history"] });
    },
    onError: (e: any) => {
      toast({ title: t("syncDashboard.retryError"), description: e?.message, variant: "destructive" });
    },
  });

  const totals = useMemo(() => {
    const items = data?.items ?? [];
    return {
      totalGlobal: data?.totalCount ?? 0,
      rejectedPage: items.filter((i) => i.status === "rejected").length,
      appliedPage: items.filter((i) => i.status === "applied" || i.status === "duplicate").length,
    };
  }, [data]);

  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / pageSize));

  useEffect(() => {
    if (!inspectMode) return;
    if (!data?.items?.length) return;
    const initial: Record<string, boolean> = {};
    for (const item of data.items.slice(0, 3)) {
      initial[`${item.deviceId}:${item.opId}`] = true;
    }
    setExpandedRows(initial);
    const next = new URLSearchParams(params);
    next.delete("inspectSync");
    setParams(next, { replace: true });
  }, [inspectMode, data?.items, params, setParams]);

  return (
    <div className="p-6 space-y-4">
      <HydrationLastRunPanel variant="compact" />
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>{t("syncDashboard.title")}</CardTitle>
          <CardDescription>{t("syncDashboard.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t("syncDashboard.total")}</div>
              <div className="text-2xl font-semibold">{totals.totalGlobal}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t("syncDashboard.syncedPage")}</div>
              <div className="text-2xl font-semibold text-emerald-600">{totals.appliedPage}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t("syncDashboard.rejectedPage")}</div>
              <div className="text-2xl font-semibold text-destructive">{totals.rejectedPage}</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
                placeholder={t("syncDashboard.searchPlaceholder")}
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("syncDashboard.filters.all")}</SelectItem>
                <SelectItem value="applied">{t("syncDashboard.filters.applied")}</SelectItem>
                <SelectItem value="duplicate">{t("syncDashboard.filters.duplicate")}</SelectItem>
                <SelectItem value="rejected">{t("syncDashboard.filters.rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-12 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
              <div className="col-span-2">{t("syncDashboard.cols.status")}</div>
              <div className="col-span-2">{t("syncDashboard.cols.entity")}</div>
              <div className="col-span-3">{t("syncDashboard.cols.operation")}</div>
              <div className="col-span-3">{t("syncDashboard.cols.time")}</div>
              <div className="col-span-2 text-right">{t("syncDashboard.cols.actions")}</div>
            </div>
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">{t("syncDashboard.loading")}</div>
            ) : (data?.items?.length ?? 0) === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t("syncDashboard.empty")}
              </div>
            ) : (
              data!.items.map((item) => {
                const rowKey = `${item.deviceId}:${item.opId}`;
                const isExpanded = !!expandedRows[rowKey];
                return (
                  <div key={rowKey} className="border-t">
                    <div className="grid grid-cols-12 px-3 py-2 text-sm">
                      <div className="col-span-2 flex items-center gap-2">
                        {statusIcon(item.status)}
                        <Badge variant={item.status === "rejected" ? "destructive" : "secondary"}>{item.status}</Badge>
                      </div>
                      <div className="col-span-2">{item.entityType || "-"}</div>
                      <div className="col-span-3 truncate" title={item.endpoint || item.operation || ""}>
                        {(item.method || item.operation || "-").toUpperCase()} {item.endpoint ? `- ${item.endpoint}` : ""}
                      </div>
                      <div className="col-span-3">{new Date(item.createdAt).toLocaleString()}</div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))}
                        >
                          {isExpanded ? t("syncDashboard.hideDetails") : t("syncDashboard.details")}
                        </Button>
                        {item.canRetry ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryMutation.mutate(item)}
                            disabled={retryMutation.isPending}
                          >
                            {retryMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : t("syncDashboard.retry")}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{item.error || "-"}</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <div className="px-3 pb-3 text-xs space-y-2 bg-muted/20">
                        <div><span className="font-medium">{t("syncDashboard.detailsPanel.opId")}:</span> {item.opId}</div>
                        <div><span className="font-medium">{t("syncDashboard.detailsPanel.deviceId")}:</span> {item.deviceId}</div>
                        <div><span className="font-medium">{t("syncDashboard.detailsPanel.transactionGroup")}:</span> {item.transactionGroupId || "-"}</div>
                        <div><span className="font-medium">{t("syncDashboard.detailsPanel.conflictStrategy")}:</span> {item.conflictStrategy || "-"}</div>
                        <div><span className="font-medium">{t("syncDashboard.detailsPanel.serverEntityId")}:</span> {item.serverEntityId ?? "-"}</div>
                        <div><span className="font-medium">{t("syncDashboard.detailsPanel.backendError")}:</span> {item.error || "-"}</div>
                        <div>
                          <div className="font-medium mb-1">{t("syncDashboard.detailsPanel.operationJson")}</div>
                          <pre className="rounded border bg-background p-2 overflow-auto whitespace-pre-wrap break-all">
                            {item.operationJson || "-"}
                          </pre>
                        </div>
                        <div>
                          <div className="font-medium mb-1">{t("syncDashboard.detailsPanel.responseJson")}</div>
                          <pre className="rounded border bg-background p-2 overflow-auto whitespace-pre-wrap break-all">
                            {item.responseJson || "-"}
                          </pre>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {t("syncDashboard.pageInfo", { page, totalPages, total: data?.totalCount ?? 0 })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => p - 1)}>
                {t("syncDashboard.prev")}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>
                {t("syncDashboard.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
