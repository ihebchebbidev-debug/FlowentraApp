import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import {
  TrendingUp, Download, Search, Award, Clock, Wallet, Truck, FileCheck, AlertTriangle,
  ExternalLink, Package, Receipt,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line,
} from "recharts";
import { purchaseOrderService, supplierInvoiceService } from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ChartSkeleton } from "../components/PurchaseSkeletons";
import type { PurchaseOrder, SupplierInvoice } from "../types";
import { useCurrency } from '@/shared/hooks/useCurrency';

/**
 * Supplier Performance Scorecard
 * --------------------------------------------------------------------
 * Aggregates supplier KPIs entirely on the client from existing endpoints
 * (purchaseOrderService.getAll + supplierInvoiceService.getAll). No new
 * backend route needed.
 *
 * Per-supplier metrics:
 *  - PO count + total spend (excludes cancelled)
 *  - On-time delivery % (received POs delivered on/before expectedDelivery)
 *  - Avg lead time in days (actualDelivery - orderDate)
 *  - Invoice count, paid count, overdue count
 *  - Composite score (0–100) blending on-time, paid % and lead-time penalty
 *  - Letter grade (A / B / C / D)
 */

function diffDays(a: string | undefined, b: string | undefined): number | null {
  if (!a || !b) return null;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.round((da - db) / (1000 * 60 * 60 * 24));
}

type Row = {
  supplierId: string;
  supplierName: string;
  poCount: number;
  totalSpend: number;
  receivedCount: number;
  onTimeCount: number;
  leadTimeSum: number;
  leadTimeSamples: number;
  invoiceCount: number;
  invoicePaidCount: number;
  invoiceOverdueCount: number;
};

type SortKey = 'spend' | 'score' | 'onTime' | 'lead' | 'po' | 'name';

function gradeFor(score: number): { letter: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (score >= 85) return { letter: 'A', variant: 'default' };
  if (score >= 70) return { letter: 'B', variant: 'secondary' };
  if (score >= 50) return { letter: 'C', variant: 'outline' };
  return { letter: 'D', variant: 'destructive' };
}

