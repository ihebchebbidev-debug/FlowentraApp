import { useState, useEffect, useMemo } from "react";
import { ContentSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Package, Clock, Receipt, AlertCircle, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { useCurrency } from "@/shared/hooks/useCurrency";
import { toast } from "sonner";

interface InvoicePreparationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: number;
  saleId?: number | string;
  onSuccess: () => void;
}

interface MaterialItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  invoiceStatus?: string | null;
  sku?: string;
  description?: string;
  sourceTable?: string; // "service_order" or "dispatch"
}

interface ExpenseItem {
  id: number;
  type: string;
  description?: string;
  amount: number;
  currency?: string;
  invoiceStatus?: string | null;
  sourceTable?: string; // "service_order" or "dispatch"
}

interface TimeEntryItem {
  id: number;
  workType: string;
  duration: number;
  hourlyRate?: number;
  totalCost?: number;
  billable: boolean;
  description?: string;
  invoiceStatus?: string | null;
  sourceTable?: string; // "service_order" or "dispatch"
}

// Format a raw type/workType string into a readable label
const formatLabel = (raw: string): string => {
  if (!raw) return '';
  return raw
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export function InvoicePreparationModal({
  open,
  onOpenChange,
  serviceOrderId,
  saleId,
  onSuccess,
}: InvoicePreparationModalProps) {
  const { t } = useTranslation("service_orders");
  const { format } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryItem[]>([]);

  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<number>>(new Set());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<number>>(new Set());
  const [selectedTimeEntryIds, setSelectedTimeEntryIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) fetchData();
  }, [open, serviceOrderId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matData, expData, teData] = await Promise.all([
        serviceOrdersApi.getMaterials(serviceOrderId),
        serviceOrdersApi.getExpenses(serviceOrderId),
        serviceOrdersApi.getTimeEntries(serviceOrderId),
      ]);
      // Filter out materials that came from sale conversion - only show materials added after SO/dispatch creation
      const filteredMats = (matData || []).filter((m: any) => {
        const source = (m.source || m.Source || '').toLowerCase();
        // Exclude materials that originated from the sale conversion
        return source !== 'sale_conversion';
      });
      setMaterials(filteredMats.map((m: any) => ({
        id: m.id || m.Id,
        name: m.name || m.Name || m.articleName || m.ArticleName || m.description || m.Description || `Material #${m.id || m.Id}`,
        quantity: m.quantity || m.Quantity || 1,
        unitPrice: m.unitPrice || m.UnitPrice || m.price || m.Price || 0,
        totalPrice: m.totalPrice || m.TotalPrice || (m.unitPrice || m.UnitPrice || 0) * (m.quantity || m.Quantity || 1),
        invoiceStatus: m.invoiceStatus || m.InvoiceStatus || null,
        sku: m.sku || m.Sku,
        description: m.description || m.Description,
        sourceTable: m.sourceTable || m.SourceTable || 'service_order',
      })));
      console.log('[InvoicePreparation] Raw expenses from API:', JSON.stringify(expData));
      setExpenses((expData || []).map((e: any) => ({
        id: e.id || e.Id,
        type: e.type || e.Type || 'other',
        description: e.description || e.Description,
        amount: e.amount || e.Amount || 0,
        currency: e.currency || e.Currency,
        invoiceStatus: e.invoiceStatus || e.InvoiceStatus || null,
        sourceTable: e.sourceTable || e.SourceTable || 'dispatch',
      })));
      setTimeEntries((teData || []).filter((te: any) => te.billable !== false).map((te: any) => ({
        id: te.id || te.Id,
        workType: te.workType || te.WorkType || 'work',
        duration: te.duration || te.Duration || 0,
        hourlyRate: te.hourlyRate || te.HourlyRate,
        totalCost: te.totalCost || te.TotalCost || 0,
        billable: te.billable !== false,
        description: te.description || te.Description,
        invoiceStatus: te.invoiceStatus || te.InvoiceStatus || null,
        sourceTable: te.sourceTable || te.SourceTable || 'dispatch',
      })));
      setSelectedMaterialIds(new Set());
      setSelectedExpenseIds(new Set());
      setSelectedTimeEntryIds(new Set());
    } catch (error) {
      console.error("Failed to fetch invoice data:", error);
    } finally {
      setLoading(false);
    }
  };

  const availableMaterials = useMemo(() => materials.filter((m) => !m.invoiceStatus), [materials]);
  const alreadyInvoicedMaterials = useMemo(() => materials.filter((m) => m.invoiceStatus), [materials]);
  const availableExpenses = useMemo(() => expenses.filter((e) => !e.invoiceStatus), [expenses]);
  const alreadyInvoicedExpenses = useMemo(() => expenses.filter((e) => e.invoiceStatus), [expenses]);
  const availableTimeEntries = useMemo(() => timeEntries.filter((te) => !te.invoiceStatus), [timeEntries]);
  const alreadyInvoicedTimeEntries = useMemo(() => timeEntries.filter((te) => te.invoiceStatus), [timeEntries]);

  const selectedTotal = useMemo(() => {
    let total = 0;
    for (const id of selectedMaterialIds) {
      const mat = materials.find((m) => m.id === id);
      if (mat) total += mat.totalPrice || mat.unitPrice * mat.quantity;
    }
    for (const id of selectedExpenseIds) {
      const exp = expenses.find((e) => e.id === id);
      if (exp) total += exp.amount;
    }
    for (const id of selectedTimeEntryIds) {
      const te = timeEntries.find((t) => t.id === id);
      if (te) total += te.totalCost || 0;
    }
    return total;
  }, [selectedMaterialIds, selectedExpenseIds, selectedTimeEntryIds, materials, expenses, timeEntries]);

  const toggleAll = (
    items: { id: number }[],
    selected: Set<number>,
    setSelected: (s: Set<number>) => void
  ) => {
    if (items.every((i) => selected.has(i.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  };

  const toggleItem = (
    id: number,
    selected: Set<number>,
    setSelected: (s: Set<number>) => void
  ) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleConfirm = async () => {
    const totalSelected = selectedMaterialIds.size + selectedExpenseIds.size + selectedTimeEntryIds.size;

    setSubmitting(true);
    try {
      // If no items selected, skip the API call and just confirm
      if (totalSelected === 0) {
        console.log('[InvoicePreparation] No items selected, confirming without transfer.');
      } else {
        // Split selected IDs by source table
        const soMaterialIds = Array.from(selectedMaterialIds).filter(id => {
          const mat = materials.find(m => m.id === id);
          return mat?.sourceTable === 'service_order';
        });
        const dispatchMaterialIds = Array.from(selectedMaterialIds).filter(id => {
          const mat = materials.find(m => m.id === id);
          return mat?.sourceTable === 'dispatch';
        });
        const soExpenseIds = Array.from(selectedExpenseIds).filter(id => {
          const exp = expenses.find(e => e.id === id);
          return exp?.sourceTable === 'service_order';
        });
        const dispatchExpenseIds = Array.from(selectedExpenseIds).filter(id => {
          const exp = expenses.find(e => e.id === id);
          return exp?.sourceTable === 'dispatch';
        });
        const soTimeEntryIds = Array.from(selectedTimeEntryIds).filter(id => {
          const te = timeEntries.find(t => t.id === id);
          return te?.sourceTable === 'service_order';
        });
        const dispatchTimeEntryIds = Array.from(selectedTimeEntryIds).filter(id => {
          const te = timeEntries.find(t => t.id === id);
          return te?.sourceTable === 'dispatch';
        });

        console.log('[InvoicePreparation] Submitting transfer:', {
          serviceOrderId,
          materialIds: soMaterialIds,
          dispatchMaterialIds,
          expenseIds: soExpenseIds,
          dispatchExpenseIds,
          timeEntryIds: soTimeEntryIds,
          dispatchTimeEntryIds,
        });
        
        const result = await serviceOrdersApi.prepareForInvoice(serviceOrderId, {
          materialIds: soMaterialIds,
          expenseIds: soExpenseIds,
          timeEntryIds: soTimeEntryIds,
          dispatchMaterialIds,
          dispatchExpenseIds,
          dispatchTimeEntryIds,
        });
        
        console.log('[InvoicePreparation] Transfer result:', result);
      }
      
      // Verify: immediately fetch the sale to check if items were added
      if (saleId) {
        try {
          const { apiFetch } = await import('@/services/api/apiClient');
          const verifyResult = await apiFetch<any>(`/api/sales/${saleId}`);
          const saleData = verifyResult.data?.data || verifyResult.data;
          console.log('[InvoicePreparation] VERIFY - Sale items after transfer:', saleData?.items?.length, JSON.stringify(saleData?.items?.map((i: any) => ({ id: i.id, itemName: i.itemName, type: i.type }))));
        } catch (e) {
          console.warn('[InvoicePreparation] Verify fetch failed:', e);
        }
      }
      
      toast.success(t("invoicePreparation.success"));
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("[InvoicePreparation] Failed to prepare invoice:", error);
      console.error("[InvoicePreparation] Error details:", error.message, error.response);
      toast.error(error.message || t("invoicePreparation.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const hasNoSale = !saleId;
  const totalItems = availableMaterials.length + availableExpenses.length + availableTimeEntries.length;
  const totalSelected = selectedMaterialIds.size + selectedExpenseIds.size + selectedTimeEntryIds.size;

  const allMaterialsSelected = availableMaterials.length > 0 && availableMaterials.every((m) => selectedMaterialIds.has(m.id));
  const allExpensesSelected = availableExpenses.length > 0 && availableExpenses.every((e) => selectedExpenseIds.has(e.id));
  const allTimeEntriesSelected = availableTimeEntries.length > 0 && availableTimeEntries.every((te) => selectedTimeEntryIds.has(te.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <DialogTitle className="text-lg">{t("invoicePreparation.title")}</DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              {totalItems > 0
                ? t("invoicePreparation.description")
                : t("invoicePreparation.noItemsDescription", "Aucun matériau, frais ou temps à transférer. Vous pouvez tout de même marquer cet ordre comme prêt pour facturation.")}
            </DialogDescription>
          </DialogHeader>

          {hasNoSale && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-md bg-muted text-muted-foreground border border-border">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{t("invoicePreparation.noSaleLinked")}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content - only show if there are items */}
        {loading ? (
          <ContentSkeleton rows={6} />
        ) : totalItems > 0 ? (
          <ScrollArea className="flex-1 px-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 260px)' }}>
            <div className="space-y-5 py-4">
              {/* Materials Section */}
              {(availableMaterials.length > 0 || alreadyInvoicedMaterials.length > 0) && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">
                        {t("invoicePreparation.materials")}
                      </h4>
                      <Badge variant="secondary" className="text-px-10 px-1.5 py-0 font-normal">
                        {availableMaterials.length}
                      </Badge>
                    </div>
                    {availableMaterials.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleAll(availableMaterials, selectedMaterialIds, setSelectedMaterialIds)}
                      >
                        {allMaterialsSelected ? t("invoicePreparation.deselectAll", "Deselect All") : t("invoicePreparation.selectAll")}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {availableMaterials.map((mat) => {
                      const isSelected = selectedMaterialIds.has(mat.id);
                      return (
                        <label
                          key={mat.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(mat.id, selectedMaterialIds, setSelectedMaterialIds)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{mat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {mat.quantity} × {format(mat.unitPrice)}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                            {format(mat.totalPrice || mat.unitPrice * mat.quantity)}
                          </span>
                        </label>
                      );
                    })}
                    {alreadyInvoicedMaterials.map((mat) => (
                      <div key={mat.id} className="flex items-center gap-3 p-3 rounded-lg border border-border opacity-50">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground truncate">{mat.name}</p>
                        </div>
                        <Badge variant="outline" className="text-px-10 shrink-0">
                          {t("invoicePreparation.alreadySelected")}
                        </Badge>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(mat.totalPrice || mat.unitPrice * mat.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Expenses Section */}
              {(availableExpenses.length > 0 || alreadyInvoicedExpenses.length > 0) && (
                <section>
                  <Separator className="mb-4" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">
                        {t("invoicePreparation.expenses")}
                      </h4>
                      <Badge variant="secondary" className="text-px-10 px-1.5 py-0 font-normal">
                        {availableExpenses.length}
                      </Badge>
                    </div>
                    {availableExpenses.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleAll(availableExpenses, selectedExpenseIds, setSelectedExpenseIds)}
                      >
                        {allExpensesSelected ? t("invoicePreparation.deselectAll", "Deselect All") : t("invoicePreparation.selectAll")}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {availableExpenses.map((exp) => {
                      const isSelected = selectedExpenseIds.has(exp.id);
                      return (
                        <label
                          key={exp.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(exp.id, selectedExpenseIds, setSelectedExpenseIds)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {formatLabel(exp.type)}
                            </p>
                            {exp.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {exp.description}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                            {format(exp.amount)}
                          </span>
                        </label>
                      );
                    })}
                    {alreadyInvoicedExpenses.map((exp) => (
                      <div key={exp.id} className="flex items-center gap-3 p-3 rounded-lg border border-border opacity-50">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">{formatLabel(exp.type)}</p>
                        </div>
                        <Badge variant="outline" className="text-px-10 shrink-0">
                          {t("invoicePreparation.alreadySelected")}
                        </Badge>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{format(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Time Entries Section */}
              {(availableTimeEntries.length > 0 || alreadyInvoicedTimeEntries.length > 0) && (
                <section>
                  <Separator className="mb-4" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">
                        {t("invoicePreparation.timeEntries")}
                      </h4>
                      <Badge variant="secondary" className="text-px-10 px-1.5 py-0 font-normal">
                        {availableTimeEntries.length}
                      </Badge>
                    </div>
                    {availableTimeEntries.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleAll(availableTimeEntries, selectedTimeEntryIds, setSelectedTimeEntryIds)}
                      >
                        {allTimeEntriesSelected ? t("invoicePreparation.deselectAll", "Deselect All") : t("invoicePreparation.selectAll")}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {availableTimeEntries.map((te) => {
                      const isSelected = selectedTimeEntryIds.has(te.id);
                      return (
                        <label
                          key={te.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(te.id, selectedTimeEntryIds, setSelectedTimeEntryIds)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {formatLabel(te.workType)}
                              </p>
                              <Badge variant="outline" className="text-px-10 px-1.5 py-0">
                                {formatDuration(te.duration)}
                              </Badge>
                              {/* Labor logged from the field app has no hourly rate of its
                                  own; the backend falls back to the technician's last known
                                  rate and, failing that, transfers the line at 0. Surface
                                  that instead of silently billing nothing. */}
                              {te.duration > 0 && !(te.totalCost || 0) && (
                                <Badge variant="outline" className="text-px-10 px-1.5 py-0 border-amber-500/50 text-amber-600">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {t("invoicePreparation.rateMissing", "No rate — price manually")}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {te.hourlyRate && (
                                <span className="text-xs text-muted-foreground">
                                  @ {format(te.hourlyRate)}/h
                                </span>
                              )}
                              {te.description && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {te.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-sm font-semibold whitespace-nowrap ${te.duration > 0 && !(te.totalCost || 0) ? 'text-amber-600' : 'text-foreground'}`}>
                            {format(te.totalCost || 0)}
                          </span>
                        </label>
                      );
                    })}
                    {alreadyInvoicedTimeEntries.map((te) => (
                      <div key={te.id} className="flex items-center gap-3 p-3 rounded-lg border border-border opacity-50">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">
                            {formatLabel(te.workType)} — {formatDuration(te.duration)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-px-10 shrink-0">
                          {t("invoicePreparation.alreadySelected")}
                        </Badge>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{format(te.totalCost || 0)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {totalItems === 0 && !loading && (
                <div className="text-center py-12">
                  <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {t("invoicePreparation.noItems")}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : null}

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("invoicePreparation.itemsSelected", { count: totalSelected })}
            </p>
            <p className="text-lg font-bold text-foreground">
              {format(selectedTotal)}
            </p>
          </div>
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("invoicePreparation.confirming")}
                </>
              ) : (
                t("invoicePreparation.confirm")
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
