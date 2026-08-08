import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LineChart as LineIcon } from "lucide-react";
import { articleSupplierService } from "../services/purchaseService";

import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ChartSkeleton } from "../components/PurchaseSkeletons";
import { articlesApi } from "@/services/api/articlesApi";
import type { ArticleSupplier, ArticleSupplierPriceHistory } from "../types";

interface ArticleOpt { id: string; name: string; sku?: string; }
interface SeriesPoint { date: string; [supplier: string]: number | string; }

const COLORS = ['hsl(217 91% 60%)', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(271 91% 65%)', 'hsl(0 84% 60%)', 'hsl(180 60% 45%)'];

function PriceEvolutionContent() {
  const { t } = useTranslation('purchases');
  const [articles, setArticles] = useState<ArticleOpt[]>([]);
  const [articleId, setArticleId] = useState('');
  const [suppliers, setSuppliers] = useState<ArticleSupplier[]>([]);
  const [historyBySupplier, setHistoryBySupplier] = useState<Record<string, ArticleSupplierPriceHistory[]>>({});
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);
    // Purchasable articles are not always typed "material" — restricting the list
    // hid articles that actually have supplier price history, so load them all.
    articlesApi.getAll({ limit: 500 } as any)
      .then((res: any) => {
        if (cancelled) return;
        const list: ArticleOpt[] = (res?.data || []).map((a: any) => ({
          id: String(a.id), name: a.name, sku: a.sku,
        }));
        setArticles(list);
        if (list.length > 0) setArticleId(prev => prev || list[0].id);
      })
      .catch((e: any) => { if (!cancelled) setError(e?.message || 'Failed to load articles'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!articleId) { setSuppliers([]); setHistoryBySupplier({}); return; }
    setChartLoading(true);
    articleSupplierService.getByArticle(articleId)
      .then(async (rows) => {
        setSuppliers(rows || []);
        if (!rows || rows.length === 0) { setHistoryBySupplier({}); return; }
        const entries = await Promise.all(rows.map(async (r) => {
          try {
            const hist = await articleSupplierService.getPriceHistory(String(r.id));
            return [String(r.id), hist || []] as const;
          } catch {
            return [String(r.id), [] as ArticleSupplierPriceHistory[]] as const;
          }
        }));
        const map: Record<string, ArticleSupplierPriceHistory[]> = {};
        for (const [k, v] of entries) map[k] = v;
        setHistoryBySupplier(map);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load suppliers'))
      .finally(() => setChartLoading(false));
  }, [articleId]);

  const series = useMemo<SeriesPoint[]>(() => {
    type Event = { date: string; supplierKey: string; supplierName: string; price: number };
    const events: Event[] = [];
    for (const s of suppliers) {
      const supplierKey = s.supplierName || `Supplier #${s.supplierId}`;
      const history = historyBySupplier[String(s.id)] || [];
      const sorted = [...history].sort((a, b) => a.changedAt.localeCompare(b.changedAt));
      if (sorted.length === 0) {
        events.push({
          date: s.modifiedDate || s.createdDate,
          supplierKey, supplierName: supplierKey,
          price: Number(s.purchasePrice) || 0,
        });
      } else {
        events.push({
          date: sorted[0].changedAt,
          supplierKey, supplierName: supplierKey,
          price: Number(sorted[0].oldPrice) || 0,
        });
        for (const ev of sorted) {
          events.push({
            date: ev.changedAt,
            supplierKey, supplierName: supplierKey,
            price: Number(ev.newPrice) || 0,
          });
        }
      }
    }
    if (events.length === 0) return [];
    events.sort((a, b) => a.date.localeCompare(b.date));

    const dates = Array.from(new Set(events.map(e => e.date.split('T')[0]))).sort();
    const lastPrice: Record<string, number> = {};
    const points: SeriesPoint[] = [];
    for (const d of dates) {
      const todays = events.filter(e => e.date.split('T')[0] === d);
      for (const e of todays) lastPrice[e.supplierName] = e.price;
      const point: SeriesPoint = { date: d };
      for (const [k, v] of Object.entries(lastPrice)) point[k] = v;
      points.push(point);
    }
    return points;
  }, [suppliers, historyBySupplier]);

  const supplierNames = useMemo(() => {
    return suppliers.map(s => s.supplierName || `Supplier #${s.supplierId}`);
  }, [suppliers]);

  if (loading) return <><PurchasePageHeader title={t('reports.priceEvolution.title', 'Price Evolution')} icon={LineIcon} backTo={{ to: '/dashboard/purchases/reports', label: t('reports.title') }} /><ChartSkeleton /></>;
  if (error) return <><PurchasePageHeader title={t('reports.priceEvolution.title', 'Price Evolution')} icon={LineIcon} backTo={{ to: '/dashboard/purchases/reports', label: t('reports.title') }} /><PurchaseErrorFallback error={error} onRetry={() => window.location.reload()} backTo="/dashboard/purchases" /></>;

  const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' };

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('reports.priceEvolution.title', 'Price Evolution')}
        subtitle={t('reports.priceEvolution.subtitle', 'Track purchase price changes per supplier over time')}
        icon={LineIcon}
        backTo={{ to: '/dashboard/purchases/reports', label: t('reports.title') }}
      />
      <div className="p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('reports.priceEvolution.pickArticle', 'Article')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-2">
              <Label className="text-xs">{t('reports.priceEvolution.article', 'Select an article')}</Label>
              <Select value={articleId} onValueChange={setArticleId}>
                <SelectTrigger><SelectValue placeholder={t('reports.priceEvolution.selectArticle', 'Select…')} /></SelectTrigger>
                <SelectContent>
                  {articles.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}{a.sku ? ` · ${a.sku}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suppliers.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {supplierNames.map((name, i) => (
                    <Badge key={name} variant="outline" className="text-px-10" style={{ borderColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }}>
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('reports.priceEvolution.chartTitle', 'Price history')}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">{t('common.loading', 'Loading…')}</div>
            ) : series.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">{t('reports.noData', 'No price history available')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {supplierNames.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PriceEvolutionPage() {
  return (
    <PurchaseErrorBoundary>
      <PriceEvolutionContent />
    </PurchaseErrorBoundary>
  );
}
