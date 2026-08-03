import { useNavigate, useParams } from 'react-router-dom';
import { useContactAccessGuard } from '@/hooks/useContactAccessGuard';
import { ContactAccessDenied } from '@/components/access/ContactAccessDenied';
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
import { ArrowLeft, ExternalLink, Receipt, Send, Trash2, Ban, CheckCircle2, RefreshCw, User, Printer, Download, FileText, Scale } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLayoutModeContext } from '@/hooks/useLayoutMode';
import { useCustomerInvoice, useInvoiceMutations } from '../hooks/useCustomerInvoices';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { PaymentsTab } from '@/modules/payments/components/PaymentsTab';
import { usePlugins } from '@/modules/shared/plugins/usePlugins';
import { InvoiceActivityTab } from '../components/tabs/InvoiceActivityTab';
import { InvoiceDocumentsTab } from '../components/tabs/InvoiceDocumentsTab';
import { InvoicePDFPreviewModal } from '../components/InvoicePDFPreviewModal';
import { PostInvoiceReconciliationDialog } from '../components/PostInvoiceReconciliationDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  posted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  void: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const ALL_INVOICE_TABS = [
  { value: 'payments', icon: CheckCircle2, labelKey: 'detail.payments', fallback: 'Payments', pluginCode: 'PL0026PAYMENTS' },
  { value: 'documents', icon: FileText, labelKey: 'detail.documents', fallback: 'Documents', pluginCode: 'PL0012DOCUMENTS' },
  { value: 'activity', icon: RefreshCw, labelKey: 'detail.activity', fallback: 'Activity', pluginCode: undefined },
] as const;

