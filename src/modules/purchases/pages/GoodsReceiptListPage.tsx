import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, Eye, Trash2, Package, Loader2, Filter,
  Download, FileText, CheckCircle2, Clock, XCircle, X,
  List as ListIcon, Table as TableIcon,
} from "lucide-react";
import { goodsReceiptService } from "../services/purchaseService";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ListTableSkeleton } from "../components/PurchaseSkeletons";
import { PullToRefreshIndicator } from "../components/PullToRefreshIndicator";
import { BulkActionBar } from "../components/BulkActionBar";
import { runBulkDelete, restoreRowsAtOriginalIndex } from "../utils/bulkDelete";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import { toast } from "sonner";
import type { GoodsReceipt } from "../types";
import { CreateActionButton } from "@/components/CreateActionButton";
import { CompanyBadge } from "@/components/CompanyBadge";
import { CompanyFilter, useFilteredByCompany } from "@/components/CompanyFilter";
import type { CompanyFilterValue } from "@/components/CompanyFilter";
import { isViewAllMode } from "@/utils/tenant";
import { ExportModal, type ExportConfig } from "@/components/shared/ExportModal";
import { TableRowActions } from "@/shared/components/TableRowActions";
import { formatStatValue } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { getInitialViewMode } from '../../../hooks/getInitialViewMode';

