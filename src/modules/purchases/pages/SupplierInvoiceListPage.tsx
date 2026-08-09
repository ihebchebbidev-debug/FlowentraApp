import { translateApiErrorMessage } from '../utils/apiErrorToast';
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
  Plus, Search, Eye, Trash2, FileText, Loader2, Filter,
  Download, DollarSign, Clock, CheckCircle2, AlertCircle, X,
  List as ListIcon, Table as TableIcon,
} from "lucide-react";
import { supplierInvoiceService } from "../services/purchaseService";
import { RS_TRANSACTION_TYPES } from "@/modules/shared/types/retenue-source";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ListTableSkeleton } from "../components/PurchaseSkeletons";
import { PullToRefreshIndicator } from "../components/PullToRefreshIndicator";
import { BulkActionBar } from "../components/BulkActionBar";
import { runBulkDelete, restoreRowsAtOriginalIndex } from "../utils/bulkDelete";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import { toast } from "sonner";
import type { SupplierInvoice } from "../types";
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
import { formatPurchaseDate, formatPaymentTerms } from '../utils/format';

const rsRateForCode = (code?: string): number | null => {
  if (!code) return null;
  const r = RS_TRANSACTION_TYPES.find((x) => x.code === code);
  return r ? r.rate : null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  validated: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  partially_paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
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

function SupplierInvoiceListContent() {
  const { t, i18n } = useTranslation("purchases");
  const { current: currency } = useCurrency();
  const navigate = useNavigate();

  // Search & filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rsFilter, setRsFilter] = useState<string>("all");
  const [selectedStat, setSelectedStat] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>(() => getInitialViewMode(['list','table'] as const, 'table'));
  useEnforceListOnMobile(viewMode, setViewMode, ['list','table'] as const);
  const [showExport, setShowExport] = useState(false);
  const [companyId, setCompanyId] = useState<CompanyFilterValue>("all");

  // Data
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
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

  const fetchInvoices = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setError(null);
        if (append) setLoadingMore(true);
        else setLoading(true);
        const result = await supplierInvoiceService.getAll({
          search: debouncedSearch || undefined,
          status: statusFilter === "all" ? undefined : (statusFilter as any),
          page: pageNum,
          limit: 20,
        });
        const newInvoices = result.invoices || [];
        setInvoices((prev) => (append ? [...prev, ...newInvoices] : newInvoices));
        setTotalPages(result.pagination?.totalPages || 1);
        setTotal(result.pagination?.total || 0);
        setPage(pageNum);
      } catch (e: any) {
        setError(e?.message || t("common.loadError", "Failed to load invoices"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, statusFilter, t],
  );

  useEffect(() => {
    setInvoices([]);
    setPage(1);
    setSelectedIds(new Set());
    fetchInvoices(1);
  }, [debouncedSearch, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) fetchInvoices(page + 1, true);
  }, [loadingMore, page, totalPages, fetchInvoices]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: page < totalPages,
    loading: loadingMore,
    onLoadMore: handleLoadMore,
  });

  const handleRefresh = useCallback(async () => {
    setInvoices([]);
    setPage(1);
    setSelectedIds(new Set());
    await fetchInvoices(1);
  }, [fetchInvoices]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: handleRefresh });

  // Local filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchesRs =
        rsFilter === "all" ||
        (rsFilter === "applicable" && i.rsApplicable) ||
        (rsFilter === "none" && !i.rsApplicable);
      if (selectedStat === "unpaid")
        return matchesRs && i.status !== "paid" && i.status !== "cancelled";
      if (selectedStat === "paid") return matchesRs && i.status === "paid";
      if (selectedStat === "overdue") {
        // Compare parsed timestamps: dueDate may be a full ISO datetime, which
        // makes a raw string comparison against a YYYY-MM-DD "today" unreliable.
        const due = i.dueDate ? new Date(i.dueDate).getTime() : NaN;
        const isOverdue = Number.isFinite(due) && due < Date.now();
        return matchesRs && isOverdue && i.status !== "paid" && i.status !== "cancelled";
      }
      return matchesRs;
    });
  }, [invoices, rsFilter, selectedStat]);

  const companyFilteredInvoices = useFilteredByCompany(filteredInvoices);
  const companyScopedInvoices = useMemo(
    () => companyFilteredInvoices.filter((i) => companyId === "all" || (i as any).tenantId === companyId),
    [companyFilteredInvoices, companyId],
  );

  // Stats — fetched from server via pagination.total per status filter, so cards
  // reflect the FULL dataset (previously reduced over the loaded 20/page window,
  // silently undercounting once total > 20).
  const [stats, setStats] = useState<{ unpaid: number; paid: number; overdue: number; totalValue: number }>(
    { unpaid: 0, paid: 0, overdue: 0, totalValue: 0 },
  );
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const searchArg = debouncedSearch || undefined;
        const [pendingR, partialR, validatedR, paidR, overdueR] = await Promise.all([
          supplierInvoiceService.getAll({ search: searchArg, status: "pending" as any, limit: 1 }),
          supplierInvoiceService.getAll({ search: searchArg, status: "partially_paid" as any, limit: 1 }),
          supplierInvoiceService.getAll({ search: searchArg, status: "validated" as any, limit: 1 }),
          supplierInvoiceService.getAll({ search: searchArg, status: "paid" as any, limit: 1 }),
          supplierInvoiceService.getAll({ search: searchArg, overdueOnly: true, limit: 1 } as any),
        ]);
        if (cancelled) return;
        const unpaid =
          (pendingR.pagination?.total || 0) +
          (partialR.pagination?.total || 0) +
          (validatedR.pagination?.total || 0);
        const paid = paidR.pagination?.total || 0;
        // Server-side overdue_only: past due date AND not paid/cancelled.
        const overdue = overdueR.pagination?.total || 0;
        // Total value must span the FULL dataset, not the 20-row page window,
        // so pull a wide page purely to aggregate grandTotal.
        let totalValue = 0;
        try {
          const allR = await supplierInvoiceService.getAll({ search: searchArg, limit: 500 });
          totalValue = (allR.invoices || []).reduce(
            (sum, i) => sum + (Number(i.grandTotal) || 0),
            0,
          );
        } catch {
          /* leave 0 */
        }
        if (cancelled) return;
        setStats((prev) => ({ ...prev, unpaid, paid, overdue, totalValue }));
      } catch {
        /* keep previous */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  // Single delete
  const handleDelete = async () => {
    if (!deleteId) return;
    const originalIndex = invoices.findIndex((i) => i.id === deleteId);
    const snapshot = originalIndex >= 0 ? invoices[originalIndex] : null;
    setInvoices((prev) => prev.filter((i) => i.id !== deleteId));
    setTotal((prev) => Math.max(0, prev - 1));
    const id = deleteId;
    setDeleteId(null);
    try {
      await supplierInvoiceService.delete(id);
      toast.success(t("invoices.deleted", "Invoice deleted"));
    } catch (err) {
      if (snapshot) {
        setInvoices((prev) => restoreRowsAtOriginalIndex(prev, [{ row: snapshot, idx: originalIndex }]));
        setTotal((prev) => prev + 1);
      }
      toast.error(translateApiErrorMessage(err, t, t("common.error", "Delete failed") as string));
    }
  };

  // Bulk
  const allSelected = useMemo(
    () => companyScopedInvoices.length > 0 && companyScopedInvoices.every((i) => selectedIds.has(i.id)),
    [companyScopedInvoices, selectedIds],
  );
  const someSelected = selectedIds.size > 0 && !allSelected;

  const handleToggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(companyScopedInvoices.map((i) => i.id)) : new Set());

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
    const indexById = new Map(invoices.map((i, idx) => [i.id, idx] as const));
    const snapshot = invoices.filter((i) => selectedIds.has(i.id));
    setInvoices((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setTotal((prev) => Math.max(0, prev - ids.length));

    const { failed, failedIds } = await runBulkDelete({
      ids,
      items: snapshot,
      getId: (i) => i.id,
      deleteOne: (id) => supplierInvoiceService.delete(id),
      concurrency: 5,
      onFailures: (failedIds) => {
        const restore = snapshot
          .filter((i) => failedIds.includes(i.id))
          .map((i) => ({ row: i, idx: indexById.get(i.id) ?? 0 }));
        setInvoices((prev) => restoreRowsAtOriginalIndex(prev, restore));
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

  const fmt = (n: number) => n.toLocaleString(i18n.language || undefined, { minimumFractionDigits: 2 });

  // Stat cards
  const statCards: Array<{
    key: string;
    label: string;
    value: string | number;
    icon: typeof FileText;
    color: string;
    bg: string;
    readonly?: boolean;
  }> = [
    {
      key: "all",
      label: t("invoices.stats.total", "Total Invoices") || "Total Invoices",
      value: formatStatValue(total),
      icon: FileText,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      key: "unpaid",
      label: t("invoices.stats.unpaid", "Unpaid") || "Unpaid",
      value: formatStatValue(stats.unpaid),
      icon: Clock,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      key: "overdue",
      label: t("invoices.stats.overdue", "Overdue") || "Overdue",
      value: formatStatValue(stats.overdue),
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      key: "value",
      label: t("invoices.stats.value", "Total Value") || "Total Value",
      value: `${fmt(stats.totalValue)} ${currency.code}`,
      icon: DollarSign,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      readonly: true,
    },
  ];

  // Export
  const exportConfig: ExportConfig = {
    filename: "supplier-invoices-export",
    allDataTransform: (inv: SupplierInvoice) => ({
      "Invoice Number": inv.invoiceNumber,
      "Supplier Ref": inv.supplierInvoiceRef || "",
      Supplier: inv.supplierName,
      "PO Ref": inv.purchaseOrderNumber || "",
      Date: inv.invoiceDate,
      "Due Date": inv.dueDate,
      Status: inv.status,
      "RS Applicable": inv.rsApplicable ? "Yes" : "No",
      "RS Type": inv.rsTypeCode || "",
      "RS Amount": inv.rsAmount,
      Currency: inv.currency,
      Subtotal: inv.subTotal,
      Tax: inv.taxAmount,
      "Grand Total": inv.grandTotal,
      "Amount Paid": inv.amountPaid,
      Notes: inv.notes || "",
    }),
    availableColumns: [
      { key: "invoiceNumber", label: "Invoice Number", category: "Basic" },
      { key: "supplierName", label: "Supplier", category: "Basic" },
      { key: "purchaseOrderNumber", label: "PO Ref", category: "Basic" },
      { key: "invoiceDate", label: "Date", category: "Basic" },
      { key: "dueDate", label: "Due Date", category: "Basic" },
      { key: "status", label: "Status", category: "Basic" },
      { key: "grandTotal", label: "Grand Total", category: "Financial" },
      { key: "amountPaid", label: "Amount Paid", category: "Financial" },
      { key: "rsApplicable", label: "RS Applicable", category: "Compliance" },
      { key: "rsAmount", label: "RS Amount", category: "Compliance" },
      { key: "notes", label: "Notes", category: "Details" },
    ],
  };

  const viewAll = isViewAllMode();
  const hasActiveFilter = statusFilter !== "all" || rsFilter !== "all" || selectedStat !== "all";

  return (
    <div ref={containerRef} className="flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
              {t("invoices.title", "Supplier Invoices")}
            </h1>
            <p className="text-px-11 text-muted-foreground">
              {t("invoices.subtitle", "{{count}} invoices", { count: total })}
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
          <CreateActionButton size="sm" onClick={() => navigate("/dashboard/purchases/invoices/add")}>
            <Plus className="h-4 w-4 me-1" />
            <span className="hidden sm:inline">{t("invoices.newInvoice", "New Invoice")}</span>
          </CreateActionButton>
        </div>
      </div>

      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />

      {/* KPI cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
                      <div className="text-px-11 text-muted-foreground truncate">{s.label}</div>
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
              placeholder={t("invoices.searchPlaceholder", "Search invoices...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-8 h-9"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant={showFilters || hasActiveFilter ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5 sm:me-1.5" />
              <span className="hidden sm:inline">{t("filters.title", "Filters")}</span>
              {hasActiveFilter && (
                <Badge variant="secondary" className="ms-1.5 h-4 px-1 text-px-10">•</Badge>
              )}
            </Button>
            {viewAll && <CompanyFilter value={companyId} onChange={setCompanyId} />}
            <div className="hidden md:flex items-center border border-border rounded-md p-0.5">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode("table")} data-non-list-view="true"
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
                <SelectItem value="draft">{t("invoiceStatus.draft")}</SelectItem>
                <SelectItem value="validated">{t("invoiceStatus.validated")}</SelectItem>
                <SelectItem value="partially_paid">{t("invoiceStatus.partially_paid")}</SelectItem>
                <SelectItem value="paid">{t("invoiceStatus.paid")}</SelectItem>
                <SelectItem value="cancelled">{t("invoiceStatus.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={rsFilter} onValueChange={setRsFilter}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder={t("fields.rs", "RS")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allRs", "All RS")}</SelectItem>
                <SelectItem value="applicable">{t("filters.rsApplicable", "RS Applicable")}</SelectItem>
                <SelectItem value="none">{t("filters.rsNone", "No RS")}</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setStatusFilter("all");
                  setRsFilter("all");
                  setSelectedStat("all");
                }}
              >
                <X className="h-3.5 w-3.5 me-1" />
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

        {loading && <ListTableSkeleton columns={10} rows={6} />}

        {!loading && error && (
          <PurchaseErrorFallback error={error} onRetry={() => fetchInvoices(1)} backTo="/dashboard/purchases" />
        )}

        {!loading && !error && (
          <div className="animate-in fade-in duration-300">
            {viewMode === "table" ? (
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <Table className="min-w-[750px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={(c) => handleToggleAll(!!c)}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="text-xs">{t("fields.invoiceNumber", "Invoice #")}</TableHead>
                        <TableHead className="text-xs">{t("fields.supplier", "Supplier")}</TableHead>
                        <TableHead className="text-xs">{t("fields.poRef", "PO Ref")}</TableHead>
                        <TableHead className="text-xs">{t("fields.date", "Date")}</TableHead>
                        <TableHead className="text-xs">{t("fields.dueDate", "Due Date")}</TableHead>
                        <TableHead className="text-xs">{t("fields.status", "Status")}</TableHead>
                        <TableHead className="text-xs">{t("fields.rs", "RS")}</TableHead>
                        <TableHead className="text-xs text-end">{t("fields.total", "Total")}</TableHead>
                        <TableHead className="text-xs w-32 text-end">{t("fields.actions", "Actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyScopedInvoices.map((inv) => {
                        const isSelected = selectedIds.has(inv.id);
                        return (
                          <TableRow
                            key={inv.id}
                            data-state={isSelected ? "selected" : undefined}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigate(`/dashboard/purchases/invoices/${inv.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(c) => handleToggleOne(inv.id, !!c)}
                                aria-label={`Select ${inv.invoiceNumber}`}
                              />
                            </TableCell>
                            <TableCell className="text-xs font-medium text-primary">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-6 w-6 shrink-0">
                                  <AvatarFallback className="text-px-10 bg-muted">
                                    {initials(inv.supplierName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">{inv.supplierName}</span>
                                  <CompanyBadge tenantId={(inv as any).tenantId} className="text-px-9 mt-0.5" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{inv.purchaseOrderNumber || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatPurchaseDate(inv.invoiceDate)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatPurchaseDate(inv.dueDate)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-px-10 ${STATUS_COLORS[inv.status] || ""}`}>
                                {t(`invoiceStatus.${inv.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {inv.rsApplicable ? (
                                <Badge variant="outline" className="text-px-10">
                                  {rsRateForCode(inv.rsTypeCode) ?? inv.rsTypeCode}%
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-end font-medium">{fmt(inv.grandTotal)}</TableCell>
                            <TableCell className="text-end">
                              <TableRowActions
                                actions={[
                                  {
                                    icon: Eye,
                                    label: t("actions.view", "View"),
                                    onClick: () => navigate(`/dashboard/purchases/invoices/${inv.id}`),
                                  },
                                  {
                                    icon: Trash2,
                                    label: t("actions.delete", "Delete"),
                                    onClick: () => setDeleteId(inv.id),
                                    variant: "destructive",
                                  },
                                ]}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {companyScopedInvoices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <FileText className="h-8 w-8 opacity-40" />
                              <span className="text-sm">{t("invoices.empty", "No invoices found")}</span>
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
                {companyScopedInvoices.map((inv) => {
                  const isSelected = selectedIds.has(inv.id);
                  return (
                    <Card
                      key={inv.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-all",
                        isSelected && "border-primary bg-primary/5",
                      )}
                      onClick={() => navigate(`/dashboard/purchases/invoices/${inv.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(c) => handleToggleOne(inv.id, !!c)}
                            />
                          </div>
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-muted text-xs">
                              {initials(inv.supplierName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-primary">{inv.invoiceNumber}</span>
                              <Badge variant="secondary" className={`text-px-10 ${STATUS_COLORS[inv.status] || ""}`}>
                                {t(`invoiceStatus.${inv.status}`)}
                              </Badge>
                              <CompanyBadge tenantId={(inv as any).tenantId} className="text-px-9" />
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {inv.supplierName} · {t("fields.dueDate", "Due")}: {formatPurchaseDate(inv.dueDate)}
                            </div>
                          </div>
                          <div className="text-end shrink-0">
                            <div className="text-sm font-semibold">{fmt(inv.grandTotal)} {currency.code}</div>
                            {inv.rsApplicable && (
                              <Badge variant="outline" className="text-px-10 mt-0.5">
                                RS {rsRateForCode(inv.rsTypeCode) ?? inv.rsTypeCode}%
                              </Badge>
                            )}
                          </div>
                          <TableRowActions
                            actions={[
                              {
                                icon: Eye,
                                label: t("actions.view", "View"),
                                onClick: () => navigate(`/dashboard/purchases/invoices/${inv.id}`),
                              },
                              {
                                icon: Trash2,
                                label: t("actions.delete", "Delete"),
                                onClick: () => setDeleteId(inv.id),
                                variant: "destructive",
                              },
                            ]}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {companyScopedInvoices.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 opacity-40 mx-auto mb-2" />
                      <span className="text-sm">{t("invoices.empty", "No invoices found")}</span>
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
            <AlertDialogTitle>{t("confirm.deleteInvoiceTitle", "Delete Invoice")}</AlertDialogTitle>
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
            <AlertDialogTitle>{t("bulk.deleteTitle", "Delete selected invoices?")}</AlertDialogTitle>
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
                  <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" /> {t("bulk.deleting", "Deleting...")}
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
        data={companyScopedInvoices}
        moduleName="supplier-invoices"
        moduleNameTranslated={t("invoices.title", "Supplier Invoices")}
        exportConfig={exportConfig}
      />
    </div>
  );
}

export default function SupplierInvoiceListPage() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases">
      <SupplierInvoiceListContent />
    </PurchaseErrorBoundary>
  );
}
