import { useCurrency } from '@/shared/hooks/useCurrency';
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Save, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { purchaseOrderService, goodsReceiptService, newIdempotencyKey } from "../services/purchaseService";
import { toastApiError } from "../utils/apiErrorToast";

import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { TenantSelector } from "@/components/TenantSelector";
import { useTargetTenant } from "@/hooks/useTargetTenant";
import type { PurchaseOrder } from "../types";
import { formatPurchaseDate, formatPaymentTerms } from '../utils/format';

export default function CreateGoodsReceiptPage() {
  const { t } = useTranslation('purchases');
  const { current: currency } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPoId = searchParams.get('poId') || '';
  const { targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();

  const [poId, setPoId] = useState(preselectedPoId);
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryNoteRef, setDeliveryNoteRef] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  // See CreatePurchaseOrderPage for the idempotency contract.
  const idempotencyKeyRef = useRef<string>(newIdempotencyKey());

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<{ poItemId: string; articleName: string; articleNumber: string; orderedQty: number; alreadyReceived: number; quantityReceived: number; quantityRejected: number; rejectionReason: string }[]>([]);

  // Fetch pending POs — re-runs when the target tenant changes so the dropdown
  // only lists POs belonging to the selected company. Without this, the receipt
  // POST is rejected because the chosen PO is in a different tenant than the
  // X-Target-Tenant header on submit.
  useEffect(() => {
    if (!preselectedPoId) setPoId('');
    const fetchPOs = async () => {
      try {
        const [ordered, partial] = await Promise.all([
          purchaseOrderService.getAll({ status: 'ordered' as any, limit: 100 }),
          purchaseOrderService.getAll({ status: 'partially_received' as any, limit: 100 }),
        ]);
        setPendingPOs([...(ordered.orders || []), ...(partial.orders || [])]);
      } catch (e: any) {
        toastApiError(e, t, { fallback: t('common.error', 'Failed to load purchase orders') as string });
      }
    };
    fetchPOs();
  }, [targetTenantId, preselectedPoId]);

  // Load PO items when selection changes
  useEffect(() => {
    if (!poId) { setSelectedPO(null); setItems([]); return; }
    purchaseOrderService.getById(poId).then(po => {
      setSelectedPO(po);
      setItems(po.items.map(item => ({
        poItemId: item.id,
        articleName: item.articleName || item.description,
        articleNumber: item.articleNumber || '',
        orderedQty: item.quantity,
        alreadyReceived: item.receivedQty,
        quantityReceived: Math.max(0, item.quantity - item.receivedQty),
        quantityRejected: 0,
        rejectionReason: '',
      })).filter(item => item.orderedQty > item.alreadyReceived));
    }).catch((e: any) => toastApiError(e, t, { fallback: t('common.error', 'Failed to load the purchase order') as string }));
  }, [poId]);

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleSave = async () => {
    if (isTenantRequired) { toast.error(t('validation.tenantRequired', 'Please select a target company')); return; }
    if (!poId) { toast.error(t('validation.poRequired')); return; }
    if (items.length === 0) { toast.error(t('validation.itemsRequired')); return; }
    if (items.some(i => !Number.isFinite(i.quantityReceived) || i.quantityReceived < 0 || !Number.isFinite(i.quantityRejected) || i.quantityRejected < 0)) {
      toast.error(t('validation.quantityNegative', 'Quantities cannot be negative'));
      return;
    }
    if (items.every(i => i.quantityReceived === 0 && i.quantityRejected === 0)) {
      toast.error(t('validation.receiveAtLeastOne'));
      return;
    }
    // Block over-receipt: received AND rejected both consume the remaining ordered
    // quantity, so the combined figure — not just quantityReceived — must fit.
    const overReceived = items.find(i => i.quantityReceived + i.quantityRejected > (i.orderedQty - i.alreadyReceived));
    if (overReceived) {
      toast.error(`${t('validation.overReceived')} — ${overReceived.articleName}`);
      return;
    }
    const missingReason = items.find(i => i.quantityRejected > 0 && !i.rejectionReason.trim());
    if (missingReason) {
      toast.error(`${t('validation.rejectionReasonRequired', 'A rejection reason is required')} — ${missingReason.articleName}`);
      return;
    }

    setSaving(true);
    try {
      await goodsReceiptService.create({
        purchaseOrderId: poId,
        // Send as UTC ISO so the backend's Npgsql can store it in `timestamp with time zone`.
        receiptDate: new Date(`${receiptDate}T00:00:00Z`).toISOString(),
        deliveryNoteRef: deliveryNoteRef || undefined,
        notes: notes || undefined,
        items: items.filter(i => i.quantityReceived > 0 || i.quantityRejected > 0).map(i => ({
          purchaseOrderItemId: i.poItemId,
          quantityReceived: i.quantityReceived,
          quantityRejected: i.quantityRejected,
          rejectionReason: i.rejectionReason || undefined,
        })),
      } as any, { idempotencyKey: idempotencyKeyRef.current });
      toast.success(t('receipts.created'));
      navigate('/dashboard/purchases/receipts');
    } catch (e: any) {
      // Rotate on failure so retry after a fix isn't short-circuited to the
      // failed record on the server.
      idempotencyKeyRef.current = newIdempotencyKey();
      toastApiError(e, t, { fallback: t('common.error', 'Failed') as string });
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('receipts.createTitle')}
        icon={Package}
        backTo={{ to: '/dashboard/purchases/receipts', label: t('receipts.title') }}
        actions={
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {t('actions.save')}
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4">
        <TenantSelector value={targetTenantId} onChange={handleTenantChange} />
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('receipts.selectPO')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">{t('fields.orderNumber')}</Label>
                <Select value={poId} onValueChange={setPoId}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue placeholder={t('receipts.choosePO')} /></SelectTrigger>
                  <SelectContent>
                    {/* Merge the pre-selected PO (from ?poId=) into the options —
                        otherwise Radix renders the placeholder when that order
                        isn't in the pending page (paging/tenant/status window)
                        and the trigger looks empty even though poId is set. */}
                    {[
                      ...(selectedPO && !pendingPOs.some(p => String(p.id) === String(selectedPO.id)) ? [selectedPO] : []),
                      ...pendingPOs,
                    ].map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.orderNumber} — {p.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>
              {selectedPO && (
                <div className="p-2 rounded bg-muted/50 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.supplier')}</span><span className="font-medium">{selectedPO.supplierName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.date')}</span><span>{formatPurchaseDate(selectedPO.orderDate)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.total')}</span><span>{selectedPO.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency.code}</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('detail.receiptInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="text-xs">{t('fields.date')}</Label><Input type="date" className="h-8 mt-1" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} /></div>
              <div><Label className="text-xs">{t('fields.deliveryNote')}</Label><Input className="h-8 mt-1" value={deliveryNoteRef} onChange={e => setDeliveryNoteRef(e.target.value)} placeholder="BL-XXX-YYYYMMDD" /></div>
              <div><Label className="text-xs">{t('fields.notes')}</Label><Textarea className="mt-1 text-xs min-h-[60px]" value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('receipts.itemsToReceive')}</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('fields.article')}</TableHead>
                  <TableHead className="text-xs text-center">{t('fields.orderedQty')}</TableHead>
                  <TableHead className="text-xs text-center">{t('receipts.alreadyReceived')}</TableHead>
                  <TableHead className="text-xs text-center w-24">{t('fields.receivedQty')}</TableHead>
                  <TableHead className="text-xs text-center w-24">{t('fields.rejectedQty')}</TableHead>
                  <TableHead className="text-xs">{t('receipts.rejectionReason')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
                  const remaining = item.orderedQty - item.alreadyReceived;
                  const over = item.quantityReceived + item.quantityRejected > remaining;
                  const negative = item.quantityReceived < 0 || item.quantityRejected < 0;
                  const invalid = over || negative;
                  return (
                  <TableRow key={item.poItemId}>
                    <TableCell>
                      <div className="text-xs font-medium">{item.articleName}</div>
                      <div className="text-px-10 text-muted-foreground">{item.articleNumber}</div>
                      {invalid && (
                        <div className="text-[10px] text-destructive mt-0.5">
                          {negative
                            ? t('validation.quantityNegative', 'Quantities cannot be negative')
                            : `${t('validation.overReceived')} (${t('receipts.remaining', 'remaining')}: ${remaining})`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-center">{item.orderedQty}</TableCell>
                    <TableCell className="text-xs text-center text-muted-foreground">{item.alreadyReceived}</TableCell>
                    <TableCell>
                      <Input type="number" className={`h-7 text-xs w-20 mx-auto ${invalid ? 'border-destructive' : ''}`} min={0} max={remaining}
                        aria-invalid={invalid}
                        value={item.quantityReceived} onChange={e => updateItem(idx, 'quantityReceived', Number(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" className={`h-7 text-xs w-20 mx-auto ${invalid ? 'border-destructive' : ''}`} min={0}
                        aria-invalid={invalid}
                        value={item.quantityRejected} onChange={e => updateItem(idx, 'quantityRejected', Number(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      {item.quantityRejected > 0 && (
                        <Input className="h-7 text-xs" placeholder={t('receipts.rejectionReasonPlaceholder')}
                          value={item.rejectionReason} onChange={e => updateItem(idx, 'rejectionReason', e.target.value)} />
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    {t('receipts.selectPOFirst')}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
