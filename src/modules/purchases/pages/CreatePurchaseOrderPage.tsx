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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, FilePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { purchaseOrderService, articleSupplierService, newIdempotencyKey } from "../services/purchaseService";
import { toastApiError } from "../utils/apiErrorToast";

import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { apiFetch } from "@/services/api/apiClient";
import { UNIT_OPTIONS, getUnitLabel } from "@/constants/units";
import { calculateDocumentTotal } from "@/lib/calculateTotal";
import { TenantSelector } from "@/components/TenantSelector";
import { useTargetTenant } from "@/hooks/useTargetTenant";
import type { PurchaseOrderItem, ArticleSupplier } from "../types";

interface SupplierOption { id: string; name: string; }

export default function CreatePurchaseOrderPage() {
  const { t } = useTranslation('purchases');
  const { current: currency } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Optional prefill query params:
  //   ?articleId=123          → from "low stock" action on Articles page
  //   ?serviceOrderId=456     → from Service Order detail "Create PO" action
  // Both are honoured below in dedicated effects.
  const prefillArticleId = searchParams.get('articleId') || '';
  const prefillServiceOrderId = searchParams.get('serviceOrderId') || '';
  const { targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('net30');
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<Partial<PurchaseOrderItem>[]>([]);
  const [fiscalStamp, setFiscalStamp] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [supplierArticles, setSupplierArticles] = useState<ArticleSupplier[]>([]);

  // Fetch suppliers (contacts with type=supplier). Re-runs when the target
  // company changes so the dropdown only shows suppliers belonging to that
  // tenant — otherwise the backend rejects POST with 404 "Supplier not found"
  // because the chosen supplier belongs to a different tenant than the
  // X-Target-Tenant header sent on submit.
  useEffect(() => {
    // Reset previously selected supplier and all line items when the target
    // tenant changes — supplier IDs and article IDs from the old company are
    // not valid in the new tenant's scope and would cause 404s on submit.
    setSupplierId('');
    setSupplierArticles([]);
    setItems([]);
    apiFetch<any>('/api/contacts?type=supplier&limit=500').then(res => {
      const raw = res?.data?.contacts || res?.data || [];
      // The backend may return either { name } (already concatenated) or
      // { firstName, lastName, companyName }. Build a clean display label and
      // collapse the common "X X" duplication that happens when first/last
      // name were both seeded with the company name.
      const cleanLabel = (c: any): string => {
        const company = String(c.companyName ?? '').trim();
        const first = String(c.firstName ?? '').trim();
        const last = String(c.lastName ?? '').trim();
        const fallback = String(c.name ?? '').trim();
        let label = company;
        if (!label) {
          if (first && last && first.toLowerCase() === last.toLowerCase()) {
            label = first;
          } else {
            label = [first, last].filter(Boolean).join(' ');
          }
        }
        if (!label) label = fallback;
        // Collapse adjacent duplicate words (e.g. "STE Plasticap STE Plasticap").
        label = label.replace(/\b(\S+(?:\s+\S+)*)\s+\1\b/gi, '$1').trim();
        return label;
      };
      const list: SupplierOption[] = Array.isArray(raw)
        ? raw.map((c: any) => ({ id: String(c.id), name: cleanLabel(c) }))
        : [];
      // Deduplicate by id first, then by normalized name to guard against
      // backend returning the same supplier twice (e.g. overlapping pages).
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      const unique: SupplierOption[] = [];
      for (const s of list) {
        if (!s.id || !s.name) continue;
        const nameKey = s.name.toLowerCase();
        if (seenIds.has(s.id) || seenNames.has(nameKey)) continue;
        seenIds.add(s.id);
        seenNames.add(nameKey);
        unique.push(s);
      }
      unique.sort((a, b) => a.name.localeCompare(b.name));
      setSuppliers(unique);
    }).catch(() => {
      toast.error(t('common.error', 'Failed to load suppliers'));
    });
  }, [targetTenantId]);

  // Fetch supplier articles when supplier changes
  useEffect(() => {
    if (!supplierId) { setSupplierArticles([]); return; }
    articleSupplierService.getBySupplier(supplierId).then(setSupplierArticles).catch(() => setSupplierArticles([]));
  }, [supplierId]);

  // Prefill from ?articleId — picks the article's preferred (or first active)
  // supplier, selects it, then drops one prefilled line for that article.
  // Runs once after suppliers are loaded so the supplier dropdown can resolve
  // the chosen id, and once supplierArticles arrive we patch the line price.
  useEffect(() => {
    if (!prefillArticleId || suppliers.length === 0 || supplierId) return;
    let cancelled = false;
    articleSupplierService.getByArticle(prefillArticleId)
      .then((rows) => {
        if (cancelled || !rows || rows.length === 0) return;
        const preferred = rows.find(r => r.isPreferred && r.isActive) || rows.find(r => r.isActive) || rows[0];
        if (!preferred) return;
        setSupplierId(String(preferred.supplierId));
        setItems([{
          id: `new-${Date.now()}`,
          articleId: String(prefillArticleId),
          articleName: preferred.articleName,
          articleNumber: preferred.articleNumber,
          supplierRef: preferred.supplierRef,
          quantity: Math.max(1, Number(preferred.minOrderQty) || 1),
          unitPrice: Number(preferred.purchasePrice) || 0,
          taxRate: 19,
          discount: 0,
          discountType: 'percentage',
          lineTotal: Math.max(1, Number(preferred.minOrderQty) || 1) * (Number(preferred.purchasePrice) || 0),
          unit: 'piece',
          displayOrder: 0,
        }]);
        if (preferred.leadTimeDays && !expectedDelivery) {
          const eta = new Date();
          eta.setDate(eta.getDate() + preferred.leadTimeDays);
          setExpectedDelivery(eta.toISOString().split('T')[0]);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillArticleId, suppliers.length]);

  // Prefill from ?serviceOrderId — set the title and notes so the user knows
  // this PO is linked to a service order. The actual FK is sent in handleSave.
  useEffect(() => {
    if (!prefillServiceOrderId) return;
    if (!title) setTitle(`SO #${prefillServiceOrderId}`);
    if (!notes) setNotes(t('orders.linkedToServiceOrder', { id: prefillServiceOrderId, defaultValue: `Linked to Service Order #${prefillServiceOrderId}` }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillServiceOrderId]);

  const addItem = () => {
    setItems([...items, { id: `new-${Date.now()}`, quantity: 1, unitPrice: 0, taxRate: 19, discount: 0, discountType: 'percentage', lineTotal: 0, unit: 'piece', displayOrder: items.length }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'articleId' && supplierId) {
      const as = supplierArticles.find(a => String(a.articleId) === String(value));
      if (as) {
        updated[index].unitPrice = as.purchasePrice;
        updated[index].supplierRef = as.supplierRef;
        updated[index].articleName = as.articleName;
        updated[index].articleNumber = as.articleNumber;
      }
    }
    const qty = updated[index].quantity || 0;
    const price = updated[index].unitPrice || 0;
    const disc = updated[index].discount || 0;
    const discType = updated[index].discountType || 'percentage';
    const subtotalItem = qty * price;
    const discountAmount = discType === 'percentage' ? subtotalItem * disc / 100 : disc;
    updated[index].lineTotal = subtotalItem - discountAmount;
    setItems(updated);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  // Keyboard-first PO builder. Global shortcuts use "latest ref" handlers so the
  // single window-level listener always sees current state without re-binding.
  const handleSaveRef = useRef<() => void>(() => {});
  const addItemRef = useRef<() => void>(() => {});
  // Stable idempotency key for this create screen. A double-click, network
  // retry, or React Strict-Mode double-invoke all send the same key → server
  // short-circuits to the already-created PO instead of writing a duplicate.
  // Regenerated only after a successful submit (see handleSave).
  const idempotencyKeyRef = useRef<string>(newIdempotencyKey());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl/Cmd+S → save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveRef.current();
        return;
      }
      // Alt+N → add a new line
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addItemRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Use the shared total calculator (same one used by offers/sales) so the rule
  // "Subtotal → Discount → TVA → Fiscal Stamp" stays consistent across modules.
  // Per-line tax rates are aggregated into a fixed taxAmount because the calculator
  // operates on a single tax rate.
  const subtotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const lineTaxAmount = items.reduce((sum, item) => {
    const rate = (item.taxRate ?? 19) / 100;
    return sum + (item.lineTotal || 0) * rate;
  }, 0);
  // The fiscal stamp only applies to an actual document — an empty form totals 0.
  const effectiveFiscalStamp = items.length > 0 ? fiscalStamp : 0;
  const totals = calculateDocumentTotal({
    subtotal,
    discount: 0,
    discountType: 'fixed',
    tax: lineTaxAmount,
    taxType: 'fixed',
    fiscalStamp: effectiveFiscalStamp,
  });
  const grandTotal = totals.total;
  const taxAmount = totals.taxAmount;
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  const handleSave = async () => {
    if (isTenantRequired) { toast.error(t('validation.tenantRequired', 'Please select a target company')); return; }
    if (!supplierId) { toast.error(t('validation.supplierRequired')); return; }
    if (items.length === 0) { toast.error(t('validation.itemsRequired')); return; }
    if (items.some(i => !i.articleId && !i.description?.trim())) {
      toast.error(t('validation.itemArticleOrDescription', 'Each line needs an article or a description'));
      return;
    }
    if (items.some(i => !i.quantity || i.quantity <= 0)) {
      toast.error(t('validation.quantityRequired', 'Quantity must be greater than zero'));
      return;
    }
    setSaving(true);
    try {
      await purchaseOrderService.create({
        title,
        supplierId,
        orderDate: new Date(`${orderDate}T00:00:00Z`).toISOString(),
        expectedDelivery: expectedDelivery ? new Date(`${expectedDelivery}T00:00:00Z`).toISOString() : undefined,
        paymentTerms,
        notes: notes || undefined,
        currency: currency.code,
        discount: 0,
        discountType: 'fixed',
        fiscalStamp,
        // Persist the link to the originating service order so traceability
        // works both ways (PO list can filter by SO, SO detail can show its POs).
        serviceOrderId: prefillServiceOrderId || undefined,
        items: items.map((item, idx) => ({
          ...item,
          id: undefined as any,
          purchaseOrderId: undefined as any,
          displayOrder: idx,
          receivedQty: 0,
        })) as any,
      } as any, { idempotencyKey: idempotencyKeyRef.current });
      toast.success(t('orders.created'));
      navigate('/dashboard/purchases/orders');
    } catch (e: any) {
      // Rotate the key so a user who fixes the input and resubmits doesn't hit
      // the server's short-circuit against the failed attempt.
      idempotencyKeyRef.current = newIdempotencyKey();
      toastApiError(e, t, { fallback: t('common.error', 'Failed to create order') as string });
    } finally {

      setSaving(false);
    }
  };

  // Keep the global-shortcut refs pointing at the freshest closures every render.
  handleSaveRef.current = () => { if (!saving) handleSave(); };
  addItemRef.current = addItem;

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('orders.createTitle')}
        icon={FilePlus}
        backTo={{ to: '/dashboard/purchases/orders', label: t('orders.title') }}
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
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('create.headerInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="text-xs">{t('fields.title')}</Label><Input className="h-8 mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('create.titlePlaceholder')} /></div>
              <div><Label className="text-xs">{t('fields.date')}</Label><Input type="date" className="h-8 mt-1" value={orderDate} onChange={e => setOrderDate(e.target.value)} /></div>
              <div><Label className="text-xs">{t('fields.expectedDelivery')}</Label><Input type="date" className="h-8 mt-1" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('create.supplierSelection')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">{t('fields.supplier')}</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue placeholder={t('create.selectSupplier')} /></SelectTrigger>
                  <SelectContent>
                    {/* In-list search keeps the dropdown usable when there are many suppliers. */}
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
              <div>
                <Label className="text-xs">{t('fields.paymentTerms')}</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">{t('paymentTermsOptions.immediate')}</SelectItem>
                    <SelectItem value="net30">{t('paymentTermsOptions.net30')}</SelectItem>
                    <SelectItem value="net60">{t('paymentTermsOptions.net60')}</SelectItem>
                    <SelectItem value="net90">{t('paymentTermsOptions.net90')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">{t('fields.notes')}</Label><Textarea className="mt-1 text-xs min-h-[60px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('create.notesPlaceholder')} /></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{t('create.items')}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-px-10 text-muted-foreground">
                {t('create.shortcutsHint', 'Alt+N add line · Enter next · Ctrl+S save')}
              </span>
              <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" /> {t('create.addItem')}</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs min-w-[200px]">{t('fields.article')}</TableHead>
                  <TableHead className="text-xs">{t('fields.supplierRef')}</TableHead>
                  <TableHead className="text-xs w-20">{t('fields.quantity')}</TableHead>
                  <TableHead className="text-xs w-24">{t('fields.unit', 'Unit')}</TableHead>
                  <TableHead className="text-xs w-24">{t('fields.unitPrice')}</TableHead>
                  <TableHead className="text-xs w-32">{t('fields.discount', 'Discount')}</TableHead>
                  <TableHead className="text-xs w-20">{t('fields.tax', 'Tax')} %</TableHead>
                  <TableHead className="text-xs text-right">{t('fields.lineTotal')}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {supplierId && supplierArticles.length > 0 ? (
                        <Select value={item.articleId || ''} onValueChange={v => updateItem(idx, 'articleId', v)}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder={t('create.selectArticle')} /></SelectTrigger>
                          <SelectContent>
                            {supplierArticles.map(sa => <SelectItem key={sa.articleId} value={sa.articleId}>{sa.articleName} ({sa.supplierRef})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input className="h-7 text-xs" placeholder={t('create.articleDescription')} value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} />
                      )}
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{item.supplierRef || '-'}</span></TableCell>
                    <TableCell><Input type="number" min="0" step="0.01" className="h-7 text-xs w-16" value={item.quantity ?? ''} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} /></TableCell>
                    <TableCell>
                      <Select value={item.unit || 'piece'} onValueChange={v => updateItem(idx, 'unit', v)}>
                        <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{getUnitLabel(u.value, t)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="0" step="0.01" className="h-7 text-xs w-20" value={item.unitPrice ?? ''} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} />
                      {(() => {
                        // Last-price hint: the supplier catalogue price for this article.
                        // Click to apply it to the line (one-tap correction).
                        const sa = item.articleId
                          ? supplierArticles.find(a => String(a.articleId) === String(item.articleId))
                          : null;
                        if (!sa || !sa.purchasePrice) return null;
                        const differs = Number(item.unitPrice ?? 0) !== Number(sa.purchasePrice);
                        return (
                          <button
                            type="button"
                            onClick={() => updateItem(idx, 'unitPrice', sa.purchasePrice)}
                            title={t('create.useLastPrice', 'Use last price')}
                            className={`block text-px-10 mt-0.5 hover:underline ${differs ? 'text-amber-600' : 'text-muted-foreground'}`}
                          >
                            {t('create.lastPrice', 'Last: {{price}} {{currency}}', { price: fmt(sa.purchasePrice), currency: sa.currency || currency.code })}
                          </button>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Input type="number" min="0" step="0.01" className="h-7 text-xs w-14" value={item.discount ?? 0} onChange={e => updateItem(idx, 'discount', Number(e.target.value))} />
                        <Select value={item.discountType || 'percentage'} onValueChange={v => updateItem(idx, 'discountType', v)}>
                          <SelectTrigger className="h-7 text-xs w-14 px-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">{currency.code}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min="0" max="100" step="0.01" className="h-7 text-xs w-16"
                        value={item.taxRate ?? 19}
                        onChange={e => updateItem(idx, 'taxRate', Number(e.target.value))}
                        onKeyDown={e => {
                          // Enter from the last cell of the last row appends a new line
                          // (keyboard-first entry); on earlier rows it just blurs.
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (idx === items.length - 1) addItem();
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">{fmt(item.lineTotal || 0)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(idx)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-6 text-xs text-muted-foreground">{t('create.noItems')}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-end">
              <div className="w-72 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.subtotal')}</span><span>{fmt(subtotal)} {currency.code}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.tax')}</span><span>{fmt(taxAmount)} {currency.code}</span></div>
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground m-0">{t('fields.fiscalStamp')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    className="h-7 w-24 text-xs text-right"
                    value={fiscalStamp}
                    onChange={e => setFiscalStamp(Number(e.target.value) || 0)}
                  />
                </div>
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
