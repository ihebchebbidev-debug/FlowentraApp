import { useState, useEffect } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { calculateDocumentTotal } from "@/lib/calculateTotal";
import { ArrowLeft, Save, Send, ShoppingCart, CalendarIcon, Settings2, Package, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SalesService } from "../services/sales.service";
import { ContactSelectorWithType } from "@/modules/offers/components/ContactSelectorWithType";
import { SaleItemsSelectorAdvanced } from "../components/SaleItemsSelectorAdvanced";
import { InstallationSelector } from "@/modules/field/installations/components/InstallationSelector";
import { CreateInstallationModal } from "@/modules/field/installations/components/CreateInstallationModal";
import { CreateSaleData, SaleItem } from "../types";
import { useActionLogger } from "@/hooks/useActionLogger";
import currencies from "@/data/mock/currencies.json";
import { useLookups } from "@/shared/contexts/LookupsContext";
import { TenantSelector } from "@/components/TenantSelector";
import { useTargetTenant } from "@/hooks/useTargetTenant";
import { validateConvertibleForm } from "@/modules/external/utils/convertValidation";

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
  const { logFormSubmit } = useActionLogger("Sales");
  const {
    priorities: lookupPriorities,
    offerCategories,
    offerSources,
    getDefaultPriority,
    getDefaultOfferCategory,
    getDefaultOfferSource,
    refreshLookups,
  } = useLookups();

  const [loading, setLoading] = useState(false);
  const [validUntil, setValidUntil] = useState<Date>();
  const [selectedInstallations, setSelectedInstallations] = useState<any[]>([]);
  const [showCreateInstallation, setShowCreateInstallation] = useState(false);

  const currentPath = location.pathname;

  // Refresh lookups when returning from Manage
  useEffect(() => {
    const handleFocus = () => refreshLookups();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshLookups]);
  useEffect(() => {
    refreshLookups();
  }, [location.key]);

  const [formData, setFormData, clearFormData] = useFormPersistence<CreateSaleData>("add-sale", {
    title: "",
    description: "",
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    status: "created",
    priority: "medium",
    category: "",
    source: "",
    amount: 0,
    currency: "TND",
    deliveryDate: undefined,
    items: [],
    notes: "",
    taxes: 0,
    taxType: "percentage",
    discount: 0,
    discountType: "percentage",
    fiscalStamp: 1,
    shippingCost: 0,
    isRecurring: false,
    recurringInterval: "monthly",
  });

  // Prefill from external-endpoint log conversion
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
      amount: typeof prefill.totalAmount === "number" ? prefill.totalAmount : prev.amount,
      items: Array.isArray(prefill.items) && prefill.items.length > 0
        ? prefill.items.map((it: any, idx: number) => ({
            id: `prefill-${idx}-${Date.now()}`,
            description: it.description || "",
            quantity: it.quantity ?? 1,
            unitPrice: it.unitPrice ?? 0,
            totalPrice: it.totalPrice ?? (it.quantity ?? 1) * (it.unitPrice ?? 0),
          }))
        : prev.items,
    }));
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-apply default lookups (priority / category / source)
  useEffect(() => {
    if (lookupPriorities.length > 0 && (!formData.priority || formData.priority === "medium")) {
      const dp = getDefaultPriority();
      if (dp) setFormData(prev => ({ ...prev, priority: dp.id as CreateSaleData["priority"] }));
      else if (lookupPriorities.length === 1)
        setFormData(prev => ({ ...prev, priority: lookupPriorities[0].id as CreateSaleData["priority"] }));
    }
  }, [lookupPriorities, getDefaultPriority]);

  useEffect(() => {
    const defaultCategory = getDefaultOfferCategory();
    const defaultSource = getDefaultOfferSource();
    const categoryToSelect = offerCategories.length === 1
      ? offerCategories[0].name
      : defaultCategory?.name || (offerCategories.length > 0 ? offerCategories[0].name : "");
    const sourceToSelect = offerSources.length === 1
      ? offerSources[0].name
      : defaultSource?.name || (offerSources.length > 0 ? offerSources[0].name : "");
    setFormData(prev => ({
      ...prev,
      category: offerCategories.length === 1 ? categoryToSelect : (prev.category || categoryToSelect),
      source: offerSources.length === 1 ? sourceToSelect : (prev.source || sourceToSelect),
    }));
  }, [offerCategories, offerSources, getDefaultOfferCategory, getDefaultOfferSource]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContactSelect = (contact: Contact | null) => {
    if (!contact) {
      setFormData(prev => ({
        ...prev,
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
      }));
      setSelectedInstallations([]);
      return;
    }
    setFormData(prev => ({
      ...prev,
      customerId: contact.id,
      customerName: contact.name,
      customerEmail: contact.email || "",
      customerPhone: contact.phone || "",
      customerAddress: contact.address || "",
    }));
    setSelectedInstallations([]);
  };

  const handleItemsChange = (items: SaleItem[]) => {
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    setFormData(prev => ({ ...prev, items, amount: itemsTotal }));
  };

  const calculateDiscountAmount = () =>
    calculateDocumentTotal({
      subtotal: formData.amount,
      discount: formData.discount,
      discountType: formData.discountType,
    }).discountAmount;

  const calculateTaxAmount = () =>
    calculateDocumentTotal({
      subtotal: formData.amount,
      discount: formData.discount,
      discountType: formData.discountType,
      tax: formData.taxes,
      taxType: formData.taxType,
    }).taxAmount;

  const calculateTotal = () =>
    calculateDocumentTotal({
      subtotal: formData.amount,
      discount: formData.discount,
      discountType: formData.discountType,
      tax: formData.taxes,
      taxType: formData.taxType,
      fiscalStamp: formData.fiscalStamp,
    }).total;

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();

    if (isTenantRequired) {
      toast({ title: t("common.error", "Error"), description: "Please select a target company first.", variant: "destructive" });
      return;
    }

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
        title: t("common.error", "Error"),
        description: validation.message ?? t("addSale.fillRequiredFields", "Please fill required fields"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const projectIdParam = new URLSearchParams(location.search).get("projectId");
      const saleData = {
        ...formData,
        deliveryDate: validUntil,
        totalAmount: calculateTotal(),
        status: isDraft ? ("created" as const) : ("in_progress" as const),
        ...(projectIdParam ? { projectId: Number(projectIdParam) } : {}),
      };

      const newSale = await SalesService.createSale(saleData);

      logFormSubmit("Create Sale", true, {
        entityType: "Sale",
        entityId: newSale.id,
        details: `Created sale "${formData.title}" for ${formData.customerName}`,
      });

      toast({
        title: t("addSale.successTitle", "Success"),
        description: isDraft ? t("addSale.successDraft") : t("addSale.successCreated"),
      });

      clearFormData();
      if (newSale?.id) navigate(`/dashboard/sales/${newSale.id}`);
      else navigate("/dashboard/sales");
    } catch (error) {
      console.error("Error creating sale:", error);
      logFormSubmit("Create Sale", false, { details: (error as Error).message });
      toast({
        title: t("common.error", "Error"),
        description: t("addSale.errorCreating"),
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
              {t("addSale.backToSales", "Back to Sales")}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-medium">{t("addSale.pageTitle")}</h1>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Sale Information */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                <TenantSelector value={targetTenantId} onChange={handleTenantChange} />
                <div className="space-y-2">
                  <Label htmlFor="title">{t("addSale.saleTitleLabel")} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder={t("addSale.saleTitlePlaceholder")}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category">{t("addSale.categoryLabel")} *</Label>
                      <Link
                        to={`/dashboard/lookups?tab=offerCategories&returnUrl=${encodeURIComponent(currentPath)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t("common.manage", "Manage")}
                      </Link>
                    </div>
                    <Select value={formData.category} onValueChange={(v) => handleInputChange("category", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("addSale.categoryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {offerCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="source">{t("addSale.sourceLabel")} *</Label>
                      <Link
                        to={`/dashboard/lookups?tab=offerSources&returnUrl=${encodeURIComponent(currentPath)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t("common.manage", "Manage")}
                      </Link>
                    </div>
                    <Select value={formData.source} onValueChange={(v) => handleInputChange("source", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("addSale.sourcePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {offerSources.map((src) => (
                          <SelectItem key={src.id} value={src.name}>{src.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="priority">{t("addSale.priorityLabel")}</Label>
                      <Link
                        to={`/dashboard/lookups?tab=priorities&returnUrl=${encodeURIComponent(currentPath)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t("common.manage", "Manage")}
                      </Link>
                    </div>
                    <Select value={formData.priority} onValueChange={(v) => handleInputChange("priority", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("addSale.priorityPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {lookupPriorities.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{t(p.id, p.name || p.id)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("addSale.deliveryDateLabel")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !validUntil && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validUntil ? format(validUntil, "PPP") : <span>{t("addSale.pickDate")}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={validUntil} onSelect={setValidUntil} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("addSale.descriptionLabel")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder={t("addSale.descriptionPlaceholder")}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardContent className="pt-6">
                <ContactSelectorWithType
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

            {/* Installations */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <InstallationSelector
                    onSelect={(installation) => {
                      setSelectedInstallations((prev) => {
                        if (prev.some((i) => i.id === installation.id)) return prev;
                        return [...prev, installation];
                      });
                    }}
                    selectedInstallation={null}
                    selectedInstallations={selectedInstallations}
                    onCreateNew={() => setShowCreateInstallation(true)}
                  />

                  {selectedInstallations.length > 0 && (
                    <div className="space-y-2">
                      {selectedInstallations.map((inst) => (
                        <div key={inst.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            <div>
                              <span className="font-medium text-sm">{inst.name}</span>
                              <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                                {inst.model && <div>{inst.manufacturer} - {inst.model}</div>}
                                {inst.serialNumber && <div>{t("installation_serial_number", "S/N")}: {inst.serialNumber}</div>}
                                {inst.matricule && <div>{t("installation_matricule", "Matricule")}: {inst.matricule}</div>}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInstallations((prev) => prev.filter((i) => i.id !== inst.id));
                              const updated = formData.items.map((item) =>
                                item.installationId === String(inst.id)
                                  ? { ...item, installationId: undefined, installationName: undefined }
                                  : item,
                              );
                              handleItemsChange(updated);
                            }}
                            className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items — gate on contact selected */}
            {formData.customerId && (
              <Card>
                <CardContent className="pt-6">
                  <SaleItemsSelectorAdvanced
                    items={formData.items}
                    onUpdateItems={handleItemsChange}
                    currency={formData.currency}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("addSale.settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("addSale.currencyLabel")}</Label>
                  <Input
                    id="currency"
                    value={currencies.find((c) => c.id === formData.currency)?.name || formData.currency}
                    readOnly
                    disabled
                    className="cursor-not-allowed bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">{t("addSale.currencyFromSettings")}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t("addSale.validUntilLabel")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !validUntil && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {validUntil ? format(validUntil, "PPP") : <span>{t("addSale.pickDate")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={validUntil} onSelect={setValidUntil} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t("addSale.financialSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Discount */}
                <div className="space-y-2">
                  <Label htmlFor="discount">{t("addSale.discount", "Discount")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => handleInputChange("discount", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="flex-1"
                    />
                    <Select
                      value={formData.discountType || "percentage"}
                      onValueChange={(v: "percentage" | "fixed") => handleInputChange("discountType", v)}
                    >
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">{formData.currency}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* TVA */}
                <div className="space-y-2">
                  <Label htmlFor="taxes">{t("addSale.tva", "TVA")}</Label>
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
                      onValueChange={(v: "percentage" | "fixed") => handleInputChange("taxType", v)}
                    >
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">{formData.currency}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fiscal Stamp */}
                <div className="space-y-2">
                  <Label htmlFor="fiscalStamp">{t("addSale.fiscalStampLabel", "Fiscal Stamp")}</Label>
                  <Input
                    id="fiscalStamp"
                    type="number"
                    step="0.001"
                    value={formData.fiscalStamp ?? 0}
                    onChange={(e) => handleInputChange("fiscalStamp", parseFloat(e.target.value) || 0)}
                    placeholder="1.000"
                  />
                  <p className="text-xs text-muted-foreground">{t("addSale.fiscalStampHint", "")}</p>
                </div>

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span>{t("addSale.itemsSubtotal", "Items Subtotal")}:</span>
                    <span>{formData.amount.toLocaleString()} {formData.currency}</span>
                  </div>
                  {calculateDiscountAmount() > 0 && (
                    <div className="flex justify-between">
                      <span>{t("addSale.discount", "Discount")} {formData.discountType === "percentage" ? `(${formData.discount}%)` : ""}:</span>
                      <span className="text-destructive">-{calculateDiscountAmount().toLocaleString()} {formData.currency}</span>
                    </div>
                  )}
                  {calculateTaxAmount() > 0 && (
                    <div className="flex justify-between">
                      <span>{t("addSale.tva", "TVA")} {formData.taxType === "percentage" ? `(${formData.taxes}%)` : ""}:</span>
                      <span>+{calculateTaxAmount().toLocaleString()} {formData.currency}</span>
                    </div>
                  )}
                  {(formData.fiscalStamp ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span>{t("addSale.fiscalStamp", "Fiscal Stamp")}:</span>
                      <span>+{(formData.fiscalStamp ?? 0).toLocaleString()} {formData.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>{t("addSale.total")}:</span>
                    <span>{calculateTotal().toLocaleString()} {formData.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t("addSale.notes", "Notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder={t("addSale.enterNotes", "Enter notes...")}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/sales")}>
            {t("addSale.cancel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading || !isFormValid}
          >
            <Save className="h-4 w-4 mr-2" />
            {t("addSale.saveAsDraft")}
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading || !isFormValid}
            className="gradient-primary"
          >
            <Send className="h-4 w-4 mr-2" />
            {t("addSale.createSale", "Create Sale")}
          </Button>
        </div>
      </form>

      {/* Create Installation Modal */}
      <CreateInstallationModal
        open={showCreateInstallation}
        onOpenChange={setShowCreateInstallation}
        onInstallationCreated={(installation) => {
          const newInst = {
            id: installation.id,
            name: installation.name,
            model: installation.model,
            manufacturer: installation.manufacturer,
            location: installation.siteAddress,
            type: installation.installationType,
            customer: { company: installation.contact?.primaryContactName || "" },
          };
          setSelectedInstallations((prev) => {
            if (prev.some((i) => i.id === newInst.id)) return prev;
            return [...prev, newInst];
          });
          setShowCreateInstallation(false);
        }}
      />
    </div>
  );
}
