import { computeLineTotal as sharedLineTotal } from "../utils/totals";
import { toastApiError } from "../utils/apiErrorToast";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Package, FileText, CheckCircle, User, Building2, MapPin, ClipboardList, Download, Pencil, Plus, Trash2, Save, X, Loader2, FileDown, LayoutDashboard, PackageCheck, Activity, AlertTriangle } from "lucide-react";
import { purchaseOrderService, goodsReceiptService, supplierInvoiceService } from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { DetailSkeleton } from "../components/PurchaseSkeletons";
import { PurchaseOrderPDFPreviewModal } from "../components/PurchaseOrderPDFPreviewModal";
import { PurchaseOrderStatusFlow } from "../components/PurchaseOrderStatusFlow";
import { ActivityTimeline, type TimelineEvent } from "../components/ActivityTimeline";
import { TejMissingInfoDialog } from "../components/TejMissingInfoDialog";
import { useCurrency } from "@/shared/hooks/useCurrency";
import { UNIT_OPTIONS, getUnitLabel } from "@/constants/units";
import { toast } from "sonner";
import type { PurchaseOrder, GoodsReceipt, SupplierInvoice, PurchaseActivity, PurchaseOrderItem } from "../types";
import { CreateActionButton } from '@/components/CreateActionButton';
import { formatPurchaseDate, formatPaymentTerms } from '../utils/format';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  validated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ordered: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  partially_received: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};


