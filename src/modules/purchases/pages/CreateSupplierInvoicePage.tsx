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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, FilePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RS_TRANSACTION_TYPES } from "@/modules/shared/types/retenue-source";
import { TejOperationCodePicker } from "@/modules/shared/components/TejOperationCodePicker";
import { legacyToTejOperationCode } from "@/modules/shared/constants/tejOperationCodes";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { supplierInvoiceService, purchaseOrderService, newIdempotencyKey } from "../services/purchaseService";
import { computeDocumentTotals, money } from "../utils/totals";
import { toastApiError } from "../utils/apiErrorToast";

import { apiFetch } from "@/services/api/apiClient";
import { TenantSelector } from "@/components/TenantSelector";
import { useTargetTenant } from "@/hooks/useTargetTenant";


interface SupplierOption { id: string; name: string; mf?: string; }

export default function CreateSupplierInvoicePage() {
  const { t } = useTranslation('purchases');
  const { current: currency } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // When arriving from a purchase order ("Create Invoice" on the PO), keep the
  // link so the invoice shows on the PO and feeds its aggregated TEJ XML.
  const poId = searchParams.get('poId') || '';
  const { targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  // Switching company wipes the supplier + every entered line (IDs are
  // tenant-scoped), so confirm before throwing away typed work.
  const confirmTenantChange = (next: number) => {
    if (next !== targetTenantId && items.length > 0 &&
        !window.confirm(t('receipts.confirmTenantSwitch', 'Switching company clears the supplier and all entered lines. Continue?') as string)) {
      return;
    }
    handleTenantChange(next);
  };
  const [supplierId, setSupplierId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [supplierRef, setSupplierRef] = useState('');
  const [rsApplicable, setRsApplicable] = useState(false);
  const [rsTypeCode, setRsTypeCode] = useState('10');
  const [rsOperationCode, setRsOperationCode] = useState<string>('RS1_000002');
  // SupplierInvoiceItem has NO per-line discount field on the backend, so we
  // intentionally don't expose one here — anything we sent would be silently
  // dropped, leaving the persisted invoice priced higher than the preview.
  const [items, setItems] = useState<{ id: string; description: string; quantity: number; unitPrice: number; taxRate: number; lineTotal: number }[]>([]);
  const [fiscalStamp, setFiscalStamp] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  // See CreatePurchaseOrderPage for the idempotency contract.
  const idempotencyKeyRef = useRef<string>(newIdempotencyKey());

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierFilter, setSupplierFilter] = useState('');

  // Re-fetch suppliers when the target tenant changes — apiFetch attaches the
  // X-Target-Tenant header from the global store, so this scopes the dropdown
  // to suppliers that belong to the selected company. Without this, the create
  // POST is rejected with 404 "Supplier not found" because the chosen supplier
  // belongs to a different tenant than the X-Target-Tenant on submit.
  useEffect(() => {
    setSupplierId('');
    apiFetch<any>('/api/contacts?type=supplier&limit=500').then(res => {
      const data = res?.data?.contacts || res?.data || [];
      setSuppliers(data.map((c: any) => ({ id: String(c.id), name: c.name, mf: c.matriculeFiscale })));
    }).catch((e: any) => toastApiError(e, t, { fallback: t('common.error', 'Failed to load suppliers') as string }));
  }, [targetTenantId]);

  // Prefill from the originating purchase order: supplier + its lines, so the
  // invoice matches the order instead of being retyped by hand.
  const [poNumber, setPoNumber] = useState('');
  useEffect(() => {
    if (!poId) return;
    purchaseOrderService.getById(poId).then(po => {
      if (!po) return;
      setPoNumber(po.orderNumber || '');
      if (po.supplierId) setSupplierId(String(po.supplierId));
      setItems((po.items || []).map((it: any, idx: number) => ({
        id: `po-${it.id ?? idx}`,
        description: it.description || it.articleName || '',
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        taxRate: Number(it.taxRate ?? 19),
        lineTotal: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      })));
    }).catch((e: any) => toastApiError(e, t, { fallback: t('common.error', 'Failed to load the purchase order') as string }));
  }, [poId, targetTenantId]);



  const addItem = () => setItems([...items, { id: `i-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, taxRate: 19, lineTotal: 0 }]);
  // Sanitize numeric inputs: Number('') / Number('-') yields NaN, which would
  // flow into lineTotal and serialize as null in the POST body.
  const num = (v: any) => (Number.isFinite(v) ? (v as number) : 0);
  const updateItem = (i: number, f: string, v: any) => {
    const u = [...items];
    (u[i] as any)[f] = f === 'description' ? v : num(v);
    const qty = u[i].quantity || 0;
    const price = u[i].unitPrice || 0;
    // Backend formula: LineTotal = quantity * unitPrice (tax-exclusive, no per-line discount).
    u[i].lineTotal = qty * price;
    setItems(u);
  };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  // Totals come from the shared, backend-mirroring calculator (utils/totals) so
  // the preview can never drift from what RecalculateInvoiceTotalsAsync persists.
  const rsRate = RS_TRANSACTION_TYPES.find(r => r.code === rsTypeCode)?.rate || 0;
  const preRs = computeDocumentTotals(items, { fiscalStamp, defaultTaxRate: 0 });
  const rsAmount = rsApplicable ? money(preRs.subtotal * (rsRate / 100)) : 0;
  const { subtotal, taxAmount, grandTotal } = computeDocumentTotals(items, {
    fiscalStamp,
    rsAmount,
    defaultTaxRate: 0,
  });
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  const handleSave = async () => {
    if (isTenantRequired) { toast.error(t('validation.tenantRequired', 'Please select a target company')); return; }
    if (!supplierId) { toast.error(t('validation.supplierRequired')); return; }
    if (!dueDate) { toast.error(t('validation.dueDateRequired', 'Due date is required')); return; }
    if (items.length === 0) { toast.error(t('validation.itemsRequired')); return; }
    if (items.some(i => !i.description?.trim())) { toast.error(t('validation.descriptionRequired', 'Each item needs a description')); return; }
    if (items.some(i => !Number.isFinite(i.quantity) || i.quantity <= 0)) { toast.error(t('validation.quantityPositive', 'Each item needs a quantity greater than 0')); return; }
    if (items.some(i => !Number.isFinite(i.unitPrice) || i.unitPrice < 0)) { toast.error(t('validation.pricePositive', 'Unit price cannot be negative')); return; }
    if (items.some(i => !Number.isFinite(i.taxRate ?? 0) || (i.taxRate ?? 0) < 0 || (i.taxRate ?? 0) > 100)) { toast.error(t('validation.taxRateRange', 'Tax rate must be between 0 and 100')); return; }
    if (!Number.isFinite(fiscalStamp) || fiscalStamp < 0) { toast.error(t('validation.fiscalStampNegative', 'Fiscal stamp cannot be negative')); return; }
    if (invoiceDate && dueDate < invoiceDate) { toast.error(t('validation.dueBeforeInvoice', 'Due date cannot be before the invoice date')); return; }
    setSaving(true);
    try {
      await supplierInvoiceService.create({
        supplierId,
        purchaseOrderId: poId || undefined,
        invoiceDate: new Date(`${invoiceDate}T00:00:00Z`).toISOString(),
        dueDate: new Date(`${dueDate}T00:00:00Z`).toISOString(),
        supplierInvoiceRef: supplierRef || undefined,
        currency: currency.code,
        discount: 0,
        discountType: 'fixed',
        fiscalStamp,
        rsApplicable,
        rsTypeCode: rsApplicable ? rsTypeCode : undefined,
        rsOperationCode: rsApplicable ? rsOperationCode : undefined,
        items: items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate ?? 19,
          lineTotal: item.lineTotal,
          displayOrder: idx,
        })),
      }, { idempotencyKey: idempotencyKeyRef.current });
      toast.success(t('invoices.created'));
      navigate('/dashboard/purchases/invoices');
    } catch (e: any) {
      // Rotate the key so a resubmit after fixing a duplicate ref / validation
      // error isn't collapsed onto the failed attempt.
      idempotencyKeyRef.current = newIdempotencyKey();
      toastApiError(e, t, { fallback: t('common.error', 'Failed') as string });
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('invoices.createTitle')}
        icon={FilePlus}
        backTo={{ to: '/dashboard/purchases/invoices', label: t('invoices.title') }}
        actions={
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Save className="h-4 w-4 me-1" />}
            {t('actions.save')}
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4">
        <TenantSelector value={targetTenantId} onChange={confirmTenantChange} />
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('create.invoiceInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="text-xs">{t('fields.supplier')}</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue placeholder={t('create.selectSupplier')} /></SelectTrigger>
                  <SelectContent>
                    <div className="p-1.5 sticky top-0 bg-popover z-10 border-b">
                      <Input
                        autoFocus
                        placeholder={t('create.searchSuppliers', 'Search suppliers…')}
                        value={supplierFilter}
                        onChange={e => setSupplierFilter(e.target.value)}
                        onKeyDown={e => e.stopPropagation()}
                        className="h-7 text-xs"
                      />
                    </div>
                    {suppliers
                      .filter(s => !supplierFilter || s.name.toLowerCase().includes(supplierFilter.toLowerCase()))
                      .slice(0, 200)
                      .map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    {suppliers.filter(s => !supplierFilter || s.name.toLowerCase().includes(supplierFilter.toLowerCase())).length === 0 && (
                      <div className="px-2 py-3 text-xs text-muted-foreground text-center">{t('create.noSuppliersMatch', 'No suppliers match')}</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {poNumber && (
                <p className="text-xs text-muted-foreground">{t('fields.purchaseOrder', 'Purchase Order')}: {poNumber}</p>
              )}
              <div><Label className="text-xs">{t('fields.supplierInvoiceRef')}</Label><Input className="h-8 mt-1" value={supplierRef} onChange={e => setSupplierRef(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">{t('fields.invoiceDate')}</Label><Input type="date" className="h-8 mt-1" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
                <div><Label className="text-xs">{t('fields.dueDate')}</Label><Input type="date" className="h-8 mt-1" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('compliance.rs')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('compliance.applicable')}</Label>
                <Switch checked={rsApplicable} onCheckedChange={setRsApplicable} />
              </div>
              {rsApplicable && (
                <>
                  <div><Label className="text-xs">{t('compliance.rsType')}</Label>
                    <Select value={rsTypeCode} onValueChange={(v) => {
                      setRsTypeCode(v);
                      setRsOperationCode(legacyToTejOperationCode(v));
                    }}>
                      <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{RS_TRANSACTION_TYPES.map(r => <SelectItem key={r.code} value={r.code}>{r.rate}% - {r.labelFr}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <TejOperationCodePicker
                    value={rsOperationCode}
                    onChange={(code) => setRsOperationCode(code)}
                    purchaseOnly
                  />
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
                    <p className="font-medium text-amber-700 dark:text-amber-400">{t('compliance.rsAmount')}: {fmt(rsAmount)} {currency.code}</p>
                    <p className="text-px-10 text-muted-foreground mt-1">{t('compliance.rsNote')}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{t('create.items')}</CardTitle>
            <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3.5 w-3.5 me-1" /> {t('create.addItem')}</Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[560px]">
              <TableHeader><TableRow>
                <TableHead className="text-xs min-w-[180px]">{t('fields.description')}</TableHead>
                <TableHead className="text-xs w-20">{t('fields.quantity')}</TableHead>
                <TableHead className="text-xs w-24">{t('fields.unitPrice')}</TableHead>
                <TableHead className="text-xs w-20">{t('fields.tax', 'Tax')} %</TableHead>
                <TableHead className="text-xs text-end">{t('fields.lineTotal')}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell><Input className="h-7 text-xs" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} /></TableCell>
                    <TableCell><Input type="number" min="0" step="0.01" className="h-7 text-xs w-16" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} /></TableCell>
                    <TableCell><Input type="number" min="0" step="0.01" className="h-7 text-xs w-20" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} /></TableCell>
                    <TableCell><Input type="number" min="0" max="100" step="0.01" className="h-7 text-xs w-16" value={item.taxRate} onChange={e => updateItem(idx, 'taxRate', Number(e.target.value))} /></TableCell>
                    <TableCell className="text-xs text-end font-medium">{fmt(item.lineTotal)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(idx)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">{t('create.noItems')}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-end">
              <div className="w-72 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.subtotal')}</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.tax')}</span><span>{fmt(taxAmount)}</span></div>
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground m-0">{t('fields.fiscalStamp')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-7 w-24 text-xs text-end"
                    value={fiscalStamp}
                    onChange={e => setFiscalStamp(Number(e.target.value) || 0)}
                  />
                </div>
                {rsApplicable && (
                  <div className="flex justify-between text-amber-600">
                    <span>{t('fields.rsDeduction')} ({rsRate}%)</span>
                    <span>-{fmt(rsAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-sm"><span>{t('fields.grandTotal')}</span><span>{fmt(grandTotal)} {currency.code}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
