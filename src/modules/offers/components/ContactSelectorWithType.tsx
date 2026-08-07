import { useState, useEffect, Suspense, lazy } from "react";
import { ContentSkeleton } from "@/components/ui/page-skeleton";
import { Search, Plus, User, Building2, ArrowRight, Zap, Loader2, MapPin, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { contactsApi } from "@/services/contactsApi";
import { toast } from "sonner";

// Lazy load the map component
const MapLocationPicker = lazy(() => import("@/components/shared/MapLocationPicker").then(m => ({ default: m.MapLocationPicker })));

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  type?: string;
}

interface ContactSelectorWithTypeProps {
  onContactSelect: (contact: Contact | null) => void;
  selectedContact: Contact | null;
  disabled?: boolean;
}

export function ContactSelectorWithType({ onContactSelect, selectedContact, disabled = false }: ContactSelectorWithTypeProps) {
  const { t } = useTranslation('offers');
  const [selectedType, setSelectedType] = useState<'person' | 'company' | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddStep, setQuickAddStep] = useState<1 | 2 | 3>(1);
  // Per-step inline validation errors (phone on step 1, email on step 2) so the
  // user is corrected as they go, not only with a toast on the final step.
  const [quickAddErrors, setQuickAddErrors] = useState<{ phone?: string; email?: string }>({});
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    position: "",
    status: "active",
    type: "individual" as "individual" | "company",
    cin: "",
    matriculeFiscale: "",
    latitude: "",
    longitude: ""
  });

  // Fetch contacts from backend API
  useEffect(() => {
    const fetchContacts = async () => {
    setLoading(true);
      try {
        const response = await contactsApi.getAll({ pageSize: 100 });
        const contactsList = response?.contacts || [];
        setContacts(contactsList);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(contact => {
    // Map backend type to frontend type
    const contactType = contact.type === 'company' || contact.type === 'Company' ? 'company' : 'person';
    const matchesType = !selectedType || contactType === selectedType;
    
    const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.company || contact.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleSelectContact = (contact: any) => {
    const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    onContactSelect({
      id: contact.id.toString(),
      name: name,
      email: contact.email,
      phone: contact.phone || contact.phoneNumber,
      address: contact.address,
      company: contact.company || contact.companyName,
      type: contact.type === 'company' || contact.type === 'Company' ? 'company' : 'person'
    });
  };

  const [quickAddLoading, setQuickAddLoading] = useState(false);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v: string) => /^[+]?[\d\s()./-]{6,}$/.test(v);

  // Step 1 → 2: validate phone format (when provided) before advancing.
  const goToStep2 = () => {
    const phone = quickAddData.phone?.trim() || '';
    if (phone && !isValidPhone(phone)) {
      setQuickAddErrors(e => ({ ...e, phone: t('invalidPhone') || 'Please enter a valid phone number' }));
      return;
    }
    setQuickAddErrors(e => ({ ...e, phone: undefined }));
    setQuickAddStep(2);
  };

  // Step 2 → 3: validate email format (when provided) before advancing.
  const goToStep3 = () => {
    const email = quickAddData.email?.trim() || '';
    if (email && !isValidEmail(email)) {
      setQuickAddErrors(e => ({ ...e, email: t('invalidEmail') || 'Please enter a valid email address' }));
      return;
    }
    setQuickAddErrors(e => ({ ...e, email: undefined }));
    setQuickAddStep(3);
  };

  const handleQuickAdd = async () => {
    const isCompany = quickAddData.type === 'company';
    
    // Validation
    if (isCompany) {
      if (!quickAddData.company) {
        toast.error(t('companyNameRequired') || 'Company name is required');
        return;
      }
      if (!quickAddData.matriculeFiscale) {
        toast.error(t('matriculeFiscaleRequired') || 'Tax identification number (Matricule Fiscal) is required');
        return;
      }
    } else {
      if (!quickAddData.firstName) {
        toast.error(t('firstNameRequired') || 'First name is required');
        return;
      }
      if (!quickAddData.lastName) {
        toast.error(t('lastNameRequired') || 'Last name is required');
        return;
      }
      if (!quickAddData.phone) {
        toast.error(t('phoneRequired') || 'Phone number is required');
        return;
      }
    }
    
    // Validate email format if provided
    const emailValue = quickAddData.email?.trim() || '';
    if (emailValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        toast.error(t('invalidEmail') || 'Please enter a valid email address');
        return;
      }
      
      // Check if email already exists in the system
      try {
        const emailExists = await contactsApi.exists(emailValue);
        if (emailExists) {
          toast.warning(t('emailAlreadyExists') || 'A contact with this email already exists. Please use a different email or select the existing contact.');
          return;
        }
      } catch (checkError) {
        console.warn('[QuickAddContact] Could not verify email uniqueness:', checkError);
        // Continue with creation - backend will handle duplicate check
      }
    }
    
    setQuickAddLoading(true);
    try {
      // Create contact in backend - match AddContactPage payload exactly
      // For companies, backend requires firstName + lastName both non-empty,
      // so mirror the company name into lastName (same pattern as AddContactPage).
      const firstName = isCompany ? quickAddData.company : quickAddData.firstName;
      const lastName = isCompany ? quickAddData.company : quickAddData.lastName;
      const displayName = isCompany
        ? quickAddData.company.trim()
        : `${quickAddData.firstName} ${quickAddData.lastName}`.trim();

      const emailValue = quickAddData.email?.trim() || null;

      const contactPayload: any = {
        firstName,
        lastName,
        name: displayName,
        email: emailValue,
        phone: quickAddData.phone || null,
        company: isCompany ? quickAddData.company : (quickAddData.company || null),
        position: !isCompany ? (quickAddData.position || null) : null,
        address: quickAddData.address || null,
        type: isCompany ? 'company' : 'individual',
        status: quickAddData.status || 'active',
        favorite: false,
        avatar: null,
        lastContactDate: null,
        cin: !isCompany ? (quickAddData.cin || null) : null,
        matriculeFiscale: quickAddData.matriculeFiscale || null,
        latitude: quickAddData.latitude ? parseFloat(quickAddData.latitude) : null,
        longitude: quickAddData.longitude ? parseFloat(quickAddData.longitude) : null
      };
      
      console.log('[QuickAddContact] Creating contact with payload:', contactPayload);
      
      const newContact = await contactsApi.createContact(contactPayload);
      
      console.log('[QuickAddContact] Contact created successfully:', newContact);
      
      onContactSelect({
        id: newContact.id.toString(),
        name: displayName,
        phone: quickAddData.phone,
        type: quickAddData.type,
        email: quickAddData.email || "",
        company: quickAddData.company || "",
        address: quickAddData.address || ""
      });
      
      toast.success(t('contactCreated') || 'Contact created successfully');
      setQuickAddData({ 
        firstName: "", 
        lastName: "", 
        email: "", 
        phone: "", 
        address: "", 
        company: "", 
        position: "", 
        status: "active", 
        type: "individual",
        cin: "",
        matriculeFiscale: "",
        latitude: "",
        longitude: ""
      });
      setQuickAddStep(1);
      setShowQuickAdd(false);
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('[QuickAddContact] Error creating contact:', error);
      console.error('[QuickAddContact] Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      
      // Extract meaningful error message
      const errorMessage = 
        error?.response?.data?.message || 
        error?.response?.data?.errors?.join(', ') ||
        error?.response?.data?.title ||
        error?.message || 
        t('failedToCreateContact') || 
        'Failed to create contact. Please check required fields.';
      
      toast.error(errorMessage);
    } finally {
      setQuickAddLoading(false);
    }
  };

  // Selected contact view
  if (selectedContact && selectedContact.name) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>{t('selectedContact')}</Label>
          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onContactSelect(null);
                setSelectedType(null);
                setShowQuickAdd(false);
              }}
            >
              {t('changeContact')}
            </Button>
          )}
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {selectedContact.type === 'company' ? (
                  <Building2 className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{selectedContact.name}</h3>
                {selectedContact.company && (
                  <p className="text-sm text-muted-foreground">{selectedContact.company}</p>
                )}
                {selectedContact.email && (
                  <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                )}
                {selectedContact.phone && (
                  <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quick Add view
  if (showQuickAdd) {
    const canProceedToStep2 =
      quickAddData.type === 'individual'
        ? Boolean(quickAddData.firstName && quickAddData.lastName && quickAddData.phone)
        : Boolean(quickAddData.company && quickAddData.matriculeFiscale);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <div className="flex items-center gap-2">
              <Label className="text-lg font-semibold">{t('quickAddContact')}</Label>
              <Badge variant="outline" className="text-xs">
                {quickAddStep}/3
              </Badge>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowQuickAdd(false)}
          >
            {t('cancel')}
          </Button>
        </div>
        
        {quickAddStep === 1 ? (
          <div className="space-y-4">
            {/* Type Selection Buttons */}
            <div className="space-y-2">
              <Label>{t('contactType')} *</Label>
              <div className="flex gap-3">
                <div 
                  className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    quickAddData.type === 'individual' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                  }`} 
                  onClick={() => {
                    setQuickAddData(prev => ({ ...prev, type: 'individual', firstName: '', lastName: '', company: '' }));
                    setQuickAddStep(1);
                  }}
                >
                  <div className={`p-2 rounded-lg ${quickAddData.type === 'individual' ? 'bg-primary/20' : 'bg-muted'}`}>
                    <User className={`h-5 w-5 ${quickAddData.type === 'individual' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{t('person')}</p>
                    <p className="text-xs text-muted-foreground">{t('individualContact') || 'Individual contact'}</p>
                  </div>
                </div>
                <div 
                  className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    quickAddData.type === 'company' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                  }`} 
                  onClick={() => {
                    setQuickAddData(prev => ({ ...prev, type: 'company', firstName: '', lastName: '', company: '' }));
                    setQuickAddStep(1);
                  }}
                >
                  <div className={`p-2 rounded-lg ${quickAddData.type === 'company' ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Building2 className={`h-5 w-5 ${quickAddData.type === 'company' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{t('company')}</p>
                    <p className="text-xs text-muted-foreground">{t('businessOrOrganization') || 'Business or organization'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Required fields based on type */}
            {quickAddData.type === 'individual' ? (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="font-medium text-sm">{t('personInformation')}</h4>
                  <p className="text-xs text-muted-foreground">{t('enterPrimaryDetails')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-firstName">{t('firstName')} *</Label>
                    <Input
                      id="quick-firstName"
                      value={quickAddData.firstName}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quick-lastName">{t('lastName')} *</Label>
                    <Input
                      id="quick-lastName"
                      value={quickAddData.lastName}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-phone">{t('phone')} *</Label>
                  <Input
                    id="quick-phone"
                    value={quickAddData.phone}
                    onChange={(e) => { setQuickAddData(prev => ({ ...prev, phone: e.target.value })); setQuickAddErrors(prev => ({ ...prev, phone: undefined })); }}
                    placeholder="+216 XX XXX XXX"
                    className={quickAddErrors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {quickAddErrors.phone && (
                    <p className="text-xs text-destructive">{quickAddErrors.phone}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="font-medium text-sm">{t('companyInformation')}</h4>
                  <p className="text-xs text-muted-foreground">{t('enterCompanyDetails')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-company">{t('companyName')} *</Label>
                  <Input
                    id="quick-company"
                    value={quickAddData.company}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Tech Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-matriculeFiscale">{t('matriculeFiscale')} *</Label>
                  <Input
                    id="quick-matriculeFiscale"
                    value={quickAddData.matriculeFiscale}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, matriculeFiscale: e.target.value }))}
                    placeholder={t('matriculeFiscalePlaceholder') || '0000000/X/X/X/000'}
                  />
                </div>
              </div>
            )}
          </div>
        ) : quickAddStep === 2 ? (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h4 className="font-medium text-sm">{t('additionalInfo') || 'Informations complémentaires'}</h4>
              <p className="text-xs text-muted-foreground">{t('optionalDetails') || 'Ces champs sont optionnels'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-email">{t('email')}</Label>
                <Input
                  id="quick-email"
                  type="email"
                  value={quickAddData.email}
                  onChange={(e) => { setQuickAddData(prev => ({ ...prev, email: e.target.value })); setQuickAddErrors(prev => ({ ...prev, email: undefined })); }}
                  placeholder={quickAddData.type === 'company' ? 'contact@company.com' : 'john@example.com'}
                  className={quickAddErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {quickAddErrors.email && (
                  <p className="text-xs text-destructive">{quickAddErrors.email}</p>
                )}
              </div>
              {quickAddData.type === 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="quick-cin">{t('cin')}</Label>
                  <Input
                    id="quick-cin"
                    value={quickAddData.cin}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, cin: e.target.value }))}
                    placeholder={t('cinPlaceholder')}
                  />
                </div>
              )}
              {quickAddData.type === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="quick-phone-company">{t('phone')}</Label>
                  <Input
                    id="quick-phone-company"
                    value={quickAddData.phone}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="quick-address">{t('address')}</Label>
                <Input
                  id="quick-address"
                  value={quickAddData.address}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={quickAddData.type === 'company' ? '123 Business Ave, City' : '123 Main St, City'}
                />
              </div>
            </div>

            {/* Work Information - only for individuals */}
            {quickAddData.type === 'individual' && (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="font-medium text-sm">{t('workInformation')}</h4>
                  <p className="text-xs text-muted-foreground">{t('professionalDetails')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-company-work">{t('company')}</Label>
                    <Input
                      id="quick-company-work"
                      value={quickAddData.company}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Tech Corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quick-position">{t('position')}</Label>
                    <Input
                      id="quick-position"
                      value={quickAddData.position}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="CEO"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : quickAddStep === 3 ? (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">{t('quickAdd.locationTitle')}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{t('quickAdd.locationDescription')}</p>
            </div>
            <Suspense fallback={
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <ContentSkeleton rows={4} />
              </div>
            }>
              <MapLocationPicker
                latitude={quickAddData.latitude}
                longitude={quickAddData.longitude}
                onLocationChange={(lat, lng) => {
                  setQuickAddData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                  }));
                }}
              />
            </Suspense>
          </div>
        ) : null}
        
        <div className="flex items-center justify-between pt-4 border-t">
          {quickAddStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuickAddStep((quickAddStep - 1) as 1 | 2 | 3)}
              disabled={quickAddLoading}
            >
              {t('back')}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {quickAddStep === 1 ? (
              <Button
                type="button"
                onClick={goToStep2}
                disabled={!canProceedToStep2}
              >
                {t('next')}
              </Button>
            ) : quickAddStep === 2 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQuickAdd}
                  disabled={quickAddLoading}
                  className="gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  {t('quickAdd.skipLocation')}
                </Button>
                <Button
                  type="button"
                  onClick={goToStep3}
                >
                  {t('next')}
                </Button>
              </>
            ) : (
              <Button 
                type="button"
                onClick={handleQuickAdd} 
                disabled={
                  quickAddLoading ||
                  (quickAddData.type === 'individual'
                    ? (!quickAddData.firstName || !quickAddData.lastName || !quickAddData.phone)
                    : (!quickAddData.company || !quickAddData.matriculeFiscale))
                }
                className="gap-2"
              >
                {quickAddLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t('addContact')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Type selection view
  if (!selectedType) {
    return (
      <div className="space-y-4">
        <Label className="text-lg font-semibold">{t('selectContact')}</Label>
        
        <Button 
          variant="outline" 
          className="w-full gap-2 h-10"
          onClick={() => {
            setQuickAddStep(1);
            setShowQuickAdd(true);
          }}
        >
          <Zap className="h-4 w-4" />
          {t('quickAddContact')}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t('orSelectFromExisting')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors group"
            onClick={() => setSelectedType('person')}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{t('person')}</h3>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:border-primary transition-colors group"
            onClick={() => setSelectedType('company')}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{t('company')}</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Contact list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedType === 'person' ? (
            <>
              <User className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">{t('selectPerson')}</Label>
            </>
          ) : (
            <>
              <Building2 className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">{t('selectCompany')}</Label>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedType(null);
              setSearchTerm("");
            }}
          >
            {t('back')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuickAddStep(1);
              setShowQuickAdd(true);
            }}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {t('quickAddContact')}
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchContacts')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="max-h-64 overflow-y-auto">
        <CardContent className="p-0">
          {loading ? (
            <ContentSkeleton rows={4} className="p-6" />
          ) : filteredContacts.length > 0 ? (
            <div className="divide-y">
              {filteredContacts.map((contact) => {
                const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
                const contactType = contact.type === 'company' || contact.type === 'Company' ? 'company' : 'person';
                return (
                  <div
                    key={contact.id}
                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {contactType === 'company' ? (
                          <Building2 className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {contact.status || 'active'}
                          </Badge>
                        </div>
                        {(contact.company || contact.companyName) && (
                          <p className="text-sm text-muted-foreground break-words line-clamp-1">{contact.company || contact.companyName}</p>
                        )}
                        {contact.email && (
                          <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <div className="mb-4">
                <User className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <p className="mb-2">{t('noContactsFound')}</p>
              <Button
                variant="link"
                onClick={() => {
                  setQuickAddStep(1);
                  setShowQuickAdd(true);
                }}
                className="p-0 h-auto gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('quickAddInstead')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}