import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, FileText, Receipt, ExternalLink, Eye } from 'lucide-react';
import { getStatusColorClass } from '@/config/entity-statuses';
import { useCustomerInvoicesList, useInvoiceMutations } from '../../hooks/useCustomerInvoices';
import { useCurrency } from '@/shared/hooks/useCurrency';

interface Props {
  saleId: number;
  saleTotal: number;
  currency: string;
}

/**
 * "Invoices" tab inside a Sale — read-only list of every invoice tied to that
 * sale plus a "create invoice" entry point. All invoice management (post, void,
 * mark paid, reopen) lives in the Invoices module.
 *
 * Layout intentionally mirrors the Sale "Items" tab: one Card with a
 * CardHeader title + action button, a plain table, and a totals footer.
 */
export function SaleInvoicesTab({ saleId, saleTotal, currency }: Props) {
  const { t } = useTranslation('invoices');
  const { format } = useCurrency();
  const navigate = useNavigate();
  const { createFromSale } = useInvoiceMutations();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading } = useCustomerInvoicesList({ saleId, limit: 100 });
  const invoices = data?.data ?? [];

  const summary = useMemo(() => {
    const active = invoices.filter((i) => i.status !== 'void');
    const invoiced = active.reduce((s, i) => s + i.grandTotal, 0);
    const paid = active.reduce((s, i) => s + i.amountPaid, 0);
    const outstanding = active.reduce((s, i) => s + (i.amountDue ?? 0), 0);
    const notInvoiced = Math.max(0, (saleTotal || 0) - invoiced);
    const coverage = saleTotal > 0 ? Math.min(100, (invoiced / saleTotal) * 100) : 0;
    const drafts = invoices.filter((i) => i.status === 'draft').length;
    return { invoiced, paid, outstanding, notInvoiced, coverage, drafts };
  }, [invoices, saleTotal]);

  const handleCreate = () => {
    createFromSale.mutate({ saleId }, {
      onSuccess: (inv) => { setConfirmOpen(false); navigate(`/dashboard/invoices/${inv.id}`); },
    });
  };

  const openInvoice = (id: number) => navigate(`/dashboard/invoices/${id}`);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              {t('sale_tab.heading')} ({invoices.length})
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={createFromSale.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {t('sale_tab.create_invoice')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('sale_tab.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>{t('columns.number')}</TableHead>
                    <TableHead>{t('columns.status')}</TableHead>
                    <TableHead>{t('columns.issue_date')}</TableHead>
                    <TableHead className="text-right">{t('columns.total')}</TableHead>
                    <TableHead className="text-right">{t('columns.paid')}</TableHead>
                    <TableHead className="text-right">{t('columns.due')}</TableHead>
                    <TableHead className="text-center">{t('columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => openInvoice(inv.id)}
                    >
                      <TableCell className="text-center">
                        <FileText className="h-4 w-4 text-muted-foreground mx-auto" />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {inv.invoiceNumber || t('detail.no_number_yet')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColorClass('invoice', inv.status)}>
                          {t(`status.${inv.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-foreground">
                        {format(inv.grandTotal)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-foreground">
                        {format(inv.amountPaid)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-foreground">
                        {format(inv.amountDue ?? 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => { e.stopPropagation(); openInvoice(inv.id); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/dashboard/invoices/${inv.id}`, '_blank', 'noopener');
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {invoices.length > 0 && (
            <div className="mt-6 pt-4 border-t space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="text-sm text-muted-foreground">
                  {t('sale_tab.count_summary', { count: invoices.length, drafts: summary.drafts })}
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-sm text-muted-foreground">
                    {t('sale_tab.sale_total')}: {format(saleTotal)} {currency}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('sale_tab.invoiced')}: {format(summary.invoiced)}
                  </p>
                  {summary.notInvoiced > 0 && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {t('sale_tab.not_invoiced')}: {format(summary.notInvoiced)}
                    </p>
                  )}
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {t('sale_tab.paid')}: {format(summary.paid)}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {t('sale_tab.outstanding')}: {format(summary.outstanding)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('sale_tab.coverage')}</span>
                  <span>{summary.coverage.toFixed(0)}%</span>
                </div>
                <Progress value={summary.coverage} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sale_tab.confirm_create_title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('sale_tab.confirm_create_body')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleCreate} disabled={createFromSale.isPending}>{t('create_from_sale.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SaleInvoicesTab;