const STATUS_COLORS: Record<string, string> = {
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  complete: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const initials = (name: string): string =>
  (name || "?")
    .split(" ")
    .map((p) => p.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

function GoodsReceiptListContent() {
  const { t } = useTranslation("purchases");
  const navigate = useNavigate();

  // Search & filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStat, setSelectedStat] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>(() => getInitialViewMode(['list','table'] as const, 'table'));
  const [showExport, setShowExport] = useState(false);
  const [companyId, setCompanyId] = useState<CompanyFilterValue>("all");

  // Data
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchReceipts = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setError(null);
        if (append) setLoadingMore(true);
        else setLoading(true);
        const result = await goodsReceiptService.getAll({
          search: debouncedSearch || undefined,
          status: statusFilter === "all" ? undefined : (statusFilter as any),
          page: pageNum,
          limit: 20,
        });
        // Defensive: hide soft-deleted receipts that may leak through.
        const newReceipts = (result.receipts || []).filter((r) => !r.isDeleted);
        setReceipts((prev) => (append ? [...prev, ...newReceipts] : newReceipts));
        setTotalPages(result.pagination?.totalPages || 1);
        setTotal(result.pagination?.total || 0);
        setPage(pageNum);
      } catch (e: any) {
        setError(e?.message || t("common.loadError", "Failed to load receipts"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, statusFilter, t],
  );

  useEffect(() => {
    setReceipts([]);
    setPage(1);
    setSelectedIds(new Set());
    fetchReceipts(1);
  }, [debouncedSearch, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) fetchReceipts(page + 1, true);
  }, [loadingMore, page, totalPages, fetchReceipts]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: page < totalPages,
    loading: loadingMore,
    onLoadMore: handleLoadMore,
  });

  const handleRefresh = useCallback(async () => {
    setReceipts([]);
    setPage(1);
    setSelectedIds(new Set());
    await fetchReceipts(1);
  }, [fetchReceipts]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: handleRefresh });

  // Apply local stat filter on top of server-side filters
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (selectedStat === "partial") return r.status === "partial";
      if (selectedStat === "complete") return r.status === "complete";
      if (selectedStat === "rejected") return r.status === "rejected";
      return true;
    });
  }, [receipts, selectedStat]);

  const companyFilteredReceipts = useFilteredByCompany(filteredReceipts);
  const companyScopedReceipts = useMemo(
    () => companyFilteredReceipts.filter((r) => companyId === "all" || (r as any).tenantId === companyId),
    [companyFilteredReceipts, companyId],
  );

  // Stats
  const stats = useMemo(() => {
    const partial = receipts.filter((r) => r.status === "partial").length;
    const complete = receipts.filter((r) => r.status === "complete").length;
    const rejected = receipts.filter((r) => r.status === "rejected").length;
    return { partial, complete, rejected };
  }, [receipts]);

  // Single delete (optimistic)
  const handleDelete = async () => {
    if (!deleteId) return;
    const originalIndex = receipts.findIndex((r) => r.id === deleteId);
    const snapshot = originalIndex >= 0 ? receipts[originalIndex] : null;
    setReceipts((prev) => prev.filter((r) => r.id !== deleteId));
    setTotal((prev) => Math.max(0, prev - 1));
    const id = deleteId;
    setDeleteId(null);
    try {
      await goodsReceiptService.delete(id);
      toast.success(t("receipts.deleted", "Receipt deleted"));
    } catch (err) {
      if (snapshot) {
        setReceipts((prev) => restoreRowsAtOriginalIndex(prev, [{ row: snapshot, idx: originalIndex }]));
        setTotal((prev) => prev + 1);
      }
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg || t("common.error", "Delete failed"));
    }
  };

  // Bulk
  const allSelected = useMemo(
    () => companyScopedReceipts.length > 0 && companyScopedReceipts.every((r) => selectedIds.has(r.id)),
    [companyScopedReceipts, selectedIds],
  );
  const someSelected = selectedIds.size > 0 && !allSelected;

  const handleToggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(companyScopedReceipts.map((r) => r.id)) : new Set());

  const handleToggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setIsBulkDeleting(true);
    const indexById = new Map(receipts.map((r, i) => [r.id, i] as const));
    const snapshot = receipts.filter((r) => selectedIds.has(r.id));
    setReceipts((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setTotal((prev) => Math.max(0, prev - ids.length));

    const { failed, failedIds } = await runBulkDelete({
      ids,
      items: snapshot,
      getId: (r) => r.id,
      deleteOne: (id) => goodsReceiptService.delete(id),
      concurrency: 5,
      onFailures: (failedIds) => {
        const restore = snapshot
          .filter((r) => failedIds.includes(r.id))
          .map((r) => ({ row: r, idx: indexById.get(r.id) ?? 0 }));
        setReceipts((prev) => restoreRowsAtOriginalIndex(prev, restore));
        setTotal((prev) => prev + restore.length);
      },
      successMsg: (n) => t("bulk.deleteSuccess", "{{count}} items deleted", { count: n }),
      partialMsg: (s, f) => t("bulk.deletePartial", "{{success}} deleted, {{failed}} failed", { success: s, failed: f }),
      errorMsg: () => t("common.error", "Delete failed"),
    });

    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(failed > 0 ? new Set(failedIds) : new Set());
  };

  // Stat cards
  const statCards: Array<{
    key: string;
    label: string;
    value: string | number;
    icon: typeof Package;
    color: string;
    bg: string;
  }> = [
    {
      key: "all",
      label: t("receipts.stats.total", "Total Receipts") || "Total Receipts",
      value: formatStatValue(total),
      icon: Package,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      key: "partial",
      label: t("receipts.stats.partial", "Partial") || "Partial",
      value: formatStatValue(stats.partial),
      icon: Clock,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      key: "complete",
      label: t("receipts.stats.complete", "Complete") || "Complete",
      value: formatStatValue(stats.complete),
      icon: CheckCircle2,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      key: "rejected",
      label: t("receipts.stats.rejected", "Rejected") || "Rejected",
      value: formatStatValue(stats.rejected),
      icon: XCircle,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ];

  // Export
  const exportConfig: ExportConfig = {
    filename: "goods-receipts-export",
    allDataTransform: (gr: GoodsReceipt) => ({
      "Receipt Number": gr.receiptNumber,
      "Order Number": gr.purchaseOrderNumber || "",
      Supplier: gr.supplierName,
      Date: gr.receiptDate,
      Status: gr.status,
      "Received By": gr.receivedByName || gr.receivedBy,
      "Delivery Note": gr.deliveryNoteRef || "",
      Notes: gr.notes || "",
    }),
    availableColumns: [
      { key: "receiptNumber", label: "Receipt Number", category: "Basic" },
      { key: "purchaseOrderNumber", label: "Order Number", category: "Basic" },
      { key: "supplierName", label: "Supplier", category: "Basic" },
      { key: "receiptDate", label: "Date", category: "Basic" },
      { key: "status", label: "Status", category: "Basic" },
      { key: "receivedByName", label: "Received By", category: "Basic" },
      { key: "deliveryNoteRef", label: "Delivery Note", category: "Details" },
      { key: "notes", label: "Notes", category: "Details" },
    ],
  };

  const viewAll = isViewAllMode();
  const hasActiveFilter = statusFilter !== "all" || selectedStat !== "all";

  return (
    <div ref={containerRef} className="flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
              {t("receipts.title", "Goods Receipts")}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {t("receipts.subtitle", "{{count}} receipts", { count: total })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowExport(true)}
            title={t("actions.export", "Export")}
          >
            <Download className="h-4 w-4" />
          </Button>
          <CreateActionButton size="sm" onClick={() => navigate("/dashboard/purchases/receipts/add")}>
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{t("receipts.newReceipt", "New Receipt")}</span>
          </CreateActionButton>
        </div>
      </div>

      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />

      {/* KPI cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((s) => {
            const isSelected = selectedStat === s.key;
            return (
              <Card
                key={s.key}
                className={cn(
                  "shadow-sm border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5",
                  isSelected ? "border-primary bg-primary/5" : "border-border",
                )}
                onClick={() => setSelectedStat((prev) => (prev === s.key ? "all" : s.key))}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg shrink-0", s.bg)}>
                      <s.icon className={cn("h-4 w-4", s.color)} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground truncate">{s.label}</div>
                      <div className="text-base sm:text-lg font-semibold text-foreground truncate">{s.value}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("receipts.searchPlaceholder", "Search receipts...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant={showFilters || hasActiveFilter ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{t("filters.title", "Filters")}</span>
              {hasActiveFilter && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">•</Badge>
              )}
            </Button>
            {viewAll && <CompanyFilter value={companyId} onChange={setCompanyId} />}
            <div className="hidden md:flex items-center border border-border rounded-md p-0.5">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode("table")}
              >
                <TableIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 border border-border rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder={t("fields.status", "Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatuses", "All Statuses")}</SelectItem>
                <SelectItem value="partial">{t("receiptStatus.partial", "Partial")}</SelectItem>
                <SelectItem value="complete">{t("receiptStatus.complete", "Complete")}</SelectItem>
                <SelectItem value="rejected">{t("receiptStatus.rejected", "Rejected")}</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setStatusFilter("all");
                  setSelectedStat("all");
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                {t("filters.clear", "Clear")}
              </Button>
            )}
          </div>
        )}

        <BulkActionBar
          selectedCount={selectedIds.size}
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleAll={handleToggleAll}
          onClear={() => setSelectedIds(new Set())}
          onDelete={() => setShowBulkDeleteDialog(true)}
        />

        {loading && <ListTableSkeleton columns={8} rows={6} />}

        {!loading && error && (
          <PurchaseErrorFallback error={error} onRetry={() => fetchReceipts(1)} backTo="/dashboard/purchases" />
        )}

        {!loading && !error && (
          <div className="animate-in fade-in duration-300">
            {viewMode === "table" ? (
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={(c) => handleToggleAll(!!c)}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="text-xs">{t("fields.receiptNumber", "Receipt #")}</TableHead>
                        <TableHead className="text-xs">{t("fields.orderNumber", "Order #")}</TableHead>
                        <TableHead className="text-xs">{t("fields.supplier", "Supplier")}</TableHead>
                        <TableHead className="text-xs">{t("fields.date", "Date")}</TableHead>
                        <TableHead className="text-xs">{t("fields.status", "Status")}</TableHead>
                        <TableHead className="text-xs">{t("fields.receivedBy", "Received By")}</TableHead>
                        <TableHead className="text-xs w-32 text-right">{t("fields.actions", "Actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyScopedReceipts.map((gr) => {
                        const isSelected = selectedIds.has(gr.id);
                        return (
                          <TableRow
                            key={gr.id}
                            data-state={isSelected ? "selected" : undefined}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigate(`/dashboard/purchases/receipts/${gr.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(c) => handleToggleOne(gr.id, !!c)}
                                aria-label={`Select ${gr.receiptNumber}`}
                              />
                            </TableCell>
                            <TableCell className="text-xs font-medium text-primary">{gr.receiptNumber}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{gr.purchaseOrderNumber || "-"}</TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-6 w-6 shrink-0">
                                  <AvatarFallback className="text-[10px] bg-muted">
                                    {initials(gr.supplierName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">{gr.supplierName}</span>
                                  <CompanyBadge tenantId={(gr as any).tenantId} className="text-[9px] mt-0.5" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{gr.receiptDate}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[gr.status] || ""}`}>
                                {t(`receiptStatus.${gr.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{gr.receivedByName || gr.receivedBy}</TableCell>
                            <TableCell className="text-right">
                              <TableRowActions
                                actions={[
                                  {
                                    icon: Eye,
                                    label: t("actions.view", "View"),
                                    onClick: () => navigate(`/dashboard/purchases/receipts/${gr.id}`),
                                  },
                                  {
                                    icon: Trash2,
                                    label: t("actions.delete", "Delete"),
                                    onClick: () => setDeleteId(gr.id),
                                    variant: "destructive",
                                  },
                                ]}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {companyScopedReceipts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <FileText className="h-8 w-8 opacity-40" />
                              <span className="text-sm">{t("receipts.empty", "No goods receipts found")}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {companyScopedReceipts.map((gr) => {
                  const isSelected = selectedIds.has(gr.id);
                  return (
                    <Card
                      key={gr.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-all",
                        isSelected && "border-primary bg-primary/5",
                      )}
                      onClick={() => navigate(`/dashboard/purchases/receipts/${gr.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(c) => handleToggleOne(gr.id, !!c)}
                            />
                          </div>
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-muted text-xs">
                              {initials(gr.supplierName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-primary">{gr.receiptNumber}</span>
                              <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[gr.status] || ""}`}>
                                {t(`receiptStatus.${gr.status}`)}
                              </Badge>
                              <CompanyBadge tenantId={(gr as any).tenantId} className="text-[9px]" />
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {gr.supplierName} · {gr.receiptDate}
                            </div>
                          </div>
                          <TableRowActions
                            actions={[
                              {
                                icon: Eye,
                                label: t("actions.view", "View"),
                                onClick: () => navigate(`/dashboard/purchases/receipts/${gr.id}`),
                              },
                              {
                                icon: Trash2,
                                label: t("actions.delete", "Delete"),
                                onClick: () => setDeleteId(gr.id),
                                variant: "destructive",
                              },
                            ]}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {companyScopedReceipts.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 opacity-40 mx-auto mb-2" />
                      <span className="text-sm">{t("receipts.empty", "No goods receipts found")}</span>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single delete dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.deleteReceiptTitle", "Delete Receipt")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.deleteDesc", "This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("actions.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={(o) => !isBulkDeleting && setShowBulkDeleteDialog(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulk.deleteTitle", "Delete selected receipts?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulk.deleteDescription", "This will permanently delete {{count}} item(s). This action cannot be undone.", {
                count: selectedIds.size,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>{t("actions.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> {t("bulk.deleting", "Deleting...")}
                </>
              ) : (
                t("actions.delete", "Delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export modal */}
      <ExportModal
        open={showExport}
        onOpenChange={setShowExport}
        data={companyScopedReceipts}
        moduleName="goods-receipts"
        moduleNameTranslated={t("receipts.title", "Goods Receipts")}
        exportConfig={exportConfig}
      />
    </div>
  );
}

export default function GoodsReceiptListPage() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases">
      <GoodsReceiptListContent />
    </PurchaseErrorBoundary>
  );
}
