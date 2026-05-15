import { useState, useEffect } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { calculateDocumentTotal } from "@/lib/calculateTotal";
import { ArrowLeft, Save, Send, ShoppingCart, CalendarIcon, Settings2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SalesService } from "../services/sales.service";
import { ContactSelectorAdvanced } from "../components/ContactSelectorAdvanced";
import { SaleItemsSelectorAdvanced } from "../components/SaleItemsSelectorAdvanced";
import { CreateSaleData, SaleItem } from "../types";
import { useActionLogger } from "@/hooks/useActionLogger";
import currencies from '@/data/mock/currencies.json';
import offerStatuses from '@/data/mock/offer-statuses.json';
import { useLookups } from '@/shared/contexts/LookupsContext';
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { validateConvertibleForm } from '@/modules/external/utils/convertValidation';
const statuses = offerStatuses.map(s => s.id);
const recurringIntervals = ['weekly', 'monthly', 'quarterly', 'yearly'];

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  type?: string;
}

export function AddSale() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { viewAll, targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  const { logFormSubmit, logButtonClick } = useActionLogger('Sales');
  const { priorities: lookupPriorities, getDefaultPriority } = useLookups();
  const priorities = lookupPriorities.map(p => p.id);
  const [loading, setLoading] = useState(false);
  const [validUntil, setValidUntil] = useState<Date>();
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  const [formData, setFormData, clearFormData] = useFormPersistence<CreateSaleData>('add-sale', {
    title: "",
    description: "",
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    status: "created",
    priority: "medium",
    amount: 0,
    currency: "USD",
    deliveryDate: undefined,
    items: [],
    notes: "",
    taxes: 0,
    taxType: "percentage",
    discount: 0,
    shippingCost: 0,
    isRecurring: false,
    recurringInterval: "monthly"
  });

  // Prefill from external-endpoint log conversion (see EndpointLogsTable).
  // Apply once, then clear router state so refresh doesn't re-overwrite edits.
  useEffect(() => {
    const prefill = (location.state as any)?.prefill;
    if (!prefill) return;
    setFormData(prev => ({
      ...prev,
      customerName: prefill.contactName || prev.customerName,
      customerEmail: prefill.email || prev.customerEmail,
      customerPhone: prefill.phone || prev.customerPhone,
      customerAddress: prefill.address || prev.customerAddress,
      currency: prefill.currency || prev.currency,
      notes: prefill.notes || prev.notes,
      amount: typeof prefill.totalAmount === 'number' ? prefill.totalAmount : prev.amount,
      items: Array.isArray(prefill.items) && prefill.items.length > 0
        ? prefill.items.map((it: any, idx: number) => ({
            id: `prefill-${idx}-${Date.now()}`,
            description: it.description || '',
            quantity: it.quantity ?? 1,
            unitPrice: it.unitPrice ?? 0,
            totalPrice: it.totalPrice ?? (it.quantity ?? 1) * (it.unitPrice ?? 0),
          }))
        : prev.items,
    }));
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select priority: default one, single option, or fallback
  useEffect(() => {
    if (lookupPriorities.length > 0 && (!formData.priority || formData.priority === 'medium')) {
      const defaultPriority = getDefaultPriority();
      if (defaultPriority) {
        setFormData(prev => ({ ...prev, priority: defaultPriority.id as CreateSaleData['priority'] }));
      } else if (lookupPriorities.length === 1) {
        setFormData(prev => ({ ...prev, priority: lookupPriorities[0].id as CreateSaleData['priority'] }));
      }
    }
  }, [lookupPriorities, getDefaultPriority]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactSelect = (contact: Contact | null) => {
    if (contact) {
      setFormData(prev => ({
        ...prev,
        customerId: contact.id,
        customerName: contact.name,
        customerEmail: contact.email || "",
        customerPhone: contact.phone || "",
        customerAddress: contact.address || "",
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
      }));
    }
  };

  const handleItemsChange = (items: SaleItem[]) => {
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    setFormData(prev => ({
      ...prev,
      items,
      amount: itemsTotal
    }));
  };

  const calculateDiscountAmount = () => {
    if (!formData.discount || formData.discount === 0) return 0;
    if (formData.discountType === 'percentage') {
      return formData.amount * (formData.discount / 100);
    }
    return formData.discount;
  };

  const calculateTaxAmount = () => {
    return calculateDocumentTotal({
      subtotal: formData.amount,
      discount: formData.discount,
      discountType: formData.discountType,
      tax: formData.taxes,
      taxType: formData.taxType,
    }).taxAmount;
  };

  const calculateTotal = () => {
    return calculateDocumentTotal({
      subtotal: formData.amount,
      discount: formData.discount,
      discountType: formData.discountType,
      tax: formData.taxes,
      taxType: formData.taxType,
      shippingCost: formData.shippingCost,
    }).total;
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    
    if (isTenantRequired) {
      toast({ title: t('common.error', 'Error'), description: 'Please select a target company first.', variant: "destructive" });
      return;
    }

    // Schema validation — sale form was previously only guarded by a
    // button-disable on `isFormValid`, which the Save-as-draft path bypasses.
    // Run a real validation here so converted external payloads can't write
    // malformed contacts/items into the DB.
    const validation = validateConvertibleForm({
      title: formData.title,
      contactName: formData.customerName,
      contactEmail: formData.customerEmail,
      contactPhone: formData.customerPhone,
      contactAddress: formData.customerAddress,
      notes: formData.notes,
      currency: formData.currency,
      amount: formData.amount,
      items: (formData.items ?? []).map((it: SaleItem) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      })),
    });
    if (!validation.ok) {
      toast({
        title: t('common.error', 'Error'),
        description: validation.message ?? t('addSale.fillRequiredFields', 'Please fill required fields'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const saleData = {
        ...formData,
        deliveryDate: validUntil,
        totalAmount: calculateTotal(),
        status: isDraft ? "created" : formData.status
      };
      
      const newSale = await SalesService.createSale(saleData);
      
      logFormSubmit('Create Sale', true, { 
        entityType: 'Sale', 
        entityId: newSale.id,
        details: `Created sale "${formData.title}" for ${formData.customerName}`
      });
      
      toast({
        title: t('addSale.successTitle', 'Success'),
        description: isDraft ? t('addSale.successDraft') : t('addSale.successCreated'),
      });
      
      clearFormData();
      navigate(`/dashboard/sales/${newSale.id}`);
    } catch (error) {
      console.error("Error creating sale:", error);
      logFormSubmit('Create Sale', false, { details: (error as Error).message });
      toast({
        title: t('error', 'Error'),
        description: t('addSale.errorCreating'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.title && formData.customerName;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/sales" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('backToSales')}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-medium">{t('addSale.pageTitle')}</h1>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sale Information */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                <TenantSelector value={targetTenantId} onChange={handleTenantChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('addSale.saleTitleLabel')} *</Label>
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
                      <Label htmlFor="status">{t('addSale.statusLabel')} *</Label>
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
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {offerStatuses.find(s => s.id === status)?.name ?? status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('addSale.descriptionLabel')}</Label>
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
                      <Label htmlFor="priority">{t('addSale.priorityLabel')}</Label>
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
                        {priorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {t(priority)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('addSale.deliveryDateLabel')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !validUntil && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validUntil ? format(validUntil, "PPP") : <span>{t('addSale.pickDate')}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={validUntil}
                          onSelect={setValidUntil}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className="pt-6">
                <ContactSelectorAdvanced
                  onContactSelect={handleContactSelect}
                  selectedContact={formData.customerName ? {
                    id: formData.customerId,
                    name: formData.customerName,
                    email: formData.customerEmail,
                    phone: formData.customerPhone,
                    address: formData.customerAddress,
                  } : null}
                />
              </CardContent>
            </Card>

            {/* Sale Items */}
            <Card>
              <CardContent className="pt-6">
                <SaleItemsSelectorAdvanced
                  items={formData.items}
                  onUpdateItems={handleItemsChange}
                  currency={formData.currency}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">{t('addSale.settings')}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('addSale.currencyLabel')}</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('addSale.validUntilLabel')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !validUntil && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {validUntil ? format(validUntil, "PPP") : <span>{t('addSale.pickDate')}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={validUntil}
                        onSelect={setValidUntil}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => handleInputChange("isRecurring", !!checked)}
                    />
                    <Label htmlFor="isRecurring">{t('addSale.isRecurring')}</Label>
                  </div>

                  {formData.isRecurring && (
                    <div className="space-y-2">
                      <Label htmlFor="recurringInterval">{t('addSale.intervalLabel')}</Label>
                      <Select 
                        value={formData.recurringInterval} 
                        onValueChange={(value) => handleInputChange("recurringInterval", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('addSale.intervalPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {recurringIntervals.map((interval) => (
                            <SelectItem key={interval} value={interval}>
                              {t(`addSale.${interval}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="text-lg font-semibold">{t('addSale.financialSummary')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxes">{t('overview.tva')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="taxes"
                        type="number"
                        step="0.01"
                        value={formData.taxes}
                        onChange={(e) => handleInputChange("taxes", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
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
                    <Label htmlFor="discount">{t('addSale.discountLabel')}</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => handleInputChange("discount", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span>{t('addSale.itemsTotal')}:</span>
                    <span>{formData.amount.toLocaleString()} {formData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('overview.tva')} {formData.taxType === 'percentage' ? `(${formData.taxes}%)` : ''}:</span>
                    <span>+{calculateTaxAmount().toLocaleString()} {formData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('addSale.discountLabel')}:</span>
                    <span className="text-destructive">-{formData.discount.toLocaleString()} {formData.currency}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>{t('addSale.total')}:</span>
                    <span>{calculateTotal().toLocaleString()} {formData.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{t('addSale.notesTitle')}</h3>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder={t('addSale.notesPlaceholder')}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/dashboard/sales')}
          >
            {t('addSale.cancel')}
          </Button>
          <Button 
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading || !isFormValid}
          >
            <Save className="h-4 w-4 mr-2" />
            {t('addSale.saveAsDraft')}
          </Button>
          <Button 
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading || !isFormValid}
            className="gradient-primary"
          >
            <Send className="h-4 w-4 mr-2" />
            {t('addSale.createAndSend')}
          </Button>
        </div>
      </form>
    </div>
  );
}
