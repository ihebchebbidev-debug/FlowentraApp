import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Scale, Send } from 'lucide-react';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useSaleReconciliation } from '../hooks/useSaleReconciliation';
import { getPostGate } from '../utils/reconciliation';
import { ReconciliationFindingList } from './ReconciliationFindingList';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  saleId?: number | null;
  isPosting?: boolean;
  onConfirm: () => void;
}

/**
 * Pre-post reconciliation gate. Compares the parent sale's totals against every
 * invoice generated from it and refuses to post while a hard mismatch exists;
 * soft mismatches must be explicitly acknowledged.
 *
 * An invoice with no parent sale has nothing to reconcile, so posting proceeds
 * with a plain confirmation.
 */
export function PostInvoiceReconciliationDialog({
  open, onOpenChange, invoiceId, saleId, isPosting, onConfirm,
}: Props) {
  const { t } = useTranslation('invoices');
  const navigate = useNavigate();
  const { format, current: currencyInfo } = useCurrency();
  const [acknowledged, setAcknowledged] = useState(false);

  const { result, isLoading } = useSaleReconciliation(open && saleId ? saleId : null);

  const gate = useMemo(() => (result ? getPostGate(result, invoiceId) : null), [result, invoiceId]);

  const money = (amount?: number | null) => {
    const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
    return value === 0 ? `0 ${result?.currency || currencyInfo.code}` : format(value);
  };

  const noSale = !saleId;
  const blocked = !!gate && !gate.canPost;
  const needsAck = !!gate?.requiresAcknowledgement;
  const canConfirm = !isPosting && !isLoading && !blocked && (!needsAck || acknowledged);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setAcknowledged(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            {t('reconciliation.gate_title', 'Reconcile before posting')}
          </DialogTitle>
          <DialogDescription>
            {noSale
              ? t('reconciliation.gate_no_sale', 'This invoice has no parent sale, so there is nothing to reconcile.')
              : t('reconciliation.gate_body', 'Posting is final. The sale total is compared with every invoice generated from it.')}
          </DialogDescription>
        </DialogHeader>

        {!noSale && (isLoading || !result || !gate) ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : !noSale && result && gate ? (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-xs">{t('reconciliation.sale_total', 'Sale total')}</p>
                <p className="font-medium text-foreground">{money(result.sale.grandTotal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('reconciliation.invoiced', 'Invoiced')}</p>
                <p className="font-medium text-foreground">{money(result.invoicedTotal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">
                  {result.remaining < 0
                    ? t('reconciliation.over_by', 'Over-invoiced by')
                    : t('reconciliation.remaining', 'Left to invoice')}
                </p>
                <p className={`font-medium ${result.remaining < -0.01 ? 'text-destructive' : 'text-foreground'}`}>
                  {money(Math.abs(result.remaining))}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('sale_tab.coverage')}</p>
                <p className="font-medium text-foreground">{result.coveragePct.toFixed(0)}%</p>
              </div>
            </div>

            <Separator />

            <ReconciliationFindingList
              findings={[...gate.blocking, ...gate.warnings, ...gate.infos]}
              emptyLabel={t('reconciliation.gate_ok', 'Sale and invoices match — safe to post.')}
            />

            {needsAck && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
                <Checkbox
                  id="recon-ack"
                  checked={acknowledged}
                  onCheckedChange={(v) => setAcknowledged(v === true)}
                />
                <Label htmlFor="recon-ack" className="text-sm text-amber-700 dark:text-amber-400 leading-snug">
                  {t('reconciliation.acknowledge', 'I reviewed the differences above and want to post anyway.')}
                </Label>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('actions.cancel')}</Button>
          {!noSale && result && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/dashboard/invoices/${invoiceId}/reconciliation`)}
            >
              <Scale className="h-4 w-4" />
              {t('reconciliation.open_screen', 'Open reconciliation')}
            </Button>
          )}
          <Button className="gap-2" disabled={!canConfirm} onClick={handleConfirm}>
            <Send className="h-4 w-4" />
            {blocked ? t('reconciliation.blocked', 'Resolve mismatches first') : t('actions.post')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PostInvoiceReconciliationDialog;
