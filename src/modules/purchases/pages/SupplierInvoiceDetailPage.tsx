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
import { Building2, Calendar, FileText, Shield, CheckCircle, AlertTriangle, XCircle, Download, Pencil, Plus, Trash2, Save, X, Loader2, Send, Cloud } from "lucide-react";
import { supplierInvoiceService } from "../services/purchaseService";
import { RS_TRANSACTION_TYPES } from "@/modules/shared/types/retenue-source";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { DetailSkeleton } from "../components/PurchaseSkeletons";
import { SupplierInvoicePDFPreviewModal } from "../components/SupplierInvoicePDFPreviewModal";
import { useCurrency } from "@/shared/hooks/useCurrency";
import { toast } from "sonner";
import type { SupplierInvoice, SupplierInvoiceItem } from "../types";

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  validated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function SupplierInvoiceDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('purchases');
  const [activeTab, setActiveTab] = useState('overview');
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const { format: formatCurrency } = useCurrency();
  const [inv, setInv] = useState<SupplierInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [draftItems, setDraftItems] = useState<Partial<SupplierInvoiceItem>[]>([]);
  const [savingItems, setSavingItems] = useState(false);

  const fetchData = useCallback(() => {
    if (!id) return;
    setError(null);
    setLoading(true);
    supplierInvoiceService.getById(id)
      .then(setInv)
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Items edit helpers ──
  const startEditItems = () => {
    if (!inv) return;
    setDraftItems(inv.items.map(it => ({ ...it })));
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
      const qty = Number(u[idx].quantity) || 0;
      const price = Number(u[idx].unitPrice) || 0;
      u[idx].lineTotal = qty * price;
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
      lineTotal: 0,
      displayOrder: prev.length,
    } as Partial<SupplierInvoiceItem>]);
  };

  const removeDraftItem = (idx: number) => {
    setDraftItems(prev => prev.filter((_, i) => i !== idx));
  };

  const saveItems = async () => {
    if (!id || !inv) return;
    if (draftItems.some(it => !it.description?.trim())) {
      toast.error(t('validation.descriptionRequired', 'Each item needs a description'));
      return;
    }
    if (draftItems.some(it => !it.quantity || Number(it.quantity) <= 0)) {
      toast.error(t('validation.quantityRequired', 'Quantity must be greater than zero'));
      return;
    }
    setSavingItems(true);
    try {
      const draftIdsKept = new Set(draftItems.filter(d => !String(d.id).startsWith('new-')).map(d => String(d.id)));
      const toDelete = inv.items.filter(orig => !draftIdsKept.has(String(orig.id)));
      const toUpdate = draftItems.filter(d => !String(d.id).startsWith('new-'));
      const toCreate = draftItems.filter(d => String(d.id).startsWith('new-'));

      const buildPayload = (it: Partial<SupplierInvoiceItem>) => ({
        articleId: it.articleId,
        articleName: it.articleName,
        description: it.description || '',
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        taxRate: Number(it.taxRate) || 0,
      });

      // Parallel save with partial-failure tolerance — see PurchaseOrderDetailPage for rationale.
      const deletePromises = toDelete.map(d => supplierInvoiceService.deleteItem(id, String(d.id)));
      const updatePromises = toUpdate.map(u => supplierInvoiceService.updateItem(id, String(u.id), buildPayload(u)));
      const createPromises = toCreate.map(c => supplierInvoiceService.addItem(id, buildPayload(c)));

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
      fetchData();
    } catch (e: any) {
      toast.error(e?.message || t('common.error', 'Failed to save items'));
      fetchData();
    } finally {
      setSavingItems(false);
    }
  };

  // ── Lifecycle actions (validate, TEJ, facture-en-ligne) ──
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!id) return;
    setActionLoading('validate');
    try {
      const updated = await supplierInvoiceService.validate(id);
      setInv(updated);
      toast.success(t('actions.validated', 'Invoice validated'));
    } catch (e: any) {
      toast.error(e?.message || t('common.error', 'Validation failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncTej = async () => {
    if (!id) return;
    setActionLoading('tej');
    try {
      const updated = await supplierInvoiceService.syncTej(id);
      setInv(updated);
      toast.success(t('actions.tejSynced', 'Synced to TEJ'));
    } catch (e: any) {
      toast.error(e?.message || t('common.error', 'TEJ sync failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendFactureEnLigne = async () => {
    if (!id) return;
    setActionLoading('fel');
    try {
      const updated = await supplierInvoiceService.sendFactureEnLigne(id);
      setInv(updated);
      toast.success(t('actions.factureEnLigneSent', 'Facture-en-Ligne sent'));
    } catch (e: any) {
      toast.error(e?.message || t('common.error', 'Send failed'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error) return <PurchaseErrorFallback error={error} onRetry={fetchData} backTo="/dashboard/purchases/invoices" />;
  if (!inv) return <PurchaseErrorFallback error={t('invoices.notFound')} backTo="/dashboard/purchases/invoices" />;

  const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 2 });
  const rsType = RS_TRANSACTION_TYPES.find(r => r.code === inv.rsTypeCode);

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={inv.invoiceNumber}
        subtitle={`${inv.supplierName} ${inv.supplierInvoiceRef ? `• ${inv.supplierInvoiceRef}` : ''}`}
        icon={FileText}
        backTo={{ to: '/dashboard/purchases/invoices', label: t('invoices.title') }}
        actions={
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[inv.status]}>{t(`invoiceStatus.${inv.status}`)}</Badge>
            <Button size="sm" variant="outline" onClick={() => setIsPdfOpen(true)}>
              <Download className="h-3.5 w-3.5 mr-1" /> {t('actions.exportPdf')}
            </Button>
            {inv.status === 'draft' && (
              <Button size="sm" variant="outline" onClick={handleValidate} disabled={actionLoading !== null}>
                {actionLoading === 'validate' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                {t('actions.validate', 'Validate')}
              </Button>
            )}
            {inv.status !== 'draft' && inv.status !== 'cancelled' && !inv.tejSynced && (
              <Button size="sm" variant="outline" onClick={handleSyncTej} disabled={actionLoading !== null}>
                {actionLoading === 'tej' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Cloud className="h-3.5 w-3.5 mr-1" />}
                {t('actions.syncTej', 'Sync TEJ')}
              </Button>
            )}
            {inv.status !== 'draft' && inv.status !== 'cancelled' && inv.factureEnLigneStatus !== 'sent' && inv.factureEnLigneStatus !== 'validated' && (
              <Button size="sm" variant="outline" onClick={handleSendFactureEnLigne} disabled={actionLoading !== null}>
                {actionLoading === 'fel' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                {t('actions.sendFactureEnLigne', 'Send F.E.L')}
              </Button>
            )}
          </div>
        }
      />

      <div className="p-4 md:p-6 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8">
            <TabsTrigger value="overview" className="text-xs">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="items" className="text-xs">{t('tabs.items')}</TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs">{t('tabs.compliance')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{t('detail.invoiceInfo')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium">{inv.supplierName}</span></div>
                  {inv.supplierMatriculeFiscale && <div className="flex items-center gap-2 text-muted-foreground"><FileText className="h-3.5 w-3.5" />{inv.supplierMatriculeFiscale}</div>}
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{t('fields.invoiceDate')}: {inv.invoiceDate}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{t('fields.dueDate')}: {inv.dueDate}</div>
                  {inv.purchaseOrderNumber && <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-primary cursor-pointer" onClick={() => navigate(`/dashboard/purchases/orders/${inv.purchaseOrderId}`)}>{inv.purchaseOrderNumber}</span></div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{t('detail.financial')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.subtotal')}</span><span>{fmt(inv.subTotal)}</span></div>
                  {inv.discount > 0 && <div className="flex justify-between text-destructive"><span>{t('fields.discount')}</span><span>-{inv.discountType === 'percentage' ? `${inv.discount}%` : fmt(inv.discount)}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.tax')}</span><span>{fmt(inv.taxAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.fiscalStamp')}</span><span>{fmt(inv.fiscalStamp)}</span></div>
                  {inv.rsApplicable && <div className="flex justify-between text-amber-600"><span>{t('fields.rsDeduction')}</span><span>-{fmt(inv.rsAmount)}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold text-sm"><span>{t('fields.grandTotal')}</span><span>{fmt(inv.grandTotal)} {inv.currency}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.amountPaid')}</span><span className="text-green-600">{fmt(inv.amountPaid)}</span></div>
                  <div className="flex justify-between font-medium"><span>{t('fields.balance')}</span><span className={inv.grandTotal - inv.amountPaid > 0 ? 'text-destructive' : 'text-green-600'}>{fmt(inv.grandTotal - inv.amountPaid)}</span></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{t('tabs.items')}</CardTitle>
                {inv.status === 'draft' && (
                  isEditingItems ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={addDraftItem} disabled={savingItems}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> {t('create.addItem')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditItems} disabled={savingItems}>
                        <X className="h-3.5 w-3.5 mr-1" /> {t('actions.cancel', 'Cancel')}
                      </Button>
                      <Button size="sm" onClick={saveItems} disabled={savingItems}>
                        {savingItems ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                        {t('actions.save')}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startEditItems}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> {t('actions.edit', 'Edit items')}
                    </Button>
                  )
                )}
              </CardHeader>
              <CardContent className="p-0">
                {!isEditingItems ? (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-xs">{t('fields.article')}</TableHead>
                      <TableHead className="text-xs text-center">{t('fields.quantity')}</TableHead>
                      <TableHead className="text-xs text-right">{t('fields.unitPrice')}</TableHead>
                      <TableHead className="text-xs text-right">{t('fields.tax', 'Tax')} %</TableHead>
                      <TableHead className="text-xs text-right">{t('fields.lineTotal')}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {inv.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell><div className="text-xs font-medium">{item.articleName || item.description}</div></TableCell>
                          <TableCell className="text-xs text-center">{Number(item.quantity || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-right">{fmt(item.unitPrice)}</TableCell>
                          <TableCell className="text-xs text-right">{item.taxRate ?? 0}%</TableCell>
                          <TableCell className="text-xs text-right font-medium">{fmt(item.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-xs min-w-[200px]">{t('fields.description')}</TableHead>
                      <TableHead className="text-xs w-20">{t('fields.quantity')}</TableHead>
                      <TableHead className="text-xs w-24">{t('fields.unitPrice')}</TableHead>
                      <TableHead className="text-xs w-20">{t('fields.tax', 'Tax')} %</TableHead>
                      <TableHead className="text-xs text-right">{t('fields.lineTotal')}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {draftItems.map((item, idx) => (
                        <TableRow key={String(item.id) || idx}>
                          <TableCell><Input className="h-7 text-xs" value={item.description || ''} onChange={e => updateDraftItem(idx, 'description', e.target.value)} /></TableCell>
                          <TableCell><Input type="number" min="0" step="0.01" className="h-7 text-xs w-16" value={item.quantity ?? ''} onChange={e => updateDraftItem(idx, 'quantity', Number(e.target.value))} /></TableCell>
                          <TableCell><Input type="number" min="0" step="0.01" className="h-7 text-xs w-20" value={item.unitPrice ?? ''} onChange={e => updateDraftItem(idx, 'unitPrice', Number(e.target.value))} /></TableCell>
                          <TableCell><Input type="number" min="0" max="100" step="0.01" className="h-7 text-xs w-16" value={item.taxRate ?? 19} onChange={e => updateDraftItem(idx, 'taxRate', Number(e.target.value))} /></TableCell>
                          <TableCell className="text-xs text-right font-medium">{fmt(item.lineTotal || 0)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDraftItem(idx)} disabled={savingItems}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {draftItems.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">{t('create.noItems')}</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> {t('compliance.rs')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('compliance.applicable')}</span><Badge variant={inv.rsApplicable ? 'default' : 'outline'} className="text-[10px]">{inv.rsApplicable ? t('compliance.yes') : t('compliance.no')}</Badge></div>
                  {inv.rsApplicable && <>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('compliance.rsType')}</span><span>{rsType?.labelFr || inv.rsTypeCode}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('compliance.rate')}</span><span>{rsType?.rate}%</span></div>
                    <div className="flex justify-between font-medium"><span>{t('compliance.rsAmount')}</span><span>{fmt(inv.rsAmount)} TND</span></div>
                  </>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> {t('compliance.factureEnLigne')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('fields.status')}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {inv.factureEnLigneStatus === 'validated' && <CheckCircle className="h-3 w-3 mr-1 text-green-500" />}
                      {inv.factureEnLigneStatus === 'rejected' && <XCircle className="h-3 w-3 mr-1 text-destructive" />}
                      {inv.factureEnLigneStatus === 'pending' && <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />}
                      {t(`factureStatus.${inv.factureEnLigneStatus || 'pending'}`)}
                    </Badge>
                  </div>
                  {inv.factureEnLigneId && <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span>{inv.factureEnLigneId}</span></div>}
                  {inv.factureEnLigneSentAt && <div className="flex justify-between"><span className="text-muted-foreground">{t('compliance.sentAt')}</span><span>{inv.factureEnLigneSentAt}</span></div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> {t('compliance.tej')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('compliance.synced')}</span>
                    <Badge variant={inv.tejSynced ? 'default' : 'outline'} className="text-[10px]">
                      {inv.tejSynced ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                      {t(`tejStatus.${inv.tejSyncStatus || 'pending'}`)}
                    </Badge>
                  </div>
                  {inv.tejSyncDate && <div className="flex justify-between"><span className="text-muted-foreground">{t('compliance.syncDate')}</span><span>{inv.tejSyncDate}</span></div>}
                  {inv.tejErrorMessage && <div className="text-destructive text-[10px]">{inv.tejErrorMessage}</div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <SupplierInvoicePDFPreviewModal
        isOpen={isPdfOpen}
        onClose={() => setIsPdfOpen(false)}
        invoice={inv}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

export default function SupplierInvoiceDetailPage() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases/invoices">
      <SupplierInvoiceDetailContent />
    </PurchaseErrorBoundary>
  );
}