function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('purchases');
  const { current: currency } = useCurrency();
  const [activeTab, setActiveTab] = useState('overview');
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const { format: formatCurrency } = useCurrency();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [activities, setActivities] = useState<PurchaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Items edit mode (only available when status === 'draft')
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [draftItems, setDraftItems] = useState<Partial<PurchaseOrderItem>[]>([]);
  const [savingItems, setSavingItems] = useState(false);
  const [downloadingTej, setDownloadingTej] = useState(false);
  const [tejMissing, setTejMissing] = useState<string[]>([]);
  const [tejMissingOpen, setTejMissingOpen] = useState(false);

  const handleDownloadTejXml = async () => {
    if (!id) return;
    setDownloadingTej(true);
    try {
      await purchaseOrderService.downloadTejXml(id);
      toast.success(t('actions.tejXmlDownloaded', 'TEJ XML downloaded'));
      fetchData(); // refresh so linked invoices show as registered for TEJ
    } catch (e: any) {
      const missing: string[] = e?.missing || [];
      if (missing.length > 0) {
        setTejMissing(missing);
        setTejMissingOpen(true);
      } else {
        toastApiError(e, t, { fallback: t('common.error', 'Failed to generate the TEJ XML') as string });
      }
    } finally {
      setDownloadingTej(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [order, grData, siData, acts] = await Promise.all([
        purchaseOrderService.getById(id),
        goodsReceiptService.getAll({ purchase_order_id: id }).catch(() => ({ receipts: [] })),
        // Scope invoice fetch by PO id so we don't pull every invoice in the system.
        // Backend supports `purchase_order_id` filter; client-side filter is kept as a safety net.
        supplierInvoiceService.getAll({ purchaseOrderId: id, limit: 100 }).catch(() => ({ invoices: [] })),
        purchaseOrderService.getActivities(id).catch(() => []),
      ]);
      setPo(order);
      setReceipts(grData.receipts || []);
      setInvoices((siData.invoices || []).filter(i => String(i.purchaseOrderId) === id));
      setActivities(acts || []);
    } catch (e: any) {
      setError(e?.message || t('orders.notFound'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleValidate = async () => {
    if (!id) return;
    try {
      const updated = await purchaseOrderService.validate(id);
      setPo(updated);
      // Refresh so the activity timeline reflects the transition the server logged.
      fetchData();
      toast.success(t('actions.validated'));
    } catch (e: any) { toastApiError(e, t, { fallback: t('common.error', 'Failed') as string }); }
  };

  const handleSendToSupplier = async () => {
    if (!id) return;
    try {
      const updated = await purchaseOrderService.sendToSupplier(id);
      setPo(updated);
      // Refresh so the activity timeline reflects the transition the server logged.
      fetchData();
      toast.success(t('actions.sentToSupplier'));
    } catch (e: any) { toastApiError(e, t, { fallback: t('common.error', 'Failed') as string }); }
  };

  // ── Items edit mode ──
  // Shared with the create pages and mirrored on the backend — see utils/totals.
  const computeLineTotal = (it: Partial<PurchaseOrderItem>): number => sharedLineTotal(it);

  const startEditItems = () => {
    if (!po) return;
    setDraftItems(po.items.map(it => ({ ...it })));
    setIsEditingItems(true);
  };

  const cancelEditItems = () => {
    setIsEditingItems(false);
    setDraftItems([]);
  };

  const updateDraftItem = (idx: number, field: string, value: any) => {
    setDraftItems(prev => {
      const u = [...prev];
      (u[idx] as any)[field] = value;
      u[idx].lineTotal = computeLineTotal(u[idx]);
      return u;
    });
  };

  const addDraftItem = () => {
    setDraftItems(prev => [...prev, {
      id: `new-${Date.now()}` as any,
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 19,
      discount: 0,
      discountType: 'percentage',
      unit: 'piece',
      lineTotal: 0,
      receivedQty: 0,
      displayOrder: prev.length,
    } as Partial<PurchaseOrderItem>]);
  };

  const removeDraftItem = (idx: number) => {
    setDraftItems(prev => prev.filter((_, i) => i !== idx));
  };

  const saveItems = async () => {
    if (!id || !po) return;
    if (draftItems.some(it => !it.articleId && !it.description?.trim())) {
      toast.error(t('validation.itemArticleOrDescription', 'Each line needs an article or a description'));
      return;
    }
    if (draftItems.some(it => !it.quantity || Number(it.quantity) <= 0)) {
      toast.error(t('validation.quantityRequired', 'Quantity must be greater than zero'));
      return;
    }
    setSavingItems(true);
    try {
      const originalIds = new Set(po.items.map(i => String(i.id)));
      const draftIdsKept = new Set(
        draftItems.filter(d => !String(d.id).startsWith('new-')).map(d => String(d.id))
      );

      // 1) Delete removed items
      const toDelete = po.items.filter(orig => !draftIdsKept.has(String(orig.id)));
      // 2) Update existing
      const toUpdate = draftItems.filter(d => !String(d.id).startsWith('new-'));
      // 3) Create new
      const toCreate = draftItems.filter(d => String(d.id).startsWith('new-'));

      const buildItemPayload = (it: Partial<PurchaseOrderItem>) => ({
        articleId: it.articleId,
        articleName: it.articleName,
        articleNumber: it.articleNumber,
        supplierRef: it.supplierRef,
        description: it.description || '',
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        taxRate: Number(it.taxRate) || 0,
        discount: Number(it.discount) || 0,
        discountType: it.discountType || 'percentage',
        unit: it.unit || 'piece',
      });

      // Run all mutations in parallel and gather successes/failures separately so
      // a single failed update no longer blocks the others. Whatever the outcome,
      // we refetch from the server at the end so the UI always reflects ground truth.
      const deletePromises = toDelete.map(d => purchaseOrderService.deleteItem(id, String(d.id)));
      const updatePromises = toUpdate.map(u => purchaseOrderService.updateItem(id, String(u.id), buildItemPayload(u)));
      const createPromises = toCreate.map(c => purchaseOrderService.addItem(id, buildItemPayload(c)));

      const results = await Promise.allSettled([...deletePromises, ...updatePromises, ...createPromises]);
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (failedCount === 0) {
        toast.success(t('items.updated', 'Items updated'));
        setIsEditingItems(false);
        setDraftItems([]);
      } else if (failedCount === results.length) {
        toast.error(t('common.error', 'Failed to save items'));
      } else {
        toast.error(t('items.partialUpdate', '{{ok}} saved, {{fail}} failed — refreshing', {
          ok: results.length - failedCount,
          fail: failedCount,
        }));
        setIsEditingItems(false);
        setDraftItems([]);
      }
      await fetchData();
    } catch (e: any) {
      toastApiError(e, t, { fallback: t('common.error', 'Failed to save items') as string });
      // On unexpected failure, refresh too so the user isn't stuck with a stale draft.
      await fetchData();
    } finally {
      setSavingItems(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error) return <PurchaseErrorFallback error={error} onRetry={fetchData} backTo="/dashboard/purchases/orders" />;
  if (!po) return <PurchaseErrorFallback error={t('orders.notFound')} backTo="/dashboard/purchases/orders" />;

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  // Map the backend audit trail onto the shared inline timeline shape.
  const timelineEvents: TimelineEvent[] = activities.map((a) => ({
    id: a.id,
    action: a.activityType,
    description: a.description,
    at: a.performedAt,
    by: a.performedByName,
    oldValue: a.oldValue,
    newValue: a.newValue,
  }));

  const hasItems = (po.items?.length ?? 0) > 0;

  const handleStatusChange = async (next: string) => {

    if (!id || next === po.status) return;
    try {
      const updated = await purchaseOrderService.update(id, { status: next as any });
      setPo(updated);
      fetchData(); // keep the activity timeline in sync with the new status
      toast.success(t('status.updated', 'Status updated'));
    } catch (e: any) {
      toastApiError(e, t, { fallback: t('common.error', 'Failed') as string });
    }
  };

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={po.orderNumber}
        subtitle={po.title || po.supplierName}
        icon={ClipboardList}
        backTo={{ to: '/dashboard/purchases/orders', label: t('orders.title') }}
        actions={
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[po.status]}>{t(`status.${po.status}`)}</Badge>
            <Button size="sm" variant="outline" onClick={() => setIsPdfOpen(true)}>
              <Download className="h-3.5 w-3.5 me-1" /> {t('actions.exportPdf')}
            </Button>
            {/* TEJ XML aggregated from this order's RS-applicable invoices. Tells the
                user what to fill (e.g. create the invoice) if nothing is ready. */}
            {invoices.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleDownloadTejXml} disabled={downloadingTej}>
                {downloadingTej ? <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" /> : <FileDown className="h-3.5 w-3.5 me-1" />}
                {t('actions.downloadTejXml', 'Download TEJ XML')}
              </Button>
            )}
            {/* An order with no line items can never be received, invoiced or
                closed (backend derives those states from line quantities), so
                the lifecycle actions stay disabled until items exist. */}
            {po.status === 'draft' && <Button size="sm" variant="outline" onClick={handleValidate} disabled={!hasItems} title={!hasItems ? (t('validation.itemsRequired') as string) : undefined}><CheckCircle className="h-3.5 w-3.5 me-1" /> {t('actions.validate')}</Button>}
            {po.status === 'validated' && <Button size="sm" onClick={handleSendToSupplier} disabled={!hasItems} title={!hasItems ? (t('validation.itemsRequired') as string) : undefined}><Send className="h-3.5 w-3.5 me-1" /> {t('actions.sendToSupplier')}</Button>}
            {['ordered', 'partially_received'].includes(po.status) && <Button size="sm" onClick={() => navigate(`/dashboard/purchases/receipts/add?poId=${id}`)} disabled={!hasItems} title={!hasItems ? (t('validation.itemsRequired') as string) : undefined}><Package className="h-3.5 w-3.5 me-1" /> {t('actions.receiveGoods')}</Button>}
            {['partially_received', 'received', 'closed'].includes(po.status) && <CreateActionButton size="sm" variant="outline" onClick={() => navigate(`/dashboard/purchases/invoices/add?poId=${id}`)}><FileText className="h-3.5 w-3.5 me-1" /> {t('actions.createInvoice')}</CreateActionButton>}

          </div>
        }
      />

      <div className="p-4 md:p-6 space-y-4">
        {!hasItems && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{t('orders.noItemsTitle', 'This order has no line items')}</p>
              <p className="text-destructive/80">
                {t('orders.noItemsHint', 'Add at least one item in the Items tab — an empty order cannot be validated, received, invoiced or closed.')}
              </p>
            </div>
          </div>
        )}

        {/* Status Flow */}
        <Card>
          <CardContent className="p-3">
            <PurchaseOrderStatusFlow
              currentStatus={po.status}
              onStatusChange={handleStatusChange}
              // "Partially received" / "Received" are derived by the backend from
              // goods receipts — sending them manually always 400s. Route the
              // user to the receipt flow for this exact PO instead.
              onReceiptDerivedAttempt={() => {
                toast.info(
                  t('status.receiptDerived', 'Receiving is recorded through a goods receipt'),
                  { description: t('status.receiptDerivedHint', 'Create a goods receipt for this order — its status updates automatically.') },
                );
                navigate(`/dashboard/purchases/receipts/add?poId=${id}`);
              }}
            />

          </CardContent>
        </Card>


        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white p-4 rounded-md min-h-screen">
          {/* Mobile: Select dropdown */}
          {(() => {
            const TABS = [
              { value: 'overview',  icon: LayoutDashboard, label: t('tabs.overview') },
              { value: 'items',     icon: Package,         label: t('tabs.items') },
              { value: 'receipts',  icon: PackageCheck,    label: `${t('tabs.receipts')} (${receipts.length})` },
              { value: 'invoices',  icon: FileText,        label: `${t('tabs.invoices')} (${invoices.length})` },
              { value: 'activity',  icon: Activity,        label: t('tabs.activity') },
            ];
            const current = TABS.find(tab => tab.value === activeTab);
            return (
              <div className="md:hidden mb-4">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full h-11 rounded-xl border-primary/20 bg-primary/5 text-foreground font-medium shadow-sm focus:ring-primary/30">
                    <SelectValue>
                      {current && (
                        <span className="flex items-center gap-2">
                          <current.icon className="h-4 w-4 text-primary flex-shrink-0" />
                          {current.label}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-card rounded-xl shadow-lg border-border/60">
                    {TABS.map(({ value, icon: Icon, label }) => (
                      <SelectItem key={value} value={value} className="rounded-lg cursor-pointer py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className={`p-1 rounded-md ${activeTab === value ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-3.5 w-3.5 ${activeTab === value ? 'text-primary' : 'text-muted-foreground'}`} />
                          </span>
                          <span className={activeTab === value ? 'text-primary font-medium' : ''}>{label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
          {/* Desktop: tab pills */}
          <div className="hidden md:block">
            <TabsList variant="underline">
              <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
              <TabsTrigger value="items">{t('tabs.items')}</TabsTrigger>
              <TabsTrigger value="receipts">{t('tabs.receipts')} ({receipts.length})</TabsTrigger>
              <TabsTrigger value="invoices">{t('tabs.invoices')} ({invoices.length})</TabsTrigger>
              <TabsTrigger value="activity">{t('tabs.activity')}</TabsTrigger>
            </TabsList>

          </div>

          <TabsContent value="overview" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{t('detail.supplierInfo')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium">{po.supplierName}</span></div>
                  {po.supplierEmail && <div className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5" />{po.supplierEmail}</div>}
                  {po.supplierPhone && <div className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5" />{po.supplierPhone}</div>}
                  {po.supplierAddress && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{po.supplierAddress}</div>}
                  {po.supplierMatriculeFiscale && <div className="flex items-center gap-2 text-muted-foreground"><FileText className="h-3.5 w-3.5" />{po.supplierMatriculeFiscale}</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{t('detail.orderSummary')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.date')}</span><span>{formatPurchaseDate(po.orderDate)}</span></div>
                  {po.expectedDelivery && <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.expectedDelivery')}</span><span>{po.expectedDelivery}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.paymentTerms')}</span><span>{formatPaymentTerms(t, po.paymentTerms)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.currency')}</span><span>{po.currency}</span></div>
                  <Separator className="my-2" />
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.subtotal')}</span><span>{fmt(po.subTotal)}</span></div>
                  {po.discount > 0 && <div className="flex justify-between text-destructive"><span>{t('fields.discount')}</span><span>-{po.discountType === 'percentage' ? `${po.discount}%` : fmt(po.discount)}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.tax')}</span><span>{fmt(po.taxAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.fiscalStamp')}</span><span>{fmt(po.fiscalStamp)}</span></div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-sm"><span>{t('fields.grandTotal')}</span><span>{fmt(po.grandTotal)} {po.currency}</span></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{t('tabs.items')}</CardTitle>
                {po.status === 'draft' && (
                  isEditingItems ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={addDraftItem} disabled={savingItems}>
                        <Plus className="h-3.5 w-3.5 me-1" /> {t('create.addItem')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditItems} disabled={savingItems}>
                        <X className="h-3.5 w-3.5 me-1" /> {t('actions.cancel', 'Cancel')}
                      </Button>
                      <Button size="sm" onClick={saveItems} disabled={savingItems}>
                        {savingItems ? <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" /> : <Save className="h-3.5 w-3.5 me-1" />}
                        {t('actions.save')}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startEditItems}>
                      <Pencil className="h-3.5 w-3.5 me-1" /> {t('actions.edit', 'Edit items')}
                    </Button>
                  )
                )}
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {!isEditingItems ? (
                  <Table className="min-w-[650px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">{t('fields.article')}</TableHead>
                        <TableHead className="text-xs">{t('fields.supplierRef')}</TableHead>
                        <TableHead className="text-xs text-center">{t('fields.quantity')}</TableHead>
                        <TableHead className="text-xs text-center">{t('fields.received')}</TableHead>
                        <TableHead className="text-xs text-end">{t('fields.unitPrice')}</TableHead>
                        <TableHead className="text-xs text-end">{t('fields.discount', 'Discount')}</TableHead>
                        <TableHead className="text-xs text-end">{t('fields.tax', 'Tax')} %</TableHead>
                        <TableHead className="text-xs text-end">{t('fields.lineTotal')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="text-xs font-medium">{item.articleName || item.description}</div>
                            <div className="text-px-10 text-muted-foreground">{item.articleNumber}</div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.supplierRef || '-'}</TableCell>
                          <TableCell className="text-xs text-center">{Number(item.quantity || 0).toFixed(2)} {getUnitLabel(item.unit, t)}</TableCell>
                          <TableCell className="text-xs text-center">
                            <span className={item.receivedQty >= item.quantity ? 'text-green-600' : item.receivedQty > 0 ? 'text-amber-600' : 'text-muted-foreground'}>
                              {Number(item.receivedQty || 0).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-end">{fmt(item.unitPrice)}</TableCell>
                          <TableCell className="text-xs text-end">
                            {(item.discount ?? 0) > 0
                              ? (item.discountType === 'percentage' ? `${item.discount}%` : fmt(item.discount || 0))
                              : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-end">{item.taxRate ?? 0}%</TableCell>
                          <TableCell className="text-xs text-end font-medium">{fmt(item.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Table className="min-w-[650px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs min-w-[180px]">{t('fields.description')}</TableHead>
                        <TableHead className="text-xs w-20">{t('fields.quantity')}</TableHead>
                        <TableHead className="text-xs w-24">{t('fields.unit', 'Unit')}</TableHead>
                        <TableHead className="text-xs w-24">{t('fields.unitPrice')}</TableHead>
                        <TableHead className="text-xs w-32">{t('fields.discount', 'Discount')}</TableHead>
                        <TableHead className="text-xs w-20">{t('fields.tax', 'Tax')} %</TableHead>
                        <TableHead className="text-xs text-end">{t('fields.lineTotal')}</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draftItems.map((item, idx) => (
                        <TableRow key={String(item.id) || idx}>
                          <TableCell>
                            <Input className="h-7 text-xs" placeholder={t('create.articleDescription')} value={item.description || ''} onChange={e => updateDraftItem(idx, 'description', e.target.value)} />
                            {item.articleName && <div className="text-px-10 text-muted-foreground mt-0.5">{item.articleName}</div>}
                          </TableCell>
                          <TableCell><Input type="number" min="0" step="0.01" className="h-7 text-xs w-16" value={item.quantity ?? ''} onChange={e => updateDraftItem(idx, 'quantity', Number(e.target.value))} /></TableCell>
                          <TableCell>
                            <Select value={item.unit || 'piece'} onValueChange={v => updateDraftItem(idx, 'unit', v)}>
                              <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {UNIT_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{getUnitLabel(u.value, t)}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell><Input type="number" min="0" step="0.01" className="h-7 text-xs w-20" value={item.unitPrice ?? ''} onChange={e => updateDraftItem(idx, 'unitPrice', Number(e.target.value))} /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input type="number" min="0" step="0.01" className="h-7 text-xs w-14" value={item.discount ?? 0} onChange={e => updateDraftItem(idx, 'discount', Number(e.target.value))} />
                              <Select value={item.discountType || 'percentage'} onValueChange={v => updateDraftItem(idx, 'discountType', v)}>
                                <SelectTrigger className="h-7 text-xs w-14 px-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">%</SelectItem>
                                  <SelectItem value="fixed">{currency.code}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell><Input type="number" min="0" max="100" step="0.01" className="h-7 text-xs w-16" value={item.taxRate ?? 19} onChange={e => updateDraftItem(idx, 'taxRate', Number(e.target.value))} /></TableCell>
                          <TableCell className="text-xs text-end font-medium">{fmt(item.lineTotal || 0)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDraftItem(idx)} disabled={savingItems}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {draftItems.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">{t('create.noItems')}</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts" className="mt-4">
            {receipts.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{t('receipts.empty')}</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {receipts.map(gr => (
                  <Card key={gr.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/dashboard/purchases/receipts/${gr.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{gr.receiptNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatPurchaseDate(gr.receiptDate)} &bull; {gr.receivedByName}</p>
                        </div>
                        <Badge className={gr.status === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}>
                          {t(`receiptStatus.${gr.status}`)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            {invoices.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{t('invoices.empty')}</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {invoices.map(inv => (
                  <Card key={inv.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/dashboard/purchases/invoices/${inv.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatPurchaseDate(inv.invoiceDate)} &bull; {fmt(inv.grandTotal)} {currency.code}</p>
                        </div>
                        <Badge variant="outline">{t(`invoiceStatus.${inv.status}`)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <ActivityTimeline events={timelineEvents} variant="tab" initialLimit={50} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PurchaseOrderPDFPreviewModal
        isOpen={isPdfOpen}
        onClose={() => setIsPdfOpen(false)}
        order={po}
        formatCurrency={formatCurrency}
      />

      <TejMissingInfoDialog
        open={tejMissingOpen}
        onOpenChange={setTejMissingOpen}
        missing={tejMissing}
      />
    </div>
  );
}

export default function PurchaseOrderDetailPageWrapper() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases/orders">
      <PurchaseOrderDetailPage />
    </PurchaseErrorBoundary>
  );
}
