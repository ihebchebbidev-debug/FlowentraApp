/**
 * TenantManagement — Settings tab for managing companies (multi-tenancy).
 * Only accessible by MainAdminUser.
 */
import { useState, useEffect } from 'react';
import { Building2, Plus, Save, Loader2, Trash2, Star, Pencil, Upload, X, Layers, Eye, Settings2, ImageOff, RotateCcw, Info } from 'lucide-react';
import { ModuleScopeDialog } from './ModuleScopeDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import { API_URL } from '@/config/api';
import { setTenantOverride, isViewAllMode, VIEW_ALL_SENTINEL, getCurrentTenant } from '@/utils/tenant';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { buildFooterLines } from '@/shared/pdf/resolveCompany';
import { invalidateActiveCompany } from '@/shared/company/activeCompany';
import { tenantsApi, type Tenant, type CreateTenantRequest, type UpdateTenantRequest } from '@/services/api/tenantsApi';

/**
 * Renders a company's real logo. Falls back to the default-company admin logo,
 * then to a clean "no logo" placeholder (initials + indicator) — never a broken
 * image. Logo-load failures are caught and downgraded to the placeholder.
 */
function CompanyAvatar({ tenant, adminLogoUrl }: { tenant: Tenant; adminLogoUrl?: string }) {
  const [errored, setErrored] = useState(false);

  // Priority: the tenant's own logo → (default company) the admin's logo.
  const raw = tenant.companyLogoUrl || (tenant.isDefault ? (adminLogoUrl || '') : '');
  const src = raw ? `${API_URL}/${String(raw).replace(/^\/+/, '')}` : '';

  const initials =
    (tenant.companyName || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('') || '?';

  if (src && !errored) {
    return (
      <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border border-border/40 bg-background">
        <img
          src={src}
          alt={tenant.companyName}
          className="max-w-full max-h-full object-contain"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }

  // No logo (or it failed to load) → placeholder with initials + "no logo" badge.
  return (
    <div
      className="relative shrink-0 w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border border-dashed border-border bg-muted/40"
      title="No logo uploaded"
    >
      <span className="text-sm font-semibold text-muted-foreground tracking-wide">{initials}</span>
      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border text-muted-foreground">
        <ImageOff className="h-2.5 w-2.5" />
      </span>
    </div>
  );
}

export function TenantManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('settings');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreateTenantRequest>({
    slug: '',
    companyName: '',
    companyWebsite: '',
    companyPhone: '',
    companyAddress: '',
    companyCountry: '',
    industry: '',
    companyLogoUrl: '',
    companyEmail: '',
    companyTagline: '',
    companyCity: '',
    companyPostalCode: '',
    companyState: '',
    taxId: '',
    registrationNumber: '',
    shareCapital: '',
    bankName: '',
    bankAccount: '',
    bankSwift: '',
    reportFooterMessage: '',
  });

  /** Live preview of how this company's identity prints on report footers. */
  const footerPreview = buildFooterLines({
    name: form.companyName,
    tagline: form.companyTagline ?? '',
    address: form.companyAddress ?? '',
    city: form.companyCity ?? '',
    postalCode: form.companyPostalCode ?? '',
    state: form.companyState ?? '',
    country: form.companyCountry ?? '',
    phone: form.companyPhone ?? '',
    email: form.companyEmail ?? '',
    website: form.companyWebsite ?? '',
    taxId: form.taxId ?? '',
    registrationNumber: form.registrationNumber ?? '',
    shareCapital: form.shareCapital ?? '',
    bankName: form.bankName ?? '',
    bankAccount: form.bankAccount ?? '',
    bankSwift: form.bankSwift ?? '',
    footerMessage: form.reportFooterMessage ?? '',
  });

  const fetchTenants = async () => {
    try {
      const data = await tenantsApi.list();
      setTenants(data);
    } catch {
      toast({
        title: t('companies.loadErrorTitle'),
        description: t('companies.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const openCreate = () => {
    setEditingTenant(null);
    setForm({
    slug: '',
    companyName: '',
    companyWebsite: '',
    companyPhone: '',
    companyAddress: '',
    companyCountry: '',
    industry: '',
    companyLogoUrl: '',
    companyEmail: '',
    companyTagline: '',
    companyCity: '',
    companyPostalCode: '',
    companyState: '',
    taxId: '',
    registrationNumber: '',
    shareCapital: '',
    bankName: '',
    bankAccount: '',
    bankSwift: '',
    reportFooterMessage: '',
  });
    setLogoFile(null);
    setLogoPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    // The default tenant is edited in Company & preferences, not here.
    if (tenant.isDefault) {
      toast({
        title: t('companies.defaultEditHintTitle', 'Managed in Company & preferences'),
        description: t('companies.defaultEditHint', 'The default tenant is edited from the Company & preferences section.'),
      });
      return;
    }

    // Open immediately with current row data, then refresh from backend
    setEditingTenant(tenant);
    setDialogOpen(true);
    setEditLoading(true);

    const applyTenantToForm = (tnt: Tenant) => {
      setForm({
        slug: tnt.slug,
        companyName: tnt.companyName,
        companyWebsite: tnt.companyWebsite || '',
        companyPhone: tnt.companyPhone || '',
        companyAddress: tnt.companyAddress || '',
        companyCountry: tnt.companyCountry || '',
        industry: tnt.industry || '',
        companyLogoUrl: tnt.companyLogoUrl || '',
        companyEmail: tnt.companyEmail || '',
        companyTagline: tnt.companyTagline || '',
        companyCity: tnt.companyCity || '',
        companyPostalCode: tnt.companyPostalCode || '',
        companyState: tnt.companyState || '',
        taxId: tnt.taxId || '',
        registrationNumber: tnt.registrationNumber || '',
        shareCapital: tnt.shareCapital || '',
        bankName: tnt.bankName || '',
        bankAccount: tnt.bankAccount || '',
        bankSwift: tnt.bankSwift || '',
        reportFooterMessage: tnt.reportFooterMessage || '',
      });
      setLogoFile(null);
      setLogoPreview(tnt.companyLogoUrl ? `${API_URL}/${String(tnt.companyLogoUrl).replace(/^\/+/, '')}` : null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    applyTenantToForm(tenant);

    tenantsApi
      .getById(tenant.id)
      .then((fresh) => {
        setEditingTenant(fresh);
        applyTenantToForm(fresh);
      })
      .catch(() => {
        toast({
          title: t('companies.loadErrorTitle'),
          description: t('companies.loadError'),
          variant: 'destructive',
        });
      })
      .finally(() => setEditLoading(false));
  };

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      toast({ title: t('companies.errorTitle'), description: t('companies.companyNameRequired'), variant: 'destructive' });
      return;
    }
    if (!editingTenant && !form.slug.trim()) {
      toast({ title: t('companies.errorTitle'), description: t('companies.slugRequired'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let savedTenant: Tenant | null = null;

      if (editingTenant) {
        const update: UpdateTenantRequest = {
          companyName: form.companyName,
          companyWebsite: form.companyWebsite || undefined,
          companyPhone: form.companyPhone || undefined,
          companyAddress: form.companyAddress || undefined,
          companyCountry: form.companyCountry || undefined,
          industry: form.industry || undefined,
          // Per-company report identity — always sent so clearing a field persists.
          companyEmail: form.companyEmail ?? '',
          companyTagline: form.companyTagline ?? '',
          companyCity: form.companyCity ?? '',
          companyPostalCode: form.companyPostalCode ?? '',
          companyState: form.companyState ?? '',
          taxId: form.taxId ?? '',
          registrationNumber: form.registrationNumber ?? '',
          shareCapital: form.shareCapital ?? '',
          bankName: form.bankName ?? '',
          bankAccount: form.bankAccount ?? '',
          bankSwift: form.bankSwift ?? '',
          reportFooterMessage: form.reportFooterMessage ?? '',
          // Only send logoUrl if user removed it (empty string) and didn't pick a new file.
          // If a new file is picked, the upload endpoint will set it.
          ...(logoFile ? {} : { companyLogoUrl: form.companyLogoUrl ?? '' }),
        };
        savedTenant = await tenantsApi.update(editingTenant.id, update);
      } else {
        savedTenant = await tenantsApi.create({
          ...form,
          companyLogoUrl: logoFile ? undefined : (form.companyLogoUrl || undefined),
        });
      }

      // Upload the logo file (if any) via the dedicated endpoint now that we have a tenant id
      if (logoFile && savedTenant) {
        try {
          await tenantsApi.uploadLogo(savedTenant.id, logoFile);
        } catch (uploadErr: any) {
          toast({
            title: t('companies.logoUploadFailed', 'Logo upload failed'),
            description: uploadErr?.response?.data?.message
              || uploadErr?.message
              || t('companies.logoUploadFailedDesc', 'Could not upload the logo image.'),
            variant: 'destructive',
          });
          // Keep the rest of the save successful — don't return early
        }
      }

      toast({
        title: editingTenant ? t('companies.editTitle') : t('companies.createTitle'),
        description: t(
          editingTenant ? 'companies.editSuccess' : 'companies.createSuccess',
          { companyName: form.companyName },
        ),
      });
      invalidateActiveCompany();
      setDialogOpen(false);
      setLogoFile(null);
      setLogoPreview(null);
      fetchTenants();
    } catch (error: any) {
      toast({
        title: t('companies.errorTitle'),
        description: error?.response?.data?.message || t('companies.saveError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTenant) return;
    try {
      await tenantsApi.delete(deletingTenant.id);
      toast({ title: t('companies.deactivateTitle'), description: t('companies.deactivateSuccess', { companyName: deletingTenant.companyName }) });
      fetchTenants();
    } catch (error: any) {
      toast({
        title: t('companies.errorTitle'),
        description: error?.response?.data?.message || t('companies.deactivateError'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingTenant(null);
    }
  };

  /** Bring a deactivated company back — without it the row was a dead end. */
  const handleReactivate = async (tenant: Tenant) => {
    try {
      await tenantsApi.update(tenant.id, { isActive: true });
      toast({
        title: t('companies.reactivateTitle', 'Company reactivated'),
        description: t('companies.reactivateSuccess', { companyName: tenant.companyName }),
      });
      invalidateActiveCompany();
      fetchTenants();
    } catch (error: any) {
      toast({
        title: t('companies.errorTitle'),
        description: error?.response?.data?.message || t('companies.reactivateError', 'Failed to reactivate company.'),
        variant: 'destructive',
      });
    }
  };

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setForm({ ...form, companyLogoUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSetDefault = async (tenant: Tenant) => {
    try {
      await tenantsApi.setDefault(tenant.id);
      toast({
        title: t('companies.setDefaultTitle', 'Default company updated'),
        description: t(
          'companies.setDefaultReloadHint',
          'The app will now reload and switch to this company so that all data uses it as default.'
        ),
      });
      setTenantOverride(tenant.slug);
    } catch {
      toast({ title: t('companies.errorTitle'), description: t('companies.setDefaultError'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card border-0 bg-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {t('companies.title')}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {t('companies.managementDesc')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setScopeDialogOpen(true)}
                size="sm"
                variant="outline"
                title={t('moduleScope.title', 'Module Data Scope')}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                {t('moduleScope.title', 'Module Data Scope')}
              </Button>
              <Button onClick={openCreate} size="sm" className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                {t('companies.addCompany')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {/* View All Companies toggle */}
          {tenants.filter(t => t.isActive).length > 1 && (
            <div className="mb-4">
              <div
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                  isViewAllMode()
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50 bg-muted/20 hover:border-primary/30'
                }`}
                onClick={() => {
                  if (isViewAllMode()) {
                    setTenantOverride(null);
                  } else {
                    setTenantOverride(VIEW_ALL_SENTINEL);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${isViewAllMode() ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Layers className={`h-5 w-5 ${isViewAllMode() ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground">{t('companies.viewAllCompanies', 'View All Companies')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('companies.viewAllDesc', 'See and manage data from all companies in one view')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isViewAllMode() && (
                    <Badge variant="default" className="text-px-10 h-5 px-2">{t('companies.active', 'Active')}</Badge>
                  )}
                  <Eye className={`h-4 w-4 ${isViewAllMode() ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </div>
          )}

          {tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('companies.noCompanies')}</p>
              <p className="text-xs mt-1">{t('companies.noCompaniesDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tenants.map(tenant => {
                const currentSlug = getCurrentTenant();
                const isCurrentTenant = !isViewAllMode() && (
                  (tenant.isDefault && !currentSlug) || tenant.slug === currentSlug
                );
                return (
                <div
                  key={tenant.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    tenant.isActive ? 'cursor-pointer' : 'cursor-default opacity-70'
                  } ${
                    isCurrentTenant
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/50 bg-muted/20 hover:border-primary/30'
                  }`}
                  onClick={() => {
                    // Switching into a deactivated company would load a company
                    // the backend no longer serves — keep the row read-only.
                    if (!tenant.isActive) return;
                    setTenantOverride(tenant.slug);
                  }}
                >

                  {/* Company Logo (real) or a clean "no logo" placeholder */}
                  <CompanyAvatar tenant={tenant} adminLogoUrl={(user as any)?.companyLogoUrl} />

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-foreground truncate">{tenant.companyName}</h3>
                      {isCurrentTenant && (
                        <Badge variant="secondary" className="text-px-10 h-4 px-1.5">{t('companies.currentBadge', 'Current')}</Badge>
                      )}
                      {tenant.isDefault && (
                        <Badge variant="default" className="text-px-10 h-4 px-1.5">{t('companies.defaultBadge')}</Badge>
                      )}
                      {!tenant.isActive && (
                        <Badge variant="destructive" className="text-px-10 h-4 px-1.5">{t('companies.inactiveBadge')}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground font-mono">{tenant.slug}</span>
                      {tenant.industry && (
                        <span className="text-xs text-muted-foreground">• {tenant.industry}</span>
                      )}
                      {tenant.companyCountry && (
                        <span className="text-xs text-muted-foreground">• {tenant.companyCountry}</span>
                      )}
                    </div>
                    {(() => {
                      const details = buildFooterLines({
                        address: tenant.companyAddress || '',
                        city: tenant.companyCity || '',
                        postalCode: tenant.companyPostalCode || '',
                        state: tenant.companyState || '',
                        country: tenant.companyCountry || '',
                        phone: tenant.companyPhone || '',
                        email: tenant.companyEmail || '',
                        website: tenant.companyWebsite || '',
                        taxId: tenant.taxId || '',
                        registrationNumber: tenant.registrationNumber || '',
                        shareCapital: tenant.shareCapital || '',
                        bankName: tenant.bankName || '',
                        bankAccount: tenant.bankAccount || '',
                        bankSwift: tenant.bankSwift || '',
                      });
                      return details.length ? (
                        <div className="mt-1 space-y-0.5">
                          {details.map((line, i) => (
                            <p key={i} className="text-px-10 text-muted-foreground truncate">{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-px-10 text-muted-foreground italic">
                          {t('companies.noDetails', 'No report details yet — edit to add address, contact and legal info.')}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!tenant.isDefault && tenant.isActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); handleSetDefault(tenant); }}
                        title={t('companies.setDefault')}
                      >
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {tenant.isDefault ? (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-help"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>{t('companies.defaultEditHint', 'The default tenant is managed in Company & preferences.')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); openEdit(tenant); }}
                        title={t('companies.edit')}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {!tenant.isDefault && tenant.isActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeletingTenant(tenant); setDeleteDialogOpen(true); }}
                        title={t('companies.deactivate')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!tenant.isActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); handleReactivate(tenant); }}
                        title={t('companies.reactivate', 'Reactivate')}
                      >
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}

                  </div>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTenant ? t('companies.editTitle') : t('companies.createTitle')}</DialogTitle>
            <DialogDescription>
              {editingTenant
                ? t('companies.managementDesc')
                : t('companies.managementDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('companies.loadingCompany', 'Loading company details…')}
              </div>
            ) : null}
            {!editingTenant && (
              <div className="space-y-2">
                <Label>{t('companies.slugLabel')} <span className="text-destructive">*</span></Label>
                <Input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder={t('companies.slugPlaceholder')}
                  className="font-mono"
                />
                <p className="text-px-10 text-muted-foreground">
                  {t('companies.slugHint')}
                </p>
              </div>
            )}
            
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                {t('companies.logoLabel', 'Company Logo')}
              </Label>
              
              {logoPreview ? (
                <div className="relative group">
                  <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/30">
                    <img 
                      src={logoPreview} 
                      alt="Company logo" 
                      className="w-12 h-12 object-contain rounded-lg bg-background shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{form.companyName || t('companies.logoPreview', 'Logo preview')}</p>
                      <p className="text-xs text-muted-foreground">{t('companies.logoRemoveHint', 'Click the X to remove')}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeLogo}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
                    dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="sr-only"
                  />
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{t('companies.logoUploadCta', 'Upload or drag a file')}</p>
                      <p className="text-xs text-muted-foreground">{t('companies.logoUploadHint', 'PNG, JPG up to 5MB')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('companies.companyNameLabel')} <span className="text-destructive">*</span></Label>
                <Input
                  value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  placeholder={t('companies.companyNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('companies.taglineLabel', 'Tagline')}</Label>
                <Input
                  value={form.companyTagline ?? ''}
                  onChange={e => setForm(f => ({ ...f, companyTagline: e.target.value }))}
                  placeholder={t('companies.taglinePlaceholder', 'Your company slogan')}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('companies.sectionContact', 'Contact')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('companies.emailLabel', 'Email')}</Label>
                  <Input
                    type="email"
                    value={form.companyEmail ?? ''}
                    onChange={e => setForm(f => ({ ...f, companyEmail: e.target.value }))}
                    placeholder={t('companies.emailPlaceholder', 'contact@company.com')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companies.phoneLabel')}</Label>
                  <Input
                    value={form.companyPhone}
                    onChange={e => setForm(f => ({ ...f, companyPhone: e.target.value }))}
                    placeholder={t('companies.phonePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companies.websiteLabel')}</Label>
                  <Input
                    value={form.companyWebsite}
                    onChange={e => setForm(f => ({ ...f, companyWebsite: e.target.value }))}
                    placeholder={t('companies.websitePlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('companies.sectionAddress', 'Address')}
              </h4>
              <div className="space-y-2">
                <Label>{t('companies.addressLabel')}</Label>
                <Input
                  value={form.companyAddress}
                  onChange={e => setForm(f => ({ ...f, companyAddress: e.target.value }))}
                  placeholder={t('companies.addressPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>{t('companies.cityLabel', 'City')}</Label>
                  <Input
                    value={form.companyCity ?? ''}
                    onChange={e => setForm(f => ({ ...f, companyCity: e.target.value }))}
                    placeholder={t('companies.cityPlaceholder', 'City')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companies.postalCodeLabel', 'Postal code')}</Label>
                  <Input
                    value={form.companyPostalCode ?? ''}
                    onChange={e => setForm(f => ({ ...f, companyPostalCode: e.target.value }))}
                    placeholder={t('companies.postalCodePlaceholder', '75001')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companies.stateLabel', 'State / Region')}</Label>
                  <Input
                    value={form.companyState ?? ''}
                    onChange={e => setForm(f => ({ ...f, companyState: e.target.value }))}
                    placeholder={t('companies.statePlaceholder', 'Region')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companies.countryLabel')}</Label>
                  <Input
                    value={form.companyCountry}
                    onChange={e => setForm(f => ({ ...f, companyCountry: e.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder={t('companies.countryPlaceholder')}
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('companies.industryLabel')}</Label>
                <Input
                  value={form.industry}
                  onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  placeholder={t('companies.industryPlaceholder')}
                />
              </div>
            </div>

            {/* Legal identifiers */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('companies.sectionLegal', 'Legal identifiers')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('companies.taxIdLabel', 'Tax ID / VAT')}</Label>
                  <Input
                    value={form.taxId ?? ''}
                    onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
                    placeholder={t('companies.taxIdPlaceholder', 'FR12345678901')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companies.registrationLabel', 'Registration number')}</Label>
                  <Input
                    value={form.registrationNumber ?? ''}
                    onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))}
                    placeholder={t('companies.registrationPlaceholder', 'RCS Paris 123 456 789')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companies.shareCapitalLabel', 'Share capital')}</Label>
                  <Input
                    value={form.shareCapital ?? ''}
                    onChange={e => setForm(f => ({ ...f, shareCapital: e.target.value }))}
                    placeholder={t('companies.shareCapitalPlaceholder', '10 000 EUR')}
                  />
                </div>
              </div>
            </div>

            {/* Bank details */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('companies.sectionBank', 'Bank details')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('companies.bankNameLabel', 'Bank name')}</Label>
                  <Input
                    value={form.bankName ?? ''}
                    onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                    placeholder={t('companies.bankNamePlaceholder', 'Bank name')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companies.bankAccountLabel', 'Account / IBAN')}</Label>
                  <Input
                    value={form.bankAccount ?? ''}
                    onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))}
                    placeholder={t('companies.bankAccountPlaceholder', 'IBAN')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('companies.bankSwiftLabel', 'SWIFT / BIC')}</Label>
                  <Input
                    value={form.bankSwift ?? ''}
                    onChange={e => setForm(f => ({ ...f, bankSwift: e.target.value }))}
                    placeholder={t('companies.bankSwiftPlaceholder', 'BNPAFRPP')}
                  />
                </div>
              </div>
            </div>

            {/* Report footer */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('companies.sectionFooter', 'Report footer')}
              </h4>
              <div className="space-y-2">
                <Label>{t('companies.footerMessageLabel', 'Footer message')}</Label>
                <Textarea
                  rows={2}
                  value={form.reportFooterMessage ?? ''}
                  onChange={e => setForm(f => ({ ...f, reportFooterMessage: e.target.value }))}
                  placeholder={t('companies.footerMessagePlaceholder', 'Thank you for your business')}
                />
                <p className="text-px-10 text-muted-foreground">
                  {t('companies.footerHint', 'These details print at the bottom of this company\u2019s reports and PDFs.')}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-px-10 uppercase tracking-wide text-muted-foreground mb-1">
                  {t('companies.footerPreview', 'Footer preview')}
                </p>
                {footerPreview.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    {t('companies.footerPreviewEmpty', 'Fill in the fields above to see the footer.')}
                  </p>
                ) : (
                  footerPreview.map((line, i) => (
                    <p key={i} className="text-xs text-muted-foreground leading-relaxed">{line}</p>
                  ))
                )}
                {form.reportFooterMessage ? (
                  <p className="text-xs text-muted-foreground italic mt-1">{form.reportFooterMessage}</p>
                ) : null}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('companies.cancelButton')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editingTenant ? t('companies.saveButton') : t('companies.createButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('companies.deactivateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('companies.deactivateConfirm', { companyName: deletingTenant?.companyName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('companies.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('companies.deactivateButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ModuleScopeDialog open={scopeDialogOpen} onOpenChange={setScopeDialogOpen} />
    </>
  );
}
