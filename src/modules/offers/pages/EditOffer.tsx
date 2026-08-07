import { useState, useEffect, useRef } from "react";
import { calculateDocumentTotal } from "@/lib/calculateTotal";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import offerStatuses from '@/data/mock/offer-statuses.json';
import currencies from '@/data/mock/currencies.json';
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Calendar as CalendarIcon, Save, Plus, Loader2, AlertTriangle, Package, X } from "lucide-react";
import { InstallationSelector } from "@/modules/field/installations/components/InstallationSelector";
import { CreateInstallationModal } from "@/modules/field/installations/components/CreateInstallationModal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ContactSelectorWithType } from "../components/ContactSelectorWithType";
import { OfferItemsSelectorAdvanced } from "../components/OfferItemsSelectorAdvanced";
import { OffersService } from "../services/offers.service";
import { Offer } from "../types";
import { useLookups } from '@/shared/contexts/LookupsContext';
import { Link } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const offerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  contactId: z.string().min(1, "Contact is required"),
  contactName: z.string().min(1, "Contact name is required"),
  // Allow empty email (some legacy contacts/offers may not have one)
  contactEmail: z.union([
    z.string().email("Valid email is required"),
    z.literal(""),
    z.null(),
    z.undefined()
  ]).optional(),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  contactPosition: z.string().optional(),
  amount: z.number().min(0, "Amount must be positive"),
  currency: z.string().min(1, "Currency is required"),
  // Backend supports more statuses than just draft/sent (e.g., accepted, created)
  status: z.enum(["draft", "sent", "pending", "negotiation", "accepted", "won", "lost", "cancelled", "rejected", "expired", "declined", "modified", "created"]),
  category: z.string().optional(),
  source: z.string().optional(),
  validUntil: z.date().optional(),
  notes: z.string().optional(),
  taxes: z.number().min(0).default(0),
  taxType: z.enum(["percentage", "fixed"]).default("percentage"),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["percentage", "fixed"]).default("percentage"),
  fiscalStamp: z.number().min(0).default(1)
});

type OfferFormData = z.infer<typeof offerSchema>;

