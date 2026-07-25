import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { salesApi, type Sale } from '@/services/api/salesApi';
import { customerInvoicesApi } from '@/services/api/customerInvoicesApi';
import { useInvoiceMutations } from '../hooks/useCustomerInvoices';

interface CreateInvoiceFromSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: number;
  onCreated: (invoiceId: number) => void;
}

export function CreateInvoiceFromSaleDialog({ open, onOpenChange, contactId, onCreated }: CreateInvoiceFromSaleDialogProps) {
  const { t } = useTranslation('invoices');
  const { createFromSale } = useInvoiceMutations();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

  const [eligible, setEligible] = useState<Array<{ sale: Sale; total: number; remaining: number }>>([]);

  useEffect(() => {
    if (!open) return;
    setSelectedSaleId(null);
    setLoading(true);
    // One list call for the contact's invoices instead of one per sale.
    Promise.all([
      salesApi.getAll({ contactId, limit: 100 }),
      customerInvoicesApi.list({ contactId, limit: 200 }).catch(() => ({ data: [] as any[] })),
    ])
      .then(([salesRes, invRes]) => {
        const invoicedBySale = new Map<number, number>();
        for (const invoice of invRes.data ?? []) {
          if (invoice.status === 'void' || !invoice.saleId) continue;
          invoicedBySale.set(invoice.saleId, (invoicedBySale.get(invoice.saleId) ?? 0) + (invoice.grandTotal ?? 0));
        }

        const rows = (salesRes.data.sales ?? [])
          .filter((s) => s.status !== 'cancelled')
          .map((sale) => {
            const total = (sale as any).grandTotal ?? sale.totalAmount ?? 0;
            const invoiced = invoicedBySale.get(sale.id) ?? 0;
            return { sale, total, remaining: total > 0 ? total - invoiced : 0 };
          })
          // Keep sales that still have something left to invoice (or no total yet).
          .filter((row) => row.total <= 0 || row.remaining > 0.009);

        setEligible(rows);
        setSales(rows.map((r) => r.sale));
      })
      .catch(() => {
        setEligible([]);
        setSales([]);
      })
      .finally(() => setLoading(false));
  }, [open, contactId]);

  const handleConfirm = () => {
    if (!selectedSaleId) return;
    createFromSale.mutate(
      { saleId: selectedSaleId },
      {
        onSuccess: (invoice) => onCreated(invoice.id),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('create_from_sale.title')}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">…</div>
        ) : sales.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('create_from_sale.no_eligible_sales')}
          </div>
        ) : (
          <div className="space-y-3">
            <Label>{t('create_from_sale.pick_sale')}</Label>
            <RadioGroup value={selectedSaleId ? String(selectedSaleId) : undefined} onValueChange={(v) => setSelectedSaleId(Number(v))}>
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center space-x-2 border rounded-md p-2">
                  <RadioGroupItem value={String(sale.id)} id={`sale-${sale.id}`} />
                  <Label htmlFor={`sale-${sale.id}`} className="flex-1 cursor-pointer">
                    <span className="block">{sale.saleNumber} — {sale.title}</span>
                    {(() => {
                      const row = eligible.find((r) => r.sale.id === sale.id);
                      if (!row || row.total <= 0) return null;
                      return (
                        <span className="block text-xs text-muted-foreground">
                          {t('create_from_sale.remaining', { defaultValue: 'Remaining to invoice' })}:{' '}
                          {row.remaining.toFixed(2)} {sale.currency || 'TND'}
                          {row.remaining < row.total && ` / ${row.total.toFixed(2)}`}
                        </span>
                      );
                    })()}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!selectedSaleId || createFromSale.isPending} onClick={handleConfirm}>
            {t('create_from_sale.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateInvoiceFromSaleDialog;
