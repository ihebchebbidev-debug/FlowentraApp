import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ExternalLink, RefreshCw, Scale, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { getStatusColorClass } from '@/config/entity-statuses';
import { useCustomerInvoice } from '../hooks/useCustomerInvoices';
import { useSaleReconciliation } from '../hooks/useSaleReconciliation';
import { ReconciliationFindingList } from '../components/ReconciliationFindingList';
import type { ReconItemCoverageRow } from '../utils/reconciliation';
import { formatSaleItemLabel } from '@/modules/sales/utils/saleItemLabel';

const COVERAGE_TONE: Record<ReconItemCoverageRow['coverage'], string> = {
  none: 'bg-muted text-muted-foreground',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  full: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  over: 'bg-destructive/10 text-destructive',
};

/**
 * Invoice reconciliation screen — Sale totals vs generated Invoice totals.
 * Reached from an invoice (/dashboard/invoices/:id/reconciliation) or directly
 * for a sale (?saleId=123).
 */
export function InvoiceReconciliationPage() {
  const { t } = useTranslation('invoices');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const { format, current: currencyInfo } = useCurrency();

  // Reachable both as /invoices/:id/reconciliation and /invoices/reconciliation?saleId=
  const invoiceId = id && /^\d+$/.test(id) ? parseInt(id, 10) : null;
  const { data: invoice } = useCustomerInvoice(invoiceId);
  const saleIdParam = search.get('saleId');
  const saleId = saleIdParam ? parseInt(saleIdParam, 10) : invoice?.saleId ?? null;

  const { result, isLoading, refetch } = useSaleReconciliation(saleId ?? null);

  const money = (amount?: number | null) => {
    const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
    return value === 0 ? `0 ${result?.currency || currencyInfo.code}` : format(value);
  };

  const headline = useMemo(() => {
    if (!result) return null;
    if (result.errors.length > 0) {
      return { tone: 'error' as const, text: t('reconciliation.headline.errors', { count: result.errors.length, defaultValue: '{{count}} mismatch(es) block posting' }) };
    }
    if (result.warnings.length > 0) {
      return { tone: 'warning' as const, text: t('reconciliation.headline.warnings', { count: result.warnings.length, defaultValue: '{{count}} item(s) need review before posting' }) };
    }
    return { tone: 'ok' as const, text: t('reconciliation.headline.ok', 'Sale and invoices reconcile') };
  }, [result, t]);

  if (!saleId) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          {t('actions.back_to_list')}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t('reconciliation.no_sale', 'This invoice is not linked to a sale, so there is nothing to reconcile.')}
        </p>
      </div>
    );
  }

  if (isLoading || !result) {
    return <div className="p-6 text-sm text-muted-foreground">{t('loading')}</div>;
  }

  const rows: Array<{ label: string; value: string; strong?: boolean; tone?: string }> = [
    { label: t('reconciliation.sale_subtotal', 'Sale subtotal'), value: money(result.sale.subtotal) },
    { label: t('reconciliation.sale_discount', 'Header discount'), value: `- ${money(result.sale.discountAmount)}` },
    { label: t('reconciliation.sale_after_discount', 'After discount'), value: money(result.sale.afterDiscount) },
    { label: t('reconciliation.sale_tax', 'Tax'), value: money(result.sale.taxAmount) },
    { label: t('reconciliation.sale_stamp', 'Fiscal stamp'), value: money(result.sale.fiscalStamp) },
    { label: t('reconciliation.sale_total', 'Sale total'), value: money(result.sale.grandTotal), strong: true },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 p-3 md:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="sm" className="gap-1 shrink-0 px-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">{t('actions.back_to_list')}</span>
          </Button>
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Scale className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-semibold text-foreground truncate">
              {t('reconciliation.title', 'Invoice reconciliation')}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {result.saleNumber ? `${t('detail.sale')} ${result.saleNumber}` : `${t('detail.sale')} #${result.saleId}`}
              {result.currency ? ` · ${result.currency}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headline && (
            <Badge
              variant="outline"
              className={
                headline.tone === 'error'
                  ? 'border-destructive/40 text-destructive'
                  : headline.tone === 'warning'
                    ? 'border-amber-500/40 text-amber-700 dark:text-amber-400'
                    : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
              }
            >
              {headline.tone === 'ok' ? <ShieldCheck className="h-3.5 w-3.5 mr-1" /> : <ShieldAlert className="h-3.5 w-3.5 mr-1" />}
              {headline.text}
            </Badge>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">{t('reconciliation.refresh', 'Re-check')}</span>
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate(`/dashboard/sales/${result.saleId}`)}>
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">{t('actions.open_sale')}</span>
          </Button>
        </div>
      </div>

      <div className="p-3 md:p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Sale side */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('reconciliation.sale_side', 'Sale')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {rows.map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className={r.strong ? 'font-medium text-foreground' : 'text-muted-foreground'}>{r.label}</span>
                  <span className={r.strong ? 'font-semibold text-foreground' : 'text-foreground'}>{r.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Invoice side */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('reconciliation.invoice_side', 'Invoices (live)')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('reconciliation.invoiced', 'Invoiced')}</span>
                <span className="text-foreground">{money(result.invoicedTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('reconciliation.paid', 'Paid')}</span>
                <span className="text-foreground">{money(result.paidTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('reconciliation.due', 'Outstanding')}</span>
                <span className="text-foreground">{money(result.dueTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('reconciliation.voided', 'Voided (excluded)')}</span>
                <span className="text-foreground">{money(result.voidedTotal)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">
                  {result.remaining < 0
                    ? t('reconciliation.over_by', 'Over-invoiced by')
                    : t('reconciliation.remaining', 'Left to invoice')}
                </span>
                <span
                  className={
                    result.remaining < -0.01
                      ? 'font-semibold text-destructive'
                      : result.remaining > 0.01
                        ? 'font-semibold text-amber-700 dark:text-amber-400'
                        : 'font-semibold text-emerald-700 dark:text-emerald-400'
                  }
                >
                  {money(Math.abs(result.remaining))}
                </span>
              </div>
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('sale_tab.coverage')}</span>
                  <span>{result.coveragePct.toFixed(0)}%</span>
                </div>
                <Progress value={result.coveragePct} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('reconciliation.findings_title', 'Checks')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReconciliationFindingList findings={result.findings} />
          </CardContent>
        </Card>

        {/* Per-invoice breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('reconciliation.per_invoice', 'Invoice totals vs their own lines')}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.number')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead className="text-right">{t('detail.subtotal')}</TableHead>
                  <TableHead className="text-right">{t('detail.tax')}</TableHead>
                  <TableHead className="text-right">{t('detail.grand_total')}</TableHead>
                  <TableHead className="text-right">{t('reconciliation.from_lines', 'From lines')}</TableHead>
                  <TableHead className="text-right">{t('reconciliation.delta', 'Delta')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      {t('sale_tab.empty')}
                    </TableCell>
                  </TableRow>
                )}
                {result.invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}
                  >
                    <TableCell className="text-sm font-medium">{inv.invoiceNumber || t('detail.no_number_yet')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColorClass('invoice', inv.status)}>
                        {t(`status.${inv.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{money(inv.subtotal)}</TableCell>
                    <TableCell className="text-right text-sm">{money(inv.taxAmount)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{money(inv.grandTotal)}</TableCell>
                    <TableCell className="text-right text-sm">{money(inv.computedGrandTotal)}</TableCell>
                    <TableCell className={`text-right text-sm ${Math.abs(inv.delta) > 0.01 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {money(inv.delta)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Line coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('reconciliation.item_coverage', 'Sale line coverage')}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('detail.item')}</TableHead>
                  <TableHead className="text-right">{t('detail.qty')}</TableHead>
                  <TableHead className="text-right">{t('reconciliation.sale_line_total', 'Sale line')}</TableHead>
                  <TableHead className="text-right">{t('reconciliation.invoiced_line_total', 'Invoiced')}</TableHead>
                  <TableHead>{t('reconciliation.coverage_state', 'Coverage')}</TableHead>
                  <TableHead>{t('reconciliation.on_invoices', 'On invoices')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((it, idx) => (
                  <TableRow key={it.saleItemId ?? idx}>
                    <TableCell className="text-sm">{formatSaleItemLabel(it.itemName)}</TableCell>
                    <TableCell className="text-right text-sm">
                      {it.saleQuantity}
                      {it.invoicedQuantity > 0 && it.invoicedQuantity !== it.saleQuantity && (
                        <span className="text-amber-700 dark:text-amber-400"> → {it.invoicedQuantity}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{money(it.saleLineTotal)}</TableCell>
                    <TableCell className="text-right text-sm">{money(it.invoicedLineTotal)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={COVERAGE_TONE[it.coverage]}>
                        {t(`reconciliation.coverage.${it.coverage}`, it.coverage)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {it.invoiceIds.length ? it.invoiceIds.map((i) => `#${i}`).join(', ') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default InvoiceReconciliationPage;
