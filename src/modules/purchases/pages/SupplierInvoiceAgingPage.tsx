import { useCurrency } from '@/shared/hooks/useCurrency';
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { supplierInvoiceService } from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ChartSkeleton } from "../components/PurchaseSkeletons";
import type { SupplierInvoice } from "../types";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { useTableSort } from "@/hooks/useTableSort";

/**
 * Supplier Invoice Aging Report — buckets unpaid balance into:
 *   not-due | 1-30 | 31-60 | 61-90 | >90 days overdue
 * Computed entirely from existing /api/supplier-invoices data.
 *
 * "Outstanding" per invoice = grandTotal - amountPaid, only counted when
 * paymentStatus !== 'paid' and invoice is not draft/cancelled.
 */
type Bucket = 'notDue' | 'b30' | 'b60' | 'b90' | 'b90plus';

const BUCKET_LABELS: Record<Bucket, string> = {
  notDue: 'Not due',
  b30: '1-30 days',
  b60: '31-60 days',
  b90: '61-90 days',
  b90plus: '> 90 days',
};

function bucketOf(daysOverdue: number): Bucket {
  if (daysOverdue <= 0) return 'notDue';
  if (daysOverdue <= 30) return 'b30';
  if (daysOverdue <= 60) return 'b60';
  if (daysOverdue <= 90) return 'b90';
  return 'b90plus';
}

