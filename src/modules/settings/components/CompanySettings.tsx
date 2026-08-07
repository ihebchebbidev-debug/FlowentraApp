import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save, Loader2, ExternalLink, Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { setCompanyLogo, setCompanyLogoExplicitNone, useCompanyLogo } from "@/hooks/useCompanyLogo";
import { API_URL } from "@/config/api";
import { getMutationHeadersNoContentType } from "@/utils/apiHeaders";
import { tenantsApi, type Tenant } from "@/services/api/tenantsApi";
import { getCurrentTenant, isViewAllMode } from "@/utils/tenant";
import { getActiveCompanyId } from "@/utils/targetTenant";
import { useTenantMap } from "@/contexts/TenantMapContext";
import { invalidateActiveCompany } from "@/shared/company/activeCompany";
import { buildFooterLines } from "@/shared/pdf/resolveCompany";
import { Textarea } from "@/components/ui/textarea";



export function CompanySettings() {
  const { toast } = useToast();
  const { t } = useTranslation(['settings', 'translation']);
  const { user, isMainAdmin } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentLogo = useCompanyLogo();
  const { refetch } = useTenantMap();

  // Every field below belongs to THIS company only (the active tenant row).
  // Another company's settings page edits a different row entirely.
  const [companyData, setCompanyData] = useState({
    name: "",
    tagline: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    state: "",
    country: "",
    taxId: "",
    registrationNumber: "",
    shareCapital: "",
    bankName: "",
    bankAccount: "",
    bankSwift: "",
    footerMessage: "",
    logoUrl: "",
  });

  // Only a MainAdminUser may write to /api/Tenants/{id}. Regular users get a
  // read-only view instead of a save that fails with 403.
  const canEdit = isMainAdmin && !isLoading;

  // Load company data from the ACTIVE tenant (matches current X-Tenant slug, or default).
  // Falls back to user_data in localStorage if tenants API is unavailable.
  useEffect(() => {
    let cancelled = false;

    const loadFromTenant = async () => {
      setIsLoading(true);
      try {
        const tenants = await tenantsApi.list();
        if (cancelled) return;

        const slug = getCurrentTenant();
        const viewAll = isViewAllMode();
        const activeCompanyId = getActiveCompanyId();

        // Resolve which tenant this settings page is for:
        // Priority 1: the actively selected company (X-Target-Tenant)
        // Priority 2: the current subdomain tenant
        // Priority 3: the default tenant
        const matched =
          (activeCompanyId !== undefined ? tenants.find(t => t.id === activeCompanyId) : null) ||
          (!viewAll && slug ? tenants.find(t => t.slug?.toLowerCase() === slug.toLowerCase()) : null) ||
          tenants.find(t => t.isDefault) ||
          tenants[0] ||
          null;

        if (matched) {
          setActiveTenant(matched);
          setCompanyData({
            name: matched.companyName || "",
            tagline: matched.companyTagline || "",
            website: matched.companyWebsite || "",
            phone: matched.companyPhone || "",
            email: matched.companyEmail || "",
            address: matched.companyAddress || "",
            city: matched.companyCity || "",
            postalCode: matched.companyPostalCode || "",
            state: matched.companyState || "",
            country: matched.companyCountry || "",
            taxId: matched.taxId || "",
            registrationNumber: matched.registrationNumber || "",
            shareCapital: matched.shareCapital || "",
            bankName: matched.bankName || "",
            bankAccount: matched.bankAccount || "",
            bankSwift: matched.bankSwift || "",
            footerMessage: matched.reportFooterMessage || "",
            logoUrl: matched.companyLogoUrl || "",
          });
          // Do NOT call setCompanyLogo here — TenantMapContext is the
          // authoritative owner of the logo singleton and will set it correctly.
          return;
        }
      } catch (err) {
        console.warn('[CompanySettings] tenantsApi.list failed, falling back to user_data', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      // Fallback: localStorage user_data
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          setCompanyData(prev => ({
            ...prev,
            name: parsed.companyName || "",
            website: parsed.companyWebsite || "",
            phone: parsed.phoneNumber || "",
            logoUrl: parsed.companyLogoUrl || "",
          }));
        } catch {
          // ignore
        }
      }
    };

    loadFromTenant();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenWebsite = () => {
    if (companyData.website) {
      let url = companyData.website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('company.invalidFileType', { defaultValue: 'Invalid file type' }),
        description: t('company.onlyImages', { defaultValue: 'Please upload an image file (PNG, JPG, SVG, etc.)' }),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('company.fileTooLarge', { defaultValue: 'File too large' }),
        description: t('company.maxFileSize', { defaultValue: 'Maximum file size is 5MB' }),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    // Upload file via /api/Documents/upload (same as profile pictures)
    // Store the relative path URL in CompanyLogoUrl — NOT base64
    // For PDF reports, the backend /api/Auth/company-logo-base64 endpoint reads the file and converts
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('moduleType', 'company');
      formData.append('category', 'company-logo');
      formData.append('description', 'Company Logo');

      const uploadResponse = await fetch(`${API_URL}/api/Documents/upload`, {
        method: 'POST',
        headers: getMutationHeadersNoContentType(),
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const result = await uploadResponse.json();
      const docs = result.documents || result.data || (Array.isArray(result) ? result : [result]);
      const uploadedDoc = docs[0];

      // Build relative path from the response (same pattern as profile picture)
      const filePath = uploadedDoc?.filePath || uploadedDoc?.FilePath || uploadedDoc?.path || uploadedDoc?.Path;
      const docId = uploadedDoc?.id || uploadedDoc?.Id;

      let logoPath = '';
      if (filePath) {
        logoPath = filePath.replace(/^\//, '');
      } else if (docId) {
        logoPath = `api/Documents/download/${docId}`;
      }

      if (!logoPath) throw new Error('No file path returned from upload');

      console.log('[CompanyLogo] File uploaded, saving path to profile:', logoPath);

      // Save the relative path to MainAdminUser.CompanyLogoUrl
      const saveResponse = await authService.updateUser({ companyLogoUrl: logoPath });
      console.log('[CompanyLogo] Save response:', JSON.stringify(saveResponse));
      
      if (saveResponse.success) {
        // Update localStorage user_data
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsed = JSON.parse(userData);
          parsed.companyLogoUrl = logoPath;
          localStorage.setItem('user_data', JSON.stringify(parsed));
        }
        // Clear any stale cached base64 so reports fetch fresh
        localStorage.removeItem('company-logo-blob-data');

        // Persist to the tenant so TenantMapContext reads the new logo on
        // next fetch — without this, the sidebar reverts after a page reload.
        if (activeTenant?.id) {
          try {
            const updated = await tenantsApi.update(activeTenant.id, {
              companyLogoUrl: logoPath,
            });
            setActiveTenant(updated);
          } catch (err) {
            console.warn('[CompanyLogo] Failed to persist logo to tenant', err);
          }
        }

        // Update shared logo state across the entire app immediately (optimistic).
        setCompanyLogo(logoPath);
        setCompanyData(prev => ({ ...prev, logoUrl: logoPath }));
        // Refresh TenantMapContext cache so the sidebar/switcher/reports
        // see the new tenant logo without a page reload.
        void refetch();

        toast({
          title: t('company.logoUploaded', { defaultValue: 'Logo uploaded' }),
          description: t('company.logoUploadedDesc', { defaultValue: 'Logo saved successfully and applied across the app.' }),
        });
      } else {
        toast({
          title: t('company.uploadFailed', { defaultValue: 'Upload failed' }),
          description: saveResponse.message || t('company.uploadFailedDesc', { defaultValue: 'Failed to save the logo.' }),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[CompanyLogo] Upload failed:', error);
      toast({
        title: t('company.uploadFailed', { defaultValue: 'Upload failed' }),
        description: t('company.uploadFailedDesc', { defaultValue: 'Failed to upload the logo. Please try again.' }),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    setCompanyData(prev => ({ ...prev, logoUrl: "" }));
    // Use explicit-none sentinel so bootstrap doesn't fall back to user_data logo.
    setCompanyLogoExplicitNone();
    localStorage.removeItem('company-logo-blob-data');
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        parsed.companyLogoUrl = null;
        localStorage.setItem('user_data', JSON.stringify(parsed));
      } catch { /* ignore */ }
    }
    // Persist removal to the tenant so it survives page reload.
    if (activeTenant?.id) {
      try {
        const updated = await tenantsApi.update(activeTenant.id, { companyLogoUrl: "" });
        setActiveTenant(updated);
      } catch (err) {
        console.warn('[CompanyLogo] Failed to clear tenant logo', err);
      }
    }
    void refetch();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Primary: persist on the active tenant (multi-tenant aware)
      let savedOk = false;
      let errMsg: string | undefined;

      if (activeTenant?.id) {
        try {
          const updated = await tenantsApi.update(activeTenant.id, {
            companyName: companyData.name,
            companyTagline: companyData.tagline,
            companyWebsite: companyData.website,
            companyPhone: companyData.phone,
            companyEmail: companyData.email,
            companyAddress: companyData.address,
            companyCity: companyData.city,
            companyPostalCode: companyData.postalCode,
            companyState: companyData.state,
            companyCountry: companyData.country,
            taxId: companyData.taxId,
            registrationNumber: companyData.registrationNumber,
            shareCapital: companyData.shareCapital,
            bankName: companyData.bankName,
            bankAccount: companyData.bankAccount,
            bankSwift: companyData.bankSwift,
            reportFooterMessage: companyData.footerMessage,
            companyLogoUrl: companyData.logoUrl || "",
          });
          setActiveTenant(updated);
          savedOk = true;
        } catch (err: any) {
          errMsg = err?.response?.data?.message || err?.message;
          console.warn('[CompanySettings] tenantsApi.update failed, will try authService fallback', err);
        }
      }

      // Secondary: keep MainAdminUser profile fields in sync (and fallback when no tenant)
      try {
        await authService.updateUser({
          companyName: companyData.name,
          companyWebsite: companyData.website,
          phoneNumber: companyData.phone,
          companyLogoUrl: companyData.logoUrl || "",
        });
        savedOk = true;
      } catch (err) {
        console.warn('[CompanySettings] authService.updateUser fallback failed', err);
      }

      if (savedOk) {
        // Sync localStorage user_data so sidebar/header reflect immediately
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            parsed.companyName = companyData.name;
            parsed.companyWebsite = companyData.website;
            parsed.phoneNumber = companyData.phone;
            parsed.companyLogoUrl = companyData.logoUrl || null;
            localStorage.setItem('user_data', JSON.stringify(parsed));
          } catch { /* ignore */ }
        }
        // Reports open in other tabs pick up the new footer immediately.
        invalidateActiveCompany();
        if (companyData.logoUrl) setCompanyLogo(companyData.logoUrl);
        else setCompanyLogoExplicitNone();
        void refetch();

        toast({
          title: t('company.settingsSavedTitle'),
          description: t('company.settingsSavedDesc'),
        });
      } else {
        toast({
          title: t('company.updateFailedTitle'),
          description: errMsg || t('company.updateFailedDesc'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to save company settings:', error);
      toast({
        title: t('company.updateFailedTitle'),
        description: t('company.updateFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          {t('company.sectionTitle')}
        </CardTitle>
        <CardDescription className="text-xs">{t('company.sectionDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">
        {!canEdit && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {t('company.readOnlyNotice', { defaultValue: 'Only an administrator can change this company\u2019s information. These details appear on all PDF report footers.' })}
          </div>
        )}
        {/* Company Logo Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t('company.companyLogoLabel', { defaultValue: 'Company Logo' })}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('company.companyLogoDesc', { defaultValue: 'Upload your company logo. It will appear in the sidebar, header, login page, and PDF reports.' })}
          </p>
          <div className="flex items-center gap-4">
            {/* Logo Preview — use blob URL from hook for display */}
            <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden group">
              {(currentLogo || companyData.logoUrl) ? (
                <>
                  <img
                    src={currentLogo || companyData.logoUrl}
                    alt="Company Logo"
                    className="w-full h-full object-contain p-2"
                  />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t('company.removeLogo', { defaultValue: 'Remove logo' })}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !canEdit}
                className="w-fit"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading
                  ? t('company.uploading', { defaultValue: 'Uploading...' })
                  : t('company.uploadLogo', { defaultValue: 'Upload Logo' })
                }
              </Button>
              <p className="text-px-10 text-muted-foreground">
                {t('company.logoFormats', { defaultValue: 'PNG, JPG, SVG — max 5MB' })}
              </p>
            </div>
          </div>
        </div>

        {/* Company Name & Website */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settingsCompanyName" className="text-sm font-medium">
              {t('company.companyNameLabel')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="settingsCompanyName"
              value={companyData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('company.enterCompanyNamePlaceholder')}
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsCompanyWebsite" className="text-sm font-medium">
              {t('company.websiteLabel')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="settingsCompanyWebsite"
                type="url"
                value={companyData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder={t('company.enterWebsitePlaceholder')}
                disabled={!canEdit}
                className="h-9 sm:h-10 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleOpenWebsite}
                disabled={!companyData.website}
                className="h-9 sm:h-10 w-9 sm:w-10 shrink-0"
                title={t('company.visitWebsite', { defaultValue: 'Visit website' })}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settingsPhone" className="text-sm font-medium">
              {t('company.phoneLabel')}
            </Label>
            <Input
              id="settingsPhone"
              value={companyData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder={t('company.enterPhonePlaceholder')}
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsCompanyEmail" className="text-sm font-medium">
              {t('company.emailLabel', { defaultValue: 'Email' })}
            </Label>
            <Input
              id="settingsCompanyEmail"
              value={companyData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@company.com"
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsCompanyTagline" className="text-sm font-medium">
              {t('company.taglineLabel', { defaultValue: 'Tagline' })}
            </Label>
            <Input
              id="settingsCompanyTagline"
              value={companyData.tagline}
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              placeholder="Your slogan"
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
        </div>

        {/* Address — printed on every report footer */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-foreground">
              {t('company.addressSection', { defaultValue: 'Address' })}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('company.addressSectionDesc', { defaultValue: 'Shown in the footer of every PDF report for this company.' })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settingsCompanyAddress" className="text-sm font-medium">
              {t('company.addressLabel', { defaultValue: 'Street address' })}
            </Label>
            <Input
              id="settingsCompanyAddress"
              value={companyData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main Street"
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsCompanyCity" className="text-sm font-medium">
              {t('company.cityLabel', { defaultValue: 'City' })}
            </Label>
            <Input
              id="settingsCompanyCity"
              value={companyData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsCompanyPostalCode" className="text-sm font-medium">
              {t('company.postalCodeLabel', { defaultValue: 'Postal code' })}
            </Label>
            <Input
              id="settingsCompanyPostalCode"
              value={companyData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsCompanyState" className="text-sm font-medium">
              {t('company.stateLabel', { defaultValue: 'State / Region' })}
            </Label>
            <Input
              id="settingsCompanyState"
              value={companyData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsCompanyCountry" className="text-sm font-medium">
              {t('company.countryLabel', { defaultValue: 'Country' })}
            </Label>
            <Input
              id="settingsCompanyCountry"
              value={companyData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          </div>
        </div>

        {/* Legal identifiers */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            {t('company.legalSection', { defaultValue: 'Legal identifiers' })}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settingsTaxId" className="text-sm font-medium">
              {t('company.taxIdLabel', { defaultValue: 'Tax ID / VAT' })}
            </Label>
            <Input
              id="settingsTaxId"
              value={companyData.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsRegistrationNumber" className="text-sm font-medium">
              {t('company.registrationNumberLabel', { defaultValue: 'Registration number' })}
            </Label>
            <Input
              id="settingsRegistrationNumber"
              value={companyData.registrationNumber}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsShareCapital" className="text-sm font-medium">
              {t('company.shareCapitalLabel', { defaultValue: 'Share capital' })}
            </Label>
            <Input
              id="settingsShareCapital"
              value={companyData.shareCapital}
              onChange={(e) => handleInputChange('shareCapital', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          </div>
        </div>

        {/* Bank details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            {t('company.bankSection', { defaultValue: 'Bank details' })}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settingsBankName" className="text-sm font-medium">
              {t('company.bankNameLabel', { defaultValue: 'Bank name' })}
            </Label>
            <Input
              id="settingsBankName"
              value={companyData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsBankAccount" className="text-sm font-medium">
              {t('company.bankAccountLabel', { defaultValue: 'Account / IBAN' })}
            </Label>
            <Input
              id="settingsBankAccount"
              value={companyData.bankAccount}
              onChange={(e) => handleInputChange('bankAccount', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settingsBankSwift" className="text-sm font-medium">
              {t('company.bankSwiftLabel', { defaultValue: 'SWIFT / BIC' })}
            </Label>
            <Input
              id="settingsBankSwift"
              value={companyData.bankSwift}
              onChange={(e) => handleInputChange('bankSwift', e.target.value)}
              placeholder=""
              disabled={!canEdit}
              className="h-9 sm:h-10"
            />
          </div>
          </div>
        </div>

        {/* Footer message + live preview */}
        <div className="space-y-3">
          <Label htmlFor="settingsFooterMessage" className="text-sm font-medium">
            {t('company.footerMessageLabel', { defaultValue: 'Report footer message' })}
          </Label>
          <Textarea
            id="settingsFooterMessage"
            value={companyData.footerMessage}
            onChange={(e) => handleInputChange('footerMessage', e.target.value)}
            placeholder={t('company.footerMessagePlaceholder', { defaultValue: 'Thank you for your business.' })}
            disabled={!canEdit}
            rows={2}
          />
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t('company.footerPreview', { defaultValue: 'Report footer preview' })}
            </p>
            {companyData.name ? (
              <p className="text-xs text-foreground">{companyData.name}</p>
            ) : null}
            {buildFooterLines({
              address: companyData.address,
              city: companyData.city,
              postalCode: companyData.postalCode,
              state: companyData.state,
              country: companyData.country,
              phone: companyData.phone,
              email: companyData.email,
              website: companyData.website,
              taxId: companyData.taxId,
              registrationNumber: companyData.registrationNumber,
              shareCapital: companyData.shareCapital,
              bankName: companyData.bankName,
              bankAccount: companyData.bankAccount,
              bankSwift: companyData.bankSwift,
            }).map((line, idx) => (
              <p key={idx} className="text-xs text-muted-foreground">{line}</p>
            ))}
            {companyData.footerMessage ? (
              <p className="text-xs text-muted-foreground">{companyData.footerMessage}</p>
            ) : null}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || !canEdit}
            className="w-full sm:w-auto shadow-medium hover-lift"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('company.saveChanges', { defaultValue: t('application.saveChanges') })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