export function InvoiceDetailPage() {
  const { isEnabled: isPluginEnabled } = usePlugins();
  const INVOICE_TABS = ALL_INVOICE_TABS.filter((tab) => isPluginEnabled(tab.pluginCode));
  const paymentsEnabled = isPluginEnabled('PL0026PAYMENTS');
  const [activeTabRaw, setActiveTab] = useState<string>('payments');
  // Fall back to the first available tab when the stored one is gated off.
  const activeTab = INVOICE_TABS.some((tab) => tab.value === activeTabRaw)
    ? activeTabRaw
    : (INVOICE_TABS[0]?.value ?? 'activity');
  const { isMobile } = useLayoutModeContext();
  const { id } = useParams<{ id: string }>();
  const invoiceId = id ? parseInt(id, 10) : null;
  const { t } = useTranslation('invoices');
  const navigate = useNavigate();
  const { format, current: currencyInfo } = useCurrency();
  const { data: invoice, isLoading } = useCustomerInvoice(invoiceId);
  const { post, void: voidMutation, remove, reopen } = useInvoiceMutations();
  const { canUpdate, canDelete, isMainAdmin } = usePermissions();
  const qc = useQueryClient();
  const canUpdateInvoice = isMainAdmin || canUpdate('sales');
  const canDeleteInvoice = isMainAdmin || canDelete('sales');

  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenMemo, setReopenMemo] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  // Posting always goes through reconciliation: the sale total is compared with
  // every invoice generated from it, and hard mismatches block the post.
  const [postGateOpen, setPostGateOpen] = useState(false);

  // Totals must always render a number (0 included) — never a dash.
  const money = (amount?: number | null) => {
    const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
    return value === 0 ? `0 ${currencyInfo.code}` : format(value);
  };

  const contactAccess = useContactAccessGuard((invoice as any)?.contactId);

  if (isLoading || !invoice) {
    return <div className="p-6 text-sm text-muted-foreground">{t('loading')}</div>;
  }

  if (!contactAccess.checking && !contactAccess.allowed) {
    return <ContactAccessDenied entityLabel={'invoice'} />;
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
            onClick={() => setPdfPreviewOpen(true)}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">{t('actions.print', 'Print / View PDF')}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setPdfPreviewOpen(true)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('actions.download_pdf', 'Download PDF')}</span>
          </Button>

          {invoice.status === 'draft' && canUpdateInvoice && (
            <Button size="sm" className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-medium" onClick={() => setPostGateOpen(true)} disabled={post.isPending}>
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
            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate(`/dashboard/invoices/${invoice.id}/reconciliation`)}>
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.reconcile', 'Reconcile')}</span>
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
            <div className="flex justify-between"><span className="text-muted-foreground">{t('detail.tax')}</span><span className="font-medium">{money(invoice.taxAmount)}</span></div>
            <Separator />
            <div className="flex justify-between font-semibold text-base"><span>{t('detail.grand_total')}</span><span>{format(invoice.grandTotal)}</span></div>
            <div className="flex justify-between text-green-700 dark:text-green-400"><span>{t('detail.amount_paid')}</span><span className="font-medium">{money(invoice.amountPaid)}</span></div>
            <div className="flex justify-between text-amber-700 dark:text-amber-400"><span>{t('detail.amount_due')}</span><span className="font-medium">{money(invoice.amountDue)}</span></div>
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
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-full">
            <div className="w-full mb-6">
              {isMobile ? (
                (() => {
                  const current = INVOICE_TABS.find((tab) => tab.value === activeTab);
                  return (
                    <Select value={activeTab} onValueChange={(v) => setActiveTab(v)}>
                      <SelectTrigger className="w-full h-11 rounded-xl border-primary/20 bg-primary/5 text-foreground font-medium shadow-sm focus:ring-primary/30">
                        <SelectValue>
                          {current && (
                            <span className="flex items-center gap-2">
                              <current.icon className="h-4 w-4 text-primary flex-shrink-0" />
                              {String(t(current.labelKey, current.fallback))}
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-card rounded-xl shadow-lg border-border/60">
                        {INVOICE_TABS.map(({ value, icon: Icon, labelKey, fallback }) => (
                          <SelectItem key={value} value={value} className="rounded-lg cursor-pointer py-2.5">
                            <span className="flex items-center gap-2.5">
                              <span className={`p-1 rounded-md ${activeTab === value ? 'bg-primary/10' : 'bg-muted'}`}>
                                <Icon className={`h-3.5 w-3.5 ${activeTab === value ? 'text-primary' : 'text-muted-foreground'}`} />
                              </span>
                              <span className={activeTab === value ? 'text-primary font-medium' : ''}>
                                {String(t(labelKey, fallback))}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()
              ) : (
                <TabsList variant="underline">
                  {INVOICE_TABS.map(({ value, labelKey, fallback }) => (
                    <TabsTrigger key={value} value={value}>
                      {String(t(labelKey, fallback))}
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}
            </div>
            {paymentsEnabled && <TabsContent value="payments" className="mt-4 space-y-4">

              {(invoice.status === 'posted' || invoice.status === 'paid' || invoice.status === 'void') && (
                <div className="flex flex-wrap gap-2 justify-end">
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
                onPaymentsChanged={() => qc.invalidateQueries({ queryKey: ['customer-invoices'] })}
                entityType="invoice"
                entityId={String(invoice.id)}
                entityNumber={invoice.invoiceNumber}
                totalAmount={invoice.grandTotal}
                currency={currencyInfo.code}
              />
            </TabsContent>}
            <TabsContent value="documents" className="mt-4">
              <InvoiceDocumentsTab
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
                saleId={invoice.saleId}
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

      <InvoicePDFPreviewModal
        isOpen={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        invoice={invoice}
      />

      <PostInvoiceReconciliationDialog
        open={postGateOpen}
        onOpenChange={setPostGateOpen}
        invoiceId={invoice.id}
        saleId={invoice.saleId ?? null}
        isPosting={post.isPending}
        onConfirm={() =>
          post.mutate(invoice.id, { onSuccess: () => setPostGateOpen(false) })
        }
      />
      </div>
    </div>

  );
}

export default InvoiceDetailPage;
