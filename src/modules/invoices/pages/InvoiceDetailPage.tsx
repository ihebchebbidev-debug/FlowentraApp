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
import { ArrowLeft, ExternalLink, Receipt, Send, Trash2, Ban, CheckCircle2, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerInvoice, useInvoiceMutations } from '../hooks/useCustomerInvoices';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { PaymentsTab } from '@/modules/payments/components/PaymentsTab';
import { InvoiceActivityTab } from '../components/tabs/InvoiceActivityTab';
import { InvoiceDownloadPdfButton } from '../components/InvoiceDownloadPdfButton';

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
  const { format } = useCurrency();
  const { data: invoice, isLoading } = useCustomerInvoice(invoiceId);
  const { post, void: voidMutation, remove, markPaid, reopen } = useInvoiceMutations();

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
          <InvoiceDownloadPdfButton invoice={invoice} />
          {invoice.status === 'draft' && (
            <Button size="sm" className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-medium" onClick={() => post.mutate(invoice.id)}>
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.post')}</span>
            </Button>
          )}
          {(invoice.status === 'posted' || invoice.status === 'paid') && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setVoidOpen(true)}>
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.void')}</span>
            </Button>
          )}
          {invoice.status === 'draft' && (
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
                <div>{invoice.contactName || `#${invoice.contactId}`}</div>
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
                <div>{invoice.currency}</div>
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
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t('detail.subtotal')}</span><span>{format(invoice.subtotal)} {invoice.currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('detail.tax')}</span><span>{format(invoice.taxAmount)} {invoice.currency}</span></div>
            <Separator />
            <div className="flex justify-between font-semibold text-base"><span>{t('detail.grand_total')}</span><span>{format(invoice.grandTotal)} {invoice.currency}</span></div>
            <div className="flex justify-between text-green-700 dark:text-green-400"><span>{t('detail.amount_paid')}</span><span>{format(invoice.amountPaid)} {invoice.currency}</span></div>
            <div className="flex justify-between text-amber-700 dark:text-amber-400"><span>{t('detail.amount_due')}</span><span>{format(invoice.amountDue)} {invoice.currency}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="pt-6">
          <Tabs defaultValue="payments" className="w-full">
            <TabsList>
              <TabsTrigger value="payments">{t('detail.payments')}</TabsTrigger>
              <TabsTrigger value="activity">{t('detail.activity')}</TabsTrigger>
            </TabsList>
            <TabsContent value="payments" className="mt-4 space-y-4">
              {(invoice.status === 'posted' || invoice.status === 'paid' || invoice.status === 'void') && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {invoice.status === 'posted' && (
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setMarkPaidOpen(true)}>
                      <CheckCircle2 className="h-4 w-4" />
                      {t('actions.mark_paid')}
                    </Button>
                  )}
                  {(invoice.status === 'paid' || invoice.status === 'void') && (
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setReopenOpen(true)}>
                      <RefreshCw className="h-4 w-4" />
                      {t('actions.reopen')}
                    </Button>
                  )}
                  {(invoice.status === 'posted' || invoice.status === 'paid') && (
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
                currency={invoice.currency}
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