export function EditOffer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('offers');
  const { offerCategories, offerSources } = useLookups();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const { viewAll, targetTenantId, handleTenantChange } = useTargetTenant();
  const [offerItems, setOfferItems] = useState<any[]>([]);
  const [originalItems, setOriginalItems] = useState<any[]>([]);
  const [selectedInstallations, setSelectedInstallations] = useState<any[]>([]);
  const [showCreateInstallation, setShowCreateInstallation] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const initialDataRef = useRef<string>("");
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  
  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: "",
      description: "",
      contactId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      contactPosition: "",
      amount: 0,
      currency: "TND",
      status: "draft",
      category: "",
      source: "",
      notes: "",
      taxes: 0,
      taxType: "percentage",
      discount: 0,
      discountType: "percentage",
      fiscalStamp: 1
    },
  });

  // Persist form data to sessionStorage for navigation resilience
  const formPersistKey = `form_persist_edit-offer-${id}`;
  
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        sessionStorage.setItem(formPersistKey, JSON.stringify({ values, items: offerItems, contact: selectedContact }));
      } catch {}
    });
    return () => subscription.unsubscribe();
  }, [form, formPersistKey, offerItems, selectedContact]);

  const clearFormPersist = () => {
    try { sessionStorage.removeItem(formPersistKey); } catch {}
  };

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const offerData = await OffersService.getOfferById(id);
        if (!offerData) {
          toast.error(t('offerNotFound'));
          navigate('/dashboard/offers');
          return;
        }
        
        setOffer(offerData);
        // Deep clone items to avoid reference mutation issues
        const itemsCopy = (offerData.items || []).map(item => ({ ...item }));
        setOfferItems(itemsCopy);
        // Store a separate deep clone of original items for change detection
        setOriginalItems((offerData.items || []).map(item => ({ ...item })));
        
        // Store initial data for change detection
        const initialFormData = {
          title: offerData.title,
          description: offerData.description || "",
          contactId: offerData.contactId,
          contactName: offerData.contactName,
          contactEmail: offerData.contactEmail || "",
          contactPhone: offerData.contactPhone || "",
          contactAddress: offerData.contactAddress || "",
          contactPosition: offerData.contactPosition || "",
          amount: offerData.amount,
          currency: offerData.currency,
          status: offerData.status,
          category: offerData.category || "",
          source: offerData.source || "",
          notes: offerData.notes || "",
          taxes: offerData.taxes || 0,
          taxType: offerData.taxType || 'percentage',
          discount: offerData.discount || 0,
          discountType: offerData.discountType || 'percentage',
          fiscalStamp: offerData.fiscalStamp || 1,
          validUntil: offerData.validUntil ? new Date(offerData.validUntil).toISOString() : undefined,
          items: JSON.stringify(offerData.items || []),
        };
        initialDataRef.current = JSON.stringify(initialFormData);
        
        // Populate form with existing data
        form.reset({
          title: offerData.title,
          description: offerData.description || "",
          contactId: offerData.contactId,
          contactName: offerData.contactName,
          contactEmail: offerData.contactEmail || "",
          contactPhone: offerData.contactPhone || "",
          contactAddress: offerData.contactAddress || "",
          contactPosition: offerData.contactPosition || "",
          amount: offerData.amount,
          currency: offerData.currency,
          status: offerData.status as OfferFormData['status'],
          category: offerData.category || "",
          source: offerData.source || "",
          notes: offerData.notes || "",
          taxes: offerData.taxes || 0,
          taxType: (offerData.taxType || 'percentage') as 'percentage' | 'fixed',
          discount: offerData.discount || 0,
          discountType: (offerData.discountType || 'percentage') as 'percentage' | 'fixed',
          fiscalStamp: offerData.fiscalStamp || 1,
          validUntil: offerData.validUntil ? new Date(offerData.validUntil) : undefined,
        });

        // Set contact data
        setSelectedContact({
          id: offerData.contactId,
          name: offerData.contactName,
          email: offerData.contactEmail,
          phone: offerData.contactPhone,
          address: offerData.contactAddress,
          company: offerData.contactCompany,
          position: offerData.contactPosition,
        });

        // Extract unique installations from offer items
        const installationsFromItems = (offerData.items || [])
          .filter((item: any) => item.installationId)
          .reduce((acc: any[], item: any) => {
            if (!acc.some(i => String(i.id) === String(item.installationId))) {
              acc.push({
                id: item.installationId,
                name: item.installationName || 'Installation',
              });
            }
            return acc;
          }, []);
        // Also include linkedInstallation if present
        if (offerData.linkedInstallation && !installationsFromItems.some((i: any) => String(i.id) === String(offerData.linkedInstallation!.id))) {
          installationsFromItems.push({
            id: offerData.linkedInstallation.id,
            name: offerData.linkedInstallation.name,
            model: offerData.linkedInstallation.model,
          });
        }
        setSelectedInstallations(installationsFromItems);

        // Restore persisted user edits if they exist (e.g., after returning from lookups)
        try {
          const persisted = sessionStorage.getItem(formPersistKey);
          if (persisted) {
            const { values, items, contact } = JSON.parse(persisted);
           if (values) {
              // Convert validUntil string back to Date if it exists
              if (values.validUntil && typeof values.validUntil === 'string') {
                values.validUntil = new Date(values.validUntil);
              }
              form.reset({ ...form.getValues(), ...values });
            }
            if (items?.length) setOfferItems(items);
            if (contact) setSelectedContact(contact);
            sessionStorage.removeItem(formPersistKey);
          }
        } catch {}
      } catch (error) {
        toast.error('Failed to fetch offer');
        navigate('/dashboard/offers');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id, form, navigate, t]);

  const watchAmount = form.watch("amount");
  const watchTaxes = form.watch("taxes");
  const watchTaxType = form.watch("taxType");
  const watchDiscount = form.watch("discount");
  const watchDiscountType = form.watch("discountType");
  const watchFiscalStamp = form.watch("fiscalStamp");
  
  // Calculate total from items
  const itemsTotal = offerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const baseAmount = itemsTotal > 0 ? itemsTotal : watchAmount;
  const editOfferTotals = calculateDocumentTotal({
    subtotal: baseAmount,
    discount: watchDiscount,
    discountType: watchDiscountType,
    tax: watchTaxes,
    taxType: watchTaxType,
    fiscalStamp: watchFiscalStamp,
  });
  const discountAmount = editOfferTotals.discountAmount;
  const afterDiscount = editOfferTotals.afterDiscount;
  const taxAmount = editOfferTotals.taxAmount;
  const totalAmount = editOfferTotals.total;

  // Track changes
  const formValues = form.watch();
  useEffect(() => {
    if (!initialDataRef.current) return;
    
    const currentData = {
      title: formValues.title,
      description: formValues.description || "",
      contactId: formValues.contactId,
      contactName: formValues.contactName,
      contactEmail: formValues.contactEmail || "",
      contactPhone: formValues.contactPhone || "",
      contactAddress: formValues.contactAddress || "",
      amount: formValues.amount,
      currency: formValues.currency,
      status: formValues.status,
      category: formValues.category || "",
      source: formValues.source || "",
      notes: formValues.notes || "",
      taxes: formValues.taxes || 0,
      taxType: formValues.taxType || 'percentage',
      discount: formValues.discount || 0,
      discountType: formValues.discountType || 'percentage',
      fiscalStamp: formValues.fiscalStamp || 0,
      validUntil: formValues.validUntil ? formValues.validUntil.toISOString() : undefined,
      items: JSON.stringify(offerItems),
    };
    
    setHasChanges(JSON.stringify(currentData) !== initialDataRef.current);
  }, [formValues, offerItems]);

  const onSubmit = async (data: OfferFormData) => {
    if (!offer) return;
    

    setSaving(true);
    try {
      const updateData: Partial<Offer> = {
        title: data.title,
        description: data.description,
        contactId: data.contactId,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactAddress: data.contactAddress,
        amount: itemsTotal > 0 ? itemsTotal : data.amount,
        currency: data.currency as 'USD' | 'EUR' | 'GBP' | 'TND',
        status: data.status as Offer['status'],
        category: data.category as Offer['category'],
        source: data.source as Offer['source'],
        notes: data.notes,
        validUntil: data.validUntil,
        taxes: data.taxes,
        taxType: data.taxType,
        discount: data.discount,
        discountType: data.discountType,
        fiscalStamp: data.fiscalStamp,
        totalAmount: totalAmount,
        items: offerItems,
      };

      await OffersService.updateOffer(offer.id, updateData, originalItems);
      
      toast.success(t('offer_updated') || 'Offer saved successfully!');
      clearFormPersist();
      navigate(`/dashboard/offers/${offer.id}`);
    } catch (error) {
      console.error('Failed to update offer:', error);
      toast.error(t('failedToUpdateOffer') || 'Failed to save offer. Please try again.');
    } finally {
      setSaving(false);
      setShowConfirmDialog(false);
    }
  };

  const handleSaveClick = () => {
    // Save immediately (no extra modal step) and show validation errors via toast
    form.handleSubmit(
      onSubmit,
      (errors) => {
        console.error('Form Validation Errors:', errors);
        toast.error('Please fix the form errors before saving.');
      }
    )();
  };

  const handleContactSelect = (contact: any) => {
    if (contact === null) {
      // Clearing the contact to allow re-selection
      setSelectedContact(null);
      form.setValue("contactId", "");
      form.setValue("contactName", "");
      form.setValue("contactEmail", "");
      form.setValue("contactPhone", "");
      form.setValue("contactAddress", "");
      form.setValue("contactPosition", "");
    } else {
      setSelectedContact(contact);
      form.setValue("contactId", contact.id);
      form.setValue("contactName", contact.name);
      form.setValue("contactEmail", contact.email || "");
      form.setValue("contactPhone", contact.phone || "");
      form.setValue("contactAddress", contact.address || "");
      form.setValue("contactPosition", contact.position || "");
    }
  };

  if (loading) {
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

  if (!offer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">{t('offerNotFound')}</h2>
        <Button onClick={() => navigate('/dashboard/offers')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToOffers')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-background/95">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/offers')}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('edit_offer')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('editOfferDescription')}
            </p>
          </div>
        </div>
        
        <Button
          type="button"
          onClick={handleSaveClick}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('saveChanges') || 'Save Changes'}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmSaveTitle') || 'Save Changes?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmSaveDescription') || 'Are you sure you want to save the changes to this offer?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                form.handleSubmit(
                  onSubmit,
                  (errors) => {
                    console.error('Form Validation Errors:', errors);
                    toast.error('Please fix the form errors before saving.');
                  }
                )()
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('saveChanges') || 'Save Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <form className="p-3 sm:p-4 lg:p-6 space-y-4 md:space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveClick(); }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Tenant Selector for View All mode (read-only for edit) */}
            <TenantSelector value={targetTenantId} onChange={handleTenantChange} readOnly />
            
            {/* Offer Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('offer_details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">{t('offer_title')} *</Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    placeholder={t('enterOfferTitle')}
                    className="mt-1"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category">{t("category")}</Label>
                      <Link 
                        to={`/dashboard/lookups?tab=offerCategories&returnUrl=${encodeURIComponent(currentPath)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t('common.manage', 'Manage')}
                      </Link>
                    </div>
                    <Select 
                      value={form.watch("category")} 
                      onValueChange={(value) => form.setValue("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCategory')} />
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
                      <Label htmlFor="source">{t("source")}</Label>
                      <Link 
                        to={`/dashboard/lookups?tab=offerSources&returnUrl=${encodeURIComponent(currentPath)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t('common.manage', 'Manage')}
                      </Link>
                    </div>
                    <Select 
                      value={form.watch("source")} 
                      onValueChange={(value) => form.setValue("source", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectSource')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {offerSources.map((src) => (
                          <SelectItem key={src.id} value={src.name}>{src.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">{t('offer_description')}</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder={t('enterOfferDescription')}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Installation Selection */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <InstallationSelector
                    onSelect={(installation) => {
                      setSelectedInstallations(prev => {
                        if (prev.some(i => String(i.id) === String(installation.id))) return prev;
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
                              {inst.model && (
                                <span className="text-xs text-muted-foreground ml-2">{inst.manufacturer} - {inst.model}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInstallations(prev => prev.filter(i => String(i.id) !== String(inst.id)));
                              const updatedItems = offerItems.map(item =>
                                item.installationId === String(inst.id)
                                  ? { ...item, installationId: undefined, installationName: undefined }
                                  : item
                              );
                              setOfferItems(updatedItems);
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

            {/* Create Installation Modal */}
            <CreateInstallationModal
              open={showCreateInstallation}
              onOpenChange={setShowCreateInstallation}
              onInstallationCreated={(installation) => {
                setSelectedInstallations(prev => [...prev, {
                  id: installation.id,
                  name: installation.name,
                  model: installation.model,
                  manufacturer: installation.manufacturer,
                }]);
              }}
            />

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact_information')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactSelectorWithType
                  selectedContact={selectedContact}
                  onContactSelect={handleContactSelect}
                />
              </CardContent>
            </Card>

            {/* Offer Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  {t('offer_items')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OfferItemsSelectorAdvanced
                  items={offerItems}
                  onUpdateItems={setOfferItems}
                  currency={form.watch("currency")}
                  installations={selectedInstallations}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t('offerSettings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currency">{t('currency')} *</Label>
                  <Select
                    value={form.watch("currency")}
                    onValueChange={(value) => form.setValue("currency", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="validUntil">{t('valid_until')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full mt-1 justify-start text-left font-normal",
                          !form.watch("validUntil") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("validUntil") ? (
                          format(form.watch("validUntil")!, "PPP")
                        ) : (
                          <span>{t('selectDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("validUntil")}
                        onSelect={(date) => form.setValue("validUntil", date)}
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
                <CardTitle>{t('financialSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offerItems.length === 0 && (
                  <div>
                    <Label htmlFor="amount">{t('offer_amount')} *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("amount", { valueAsNumber: true })}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="taxes">{t('tva')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="taxes"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("taxes", { valueAsNumber: true })}
                      placeholder="0.00"
                      className="flex-1"
                    />
                    <Select 
                      value={form.watch("taxType")} 
                      onValueChange={(value: 'percentage' | 'fixed') => form.setValue("taxType", value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">{form.watch("currency")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fiscalStamp">{t('fiscalStamp')}</Label>
                  <Input
                    id="fiscalStamp"
                    type="number"
                    step="0.001"
                    min="0"
                    {...form.register("fiscalStamp", { valueAsNumber: true })}
                    placeholder="1.000"
                  />
                  <p className="text-xs text-muted-foreground">{t("fiscalStampHint")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">{t('discount')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("discount", { valueAsNumber: true })}
                      placeholder="0.00"
                      className="flex-1"
                    />
                    <Select 
                      value={form.watch("discountType")} 
                      onValueChange={(value: 'percentage' | 'fixed') => form.setValue("discountType", value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">{form.watch("currency")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {offerItems.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('itemsSubtotal')}</span>
                      <span>{itemsTotal.toFixed(2)} {form.watch("currency")}</span>
                    </div>
                  )}
                  
                  {watchTaxes > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('tva')} {watchTaxType === 'percentage' ? `(${watchTaxes}%)` : ''}
                      </span>
                      <span>+{taxAmount.toFixed(2)} {form.watch("currency")}</span>
                    </div>
                  )}
                  
                  {watchDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('discount')} {watchDiscountType === 'percentage' ? `(${watchDiscount}%)` : ''}
                      </span>
                      <span className="text-destructive">-{discountAmount.toFixed(2)} {form.watch("currency")}</span>
                    </div>
                  )}
                  
                  {(watchFiscalStamp || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('fiscalStamp')}</span>
                      <span>+{(watchFiscalStamp || 0).toFixed(3)} {form.watch("currency")}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>{t('total')}</span>
                    <span>{totalAmount.toFixed(2)} {form.watch("currency")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t('offer_notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...form.register("notes")}
                  placeholder={t('enterNotes')}
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}