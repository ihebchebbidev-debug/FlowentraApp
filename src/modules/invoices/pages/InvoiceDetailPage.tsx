import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ExternalLink, Receipt, Send, Trash2, Ban, CheckCircle2, RefreshCw, User, Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerInvoice, useInvoiceMutations } from '../hooks/useCustomerInvoices';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { PaymentsTab } from '@/modules/payments/components/PaymentsTab';
import { InvoiceActivityTab } from '../components/tabs/InvoiceActivityTab';
import { InvoiceDownloadPdfButton } from '../components/InvoiceDownloadPdfButton';
import { usePermissions } from '@/hooks/usePermissions';

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  posted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  void: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = id ? parseInt(id, 10) : null;
  const { t } = useTranslation('invoices');
  const navigate = useNavigate();
  const { format, current: currencyInfo } = useCurrency();
  const { data: invoice, isLoading } = useCustomerInvoice(invoiceId);
  const { post, void: voidMutation, remove, markPaid, reopen } = useInvoiceMutations();
  const { canUpdate, canDelete, isMainAdmin } = usePermissions();
  const canUpdateInvoice = isMainAdmin || canUpdate('sales');
  const canDeleteInvoice = isMainAdmin || canDelete('sales');

  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidMemo, setMarkPaidMemo] = useState('');
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenMemo, setReopenMemo] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading || !invoice) {
    return <div className="p-6 text-sm text-muted-foreground">{t('loading')}</div>;
  }

  return (
    <div className="flex flex-col">
      {/* Header (mirrors Sales/Offers detail header) */}
      <div className="flex items-center justify-between gap-2 p-3 md:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/invoices')} className="gap-1 shrink-0 px-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">{t('actions.back_to_list')}</span>
          </Button>
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Receipt className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base md:text-xl font-semibold text-foreground truncate">
                {invoice.invoiceNumber || t('detail.no_number_yet')}
              </h1>
              <Badge className={STATUS_COLOR[invoice.status]} variant="secondary">{t(`status.${invoice.status}`)}</Badge>
            </div>
            {invoice.title && (
              <p className="text-px-10 md:text-px-11 text-muted-foreground truncate">{invoice.title}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => window.open(`/dashboard/invoices/${invoice.id}/report`, '_blank', 'noopener,noreferrer')}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">{t('actions.print', 'Print / View PDF')}</span>
          </Button>
          <InvoiceDownloadPdfButton invoice={invoice} />
          {invoice.status === 'draft' && canUpdateInvoice && (
            <Button size="sm" className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-medium" onClick={() => post.mutate(invoice.id)}>
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.post')}</span>
            </Button>
          )}
          {(invoice.status === 'posted' || invoice.status === 'paid') && canDeleteInvoice && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setVoidOpen(true)}>
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.void')}</span>
            </Button>
          )}
          {invoice.status === 'draft' && canDeleteInvoice && (
            <Button size="sm" variant="outline" className="gap-2 text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.delete')}</span>
            </Button>
          )}
          {invoice.saleId && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate(`/dashboard/sales/${invoice.saleId}`)}>
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.open_sale')}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-3 md:p-6 space-y-4">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-card border-0 lg:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">{t('columns.issue_date')}</div>
                <div>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('columns.due_date')}</div>
                <div>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('detail.contact')}</div>
                {invoice.contactId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/contacts/${invoice.contactId}`)}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <User className="h-3.5 w-3.5" />
                    {invoice.contactName || `#${invoice.contactId}`}
                  </button>
                ) : '—'}
              </div>
              <div>
                <div className="text-muted-foreground">{t('detail.sale')}</div>
                <div>
                  {invoice.saleId ? (
                    <button className="text-primary hover:underline" onClick={() => navigate(`/dashboard/sales/${invoice.saleId}`)}>
                      {invoice.saleNumber || `#${invoice.saleId}`}
                    </button>
                  ) : '—'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('detail.currency')}</div>
                <div>{currencyInfo.code}</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">{t('detail.lines')}</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('detail.item')}</TableHead>
                      <TableHead className="text-right">{t('detail.qty')}</TableHead>
                      <TableHead className="text-right">{t('detail.unit_price')}</TableHead>
                      <TableHead className="text-right">{t('detail.line_total')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.itemName}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">{format(line.unitPrice)}</TableCell>
                        <TableCell className="text-right">{format(line.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {invoice.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">{t('detail.notes')}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="pt-6 space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t('detail.subtotal')}</span><span className="font-medium">{format(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('detail.tax')}</span><span className="font-medium">{format(invoice.taxAmount)}</span></div>
            <Separator />
            <div className="flex justify-between font-semibold text-base"><span>{t('detail.grand_total')}</span><span>{format(invoice.grandTotal)}</span></div>
            <div className="flex justify-between text-green-700 dark:text-green-400"><span>{t('detail.amount_paid')}</span><span className="font-medium">{format(invoice.amountPaid)}</span></div>
            <div className="flex justify-between text-amber-700 dark:text-amber-400"><span>{t('detail.amount_due')}</span><span className="font-medium">{format(invoice.amountDue)}</span></div>
            {invoice.grandTotal > 0 && (
              <div className="pt-2">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(100, Math.round((invoice.amountPaid / invoice.grandTotal) * 100))}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground text-right">
                  {Math.min(100, Math.round((invoice.amountPaid / invoice.grandTotal) * 100))}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="pt-6">
          <Tabs defaultValue="payments" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
              <TabsTrigger value="payments" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('detail.payments')}
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {t('detail.activity')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="payments" className="mt-4 space-y-4">
              {(invoice.status === 'posted' || invoice.status === 'paid' || invoice.status === 'void') && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {invoice.status === 'posted' && canUpdateInvoice && (
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setMarkPaidOpen(true)}>
                      <CheckCircle2 className="h-4 w-4" />
                      {t('actions.mark_paid')}
                    </Button>
                  )}
                  {(invoice.status === 'paid' || invoice.status === 'void') && canUpdateInvoice && (
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setReopenOpen(true)}>
                      <RefreshCw className="h-4 w-4" />
                      {t('actions.reopen')}
                    </Button>
                  )}
                  {(invoice.status === 'posted' || invoice.status === 'paid') && canDeleteInvoice && (
                    <Button size="sm" variant="outline" className="gap-2 text-destructive" onClick={() => setVoidOpen(true)}>
                      <Ban className="h-4 w-4" />
                      {t('actions.void')}
                    </Button>
                  )}
                </div>
              )}
              <PaymentsTab
                entityType="invoice"
                entityId={String(invoice.id)}
                entityNumber={invoice.invoiceNumber}
                totalAmount={invoice.grandTotal}
                currency={currencyInfo.code}
              />
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <InvoiceActivityTab invoiceId={invoice.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>


      <Dialog open={voidOpen} onOpenChange={(o) => { setVoidOpen(o); if (!o) setVoidReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm.void_title')}</DialogTitle>
            <DialogDescription>{t('confirm.void_body')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t('confirm.void_reason')} <span className="text-destructive">*</span></Label>
            <Textarea value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder={t('confirm.reason_placeholder')} />
            {!voidReason.trim() && <p className="text-xs text-destructive">{t('confirm.reason_required')}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)}>{t('actions.cancel')}</Button>
            <Button
              variant="destructive"
              disabled={!voidReason.trim() || voidMutation.isPending}
              onClick={() => voidMutation.mutate({ id: invoice.id, reason: voidReason.trim() }, { onSuccess: () => { setVoidOpen(false); setVoidReason(''); } })}
            >
              {t('actions.void')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={markPaidOpen} onOpenChange={(o) => { setMarkPaidOpen(o); if (!o) setMarkPaidMemo(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm.mark_paid_title')}</DialogTitle>
            <DialogDescription>{t('confirm.mark_paid_body')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t('confirm.memo')} <span className="text-destructive">*</span></Label>
            <Textarea value={markPaidMemo} onChange={(e) => setMarkPaidMemo(e.target.value)} placeholder={t('confirm.memo_placeholder')} />
            {!markPaidMemo.trim() && <p className="text-xs text-destructive">{t('confirm.memo_required')}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>{t('actions.cancel')}</Button>
            <Button
              disabled={!markPaidMemo.trim() || markPaid.isPending}
              onClick={() => markPaid.mutate({ id: invoice.id, memo: markPaidMemo.trim() }, { onSuccess: () => { setMarkPaidOpen(false); setMarkPaidMemo(''); } })}
            >
              {t('actions.mark_paid')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reopenOpen} onOpenChange={(o) => { setReopenOpen(o); if (!o) setReopenMemo(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm.reopen_title')}</DialogTitle>
            <DialogDescription>{t('confirm.reopen_body')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t('confirm.memo')} <span className="text-destructive">*</span></Label>
            <Textarea value={reopenMemo} onChange={(e) => setReopenMemo(e.target.value)} placeholder={t('confirm.memo_placeholder')} />
            {!reopenMemo.trim() && <p className="text-xs text-destructive">{t('confirm.memo_required')}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenOpen(false)}>{t('actions.cancel')}</Button>
            <Button
              disabled={!reopenMemo.trim() || reopen.isPending}
              onClick={() => reopen.mutate({ id: invoice.id, memo: reopenMemo.trim() }, { onSuccess: () => { setReopenOpen(false); setReopenMemo(''); } })}
            >
              {t('actions.reopen')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm.delete_title')}</DialogTitle>
            <DialogDescription>{t('confirm.delete_body')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('actions.cancel')}</Button>
            <Button variant="destructive" onClick={() => remove.mutate(invoice.id, { onSuccess: () => navigate('/dashboard/invoices') })}>
              {t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

export default InvoiceDetailPage;
