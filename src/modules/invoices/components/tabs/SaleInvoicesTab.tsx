import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, FileText, Receipt, ExternalLink } from 'lucide-react';
import { useCustomerInvoicesList, useInvoiceMutations } from '../../hooks/useCustomerInvoices';
import { useCurrency } from '@/shared/hooks/useCurrency';
import type { InvoiceStatus } from '../../types';

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  posted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  void: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

interface Props {
  saleId: number;
  saleTotal: number;
  currency: string;
}

/**
 * "Invoices" tab inside a Sale — shows every invoice tied to that sale and
 * how much of the sale is already invoiced/paid/outstanding.
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
    return { invoiced, paid, outstanding, notInvoiced, coverage };
  }, [invoices, saleTotal]);

  const handleCreate = () => {
    createFromSale.mutate({ saleId }, {
      onSuccess: (inv) => { setConfirmOpen(false); navigate(`/dashboard/invoices/${inv.id}`); },
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <Card className="shadow-card border-0">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">{t('sale_tab.sale_total')}</div>
              <div className="font-semibold">{format(saleTotal)} {currency}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('sale_tab.invoiced')}</div>
              <div className="font-semibold text-blue-700 dark:text-blue-400">{format(summary.invoiced)} {currency}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('sale_tab.not_invoiced')}</div>
              <div className="font-semibold text-amber-700 dark:text-amber-400">{format(summary.notInvoiced)} {currency}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('sale_tab.paid')}</div>
              <div className="font-semibold text-green-700 dark:text-green-400">{format(summary.paid)} {currency}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('sale_tab.outstanding')}</div>
              <div className="font-semibold">{format(summary.outstanding)} {currency}</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('sale_tab.coverage')}</span>
              <span>{summary.coverage.toFixed(0)}%</span>
            </div>
            <Progress value={summary.coverage} />
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="gap-2" onClick={() => setConfirmOpen(true)} disabled={createFromSale.isPending}>
              <PlusCircle className="h-4 w-4" />
              {t('sale_tab.create_invoice')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="shadow-card border-0">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('loading')}</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('sale_tab.empty')}</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.number')}</TableHead>
                      <TableHead>{t('columns.status')}</TableHead>
                      <TableHead>{t('columns.issue_date')}</TableHead>
                      <TableHead className="text-right">{t('columns.total')}</TableHead>
                      <TableHead className="text-right">{t('columns.paid')}</TableHead>
                      <TableHead className="text-right">{t('columns.due')}</TableHead>
                      <TableHead className="text-right">{t('columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}>
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {inv.invoiceNumber || t('detail.no_number_yet')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLOR[inv.status]} variant="secondary">{t(`status.${inv.status}`)}</Badge>
                        </TableCell>
                        <TableCell>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}</TableCell>
                        <TableCell className="text-right">{format(inv.grandTotal)} {inv.currency}</TableCell>
                        <TableCell className="text-right">{format(inv.amountPaid)} {inv.currency}</TableCell>
                        <TableCell className="text-right">{format(inv.amountDue)} {inv.currency}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/invoices/${inv.id}`); }}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {invoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}
                    className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{inv.invoiceNumber || t('detail.no_number_yet')}</span>
                      </span>
                      <Badge className={STATUS_COLOR[inv.status]} variant="secondary">{t(`status.${inv.status}`)}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <div>{t('columns.total')}: <span className="text-foreground">{format(inv.grandTotal)} {inv.currency}</span></div>
                      <div>{t('columns.due')}: <span className="text-foreground">{format(inv.amountDue)} {inv.currency}</span></div>
                    </div>
                  </button>
                ))}
              </div>
            </>
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
    </div>
  );
}

export default SaleInvoicesTab;
