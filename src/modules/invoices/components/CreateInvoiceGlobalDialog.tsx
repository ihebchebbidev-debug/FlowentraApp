import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search } from 'lucide-react';
import { salesApi, type Sale } from '@/services/api/salesApi';
import { customerInvoicesApi } from '@/services/api/customerInvoicesApi';
import { useInvoiceMutations } from '../hooks/useCustomerInvoices';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (invoiceId: number) => void;
}

/**
 * Global "new invoice from sale" picker used in the top-level Invoices workspace.
 * Lists all eligible sales across contacts and creates a draft invoice.
 */
export function CreateInvoiceGlobalDialog({ open, onOpenChange, onCreated }: Props) {
  const { t } = useTranslation('invoices');
  const { createFromSale } = useInvoiceMutations();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedSaleId(null);
    setLoading(true);
    salesApi
      .getAll({ limit: 100 })
      .then((res) => {
        const eligible = res.data.sales.filter(
          (s) => s.status !== 'cancelled' && s.status !== 'invoiced'
        );
        setSales(eligible);
      })
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.saleNumber ?? '').toLowerCase().includes(q) ||
      (s.title ?? '').toLowerCase().includes(q) ||
      (s.contactName ?? '').toLowerCase().includes(q)
    );
  });

  const handleConfirm = () => {
    if (!selectedSaleId) return;
    const idNum = Number(selectedSaleId);
    if (Number.isNaN(idNum)) return;
    createFromSale.mutate(
      { saleId: idNum },
      { onSuccess: (invoice) => onCreated(invoice.id) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('create_from_sale.title')}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('create_from_sale.search_placeholder')}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('create_from_sale.no_eligible_sales')}
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <Label>{t('create_from_sale.pick_sale')}</Label>
            <RadioGroup value={selectedSaleId ? String(selectedSaleId) : undefined} onValueChange={(v) => setSelectedSaleId(Number(v))}>
              {filtered.map((sale) => (
                <div key={sale.id} className="flex items-center space-x-2 border rounded-md p-2">
                  <RadioGroupItem value={String(sale.id)} id={`gsale-${sale.id}`} />
                  <Label htmlFor={`gsale-${sale.id}`} className="flex-1 cursor-pointer text-sm">
                    <div className="font-medium">{sale.saleNumber ?? `#${sale.id}`} — {sale.title}</div>
                    <div className="text-xs text-muted-foreground">{sale.contactName ?? ''}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('actions.cancel')}</Button>
          <Button disabled={!selectedSaleId || createFromSale.isPending} onClick={handleConfirm}>
            {t('create_from_sale.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateInvoiceGlobalDialog;
