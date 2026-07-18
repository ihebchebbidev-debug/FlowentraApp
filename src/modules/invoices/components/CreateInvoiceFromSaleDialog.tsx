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

  useEffect(() => {
    if (!open) return;
    setSelectedSaleId(null);
    setLoading(true);
    salesApi
      .getAll({ contactId, limit: 100 })
      .then(async (res) => {
        const allSales = res.data.sales.filter((s) => s.status !== 'cancelled');
        // Best-effort: exclude sales that already have a non-void invoice covering them fully.
        const eligible: Sale[] = [];
        for (const sale of allSales) {
          try {
            const existing = await customerInvoicesApi.list({ contactId, saleId: sale.id });
            const active = existing.data.filter((inv) => inv.status !== 'void');
            const totalInvoiced = active.reduce((sum, inv) => sum + inv.grandTotal, 0);
            if (!sale.totalAmount || totalInvoiced < sale.totalAmount) {
              eligible.push(sale);
            }
          } catch {
            eligible.push(sale);
          }
        }
        setSales(eligible);
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
                    {sale.saleNumber} — {sale.title}
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
