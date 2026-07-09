import { useState, useEffect } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { calculateDocumentTotal } from "@/lib/calculateTotal";
import { ArrowLeft, Save, ShoppingCart, CalendarIcon, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SalesService } from "../services/sales.service";
import { Sale, SaleItem } from "../types";
import { SaleItemsManager } from "../components/SaleItemsManager";

import currencies from '@/data/mock/currencies.json';
import offerStatuses from '@/data/mock/offer-statuses.json';
import { useLookups } from '@/shared/contexts/LookupsContext';
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';


const statuses = [...new Set(['new_offer', ...offerStatuses.map(s => s.id)])];

export function EditSale() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { priorities: lookupPriorities } = useLookups();
  const priorities = lookupPriorities.map(p => p.id);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const { viewAll, targetTenantId, handleTenantChange } = useTargetTenant();
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  const [formData, setFormData, clearFormData] = useFormPersistence<Partial<Sale>>(`edit-sale-${id}`, {
    title: "",
    description: "",
    status: "created",
    priority: "medium",
    amount: 0,
    currency: "TND",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    notes: "",
    taxes: 0,
    taxType: "percentage",
    discount: 0,
    shippingCost: 0,
    items: []
  });

  // Load sale data
  useEffect(() => {
    const loadSale = async () => {
      if (!id) return;
      
      try {
        const sale = await SalesService.getSaleById(id);
            if (sale) {
              setFormData(sale);
              // normalize deliveryDate to Date object when possible
              try {
                const d = sale.deliveryDate ? new Date(sale.deliveryDate) : undefined;
                setDeliveryDate(d as any);
              } catch (e) {
                setDeliveryDate(undefined);
              }
            }
      } catch (error) {
        console.error("Error loading sale:", error);
        toast({
          title: t('error', 'Error'),
          description: t('toasts.failedToLoad'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSale();
  }, [id, toast, t]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemsChange = (items: SaleItem[]) => {
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    setFormData(prev => ({
      ...prev,
      items,
      amount: itemsTotal
    }));
  };

  // Calculate discount first, then TVA on discounted amount
  const calculateDiscountAmount = () => {
    const amount = formData.amount || 0;
    if (!formData.discount || formData.discount === 0) return 0;
    if (formData.discountType === 'percentage') {
      return amount * (formData.discount / 100);
    }
    return formData.discount;
  };

  const calculateTaxAmount = () => {
    return calculateDocumentTotal({
      subtotal: formData.amount || 0,
      discount: formData.discount,
      discountType: formData.discountType,
      tax: formData.taxes,
      taxType: formData.taxType,
    }).taxAmount;
  };

  const editTotals = calculateDocumentTotal({
    subtotal: formData.amount || 0,
    discount: formData.discount,
    discountType: formData.discountType,
    tax: formData.taxes,
    taxType: formData.taxType,
    shippingCost: formData.shippingCost,
  });
  const discountAmount = editTotals.discountAmount;
  const taxAmount = editTotals.taxAmount;
  const totalAmount = editTotals.total;

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || saving) return;
    setSaving(true);
    
    try {
      const updateData = {
        ...formData,
        deliveryDate,
        totalAmount
      };
      
      await SalesService.updateSale(id, updateData);

      // Track the edit in the activity feed (status changes are logged
      // separately via their own flow; this captures plain detail edits).
      try {
        const saleId = parseInt(id, 10);
        if (!isNaN(saleId)) {
          const { salesApi } = await import('@/services/api/salesApi');
          await salesApi.addActivity(saleId, {
            type: 'updated',
            description: 'Sale details were updated',
            details: `Sale updated on ${new Date().toLocaleDateString()}`,
          });
        }
      } catch (e) {
        console.warn('Failed to log sale update activity:', e);
      }

      toast({
        title: t('success', 'Success'),
        description: t('editSale.successUpdated'),
      });
      
      clearFormData();
      navigate(`/dashboard/sales/${id}`);
    } catch (error) {
      console.error("Error updating sale:", error);
      toast({
        title: t('error', 'Error'),
        description: t('editSale.errorUpdating'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-12 w-full bg-muted/60 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/60 rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-muted/40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/dashboard/sales/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToSale')}
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{t('editSale.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('editSale.pageDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Sale Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                {t('editSale.saleInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Tenant Selector for View All mode (read-only for edit) */}
                <TenantSelector value={targetTenantId} onChange={handleTenantChange} readOnly />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {t('saleTitle')} *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder={t('addSale.saleTitlePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="status">{t('status')} *</Label>
                      <Link 
                        to={`/dashboard/lookups?tab=offerStatuses&returnUrl=${encodeURIComponent(currentPath)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t('common.manage', 'Manage')}
                      </Link>
                    </div>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addSale.statusPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => (
                          <SelectItem key={s} value={s}>{offerStatuses.find(os => os.id === s)?.name ?? (s === 'new_offer' ? t('new_offer') : s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder={t('addSale.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="priority">{t('priority')}</Label>
                      <Link 
                        to={`/dashboard/lookups?tab=priorities&returnUrl=${encodeURIComponent(currentPath)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t('common.manage', 'Manage')}
                      </Link>
                    </div>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addSale.priorityPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(p => (
                          <SelectItem key={p} value={p}>{lookupPriorities.find(x => x.id === p)?.name ?? t(p)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t('addSale.deliveryDateLabel')}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deliveryDate ? format(deliveryDate, "PPP") : t('addSale.pickDate')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={deliveryDate}
                          onSelect={setDeliveryDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('editSale.financialDetails')}</CardTitle>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    {t('editSale.baseAmount')}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">{t('editSale.baseAmountAutoCalculated')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxes">
                    {t('overview.tva')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="taxes"
                      type="number"
                      step="0.01"
                      value={formData.taxes}
                      onChange={(e) => handleInputChange("taxes", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      className="flex-1"
                    />
                    <Select 
                      value={formData.taxType || "percentage"} 
                      onValueChange={(value: 'percentage' | 'fixed') => handleInputChange("taxType", value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">{formData.currency}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">
                    {t('discount')}
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => handleInputChange("discount", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingCost">
                    {t('editSale.shippingCost')}
                  </Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    value={formData.shippingCost}
                    onChange={(e) => handleInputChange("shippingCost", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                  />
                </div>

                {/* Total Display */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t('editSale.baseAmount')}:</span>
                    <span>{formData.currency} {(formData.amount || 0).toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {t('discount')} {formData.discountType === 'percentage' ? `(${formData.discount}%)` : ''}:
                      </span>
                      <span className="text-destructive">-{formData.currency} {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {t('overview.tva')} {formData.taxType === 'percentage' ? `(${formData.taxes}%)` : ''}:
                      </span>
                      <span>+{formData.currency} {taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {(formData.shippingCost || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{t('editSale.shippingCost')}:</span>
                      <span>+{formData.currency} {(formData.shippingCost || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-semibold pt-2 border-t">
                    <span>{t('editSale.totalAmount')}:</span>
                    <span>{formData.currency} {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Sale Items Management */}
        <SaleItemsManager
          items={formData.items || []}
          onUpdateItems={handleItemsChange}
          currency={formData.currency}
        />

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('editSale.customerInformation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  {t('editSale.customerName')} *
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  placeholder={t('editSale.customerNamePlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">
                  {t('editSale.customerEmail')}
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                  placeholder={t('editSale.customerEmailPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">
                  {t('editSale.customerPhone')}
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                  placeholder={t('editSale.customerPhonePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">
                  {t('editSale.customerAddress')}
                </Label>
                <Input
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={(e) => handleInputChange("customerAddress", e.target.value)}
                  placeholder={t('editSale.customerAddressPlaceholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('editSale.additionalInformation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">
                {t('notes')}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder={t('editSale.notesPlaceholder')}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to={`/dashboard/sales/${id}`}>{t('editSale.cancel')}</Link>
          </Button>
          <Button type="submit" className="gap-2" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? t('editSale.saving', 'Saving...') : t('editSale.saveChanges')}
          </Button>
        </div>
      </form>
    </div>
  );
}