function InvoiceAgingContent() {
  const { t } = useTranslation('purchases');
  const { current: currency } = useCurrency();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supplierSort = useTableSort<{ name: string; total: number; buckets: Record<Bucket, number> }>({
    supplier: (r) => r.name,
    notDue: (r) => r.buckets.notDue,
    b30: (r) => r.buckets.b30,
    b60: (r) => r.buckets.b60,
    b90: (r) => r.buckets.b90,
    b90plus: (r) => r.buckets.b90plus,
    total: (r) => r.total,
  });

  const invoiceSort = useTableSort<{ inv: SupplierInvoice; outstanding: number; daysOverdue: number; bucket: Bucket }>({
    invoiceNumber: (r) => r.inv.invoiceNumber,
    supplier: (r) => r.inv.supplierName,
    dueDate: (r) => r.inv.dueDate,
    daysOverdue: (r) => r.daysOverdue,
    bucket: (r) => r.bucket,
    outstanding: (r) => r.outstanding,
  });

  const load = () => {
    setError(null);
    setLoading(true);
    supplierInvoiceService.getAll({ limit: 500 })
      .then(res => setInvoices(res.invoices || []))
      .catch((e: any) => setError(e?.message || 'Failed to load invoices'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const { perInvoice, perBucket, perSupplier, totalOutstanding } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const perInvoice: Array<{ inv: SupplierInvoice; outstanding: number; daysOverdue: number; bucket: Bucket }> = [];
    const perBucket: Record<Bucket, number> = { notDue: 0, b30: 0, b60: 0, b90: 0, b90plus: 0 };
    const perSupplier = new Map<string, { name: string; total: number; buckets: Record<Bucket, number> }>();
    let totalOutstanding = 0;

    for (const inv of invoices) {
      if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'draft') continue;
      const outstanding = Math.max(0, (Number(inv.grandTotal) || 0) - (Number(inv.amountPaid) || 0));
      if (outstanding <= 0.01) continue;
      const due = inv.dueDate ? new Date(inv.dueDate) : null;
      let daysOverdue = 0;
      if (due && !Number.isNaN(due.getTime())) {
        due.setHours(0, 0, 0, 0);
        daysOverdue = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      }
      const b = bucketOf(daysOverdue);
      perBucket[b] += outstanding;
      totalOutstanding += outstanding;
      perInvoice.push({ inv, outstanding, daysOverdue, bucket: b });

      const key = String(inv.supplierId);
      const row = perSupplier.get(key) || { name: inv.supplierName || '—', total: 0, buckets: { notDue: 0, b30: 0, b60: 0, b90: 0, b90plus: 0 } };
      row.total += outstanding;
      row.buckets[b] += outstanding;
      perSupplier.set(key, row);
    }
    perInvoice.sort((a, b) => b.daysOverdue - a.daysOverdue);
    return { perInvoice, perBucket, perSupplier: Array.from(perSupplier.values()).sort((a, b) => b.total - a.total), totalOutstanding };
  }, [invoices]);

  const sortedPerSupplier = useMemo(() => supplierSort.sortItems(perSupplier), [perSupplier, supplierSort.sortItems]);
  const sortedPerInvoice = useMemo(() => invoiceSort.sortItems(perInvoice), [perInvoice, invoiceSort.sortItems]);

  if (loading) return <><PurchasePageHeader title={t('reports.aging.title', 'Supplier Invoice Aging')} icon={Clock} backTo={{ to: '/dashboard/purchases/reports', label: t('reports.title') }} /><ChartSkeleton /></>;
  if (error) return <><PurchasePageHeader title={t('reports.aging.title', 'Supplier Invoice Aging')} icon={Clock} backTo={{ to: '/dashboard/purchases/reports', label: t('reports.title') }} /><PurchaseErrorFallback error={error} onRetry={load} backTo="/dashboard/purchases" /></>;

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bucketBadgeVariant = (b: Bucket): 'default' | 'secondary' | 'destructive' => {
    if (b === 'notDue') return 'secondary';
    if (b === 'b30') return 'default';
    return 'destructive';
  };

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('reports.aging.title', 'Supplier Invoice Aging')}
        subtitle={t('reports.aging.subtitle', 'Outstanding amounts grouped by overdue age')}
        icon={Clock}
        backTo={{ to: '/dashboard/purchases/reports', label: t('reports.title') }}
      />
      <div className="p-4 md:p-6 space-y-4">
        {/* Bucket summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(Object.keys(BUCKET_LABELS) as Bucket[]).map(b => (
            <Card key={b}>
              <CardContent className="p-3">
                <div className="text-px-10 uppercase tracking-wider text-muted-foreground">{t(`reports.aging.bucket.${b}`, BUCKET_LABELS[b])}</div>
                <div className={b === 'b90plus' ? 'text-base font-semibold mt-1 text-destructive' : 'text-base font-semibold mt-1'}>
                  {fmt(perBucket[b])} {currency.code}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{t('reports.aging.total', 'Total outstanding')}</CardTitle>
            <span className="text-sm font-semibold">{fmt(totalOutstanding)} {currency.code}</span>
          </CardHeader>
        </Card>

        {/* Per supplier */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('reports.aging.bySupplier', 'By supplier')}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader columnKey="supplier" sortKey={supplierSort.sortKey} sortDirection={supplierSort.sortDirection} onSort={supplierSort.toggleSort} className="text-xs">{t('reports.aging.supplier', 'Supplier')}</SortableHeader>
                  {(Object.keys(BUCKET_LABELS) as Bucket[]).map(b => (
                    <SortableHeader key={b} columnKey={b} sortKey={supplierSort.sortKey} sortDirection={supplierSort.sortDirection} onSort={supplierSort.toggleSort} align="right" className="text-xs">{t(`reports.aging.bucket.${b}`, BUCKET_LABELS[b])}</SortableHeader>
                  ))}
                  <SortableHeader columnKey="total" sortKey={supplierSort.sortKey} sortDirection={supplierSort.sortDirection} onSort={supplierSort.toggleSort} align="right" className="text-xs">{t('reports.aging.total', 'Total')}</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPerSupplier.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">{t('reports.noData', 'No outstanding invoices')}</TableCell></TableRow>
                ) : (
                  sortedPerSupplier.map(r => (
                    <TableRow key={r.name}>
                      <TableCell className="text-xs font-medium">{r.name}</TableCell>
                      {(Object.keys(BUCKET_LABELS) as Bucket[]).map(b => (
                        <TableCell key={b} className="text-xs text-end">{r.buckets[b] > 0 ? fmt(r.buckets[b]) : '—'}</TableCell>
                      ))}
                      <TableCell className="text-xs text-end font-semibold">{fmt(r.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Per invoice */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('reports.aging.byInvoice', 'Per invoice')}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader columnKey="invoiceNumber" sortKey={invoiceSort.sortKey} sortDirection={invoiceSort.sortDirection} onSort={invoiceSort.toggleSort} className="text-xs">{t('reports.aging.invoice', 'Invoice')}</SortableHeader>
                  <SortableHeader columnKey="supplier" sortKey={invoiceSort.sortKey} sortDirection={invoiceSort.sortDirection} onSort={invoiceSort.toggleSort} className="text-xs">{t('reports.aging.supplier', 'Supplier')}</SortableHeader>
                  <SortableHeader columnKey="dueDate" sortKey={invoiceSort.sortKey} sortDirection={invoiceSort.sortDirection} onSort={invoiceSort.toggleSort} className="text-xs">{t('reports.aging.dueDate', 'Due date')}</SortableHeader>
                  <SortableHeader columnKey="daysOverdue" sortKey={invoiceSort.sortKey} sortDirection={invoiceSort.sortDirection} onSort={invoiceSort.toggleSort} align="center" className="text-xs">{t('reports.aging.daysOverdue', 'Days overdue')}</SortableHeader>
                  <SortableHeader columnKey="bucket" sortKey={invoiceSort.sortKey} sortDirection={invoiceSort.sortDirection} onSort={invoiceSort.toggleSort} align="center" className="text-xs">{t('reports.aging.bucketLabel', 'Bucket')}</SortableHeader>
                  <SortableHeader columnKey="outstanding" sortKey={invoiceSort.sortKey} sortDirection={invoiceSort.sortDirection} onSort={invoiceSort.toggleSort} align="right" className="text-xs">{t('reports.aging.outstanding', 'Outstanding')}</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPerInvoice.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">{t('reports.noData', 'No outstanding invoices')}</TableCell></TableRow>
                ) : (
                  sortedPerInvoice.map(({ inv, outstanding, daysOverdue, bucket }) => (
                    <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/purchases/invoices/${inv.id}`)}>
                      <TableCell className="text-xs font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs">{inv.supplierName}</TableCell>
                      <TableCell className="text-xs">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString(undefined) : '—'}</TableCell>
                      <TableCell className="text-xs text-center">{daysOverdue > 0 ? daysOverdue : '—'}</TableCell>
                      <TableCell className="text-xs text-center">
                        <Badge variant={bucketBadgeVariant(bucket)} className="text-px-10">
                          {t(`reports.aging.bucket.${bucket}`, BUCKET_LABELS[bucket])}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-end font-medium">{fmt(outstanding)} {currency.code}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SupplierInvoiceAgingPage() {
  return (
    <PurchaseErrorBoundary>
      <InvoiceAgingContent />
    </PurchaseErrorBoundary>
  );
}
