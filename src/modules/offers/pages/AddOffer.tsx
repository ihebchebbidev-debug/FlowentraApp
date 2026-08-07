import { useState, useEffect } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { calculateDocumentTotal } from "@/lib/calculateTotal";
import { ArrowLeft, Save, FileText, Zap, Send, Search, Plus, Package, Settings2, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { OffersService } from "../services/offers.service";
import { OfferItemsSelectorAdvanced } from "../components/OfferItemsSelectorAdvanced";
import { ContactSelectorWithType } from "../components/ContactSelectorWithType";
import { InstallationSelector } from "@/modules/field/installations/components/InstallationSelector";
import { CreateInstallationModal } from "@/modules/field/installations/components/CreateInstallationModal";
import { CreateOfferData, OfferItem } from "../types";
import { useLookups } from '@/shared/contexts/LookupsContext';
import { useActionLogger } from "@/hooks/useActionLogger";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { validateConvertibleForm } from '@/modules/external/utils/convertValidation';

const statuses = [
  "draft",
  "sent"
];



const currencyKeys = ["TND", "USD", "EUR", "GBP"] as const;

export function AddOffer() {
  const { t } = useTranslation('offers');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { logFormSubmit, logButtonClick } = useActionLogger('Offers');
  const { viewAll, targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  const { priorities: lookupPriorities, offerCategories, offerSources, getDefaultOfferCategory, getDefaultOfferSource, refreshLookups } = useLookups();
  const [validUntil, setValidUntil] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [selectedInstallations, setSelectedInstallations] = useState<any[]>([]);
  const [showCreateInstallation, setShowCreateInstallation] = useState(false);
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;

  // Refresh lookups when user returns from Manage page (window focus or route change)
  useEffect(() => {
    const handleFocus = () => {
      refreshLookups();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshLookups]);

  // Also refresh when navigating back to this page
  useEffect(() => {
    refreshLookups();
  }, [location.key]);
  
  const [formData, setFormData, clearFormData] = useFormPersistence<CreateOfferData>('add-offer', {
    title: "",
    description: "",
    contactId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    status: "draft",
    category: "",
    source: "",
    amount: 0,
    currency: "TND",
    validUntil: undefined,
    items: [],
    notes: "",
    taxes: 0,
    taxType: "percentage",
    discount: 0,
    discountType: "percentage",
    fiscalStamp: 1
  });

  // Prefill from external-endpoint log conversion. The EndpointLogsTable
  // navigates here with `state.prefill` populated by the convert-preview API.
  // Apply once on mount, then strip the state so a refresh doesn't re-overwrite
  // edits the user has made.
  useEffect(() => {
    const prefill = (location.state as any)?.prefill;
    if (!prefill) return;
    setFormData(prev => ({
      ...prev,
      contactName: prefill.contactName || prev.contactName,
      contactEmail: prefill.email || prev.contactEmail,
      contactPhone: prefill.phone || prev.contactPhone,
      contactAddress: prefill.address || prev.contactAddress,
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
    // Clear the router state so back/forward + refresh don't re-trigger.
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply default values when lookups are loaded (following lookup behavior: default > first available)
  // If only one item exists, force-select it automatically
  useEffect(() => {
    const defaultCategory = getDefaultOfferCategory();
    const defaultSource = getDefaultOfferSource();
    
    // If exactly one item, always auto-select it
    const categoryToSelect = offerCategories.length === 1
      ? offerCategories[0].name
      : defaultCategory?.name || (offerCategories.length > 0 ? offerCategories[0].name : "");
    const sourceToSelect = offerSources.length === 1
      ? offerSources[0].name
      : defaultSource?.name || (offerSources.length > 0 ? offerSources[0].name : "");
    
    setFormData(prev => ({
      ...prev,
      // Force-set if only one option, otherwise only set if empty
      category: offerCategories.length === 1 ? categoryToSelect : (prev.category || categoryToSelect),
      source: offerSources.length === 1 ? sourceToSelect : (prev.source || sourceToSelect),
    }));
  }, [offerCategories, offerSources, getDefaultOfferCategory, getDefaultOfferSource]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactSelect = (contact: any) => {
    if (!contact) {
      setFormData(prev => ({
        ...prev,
        contactId: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        contactAddress: ""
      }));
      // Reset installations when contact changes
      setSelectedInstallations([]);
      return;
    }
    setFormData(prev => ({
      ...prev,
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email || "",
      contactPhone: contact.phone || "",
      contactAddress: contact.address || ""
    }));
    // Reset installations when contact changes
    setSelectedInstallations([]);
    setFormData(prev => ({
      ...prev,
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email || "",
      contactPhone: contact.phone || "",
      contactAddress: contact.address || ""
    }));
  };

  const handleItemsChange = (items: OfferItem[]) => {
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    setFormData(prev => ({
      ...prev,
      items,
      amount: itemsTotal
    }));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = true) => {
    e.preventDefault();
    
    if (isTenantRequired) {
      toast({ title: t('error'), description: 'Please select a target company first.', variant: "destructive" });
      return;
    }

    // Schema validation — covers required fields, formats, length & numeric
    // limits. Replaces the old title+contactName-only check so that converted
    // payloads (which can carry malformed emails/phones/negative prices) are
    // blocked client-side before hitting the API.
    const validation = validateConvertibleForm({
      title: formData.title,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      contactAddress: formData.contactAddress,
      notes: formData.notes,
      currency: formData.currency,
      amount: formData.amount,
      items: (formData.items ?? []).map((it: OfferItem) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      })),
    });
    if (!validation.ok) {
      toast({
        title: t('error'),
        description: validation.message ?? t('fillRequiredFields'),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // When launched from a project (…/offers/add?projectId=N) link the new
      // offer to that project so it shows up under the project's Offers tab.
      const projectIdParam = new URLSearchParams(location.search).get('projectId');

      const offerData = {
        ...formData,
        validUntil,
        status: isDraft ? 'draft' as const : 'sent' as const,
        ...(projectIdParam ? { projectId: Number(projectIdParam) } : {}),
      };

      const newOffer = await OffersService.createOffer(offerData);

      logFormSubmit('Create Offer', true, {
        entityType: 'Offer',
        entityId: newOffer.id,
        details: `Created offer "${formData.title}" for ${formData.contactName}`
      });

      toast({
        title: t('success'),
        description: isDraft ? t("offer_created") : t("offer_sent"),
      });

      clearFormData();
      if (newOffer?.id) {
        navigate(`/dashboard/offers/${newOffer.id}`);
      } else {
        navigate('/dashboard/offers');
      }
    } catch (error) {
      console.error("Error creating offer:", error);
      logFormSubmit('Create Offer', false, { details: (error as Error).message });
      toast({
        title: t('error'),
        description: t('failedToCreateOffer'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountAmount = () => {
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
      fiscalStamp: formData.fiscalStamp,
    }).total;
  };

  const isFormValid = formData.title && formData.contactName;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/offers" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('backToOffers')}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-medium">{t('new_offer')}</h1>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, true)} className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Offer Information */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                <TenantSelector value={targetTenantId} onChange={handleTenantChange} />
                <div className="space-y-2">
                  <Label htmlFor="title">{t("offer_title")} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder={t('enterOfferTitle')}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category">{t("category")} *</Label>
                      <Link 
                        to={`/dashboard/lookups?tab=offerCategories&returnUrl=${encodeURIComponent(currentPath)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t('common.manage', 'Manage')}
                      </Link>
                    </div>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                          <SelectValue placeholder={t('filters.all_priorities')} />
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
                      <Label htmlFor="source">{t("source")} *</Label>
                      <Link 
                        to={`/dashboard/lookups?tab=offerSources&returnUrl=${encodeURIComponent(currentPath)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t('common.manage', 'Manage')}
                      </Link>
                    </div>
                    <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
                      <SelectTrigger>
                          <SelectValue placeholder={t('filters.all_priorities')} />
                        </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {offerSources.map((src) => (
                          <SelectItem key={src.id} value={src.name}>{src.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("offer_description")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder={t('enterOfferDescription')}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className="pt-6">
                <ContactSelectorWithType
                  onContactSelect={handleContactSelect}
                  selectedContact={formData.contactName ? {
                    id: formData.contactId,
                    name: formData.contactName,
                    email: formData.contactEmail,
                    phone: formData.contactPhone,
                    address: formData.contactAddress
                  } : null}
                />
              </CardContent>
            </Card>

            {/* Installation Selection - always visible */}
            {(
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <InstallationSelector
                      onSelect={(installation) => {
                        // Add to list if not already present
                        setSelectedInstallations(prev => {
                          if (prev.some(i => i.id === installation.id)) return prev;
                          return [...prev, installation];
                        });
                      }}
                      selectedInstallation={null}
                      selectedInstallations={selectedInstallations}
                      onCreateNew={() => setShowCreateInstallation(true)}
                    />

                    {/* List of added installations */}
                    {selectedInstallations.length > 0 && (
                      <div className="space-y-2">
                        {selectedInstallations.map((inst) => (
                          <div key={inst.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary" />
                              <div>
                                <span className="font-medium text-sm">{inst.name}</span>
                                <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                                  {inst.model && (
                                    <div>{inst.manufacturer} - {inst.model}</div>
                                  )}
                                  {inst.serialNumber && (
                                    <div>{t('installation_serial_number')}: {inst.serialNumber}</div>
                                  )}
                                  {inst.matricule && (
                                    <div>{t('installation_matricule')}: {inst.matricule}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInstallations(prev => prev.filter(i => i.id !== inst.id));
                                const updatedItems = formData.items.map(item => 
                                  item.installationId === String(inst.id)
                                    ? { ...item, installationId: undefined, installationName: undefined }
                                    : item
                                );
                                handleItemsChange(updatedItems);
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
            )}

            {/* Offer Items - only visible after contact is selected */}
            {formData.contactId && (
              <Card>
                <CardContent className="pt-6">
                  <OfferItemsSelectorAdvanced
                    items={formData.items}
                    onUpdateItems={handleItemsChange}
                    currency={formData.currency}
                    installations={selectedInstallations}
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
                <CardTitle>{t('offerSettings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("currency")}</Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {t('currencies.TND')}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('currencyFromSettings')}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t('valid_until')}</Label>
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
                        {validUntil ? format(validUntil, "PPP") : <span>{t('selectDate')}</span>}
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
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t('financialSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Discount */}
                <div className="space-y-2">
                  <Label htmlFor="discount">{t("discount")}</Label>
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
                      value={formData.discountType} 
                      onValueChange={(value: 'percentage' | 'fixed') => handleInputChange("discountType", value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">{formData.currency}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* TVA (applied after discount) */}
                <div className="space-y-2">
                  <Label htmlFor="taxes">{t("tva")}</Label>
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
                      value={formData.taxType} 
                      onValueChange={(value: 'percentage' | 'fixed') => handleInputChange("taxType", value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">{formData.currency}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fiscal Stamp */}
                <div className="space-y-2">
                  <Label htmlFor="fiscalStamp">{t("fiscalStamp")}</Label>
                  <Input
                    id="fiscalStamp"
                    type="number"
                    step="0.001"
                    value={formData.fiscalStamp}
                    onChange={(e) => handleInputChange("fiscalStamp", parseFloat(e.target.value) || 0)}
                    placeholder="1.000"
                  />
                  <p className="text-xs text-muted-foreground">{t("fiscalStampHint")}</p>
                </div>

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span>{t('itemsSubtotal')}:</span>
                    <span>{formData.amount.toLocaleString()} {formData.currency}</span>
                  </div>
                  {calculateDiscountAmount() > 0 && (
                    <div className="flex justify-between">
                      <span>{t('discount')} {formData.discountType === 'percentage' ? `(${formData.discount}%)` : ''}:</span>
                      <span className="text-destructive">-{calculateDiscountAmount().toLocaleString()} {formData.currency}</span>
                    </div>
                  )}
                  {calculateTaxAmount() > 0 && (
                    <div className="flex justify-between">
                      <span>{t('tva')} {formData.taxType === 'percentage' ? `(${formData.taxes}%)` : ''}:</span>
                      <span>+{calculateTaxAmount().toLocaleString()} {formData.currency}</span>
                    </div>
                  )}
                  {formData.fiscalStamp > 0 && (
                    <div className="flex justify-between">
                      <span>{t('fiscalStamp')}:</span>
                      <span>+{formData.fiscalStamp.toLocaleString()} {formData.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>{t('total')}:</span>
                    <span>{calculateTotal().toLocaleString()} {formData.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t('notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                  <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder={t('enterNotes')}
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
            onClick={() => navigate('/dashboard/offers')}
          >
            {t('back')}
          </Button>
          <Button 
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading || !isFormValid}
            className="gradient-primary"
          >
            <Send className="h-4 w-4 mr-2" />
            {t('add_offer')}
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
            customer: { company: installation.contact?.primaryContactName || '' },
          };
          setSelectedInstallations(prev => {
            if (prev.some(i => i.id === newInst.id)) return prev;
            return [...prev, newInst];
          });
          setShowCreateInstallation(false);
        }}
      />
    </div>
  );
}