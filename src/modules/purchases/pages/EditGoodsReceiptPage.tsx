import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Save, Package, Loader2, Trash2, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  goodsReceiptService,
  purchaseOrderService,
} from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { DetailSkeleton } from "../components/PurchaseSkeletons";
import { PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import type { GoodsReceipt, PurchaseOrder, PurchaseOrderItem } from "../types";

type EditRow = {
  id?: string;
  purchaseOrderItemId: string;
  articleName: string;
  articleNumber: string;
  orderedQty: number;
  poAlreadyReceivedExcludingThis: number;
  originalQuantityReceived: number;
  quantityReceived: number;
  quantityRejected: number;
  rejectionReason: string;
  notes: string;
};

export default function EditGoodsReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('purchases');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [receipt, setReceipt] = useState<GoodsReceipt | null>(null);
  const [po, setPo] = useState<PurchaseOrder | null>(null);

  const [receiptDate, setReceiptDate] = useState('');
  const [deliveryNoteRef, setDeliveryNoteRef] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<EditRow[]>([]);

  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const gr = await goodsReceiptService.getById(id);
        if (cancelled) return;
        setReceipt(gr);
        setReceiptDate(gr.receiptDate?.slice(0, 10) || '');
        setDeliveryNoteRef(gr.deliveryNoteRef || '');
        setNotes(gr.notes || '');

        const poData = await purchaseOrderService.getById(gr.purchaseOrderId);
        if (cancelled) return;
        setPo(poData);

        const poItemsById = new Map<string, PurchaseOrderItem>(
          poData.items.map(i => [i.id, i])
        );

        const initial: EditRow[] = gr.items.map(it => {
          const poItem = poItemsById.get(it.purchaseOrderItemId);
          const orderedQty = poItem?.quantity ?? it.orderedQty;
          const poReceived = poItem?.receivedQty ?? it.quantityReceived;
          return {
            id: it.id,
            purchaseOrderItemId: it.purchaseOrderItemId,
            articleName: it.articleName || poItem?.articleName || '',
            articleNumber: it.articleNumber || poItem?.articleNumber || '',
            orderedQty,
            poAlreadyReceivedExcludingThis: Math.max(0, poReceived - it.quantityReceived),
            originalQuantityReceived: it.quantityReceived,
            quantityReceived: it.quantityReceived,
            quantityRejected: it.quantityRejected,
            rejectionReason: it.rejectionReason || '',
            notes: it.notes || '',
          };
        });
        setRows(initial);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const addableLines = useMemo(() => {
    if (!po) return [];
    const usedPoItemIds = new Set(rows.map(r => r.purchaseOrderItemId));
    return po.items
      .filter(i => !usedPoItemIds.has(i.id))
      .filter(i => i.quantity - i.receivedQty > 0);
  }, [po, rows]);

  const updateRow = (idx: number, field: keyof EditRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      (next[idx] as any)[field] = value;
      return next;
    });
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const addRow = (poItem: PurchaseOrderItem) => {
    setRows(prev => [
      ...prev,
      {
        purchaseOrderItemId: poItem.id,
        articleName: poItem.articleName || poItem.description || '',
        articleNumber: poItem.articleNumber || '',
        orderedQty: poItem.quantity,
        poAlreadyReceivedExcludingThis: poItem.receivedQty,
        originalQuantityReceived: 0,
        quantityReceived: Math.max(0, poItem.quantity - poItem.receivedQty),
        quantityRejected: 0,
        rejectionReason: '',
        notes: '',
      },
    ]);
  };

  const validate = (): string | null => {
    for (const r of rows) {
      if (r.quantityReceived < 0 || r.quantityRejected < 0) {
        return t('validation.negativeQty', `Quantities cannot be negative (${r.articleName})`);
      }
      const remaining = r.orderedQty - r.poAlreadyReceivedExcludingThis;
      if (r.quantityReceived > remaining) {
        return t('validation.overReceived',
          `Cannot receive ${r.quantityReceived} for ${r.articleName} — only ${remaining} remaining on PO`);
      }
      if (r.quantityRejected > 0 && !r.rejectionReason.trim()) {
        return t('validation.rejectionReasonRequired',
          `Rejection reason required for ${r.articleName}`);
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!id) return;
    setServerError(null);
    const err = validate();
    if (err) { toast.error(err); setServerError(err); return; }

    // Submitting an empty items array tells the backend to REMOVE every existing
    // line and reverse all stock movements. Confirm before wiping the receipt.
    if (rows.length === 0 && (receipt?.items?.length ?? 0) > 0) {
      const ok = window.confirm(
        t('receipts.confirmEmpty',
          'You removed every line. Saving will delete all items on this receipt and reverse the stock movements. Continue?')
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      await goodsReceiptService.update(id, {
        receiptDate: receiptDate || undefined,
        deliveryNoteRef: deliveryNoteRef || undefined,
        notes: notes || undefined,
        items: rows.map(r => ({
          id: r.id,
          purchaseOrderItemId: r.purchaseOrderItemId,
          quantityReceived: r.quantityReceived,
          quantityRejected: r.quantityRejected,
          rejectionReason: r.rejectionReason || undefined,
          notes: r.notes || undefined,
        })),
      });
      toast.success(t('receipts.updated', 'Goods receipt updated'));
      navigate(`/dashboard/purchases/receipts/${id}`);
    } catch (e: any) {
      const msg = e?.message || t('common.error', 'Failed to update');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (loadError) return (
    <PurchaseErrorFallback
      error={loadError}
      backTo="/dashboard/purchases/receipts"
    />
  );
  if (!receipt) return (
    <PurchaseErrorFallback
      error={t('receipts.notFound')}
      backTo="/dashboard/purchases/receipts"
    />
  );

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('receipts.editTitle', `Edit ${receipt.receiptNumber}`)}
        icon={Package}
        backTo={{ to: `/dashboard/purchases/receipts/${receipt.id}`, label: receipt.receiptNumber }}
        actions={
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <Save className="h-4 w-4 mr-1" />}
            {t('actions.save')}
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4">
        {serverError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('detail.receiptInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">{t('fields.orderNumber')}</Label>
                <Input
                  className="h-8 mt-1"
                  value={receipt.purchaseOrderNumber || ''}
                  disabled
                />
              </div>
              <div>
                <Label className="text-xs">{t('fields.supplier')}</Label>
                <Input className="h-8 mt-1" value={receipt.supplierName} disabled />
              </div>
              <div>
                <Label className="text-xs">{t('fields.date')}</Label>
                <Input
                  type="date"
                  className="h-8 mt-1"
                  value={receiptDate}
                  onChange={e => setReceiptDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('detail.deliveryInfo', 'Delivery info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">{t('fields.deliveryNote')}</Label>
                <Input
                  className="h-8 mt-1"
                  value={deliveryNoteRef}
                  onChange={e => setDeliveryNoteRef(e.target.value)}
                  placeholder="BL-XXX-YYYYMMDD"
                />
              </div>
              <div>
                <Label className="text-xs">{t('fields.notes')}</Label>
                <Textarea
                  className="mt-1 text-xs min-h-[60px]"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{t('receipts.itemsToReceive')}</CardTitle>
            {addableLines.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">
                  {t('receipts.addLine', 'Add line')}
                </Label>
                <select
                  className="h-7 text-xs rounded-md border border-input bg-background px-2"
                  value=""
                  onChange={e => {
                    const picked = addableLines.find(l => l.id === e.target.value);
                    if (picked) addRow(picked);
                  }}
                >
                  <option value="">— {t('receipts.choose', 'Choose')} —</option>
                  {addableLines.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.articleName || l.description} ({l.quantity - l.receivedQty} {t('fields.remaining', 'remaining')})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('fields.article')}</TableHead>
                  <TableHead className="text-xs text-center">{t('fields.orderedQty')}</TableHead>
                  <TableHead className="text-xs text-center">
                    {t('receipts.maxForThisRow', 'Max here')}
                  </TableHead>
                  <TableHead className="text-xs text-center w-24">
                    {t('fields.receivedQty')}
                  </TableHead>
                  <TableHead className="text-xs text-center w-24">
                    {t('fields.rejectedQty')}
                  </TableHead>
                  <TableHead className="text-xs">{t('receipts.rejectionReason')}</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => {
                  const max = row.orderedQty - row.poAlreadyReceivedExcludingThis;
                  const overReceived = row.quantityReceived > max;
                  return (
                    <TableRow key={`${row.id ?? 'new'}-${row.purchaseOrderItemId}-${idx}`}>
                      <TableCell>
                        <div className="text-xs font-medium">{row.articleName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {row.articleNumber}
                          {!row.id && (
                            <span className="ml-2 text-primary">
                              · {t('receipts.newLine', 'new')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-center">{row.orderedQty}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">
                        {max}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className={`h-7 text-xs w-20 mx-auto ${overReceived ? 'border-destructive' : ''}`}
                          min={0}
                          max={max}
                          value={row.quantityReceived}
                          onChange={e => updateRow(idx, 'quantityReceived', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-7 text-xs w-20 mx-auto"
                          min={0}
                          value={row.quantityRejected}
                          onChange={e => updateRow(idx, 'quantityRejected', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        {row.quantityRejected > 0 && (
                          <Input
                            className="h-7 text-xs"
                            placeholder={t('receipts.rejectionReasonPlaceholder')}
                            value={row.rejectionReason}
                            onChange={e => updateRow(idx, 'rejectionReason', e.target.value)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeRow(idx)}
                          aria-label={t('actions.remove', 'Remove')}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                      {t('receipts.noLines', 'No lines on this receipt. All items will be removed on save.')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {addableLines.length > 0 && rows.length === 0 && (
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addRow(addableLines[0])}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t('receipts.addFirstLine', 'Add a line')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