function SupplierPerformanceContent() {
  const { t } = useTranslation('purchases');
  const { current: currency } = useCurrency();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trendMonths, setTrendMonths] = useState<3 | 6 | 12>(6);
  const [trendSupplierId, setTrendSupplierId] = useState<string>('__all__');

  const load = () => {
    setError(null);
    setLoading(true);
    Promise.all([
      purchaseOrderService.getAll({ limit: 500 }),
      supplierInvoiceService.getAll({ limit: 500 }),
    ])
      .then(([po, inv]) => {
        setOrders(po.orders || []);
        setInvoices(inv.invoices || []);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    const today = Date.now();

    for (const po of orders) {
      if (po.status === 'cancelled') continue;
      const key = String(po.supplierId);
      const r = map.get(key) || {
        supplierId: key,
        supplierName: po.supplierName || '—',
        poCount: 0, totalSpend: 0,
        receivedCount: 0, onTimeCount: 0,
        leadTimeSum: 0, leadTimeSamples: 0,
        invoiceCount: 0, invoicePaidCount: 0, invoiceOverdueCount: 0,
      };
      r.poCount += 1;
      r.totalSpend += Number(po.grandTotal) || 0;
      if (po.status === 'received' || po.status === 'closed') {
        r.receivedCount += 1;
        const lead = diffDays(po.actualDelivery, po.orderDate);
        if (lead !== null && lead >= 0) {
          r.leadTimeSum += lead;
          r.leadTimeSamples += 1;
        }
        const slip = diffDays(po.actualDelivery, po.expectedDelivery);
        if (slip !== null && slip <= 0) r.onTimeCount += 1;
      }
      map.set(key, r);
    }

    for (const inv of invoices) {
      if (inv.status === 'cancelled') continue;
      const key = String(inv.supplierId);
      const r = map.get(key);
      if (!r) continue;
      r.invoiceCount += 1;
      if (inv.status === 'paid') r.invoicePaidCount += 1;
      if (inv.status !== 'paid' && inv.dueDate) {
        const due = new Date(inv.dueDate).getTime();
        if (!Number.isNaN(due) && due < today) r.invoiceOverdueCount += 1;
      }
    }

    return Array.from(map.values());
  }, [orders, invoices]);

  // Compute per-row derived KPIs once (used for sort, table, charts, exports)
  const enriched = useMemo(() => {
    return rows.map(r => {
      const onTimePct = r.receivedCount > 0 ? (r.onTimeCount / r.receivedCount) * 100 : null;
      const avgLead = r.leadTimeSamples > 0 ? r.leadTimeSum / r.leadTimeSamples : null;
      const paidPct = r.invoiceCount > 0 ? (r.invoicePaidCount / r.invoiceCount) * 100 : null;
      // Composite score: 60% on-time, 30% paid, 10% lead-time penalty (>30d = 0)
      const onTimeScore = onTimePct ?? 50;
      const paidScore = paidPct ?? 50;
      const leadScore = avgLead === null ? 50 : Math.max(0, 100 - (avgLead * 100 / 30));
      const score = Math.round(onTimeScore * 0.6 + paidScore * 0.3 + leadScore * 0.1);
      return { ...r, onTimePct, avgLead, paidPct, score };
    });
  }, [rows]);

  // Top-level summary KPIs
  const summary = useMemo(() => {
    const total = enriched.length;
    const totalSpend = enriched.reduce((s, r) => s + r.totalSpend, 0);
    const overdueSuppliers = enriched.filter(r => r.invoiceOverdueCount > 0).length;
    const avgScore = total > 0 ? Math.round(enriched.reduce((s, r) => s + r.score, 0) / total) : 0;
    const top = [...enriched].sort((a, b) => b.score - a.score)[0];
    return { total, totalSpend, overdueSuppliers, avgScore, top };
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q ? enriched.filter(r => r.supplierName.toLowerCase().includes(q)) : enriched;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'name': return a.supplierName.localeCompare(b.supplierName);
        case 'po': return b.poCount - a.poCount;
        case 'onTime': return (b.onTimePct ?? -1) - (a.onTimePct ?? -1);
        case 'lead': return (a.avgLead ?? Infinity) - (b.avgLead ?? Infinity);
        case 'score': return b.score - a.score;
        case 'spend':
        default: return b.totalSpend - a.totalSpend;
      }
    });
    return list;
  }, [enriched, search, sortKey]);

  const topSpend = useMemo(() => {
    return [...enriched].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 8).map(r => ({
      name: r.supplierName.length > 14 ? r.supplierName.slice(0, 14) + '…' : r.supplierName,
      spend: Math.round(r.totalSpend),
      score: r.score,
    }));
  }, [enriched]);

  // Build month-by-month trend for the selected supplier (or all suppliers).
  // Score per bucket uses the same composite formula as the scorecard, but
  // applied to that month's slice of POs+invoices only.
  const trendData = useMemo(() => {
    const now = new Date();
    const buckets: Array<{ key: string; label: string; year: number; month: number }> = [];
    for (let i = trendMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }

    const matchSupplier = (id: any) => trendSupplierId === '__all__' || String(id) === trendSupplierId;
    const monthKey = (iso?: string) => {
      if (!iso) return null;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    type Agg = { spend: number; received: number; onTime: number; leadSum: number; leadN: number; invCount: number; invPaid: number };
    const agg = new Map<string, Agg>();
    for (const b of buckets) agg.set(b.key, { spend: 0, received: 0, onTime: 0, leadSum: 0, leadN: 0, invCount: 0, invPaid: 0 });

    for (const po of orders) {
      if (po.status === 'cancelled' || !matchSupplier(po.supplierId)) continue;
      const k = monthKey(po.orderDate);
      if (!k) continue;
      const a = agg.get(k);
      if (!a) continue;
      a.spend += Number(po.grandTotal) || 0;
      if (po.status === 'received' || po.status === 'closed') {
        a.received += 1;
        const lead = diffDays(po.actualDelivery, po.orderDate);
        if (lead !== null && lead >= 0) { a.leadSum += lead; a.leadN += 1; }
        const slip = diffDays(po.actualDelivery, po.expectedDelivery);
        if (slip !== null && slip <= 0) a.onTime += 1;
      }
    }

    for (const inv of invoices) {
      if (inv.status === 'cancelled' || !matchSupplier(inv.supplierId)) continue;
      const k = monthKey(inv.invoiceDate);
      if (!k) continue;
      const a = agg.get(k);
      if (!a) continue;
      a.invCount += 1;
      if (inv.status === 'paid') a.invPaid += 1;
    }

    return buckets.map(b => {
      const a = agg.get(b.key)!;
      const onTimePct = a.received > 0 ? (a.onTime / a.received) * 100 : null;
      const paidPct = a.invCount > 0 ? (a.invPaid / a.invCount) * 100 : null;
      const avgLead = a.leadN > 0 ? a.leadSum / a.leadN : null;
      const onTimeScore = onTimePct ?? 50;
      const paidScore = paidPct ?? 50;
      const leadScore = avgLead === null ? 50 : Math.max(0, 100 - (avgLead * 100 / 30));
      const hasActivity = a.received > 0 || a.invCount > 0 || a.spend > 0;
      const score = hasActivity ? Math.round(onTimeScore * 0.6 + paidScore * 0.3 + leadScore * 0.1) : null;
      return {
        month: b.label,
        score,
        onTime: onTimePct === null ? null : Math.round(onTimePct),
        spend: Math.round(a.spend),
      };
    });
  }, [orders, invoices, trendMonths, trendSupplierId]);


  const exportCsv = () => {
    const header = ['Supplier', 'POs', 'Spend', 'OnTime%', 'AvgLeadDays', 'Invoices', 'Paid%', 'Overdue', 'Score', 'Grade'];
    const lines = [header.join(',')];
    for (const r of filtered) {
      lines.push([
        `"${r.supplierName.replace(/"/g, '""')}"`,
        r.poCount,
        r.totalSpend.toFixed(2),
        r.onTimePct === null ? '' : r.onTimePct.toFixed(1),
        r.avgLead === null ? '' : r.avgLead.toFixed(1),
        r.invoiceCount,
        r.paidPct === null ? '' : r.paidPct.toFixed(1),
        r.invoiceOverdueCount,
        r.score,
        gradeFor(r.score).letter,
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <><PurchasePageHeader title={t('reports.supplierPerformance.title', 'Supplier Performance')} subtitle={t('reports.supplierPerformance.subtitle', 'On-time delivery, lead time and spend per supplier')} icon={TrendingUp} backTo={{ to: '/dashboard/purchases/reports', label: t('reports.title') }} /><ChartSkeleton /></>;
  if (error) return <><PurchasePageHeader title={t('reports.supplierPerformance.title', 'Supplier Performance')} icon={TrendingUp} backTo={{ to: '/dashboard/purchases/reports', label: t('reports.title') }} /><PurchaseErrorFallback error={error} onRetry={load} backTo="/dashboard/purchases" /></>;

  const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCompact = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0);
  const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: 12 };

  const kpis = [
    { icon: Award, label: t('reports.supplierPerformance.totalSuppliers', 'Active suppliers'), value: String(summary.total), tone: 'text-primary bg-primary/10' },
    { icon: Wallet, label: t('reports.supplierPerformance.totalSpend', 'Total spend'), value: `${fmt(summary.totalSpend)} ${currency.code}`, tone: 'text-emerald-600 bg-emerald-500/10' },
    { icon: TrendingUp, label: t('reports.supplierPerformance.avgScore', 'Avg score'), value: `${summary.avgScore}/100`, tone: 'text-blue-600 bg-blue-500/10' },
    { icon: AlertTriangle, label: t('reports.supplierPerformance.overdueSuppliers', 'With overdue inv.'), value: String(summary.overdueSuppliers), tone: 'text-destructive bg-destructive/10' },
  ];

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('reports.supplierPerformance.title', 'Supplier Performance')}
        subtitle={t('reports.supplierPerformance.subtitle', 'On-time delivery, lead time and spend per supplier')}
        icon={TrendingUp}
        backTo={{ to: '/dashboard/purchases/reports', label: t('reports.title') }}
        actions={
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> CSV
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map(k => (
            <Card key={k.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{k.label}</div>
                  <div className="text-sm font-semibold truncate">{k.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top performer + spend chart */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-primary" />{t('reports.supplierPerformance.topPerformer', 'Top performer')}</CardTitle></CardHeader>
            <CardContent>
              {summary.top ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold truncate">{summary.top.supplierName}</div>
                    <Badge variant={gradeFor(summary.top.score).variant} className="text-[10px]">
                      {gradeFor(summary.top.score).letter} · {summary.top.score}
                    </Badge>
                  </div>
                  <Progress value={summary.top.score} className="h-1.5" />
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                    <div>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><Truck className="h-3 w-3" />{t('reports.supplierPerformance.onTime', 'On-time')}</div>
                      <div className="text-xs font-semibold">{summary.top.onTimePct === null ? '—' : `${Math.round(summary.top.onTimePct)}%`}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><Clock className="h-3 w-3" />{t('reports.supplierPerformance.avgLead', 'Lead')}</div>
                      <div className="text-xs font-semibold">{summary.top.avgLead === null ? '—' : `${Math.round(summary.top.avgLead)}d`}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><FileCheck className="h-3 w-3" />{t('reports.supplierPerformance.paidPct', 'Paid')}</div>
                      <div className="text-xs font-semibold">{summary.top.paidPct === null ? '—' : `${Math.round(summary.top.paidPct)}%`}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">{t('reports.noData', 'No data available')}</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('reports.supplierPerformance.topSpendChart', 'Top suppliers by spend')}</CardTitle></CardHeader>
            <CardContent>
              {topSpend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topSpend} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={fmtCompact} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${fmt(Number(v))} ${currency.code}`} />
                    <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                      {topSpend.map((row, i) => (
                        <Cell key={i} fill={row.score >= 85 ? 'hsl(142 71% 45%)' : row.score >= 70 ? 'hsl(217 91% 60%)' : row.score >= 50 ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">{t('reports.noData', 'No data available')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('reports.supplierPerformance.searchPlaceholder', 'Search supplier…')}
              className="pl-8 h-9"
            />
          </div>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spend">{t('reports.supplierPerformance.sortSpend', 'Sort: Total spend')}</SelectItem>
              <SelectItem value="score">{t('reports.supplierPerformance.sortScore', 'Sort: Score')}</SelectItem>
              <SelectItem value="onTime">{t('reports.supplierPerformance.sortOnTime', 'Sort: On-time %')}</SelectItem>
              <SelectItem value="lead">{t('reports.supplierPerformance.sortLead', 'Sort: Lead time')}</SelectItem>
              <SelectItem value="po">{t('reports.supplierPerformance.sortPo', 'Sort: PO count')}</SelectItem>
              <SelectItem value="name">{t('reports.supplierPerformance.sortName', 'Sort: Name')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Performance trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-sm">{t('reports.supplierPerformance.trendTitle', 'Performance trend')}</CardTitle>
              <div className="flex gap-2">
                <Select value={trendSupplierId} onValueChange={setTrendSupplierId}>
                  <SelectTrigger className="h-8 text-xs w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t('reports.supplierPerformance.allSuppliers', 'All suppliers')}</SelectItem>
                    {enriched.map(r => (
                      <SelectItem key={r.supplierId} value={r.supplierId}>{r.supplierName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="inline-flex rounded-md border bg-card overflow-hidden">
                  {([3, 6, 12] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTrendMonths(m)}
                      className={`px-2.5 h-8 text-xs font-medium transition-colors ${trendMonths === m ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      {m}{t('reports.supplierPerformance.monthsShort', 'M')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t('reports.supplierPerformance.score', 'Score')}</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => v === null ? '—' : `${v}/100`} />
                    <Line type="monotone" dataKey="score" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t('reports.supplierPerformance.onTime', 'On-time %')}</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => v === null ? '—' : `${v}%`} />
                    <Line type="monotone" dataKey="onTime" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t('reports.supplierPerformance.spend', 'Spend')} ({currency.code})</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={fmtCompact} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${fmt(Number(v))} ${currency.code}`} />
                    <Line type="monotone" dataKey="spend" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scorecard table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('reports.supplierPerformance.scorecardTitle', 'Supplier scorecard')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('reports.supplierPerformance.supplier', 'Supplier')}</TableHead>
                  <TableHead className="text-xs text-center">{t('reports.supplierPerformance.grade', 'Grade')}</TableHead>
                  <TableHead className="text-xs min-w-[140px]">{t('reports.supplierPerformance.score', 'Score')}</TableHead>
                  <TableHead className="text-xs text-center">{t('reports.supplierPerformance.poCount', 'POs')}</TableHead>
                  <TableHead className="text-xs text-right">{t('reports.supplierPerformance.spend', 'Total spend')}</TableHead>
                  <TableHead className="text-xs text-center">{t('reports.supplierPerformance.onTime', 'On-time %')}</TableHead>
                  <TableHead className="text-xs text-center">{t('reports.supplierPerformance.avgLead', 'Avg lead (d)')}</TableHead>
                  <TableHead className="text-xs text-center">{t('reports.supplierPerformance.invoices', 'Invoices')}</TableHead>
                  <TableHead className="text-xs text-center">{t('reports.supplierPerformance.paidPct', 'Paid %')}</TableHead>
                  <TableHead className="text-xs text-center">{t('reports.supplierPerformance.overdue', 'Overdue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">{t('reports.noData', 'No data available')}</TableCell></TableRow>
                ) : (
                  filtered.map(r => {
                    const grade = gradeFor(r.score);
                    return (
                      <TableRow key={r.supplierId} onClick={() => setSelectedId(r.supplierId)} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="text-xs font-medium">{r.supplierName}</TableCell>
                        <TableCell className="text-xs text-center">
                          <Badge variant={grade.variant} className="text-[10px] font-bold">{grade.letter}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <Progress value={r.score} className="h-1.5 flex-1 min-w-[60px]" />
                            <span className="font-semibold tabular-nums w-8 text-right">{r.score}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center">{r.poCount}</TableCell>
                        <TableCell className="text-xs text-right font-medium tabular-nums">{fmt(r.totalSpend)}</TableCell>
                        <TableCell className="text-xs text-center">
                          {r.onTimePct === null ? <span className="text-muted-foreground">—</span> : (
                            <Badge variant={r.onTimePct >= 80 ? 'default' : r.onTimePct >= 50 ? 'secondary' : 'destructive'} className="text-[10px]">{Math.round(r.onTimePct)}%</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-center">{r.avgLead === null ? <span className="text-muted-foreground">—</span> : `${Math.round(r.avgLead)}d`}</TableCell>
                        <TableCell className="text-xs text-center">{r.invoiceCount}</TableCell>
                        <TableCell className="text-xs text-center">{r.paidPct === null ? <span className="text-muted-foreground">—</span> : `${Math.round(r.paidPct)}%`}</TableCell>
                        <TableCell className="text-xs text-center">
                          {r.invoiceOverdueCount > 0
                            ? <Badge variant="destructive" className="text-[10px]">{r.invoiceOverdueCount}</Badge>
                            : <span className="text-muted-foreground">0</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center">
          {t('reports.supplierPerformance.scoreFormula', 'Score = 60% on-time delivery + 30% paid invoices + 10% lead-time efficiency')}
        </p>
      </div>

      <SupplierDetailDrawer
        supplierId={selectedId}
        onClose={() => setSelectedId(null)}
        rows={enriched}
        orders={orders}
        invoices={invoices}
        fmt={fmt}
        t={t}
      />
    </div>
  );
}

type DrawerProps = {
  supplierId: string | null;
  onClose: () => void;
  rows: Array<Row & { onTimePct: number | null; avgLead: number | null; paidPct: number | null; score: number }>;
  orders: PurchaseOrder[];
  invoices: SupplierInvoice[];
  fmt: (n: number) => string;
  t: (k: string, d?: any) => string;
};

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (['received', 'closed', 'paid'].includes(status)) return 'default';
  if (['cancelled', 'rejected'].includes(status)) return 'destructive';
  if (['draft', 'pending'].includes(status)) return 'outline';
  return 'secondary';
}

function SupplierDetailDrawer({ supplierId, onClose, rows, orders, invoices, fmt, t }: DrawerProps) {
  const { current: currency } = useCurrency();
  const row = supplierId ? rows.find(r => r.supplierId === supplierId) : null;
  const supplierOrders = useMemo(
    () => supplierId ? orders.filter(o => String(o.supplierId) === supplierId).sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || '')) : [],
    [orders, supplierId],
  );
  const supplierInvoices = useMemo(
    () => supplierId ? invoices.filter(i => String(i.supplierId) === supplierId).sort((a, b) => (b.invoiceDate || '').localeCompare(a.invoiceDate || '')) : [],
    [invoices, supplierId],
  );

  const open = !!supplierId && !!row;
  const grade = row ? gradeFor(row.score) : null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        {row && grade && (
          <>
            <SheetHeader className="p-4 border-b">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="text-base truncate">{row.supplierName}</SheetTitle>
                  <SheetDescription className="text-[11px]">
                    {t('reports.supplierPerformance.subtitle', 'On-time delivery, lead time and spend per supplier')}
                  </SheetDescription>
                </div>
                <Badge variant={grade.variant} className="text-xs font-bold shrink-0">
                  {grade.letter} · {row.score}/100
                </Badge>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* KPI breakdown */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Package, label: t('reports.supplierPerformance.poCount', 'POs'), value: String(row.poCount) },
                    { icon: Wallet, label: t('reports.supplierPerformance.spend', 'Total spend'), value: `${fmt(row.totalSpend)} ${currency.code}` },
                    { icon: Truck, label: t('reports.supplierPerformance.onTime', 'On-time %'), value: row.onTimePct === null ? '—' : `${Math.round(row.onTimePct)}%` },
                    { icon: Clock, label: t('reports.supplierPerformance.avgLead', 'Avg lead'), value: row.avgLead === null ? '—' : `${Math.round(row.avgLead)}d` },
                    { icon: Receipt, label: t('reports.supplierPerformance.invoices', 'Invoices'), value: String(row.invoiceCount) },
                    { icon: FileCheck, label: t('reports.supplierPerformance.paidPct', 'Paid %'), value: row.paidPct === null ? '—' : `${Math.round(row.paidPct)}%` },
                    { icon: AlertTriangle, label: t('reports.supplierPerformance.overdue', 'Overdue inv.'), value: String(row.invoiceOverdueCount) },
                    { icon: Award, label: t('reports.supplierPerformance.score', 'Score'), value: `${row.score}/100` },
                  ].map(k => (
                    <div key={k.label} className="flex items-center gap-2 p-2 rounded-md border bg-card">
                      <div className="p-1.5 rounded bg-primary/10"><k.icon className="h-3.5 w-3.5 text-primary" /></div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{k.label}</div>
                        <div className="text-xs font-semibold truncate">{k.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">{t('reports.supplierPerformance.score', 'Score')}</span>
                    <span className="text-[11px] font-semibold tabular-nums">{row.score}/100</span>
                  </div>
                  <Progress value={row.score} className="h-2" />
                </div>

                <Tabs defaultValue="orders">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="orders" className="text-xs">
                      <Package className="h-3.5 w-3.5 mr-1.5" />
                      {t('reports.supplierPerformance.poCount', 'POs')} ({supplierOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="text-xs">
                      <Receipt className="h-3.5 w-3.5 mr-1.5" />
                      {t('reports.supplierPerformance.invoices', 'Invoices')} ({supplierInvoices.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders" className="mt-3">
                    {supplierOrders.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">{t('reports.noData', 'No data available')}</p>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[10px] h-8">#</TableHead>
                              <TableHead className="text-[10px] h-8">{t('reports.supplierPerformance.date', 'Date')}</TableHead>
                              <TableHead className="text-[10px] h-8">{t('reports.supplierPerformance.status', 'Status')}</TableHead>
                              <TableHead className="text-[10px] h-8 text-right">{t('reports.supplierPerformance.spend', 'Total')}</TableHead>
                              <TableHead className="text-[10px] h-8 w-8"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supplierOrders.map(po => (
                              <TableRow key={po.id}>
                                <TableCell className="text-xs font-medium py-2">{po.orderNumber}</TableCell>
                                <TableCell className="text-xs py-2">{po.orderDate?.slice(0, 10) || '—'}</TableCell>
                                <TableCell className="py-2">
                                  <Badge variant={statusVariant(po.status)} className="text-[10px]">{po.status}</Badge>
                                </TableCell>
                                <TableCell className="text-xs text-right tabular-nums py-2">{fmt(po.grandTotal)}</TableCell>
                                <TableCell className="py-2">
                                  <Link to={`/dashboard/purchases/orders/${po.id}`} onClick={onClose}>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="invoices" className="mt-3">
                    {supplierInvoices.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">{t('reports.noData', 'No data available')}</p>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[10px] h-8">#</TableHead>
                              <TableHead className="text-[10px] h-8">{t('reports.supplierPerformance.date', 'Date')}</TableHead>
                              <TableHead className="text-[10px] h-8">{t('reports.supplierPerformance.status', 'Status')}</TableHead>
                              <TableHead className="text-[10px] h-8 text-right">{t('reports.supplierPerformance.spend', 'Total')}</TableHead>
                              <TableHead className="text-[10px] h-8 w-8"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supplierInvoices.map(inv => (
                              <TableRow key={inv.id}>
                                <TableCell className="text-xs font-medium py-2">{inv.invoiceNumber}</TableCell>
                                <TableCell className="text-xs py-2">{inv.invoiceDate?.slice(0, 10) || '—'}</TableCell>
                                <TableCell className="py-2">
                                  <Badge variant={statusVariant(inv.status)} className="text-[10px]">{inv.status}</Badge>
                                </TableCell>
                                <TableCell className="text-xs text-right tabular-nums py-2">{fmt(inv.grandTotal)}</TableCell>
                                <TableCell className="py-2">
                                  <Link to={`/dashboard/purchases/invoices/${inv.id}`} onClick={onClose}>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function SupplierPerformancePage() {
  return (
    <PurchaseErrorBoundary>
      <SupplierPerformanceContent />
    </PurchaseErrorBoundary>
  );
}
