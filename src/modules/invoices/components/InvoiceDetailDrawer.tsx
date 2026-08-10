import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MoreVertical, ExternalLink } from 'lucide-react';
import { useCustomerInvoice, useInvoiceMutations } from '../hooks/useCustomerInvoices';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { PaymentsTab } from '@/modules/payments/components/PaymentsTab';
import { formatSaleItemLabel } from '@/modules/sales/utils/saleItemLabel';

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  posted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  void: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

interface InvoiceDetailDrawerProps {
  invoiceId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailDrawer({ invoiceId, open, onOpenChange }: InvoiceDetailDrawerProps) {
  const { t } = useTranslation('invoices');
  const navigate = useNavigate();
  const { format } = useCurrency();
  const { data: invoice, isLoading } = useCustomerInvoice(invoiceId);
  const { post, void: voidMutation, remove } = useInvoiceMutations();
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handlePost = () => {
    if (invoice) post.mutate(invoice.id);
  };

  const handleVoidConfirm = () => {
    if (!invoice) return;
    if (!voidReason.trim()) return;
    voidMutation.mutate({ id: invoice.id, reason: voidReason.trim() }, {
      onSuccess: () => { setVoidDialogOpen(false); setVoidReason(''); },
    });
  };

  const handleDeleteConfirm = () => {
    if (invoice) {
      remove.mutate(invoice.id, {
        onSuccess: () => { setDeleteDialogOpen(false); onOpenChange(false); },
      });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto">
          {invoice && !isLoading ? (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-lg">
                      {invoice.invoiceNumber || t('detail.no_number_yet')}
                    </SheetTitle>
                    <Badge className={STATUS_COLOR[invoice.status]} variant="secondary">
                      {t(`status.${invoice.status}`)}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {invoice.status === 'draft' && (
                        <DropdownMenuItem onClick={handlePost}>{t('actions.post')}</DropdownMenuItem>
                      )}
                      {invoice.status === 'posted' && (
                        <DropdownMenuItem onClick={() => setVoidDialogOpen(true)}>{t('actions.void')}</DropdownMenuItem>
                      )}
                      {invoice.status === 'draft' && (
                        <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                          {t('actions.delete')}
                        </DropdownMenuItem>
                      )}
                      {invoice.saleId && (
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/sales/${invoice.saleId}`)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t('actions.open_sale')}
                        </DropdownMenuItem>
                      )}
                      {invoice.serviceOrderId && (
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/service-orders/${invoice.serviceOrderId}`)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t('actions.open_service_order')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">{t('columns.issue_date')}</div>
                  <div>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t('columns.due_date')}</div>
                  <div>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</div>
                </div>
                {invoice.saleId && (
                  <div>
                    <div className="text-muted-foreground">{t('detail.sale')}</div>
                    <div>#{invoice.saleId}</div>
                  </div>
                )}
                {invoice.serviceOrderId && (
                  <div>
                    <div className="text-muted-foreground">{t('detail.service_order')}</div>
                    <div>#{invoice.serviceOrderId}</div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">{t('detail.lines')}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.number')}</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{formatSaleItemLabel(line.itemName)}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">{format(line.unitPrice)}</TableCell>
                        <TableCell className="text-right">{format(line.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              <div className="space-y-1 text-sm ml-auto max-w-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('detail.subtotal')}</span><span>{format(invoice.subtotal)} {invoice.currency}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('detail.tax')}</span><span>{format(invoice.taxAmount)} {invoice.currency}</span></div>
                <div className="flex justify-between font-semibold"><span>{t('detail.grand_total')}</span><span>{format(invoice.grandTotal)} {invoice.currency}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('detail.amount_paid')}</span><span>{format(invoice.amountPaid)} {invoice.currency}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('detail.amount_due')}</span><span>{format(invoice.amountDue)} {invoice.currency}</span></div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">{t('detail.payments')}</h4>
                <PaymentsTab
                  entityType="invoice"
                  entityId={String(invoice.id)}
                  entityNumber={invoice.invoiceNumber}
                  totalAmount={invoice.grandTotal}
                  currency={invoice.currency}
                />
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">…</div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={voidDialogOpen} onOpenChange={(o) => { setVoidDialogOpen(o); if (!o) setVoidReason(''); }}>
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
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>{t('actions.cancel')}</Button>
            <Button variant="destructive" onClick={handleVoidConfirm} disabled={!voidReason.trim() || voidMutation.isPending}>{t('actions.void')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm.delete_title')}</DialogTitle>
            <DialogDescription>{t('confirm.delete_body')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>{t('actions.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InvoiceDetailDrawer;
