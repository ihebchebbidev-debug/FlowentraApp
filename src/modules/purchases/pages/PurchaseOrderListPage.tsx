import { useCurrency } from '@/shared/hooks/useCurrency';
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
  Plus, Search, Eye, Edit, Trash2, ShoppingCart, Loader2, Filter,
  Download, FileText, DollarSign, Clock, CheckCircle2, X,
  List as ListIcon, Table as TableIcon,
} from "lucide-react";
import { purchaseOrderService, purchaseStatsService } from "../services/purchaseService";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ListTableSkeleton } from "../components/PurchaseSkeletons";
import { PullToRefreshIndicator } from "../components/PullToRefreshIndicator";
import { BulkActionBar } from "../components/BulkActionBar";
import { SavedViewsBar, type SavedViewFilters } from "../components/SavedViewsBar";
import { runBulkDelete, restoreRowsAtOriginalIndex } from "../utils/bulkDelete";
import { PurchaseOrdersHeader } from "../components/PurchaseOrdersHeader";
import { PurchaseOrdersStats } from "../components/PurchaseOrdersStats";
import { PurchaseOrdersSearchControls } from "../components/PurchaseOrdersSearchControls";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import { toast } from "sonner";
import type { PurchaseOrder } from "../types";
import { CreateActionButton } from "@/components/CreateActionButton";
import { CompanyBadge } from "@/components/CompanyBadge";
import { CompanyFilter, useFilteredByCompany } from "@/components/CompanyFilter";
import type { CompanyFilterValue } from "@/components/CompanyFilter";
import { isViewAllMode } from "@/utils/tenant";
import { ExportModal, type ExportConfig } from "@/components/shared/ExportModal";
import { TableRowActions } from "@/shared/components/TableRowActions";
import { formatStatValue } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { getInitialViewMode, useEnforceListOnMobile } from '../../../hooks/getInitialViewMode';

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  validated: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ordered: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  partially_received: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  received: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const initials = (name: string): string =>
  (name || "?")
    .split(" ")
    .map((p) => p.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

function PurchaseOrderListContent() {
  const { t, i18n } = useTranslation("purchases");
  const { current: currency } = useCurrency();
  const navigate = useNavigate();

  // Search & filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedStat, setSelectedStat] = useState<string>("all");
  const [activeSmartFilter, setActiveSmartFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>(() => getInitialViewMode(['list','table'] as const, 'table'));
  useEnforceListOnMobile(viewMode, setViewMode, ['list','table'] as const);
  const [showExport, setShowExport] = useState(false);
  const [companyId, setCompanyId] = useState<CompanyFilterValue>("all");

  // Data
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
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
  const [busyAction, setBusyAction] = useState<"approve" | "send" | "close" | "export" | "delete" | null>(null);

  const fetchOrders = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setError(null);
        if (append) setLoadingMore(true);
        else setLoading(true);
        const result = await purchaseOrderService.getAll({
          search: debouncedSearch || undefined,
          status: statusFilter === "all" ? undefined : (statusFilter as any),
          page: pageNum,
          limit: 20,
        });
        const newOrders = result.orders || [];
        setOrders((prev) => (append ? [...prev, ...newOrders] : newOrders));
        setTotalPages(result.pagination?.totalPages || 1);
        setTotal(result.pagination?.total || 0);
        setPage(pageNum);
      } catch (e: any) {
        setError(e?.message || t("common.loadError", "Failed to load orders"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, statusFilter, t],
  );

  useEffect(() => {
    setOrders([]);
    setPage(1);
    setSelectedIds(new Set());
    fetchOrders(1);
  }, [debouncedSearch, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) fetchOrders(page + 1, true);
  }, [loadingMore, page, totalPages, fetchOrders]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: page < totalPages,
    loading: loadingMore,
    onLoadMore: handleLoadMore,
  });

  const handleRefresh = useCallback(async () => {
    setOrders([]);
    setPage(1);
    setSelectedIds(new Set());
    await fetchOrders(1);
  }, [fetchOrders]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: handleRefresh });

  // Threshold for the "high value (top 10%)" smart filter, derived from the
  // currently loaded orders. 0 disables the filter when there is nothing to rank.
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const highValueThreshold = useMemo(() => {
    if (activeSmartFilter !== "high-value") return 0;
    const values = orders.map((o) => o.grandTotal || 0).sort((a, b) => b - a);
    if (values.length === 0) return 0;
    const idx = Math.max(0, Math.floor(values.length * 0.1) - 1);
    return values[idx];
  }, [orders, activeSmartFilter]);

  // Extra client-side predicate for smart filters whose criteria go beyond the
  // server-side status/payment filters they already set (age, value ranking).
  const matchesSmartFilter = useCallback(
    (o: PurchaseOrder): boolean => {
      switch (activeSmartFilter) {
        case "awaiting-receipt":
          return (
            ["ordered", "partially_received"].includes(o.status) &&
            Date.now() - new Date(o.orderDate).getTime() > SEVEN_DAYS_MS
          );
        case "unpaid-overdue":
          return o.paymentStatus !== "paid";
        case "high-value":
          return highValueThreshold > 0 && (o.grandTotal || 0) >= highValueThreshold;
        default:
          return true;
      }
    },
    [activeSmartFilter, highValueThreshold, SEVEN_DAYS_MS],
  );

  // Apply local filters (payment / stat / smart) on top of server-side search/status
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!matchesSmartFilter(o)) return false;
      const matchesPayment = paymentFilter === "all" || o.paymentStatus === paymentFilter;
      if (selectedStat === "open")
        return matchesPayment && ["draft", "validated", "ordered", "partially_received"].includes(o.status);
      if (selectedStat === "received")
        return matchesPayment && (o.status === "received" || o.status === "closed");
      if (selectedStat === "unpaid") return matchesPayment && o.paymentStatus !== "paid";
      return matchesPayment;
    });
  }, [orders, paymentFilter, selectedStat, matchesSmartFilter]);

  // Tenant scoping is handled server-side via the header company switcher,
  // so the list renders whatever the API returns — no extra client filter.
  const companyScopedOrders = filteredOrders;

  // Stats — fetched from server so cards reflect the FULL dataset, not just
  // the currently loaded infinite-scroll pages. Previous implementation used
  // orders.reduce(...) which silently undercounted whenever total > 20.
  const [stats, setStats] = useState<{ open: number; received: number; unpaid: number; totalValue: number }>(
    { open: 0, received: 0, unpaid: 0, totalValue: 0 },
  );
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const searchArg = debouncedSearch || undefined;
        const [openR, validatedR, orderedR, partialR, receivedR, closedR, unpaidR, dashboard] =
          await Promise.all([
            purchaseOrderService.getAll({ search: searchArg, status: "draft" as any, limit: 1 }),
            purchaseOrderService.getAll({ search: searchArg, status: "validated" as any, limit: 1 }),
            purchaseOrderService.getAll({ search: searchArg, status: "ordered" as any, limit: 1 }),
            purchaseOrderService.getAll({ search: searchArg, status: "partially_received" as any, limit: 1 }),
            purchaseOrderService.getAll({ search: searchArg, status: "received" as any, limit: 1 }),
            purchaseOrderService.getAll({ search: searchArg, status: "closed" as any, limit: 1 }),
            purchaseOrderService.getAll({ search: searchArg, paymentStatus: "unpaid" as any, limit: 1 }),
            purchaseStatsService.getDashboardStats().catch(() => null),
          ]);
        if (cancelled) return;
        const openCount =
          (openR.pagination?.total || 0) +
          (validatedR.pagination?.total || 0) +
          (orderedR.pagination?.total || 0) +
          (partialR.pagination?.total || 0);
        const receivedCount =
          (receivedR.pagination?.total || 0) + (closedR.pagination?.total || 0);
        const unpaidCount = unpaidR.pagination?.total || 0;
        const totalValue = dashboard?.totalSpendThisYear ?? dashboard?.monthlySpend ?? 0;
        setStats({ open: openCount, received: receivedCount, unpaid: unpaidCount, totalValue });
      } catch {
        // Leave previous stats in place on transient errors; the list itself
        // surfaces its own error state via `error`.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  // Single delete (optimistic)
  const handleDelete = async () => {
    if (!deleteId) return;
    const originalIndex = orders.findIndex((o) => o.id === deleteId);
    const orderToDelete = originalIndex >= 0 ? orders[originalIndex] : null;
    setOrders((prev) => prev.filter((o) => o.id !== deleteId));
    setTotal((prev) => Math.max(0, prev - 1));
    const id = deleteId;
    setDeleteId(null);
    try {
      await purchaseOrderService.delete(id);
      toast.success(t("orders.deleted", "Order deleted"));
    } catch (err) {
      if (orderToDelete) {
        setOrders((prev) => restoreRowsAtOriginalIndex(prev, [{ row: orderToDelete, idx: originalIndex }]));
        setTotal((prev) => prev + 1);
      }
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg || t("orders.deleteBlocked", "Delete failed. Order restored."));
    }
  };

  // Bulk selection
  const allSelected = useMemo(
    () => companyScopedOrders.length > 0 && companyScopedOrders.every((o) => selectedIds.has(o.id)),
    [companyScopedOrders, selectedIds],
  );
  const someSelected = selectedIds.size > 0 && !allSelected;

  const handleToggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(companyScopedOrders.map((o) => o.id)) : new Set());

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
    const indexById = new Map(orders.map((o, i) => [o.id, i] as const));
    const snapshot = orders.filter((o) => selectedIds.has(o.id));
    setOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
    setTotal((prev) => Math.max(0, prev - ids.length));

    const { failed, failedIds } = await runBulkDelete({
      ids,
      items: snapshot,
      getId: (o) => o.id,
      deleteOne: (id) => purchaseOrderService.delete(id),
      concurrency: 5,
      onFailures: (failedIds) => {
        const restore = snapshot
          .filter((o) => failedIds.includes(o.id))
          .map((o) => ({ row: o, idx: indexById.get(o.id) ?? 0 }));
        setOrders((prev) => restoreRowsAtOriginalIndex(prev, restore));
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

  // Apply a saved view or smart filter — pushes its filters into the live state.
  // Manual filter changes (below) clear the smart-filter highlight.
  const handleApplyView = (f: SavedViewFilters) => {
    setSearch(f.search ?? "");
    setStatusFilter(f.statusFilter ?? "all");
    setPaymentFilter(f.paymentFilter ?? "all");
    setSelectedStat(f.selectedStat ?? "all");
    setActiveSmartFilter(f.smart ?? null);
  };

  const currentFilters: SavedViewFilters = {
    search,
    statusFilter,
    paymentFilter,
    selectedStat,
    smart: activeSmartFilter,
  };

  // Shared runner for bulk lifecycle PATCHes (approve / send / close). Optimistically
  // patches the affected rows, then reconciles against the server result: failed ids
  // stay selected and the list is refetched so their real status is restored.
  const runBulkLifecycle = async (
    action: "approve" | "send" | "close",
    patch: Partial<Pick<PurchaseOrder, "status">>,
  ) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBusyAction(action);
    setOrders((prev) => prev.map((o) => (selectedIds.has(o.id) ? { ...o, ...patch } : o)));
    const { succeeded, failed, failedIds } = await purchaseOrderService.bulkUpdate(ids, patch);
    if (failed === 0) {
      toast.success(t("bulk.actionSuccess", "{{count}} order(s) updated", { count: succeeded }));
      setSelectedIds(new Set());
    } else {
      toast.error(
        t("bulk.actionPartial", "{{success}} updated, {{failed}} failed", {
          success: succeeded,
          failed,
        }),
      );
      setSelectedIds(new Set(failedIds));
      fetchOrders(1); // reconcile optimistic rows that the server rejected
    }
    setBusyAction(null);
  };

  const handleBulkApprove = () => runBulkLifecycle("approve", { status: "validated" });
  const handleBulkSend = () => runBulkLifecycle("send", { status: "ordered" });
  const handleBulkClose = () => runBulkLifecycle("close", { status: "closed" });
  const handleBulkExport = () => setShowExport(true);

  const fmt = (n: number) => n.toLocaleString(i18n.language || undefined, { minimumFractionDigits: 2 });

  // Stat cards — interactive (clicking one filters the list)
  const statCards: Array<{
    key: string;
    label: string;
    value: string | number;
    icon: typeof ShoppingCart;
    color: string;
    bg: string;
    readonly?: boolean;
  }> = [
    {
      key: "all",
      label: t("orders.stats.total", "Total Orders"),
      value: formatStatValue(total),
      icon: ShoppingCart,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      key: "open",
      label: t("orders.stats.open", "Open"),
      value: formatStatValue(stats.open),
      icon: Clock,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      key: "received",
      label: t("orders.stats.received", "Received"),
      value: formatStatValue(stats.received),
      icon: CheckCircle2,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      key: "value",
      label: t("orders.stats.value", "Total Value"),
      value: `${fmt(stats.totalValue)} ${currency.code}`,
      icon: DollarSign,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      readonly: true,
    },
  ];

  // Export config
  const exportConfig: ExportConfig = {
    filename: "purchase-orders-export",
    allDataTransform: (po: PurchaseOrder) => ({
      "Order Number": po.orderNumber,
      Supplier: po.supplierName,
      Date: po.orderDate,
      Status: po.status,
      "Payment Status": po.paymentStatus,
      Currency: po.currency,
      Subtotal: po.subTotal,
      Tax: po.taxAmount,
      "Grand Total": po.grandTotal,
      Notes: po.notes || "",
    }),
    availableColumns: [
      { key: "orderNumber", label: "Order Number", category: "Basic" },
      { key: "supplierName", label: "Supplier", category: "Basic" },
      { key: "orderDate", label: "Date", category: "Basic" },
      { key: "status", label: "Status", category: "Basic" },
      { key: "paymentStatus", label: "Payment Status", category: "Basic" },
      { key: "grandTotal", label: "Grand Total", category: "Financial" },
      { key: "notes", label: "Notes", category: "Details" },
    ],
  };

  const viewAll = isViewAllMode();
  const hasActiveFilter = statusFilter !== "all" || paymentFilter !== "all" || selectedStat !== "all";

  // Export the current selection when one exists (bulk "Export"), otherwise the
  // whole visible/filtered list (header "Export").
  const exportData =
    selectedIds.size > 0
      ? companyScopedOrders.filter((o) => selectedIds.has(o.id))
      : companyScopedOrders;

  return (
    <div ref={containerRef} className="flex flex-col overflow-auto">
      <PurchaseOrdersHeader total={total} onExport={() => setShowExport(true)} />

      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />

      <PurchaseOrdersStats
        stats={{
          total,
          open: stats.open,
          received: stats.received,
          totalValue: stats.totalValue,
        }}
        selected={selectedStat}
        onSelect={(v) => { setSelectedStat(v); setActiveSmartFilter(null); }}
      />

      <PurchaseOrdersSearchControls
        search={search}
        onSearchChange={(v) => { setSearch(v); setActiveSmartFilter(null); }}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        hasActiveFilter={hasActiveFilter || !!activeSmartFilter}
        statusFilter={statusFilter}
        onStatusChange={(v) => { setStatusFilter(v); setActiveSmartFilter(null); }}
        paymentFilter={paymentFilter}
        onPaymentChange={(v) => { setPaymentFilter(v); setActiveSmartFilter(null); }}
        companyId={companyId}
        onCompanyChange={setCompanyId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <SavedViewsBar
        storageKey="flowentra.purchases.po.savedViews"
        currentFilters={currentFilters}
        activeSmartFilter={activeSmartFilter}
        onApply={handleApplyView}
      />

      <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">


        <BulkActionBar
          selectedCount={selectedIds.size}
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleAll={handleToggleAll}
          onClear={() => setSelectedIds(new Set())}
          onDelete={() => setShowBulkDeleteDialog(true)}
          onApprove={handleBulkApprove}
          onSend={handleBulkSend}
          onClose={handleBulkClose}
          onExport={handleBulkExport}
          busyAction={busyAction}
        />

        {loading && <ListTableSkeleton columns={8} rows={8} />}

        {!loading && error && (
          <PurchaseErrorFallback error={error} onRetry={() => fetchOrders(1)} backTo="/dashboard/purchases" />
        )}

        {!loading && !error && (
          <div className="animate-in fade-in duration-300">
            {viewMode === "table" ? (
              <>
                {/* Mobile cards — visible below md breakpoint */}
                <div className="md:hidden list-editorial rounded-lg border border-border overflow-hidden">
                  {companyScopedOrders.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 opacity-40 mx-auto mb-2" />
                      <span className="text-sm">{t("orders.empty", "No purchase orders found")}</span>
                    </div>
                  ) : (
                    companyScopedOrders.map((po) => {
                      const isSelected = selectedIds.has(po.id);
                      return (
                        <div
                          key={po.id}
                          className="list-row-editorial bg-card"
                          data-selected={isSelected ? 'true' : 'false'}
                          onClick={() => navigate(`/dashboard/purchases/orders/${po.id}`)}
                        >
                          {/* Header */}
                          <div className="flex items-start gap-3">
                            <div className="list-row-avatar mt-0.5">
                              <ShoppingCart className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="list-row-title flex-1">
                                  {po.orderNumber}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className={`text-px-10 px-2 py-0.5 shrink-0 ${STATUS_COLORS[po.status] || ""}`}
                                >
                                  {t(`status.${po.status}`)}
                                </Badge>
                              </div>
                              <p className="list-row-subtitle font-mono">
                                {po.supplierName}
                              </p>
                            </div>
                          </div>
                          {/* Details */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[52px] mt-2">
                            <div className="list-row-meta-item">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span>{po.orderDate}</span>
                            </div>
                            <div className="list-row-meta-item">
                              <Badge variant="outline" className="text-px-10 px-1.5 py-0">
                                {t(`paymentStatus.${po.paymentStatus}`)}
                              </Badge>
                            </div>
                          </div>
                          {/* Footer */}
                          <div
                            className="flex items-center justify-between pl-[52px] mt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="list-row-amount">
                              {fmt(po.grandTotal)} {currency.code}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs"
                                onClick={() => navigate(`/dashboard/purchases/orders/${po.id}`)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                {t("actions.view", "View")}
                              </Button>
                              {po.status === "draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => navigate(`/dashboard/purchases/orders/${po.id}`)}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  {t("actions.edit", "Edit")}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => setDeleteId(po.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                {t("actions.delete", "Delete")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop table — hidden on mobile */}
                <div className="hidden md:block overflow-x-auto">
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
                            <TableHead className="text-xs">{t("fields.orderNumber", "Order #")}</TableHead>
                            <TableHead className="text-xs">{t("fields.supplier", "Supplier")}</TableHead>
                            <TableHead className="text-xs">{t("fields.date", "Date")}</TableHead>
                            <TableHead className="text-xs">{t("fields.status", "Status")}</TableHead>
                            <TableHead className="text-xs">{t("fields.paymentStatus", "Payment")}</TableHead>
                            <TableHead className="text-xs text-right">{t("fields.total", "Total")}</TableHead>
                            <TableHead className="text-xs w-32 text-right">{t("fields.actions", "Actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {companyScopedOrders.map((po) => {
                            const isSelected = selectedIds.has(po.id);
                            return (
                              <TableRow
                                key={po.id}
                                data-state={isSelected ? "selected" : undefined}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => navigate(`/dashboard/purchases/orders/${po.id}`)}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(c) => handleToggleOne(po.id, !!c)}
                                    aria-label={`Select ${po.orderNumber}`}
                                  />
                                </TableCell>
                                <TableCell className="text-xs font-medium text-primary">{po.orderNumber}</TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarFallback className="text-px-10 bg-muted">
                                        {initials(po.supplierName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate">{po.supplierName}</span>
                                      <CompanyBadge tenantId={(po as any).tenantId} className="text-px-9 mt-0.5" />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{po.orderDate}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={`text-px-10 ${STATUS_COLORS[po.status] || ""}`}>
                                    {t(`status.${po.status}`)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-px-10">
                                    {t(`paymentStatus.${po.paymentStatus}`)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-right font-medium">{fmt(po.grandTotal)} {currency.code}</TableCell>
                                <TableCell className="text-right">
                                  <TableRowActions
                                    actions={[
                                      {
                                        icon: Eye,
                                        label: t("actions.view", "View"),
                                        onClick: () => navigate(`/dashboard/purchases/orders/${po.id}`),
                                      },
                                      {
                                        icon: Edit,
                                        label: t("actions.edit", "Edit"),
                                        onClick: () => navigate(`/dashboard/purchases/orders/${po.id}`),
                                        show: po.status === "draft",
                                      },
                                      {
                                        icon: Trash2,
                                        label: t("actions.delete", "Delete"),
                                        onClick: () => setDeleteId(po.id),
                                        variant: "destructive",
                                      },
                                    ]}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {companyScopedOrders.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-12">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                  <FileText className="h-8 w-8 opacity-40" />
                                  <span className="text-sm">{t("orders.empty", "No purchase orders found")}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {companyScopedOrders.map((po) => {
                  const isSelected = selectedIds.has(po.id);
                  return (
                    <Card
                      key={po.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-all",
                        isSelected && "border-primary bg-primary/5",
                      )}
                      onClick={() => navigate(`/dashboard/purchases/orders/${po.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(c) => handleToggleOne(po.id, !!c)}
                            />
                          </div>
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-muted text-xs">
                              {initials(po.supplierName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-primary">{po.orderNumber}</span>
                              <Badge variant="secondary" className={`text-px-10 ${STATUS_COLORS[po.status] || ""}`}>
                                {t(`status.${po.status}`)}
                              </Badge>
                              <CompanyBadge tenantId={(po as any).tenantId} className="text-px-9" />
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {po.supplierName} · {po.orderDate}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold">{fmt(po.grandTotal)} {currency.code}</div>
                            <Badge variant="outline" className="text-px-10 mt-0.5">
                              {t(`paymentStatus.${po.paymentStatus}`)}
                            </Badge>
                          </div>
                          <TableRowActions
                            actions={[
                              {
                                icon: Eye,
                                label: t("actions.view", "View"),
                                onClick: () => navigate(`/dashboard/purchases/orders/${po.id}`),
                              },
                              {
                                icon: Trash2,
                                label: t("actions.delete", "Delete"),
                                onClick: () => setDeleteId(po.id),
                                variant: "destructive",
                              },
                            ]}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {companyScopedOrders.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 opacity-40 mx-auto mb-2" />
                      <span className="text-sm">{t("orders.empty", "No purchase orders found")}</span>
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
            <AlertDialogTitle>{t("confirm.deleteTitle", "Delete Order")}</AlertDialogTitle>
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
            <AlertDialogTitle>{t("bulk.deleteTitle", "Delete selected orders?")}</AlertDialogTitle>
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
        data={exportData}
        moduleName="purchase-orders"
        moduleNameTranslated={t("orders.title", "Purchase Orders")}
        exportConfig={exportConfig}
      />
    </div>
  );
}

export default function PurchaseOrderListPage() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases">
      <PurchaseOrderListContent />
    </PurchaseErrorBoundary>
  );
}
