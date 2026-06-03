import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, TrendingUp, TrendingDown, Minus, Calendar, Building2, Trash2, Loader2 } from "lucide-react";
import { apiFetch } from "@/services/api/apiClient";
import { articleSupplierService } from "@/modules/purchases/services/purchaseService";
import type { ArticleSupplier, ArticleSupplierPriceHistory } from "@/modules/purchases/types";

interface ArticleSuppliersTabProps {
  articleId: string;
  articleName: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

export function ArticleSuppliersTab({ articleId }: ArticleSuppliersTabProps) {
  const { t } = useTranslation('articles');

  const [suppliers, setSuppliers] = useState<ArticleSupplier[]>([]);
  const [priceHistory, setPriceHistory] = useState<ArticleSupplierPriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplierId: '', supplierRef: '', purchasePrice: '', leadTimeDays: '', minOrderQty: '', isPreferred: false });

  const fmt = (n: number) => (n ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 });

  const load = useCallback(async () => {
    if (!articleId) return;
    setLoading(true);
    try {
      const list = await articleSupplierService.getByArticle(articleId);
      setSuppliers(list);
      // Pull the price history for every linked supplier and merge into a single
      // newest-first timeline (each entry already carries its articleSupplierId).
      const histories = await Promise.all(
        list.map(as => articleSupplierService.getPriceHistory(as.id).catch(() => [] as ArticleSupplierPriceHistory[]))
      );
      setPriceHistory(
        histories.flat().sort((a, b) => (b.changedAt || '').localeCompare(a.changedAt || ''))
      );
    } catch {
      toast.error(t('detail.suppliers.loadError'));
      setSuppliers([]);
      setPriceHistory([]);
    } finally {
      setLoading(false);
    }
  }, [articleId, t]);

  useEffect(() => { load(); }, [load]);

  // Load the supplier picker (contacts of type=supplier) only when the dialog opens.
  useEffect(() => {
    if (!addDialogOpen) return;
    apiFetch<any>('/api/contacts?type=supplier&limit=500')
      .then(res => {
        const data = res?.data?.contacts || res?.data || [];
        setSupplierOptions(data.map((c: any) => ({ id: String(c.id), name: c.name })));
      })
      .catch(() => setSupplierOptions([]));
  }, [addDialogOpen]);

  const resetForm = () => setForm({ supplierId: '', supplierRef: '', purchasePrice: '', leadTimeDays: '', minOrderQty: '', isPreferred: false });

  const handleCreate = async () => {
    if (!form.supplierId) { toast.error(t('detail.suppliers.supplierRequired')); return; }
    const price = parseFloat(form.purchasePrice);
    if (isNaN(price) || price < 0) { toast.error(t('detail.suppliers.priceRequired')); return; }
    setSaving(true);
    try {
      await articleSupplierService.create({
        articleId,
        supplierId: form.supplierId,
        supplierRef: form.supplierRef || undefined,
        purchasePrice: price,
        leadTimeDays: form.leadTimeDays ? parseInt(form.leadTimeDays, 10) : 0,
        minOrderQty: form.minOrderQty ? parseFloat(form.minOrderQty) : 1,
        isPreferred: form.isPreferred,
      } as Partial<ArticleSupplier>);
      toast.success(t('detail.suppliers.saved'));
      setAddDialogOpen(false);
      resetForm();
      await load();
    } catch {
      toast.error(t('detail.suppliers.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await articleSupplierService.delete(id);
      toast.success(t('detail.suppliers.deleted'));
      await load();
    } catch {
      toast.error(t('detail.suppliers.deleteError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Suppliers Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {t('detail.suppliers.title')}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> {t('detail.suppliers.add')}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t('detail.suppliers.supplierName')}</TableHead>
                <TableHead className="text-xs">{t('detail.suppliers.supplierRef')}</TableHead>
                <TableHead className="text-xs text-right">{t('detail.suppliers.purchasePrice')}</TableHead>
                <TableHead className="text-xs text-center">{t('detail.suppliers.leadTime')}</TableHead>
                <TableHead className="text-xs text-center">{t('detail.suppliers.moq')}</TableHead>
                <TableHead className="text-xs text-center">{t('detail.suppliers.preferred')}</TableHead>
                <TableHead className="text-xs">{t('detail.suppliers.lastDelivery')}</TableHead>
                <TableHead className="text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 mx-auto text-muted-foreground/50 animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground">{t('detail.suppliers.loading')}</p>
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">{t('detail.suppliers.empty')}</p>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map(as => (
                  <TableRow key={as.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">{as.supplierName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{as.supplierRef || '-'}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{fmt(as.purchasePrice)} {as.currency || 'TND'}</TableCell>
                    <TableCell className="text-xs text-center">{as.leadTimeDays} {t('detail.suppliers.days')}</TableCell>
                    <TableCell className="text-xs text-center">{as.minOrderQty}</TableCell>
                    <TableCell className="text-xs text-center">
                      {as.isPreferred ? (
                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">★ {t('detail.suppliers.preferredLabel')}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {as.modifiedDate ? new Date(as.modifiedDate).toLocaleDateString('fr-TN') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title={t('detail.suppliers.remove')}
                        onClick={() => handleDelete(as.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Price History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t('detail.suppliers.priceHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && priceHistory.length > 0 ? (
            <div className="space-y-3">
              {priceHistory.map(ph => {
                const diff = ph.newPrice - ph.oldPrice;
                const pctChange = ph.oldPrice ? ((diff / ph.oldPrice) * 100).toFixed(1) : '0.0';
                const isUp = diff > 0;

                return (
                  <div key={ph.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${isUp ? 'bg-destructive/10' : diff < 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'}`}>
                        {isUp ? <TrendingUp className="h-3.5 w-3.5 text-destructive" /> : diff < 0 ? <TrendingDown className="h-3.5 w-3.5 text-green-600" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{fmt(ph.oldPrice)} → {fmt(ph.newPrice)} {ph.currency || 'TND'}</span>
                          <Badge variant="outline" className={`text-[10px] ${isUp ? 'text-destructive border-destructive/30' : 'text-green-600 border-green-600/30'}`}>
                            {isUp ? '+' : ''}{pctChange}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {ph.changedAt ? new Date(ph.changedAt).toLocaleDateString('fr-TN') : '-'}
                          {ph.changedBy && <span className="ml-1">• {ph.changedBy}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">{t('detail.suppliers.noPriceHistory')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Supplier Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(o) => { setAddDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{t('detail.suppliers.addTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{t('detail.suppliers.supplierName')}</Label>
              <Select value={form.supplierId} onValueChange={(v) => setForm(f => ({ ...f, supplierId: v }))}>
                <SelectTrigger className="h-8 mt-1">
                  <SelectValue placeholder={t('detail.suppliers.selectSupplier')} />
                </SelectTrigger>
                <SelectContent>
                  {supplierOptions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t('detail.suppliers.supplierRef')}</Label>
              <Input className="h-8 mt-1" value={form.supplierRef} onChange={e => setForm(f => ({ ...f, supplierRef: e.target.value }))} placeholder="e.g. SUP-REF-001" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">{t('detail.suppliers.purchasePrice')}</Label><Input type="number" className="h-8 mt-1" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} placeholder="0.00" /></div>
              <div><Label className="text-xs">{t('detail.suppliers.leadTime')}</Label><Input type="number" className="h-8 mt-1" value={form.leadTimeDays} onChange={e => setForm(f => ({ ...f, leadTimeDays: e.target.value }))} placeholder="7" /></div>
              <div><Label className="text-xs">{t('detail.suppliers.moq')}</Label><Input type="number" className="h-8 mt-1" value={form.minOrderQty} onChange={e => setForm(f => ({ ...f, minOrderQty: e.target.value }))} placeholder="1" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="as-preferred" checked={form.isPreferred} onCheckedChange={(c) => setForm(f => ({ ...f, isPreferred: c === true }))} />
              <Label htmlFor="as-preferred" className="text-xs cursor-pointer">{t('detail.suppliers.preferred')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)} disabled={saving}>{t('common.cancel', 'Cancel')}</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              {saving ? t('detail.suppliers.saving') : t('detail.suppliers.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
