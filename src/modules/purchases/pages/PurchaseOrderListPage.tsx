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
import { purchaseOrderService } from "../services/purchaseService";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ListTableSkeleton } from "../components/PurchaseSkeletons";
import { PullToRefreshIndicator } from "../components/PullToRefreshIndicator";
import { BulkActionBar } from "../components/BulkActionBar";
import { runBulkDelete, restoreRowsAtOriginalIndex } from "../utils/bulkDelete";
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
import { getInitialViewMode } from '../../../hooks/getInitialViewMode';

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
  const { t } = useTranslation("purchases");
  const navigate = useNavigate();

  // Search & filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedStat, setSelectedStat] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>(() => getInitialViewMode(['list','table'] as const, 'table'));
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

  // Apply local filters (payment / stat) and company filter on top of server-side search/status
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesPayment = paymentFilter === "all" || o.paymentStatus === paymentFilter;
      if (selectedStat === "open")
        return matchesPayment && ["draft", "validated", "ordered", "partially_received"].includes(o.status);
      if (selectedStat === "received")
        return matchesPayment && (o.status === "received" || o.status === "closed");
      if (selectedStat === "unpaid") return matchesPayment && o.paymentStatus !== "paid";
      return matchesPayment;
    });
  }, [orders, paymentFilter, selectedStat]);

  const companyFilteredOrders = useFilteredByCompany(filteredOrders);
  const companyScopedOrders = useMemo(
    () => companyFilteredOrders.filter((o) => companyId === "all" || (o as any).tenantId === companyId),
    [companyFilteredOrders, companyId],
  );

  // Stats — calculated from currently loaded orders
  const stats = useMemo(() => {
    const open = orders.filter((o) =>
      ["draft", "validated", "ordered", "partially_received"].includes(o.status),
    ).length;
    const received = orders.filter((o) => o.status === "received" || o.status === "closed").length;
    const unpaid = orders.filter((o) => o.paymentStatus !== "paid").length;
    const totalValue = companyScopedOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);
    return { open, received, unpaid, totalValue };
  }, [orders, companyScopedOrders]);

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

  const fmt = (n: number) => n.toLocaleString("fr-TN", { minimumFractionDigits: 2 });

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
      value: `${fmt(stats.totalValue)} TND`,
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

  return (
    <div ref={containerRef} className="flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
              {t("orders.title", "Purchase Orders")}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {t("orders.subtitle", "{{count}} orders", { count: total })}
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
          <CreateActionButton size="sm" onClick={() => navigate("/dashboard/purchases/orders/add")}>
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{t("orders.newOrder", "New Order")}</span>
          </CreateActionButton>
        </div>
      </div>

      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />

      {/* KPI cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((s) => {
            const isSelected = selectedStat === s.key;
            const interactive = !s.readonly;
            return (
              <Card
                key={s.key}
                className={cn(
                  "shadow-sm border transition-all",
                  interactive && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
                  isSelected ? "border-primary bg-primary/5" : "border-border",
                )}
                onClick={() => interactive && setSelectedStat((prev) => (prev === s.key ? "all" : s.key))}
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
              placeholder={t("orders.searchPlaceholder", "Search orders...")}
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
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  •
                </Badge>
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
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder={t("fields.status", "Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatuses", "All Statuses")}</SelectItem>
                <SelectItem value="draft">{t("status.draft")}</SelectItem>
                <SelectItem value="validated">{t("status.validated")}</SelectItem>
                <SelectItem value="ordered">{t("status.ordered")}</SelectItem>
                <SelectItem value="partially_received">{t("status.partially_received")}</SelectItem>
                <SelectItem value="received">{t("status.received")}</SelectItem>
                <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder={t("fields.paymentStatus", "Payment")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allPayments", "All Payments")}</SelectItem>
                <SelectItem value="pending">{t("paymentStatus.pending")}</SelectItem>
                <SelectItem value="partial">{t("paymentStatus.partial")}</SelectItem>
                <SelectItem value="paid">{t("paymentStatus.paid")}</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setStatusFilter("all");
                  setPaymentFilter("all");
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

        {loading && <ListTableSkeleton columns={8} rows={8} />}

        {!loading && error && (
          <PurchaseErrorFallback error={error} onRetry={() => fetchOrders(1)} backTo="/dashboard/purchases" />
        )}

        {!loading && !error && (
          <div className="animate-in fade-in duration-300">
            {viewMode === "table" ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
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
                                  <AvatarFallback className="text-[10px] bg-muted">
                                    {initials(po.supplierName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">{po.supplierName}</span>
                                  <CompanyBadge tenantId={(po as any).tenantId} className="text-[9px] mt-0.5" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{po.orderDate}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[po.status] || ""}`}>
                                {t(`status.${po.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {t(`paymentStatus.${po.paymentStatus}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium">{fmt(po.grandTotal)} TND</TableCell>
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
                              <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[po.status] || ""}`}>
                                {t(`status.${po.status}`)}
                              </Badge>
                              <CompanyBadge tenantId={(po as any).tenantId} className="text-[9px]" />
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {po.supplierName} · {po.orderDate}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold">{fmt(po.grandTotal)} TND</div>
                            <Badge variant="outline" className="text-[10px] mt-0.5">
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
        data={companyScopedOrders}
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
