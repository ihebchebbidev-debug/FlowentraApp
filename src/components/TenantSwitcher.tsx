/**
 * TenantSwitcher — Dropdown in sidebar/header for switching between companies.
 * Only visible to MainAdminUser when multiple tenants exist.
 * Includes "All Companies" option for cross-company view mode.
 */
import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Plus, Layers, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildAssetUrl } from '@/config/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { tenantsApi, type Tenant } from '@/services/api/tenantsApi';
import { isViewAllMode } from '@/utils/tenant';
import { setActiveCompany, getActiveCompanyId } from '@/utils/targetTenant';
import { usePermissions } from '@/hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function TenantSwitcher() {
  const { isMainAdmin } = usePermissions();
  const navigate = useNavigate();
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<Tenant | null>(null);
  const activeId = getActiveCompanyId();
  const viewAll = isViewAllMode();

  const loadTenants = () => {
    return tenantsApi.list()
      .then(data => setTenants(data))
      .catch(() => setTenants([]));
  };

  useEffect(() => {
    if (!isMainAdmin) {
      setLoading(false);
      return;
    }
    loadTenants().finally(() => setLoading(false));
  }, [isMainAdmin]);

  // Don't render if not admin or fewer than two tenants exist (active or not)
  if (!isMainAdmin || loading || tenants.length <= 1) return null;

  const currentTenant = viewAll
    ? null
    : tenants.find(t => t.id === activeId)
      || tenants.find(t => t.isDefault)
      || tenants[0];

  const handleSwitch = (tenant: Tenant) => {
    if (!viewAll && tenant.id === activeId) return;
    setActiveCompany({ id: tenant.id, reload: true });
  };

  const handleViewAll = () => {
    if (viewAll) return;
    setActiveCompany({ viewAll: true, reload: true });
  };

  const handleUploadClick = (e: React.MouseEvent, tenant: Tenant) => {
    e.preventDefault();
    e.stopPropagation();
    uploadTargetRef.current = tenant;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = uploadTargetRef.current;
    e.target.value = '';
    uploadTargetRef.current = null;
    if (!file || !target) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please choose an image.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum 5MB.', variant: 'destructive' });
      return;
    }

    setUploadingId(target.id);
    try {
      const updated = await tenantsApi.uploadLogo(target.id, file);
      setTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
      toast({ title: 'Logo updated', description: `${target.companyName} logo uploaded.` });
    } catch (err) {
      console.error('[TenantSwitcher] logo upload failed', err);
      toast({ title: 'Upload failed', description: 'Could not upload the logo.', variant: 'destructive' });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg w-full",
            "text-sm font-medium text-sidebar-foreground",
            "hover:bg-sidebar-accent transition-colors",
            "border border-border/40 bg-sidebar-accent/30"
          )}
        >
          {viewAll ? (
            <Layers className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Building2 className="h-4 w-4 text-primary shrink-0" />
          )}
          <span className="truncate flex-1 text-left">
            {viewAll
              ? t('tenant.allCompanies', 'All Companies')
              : currentTenant?.companyName || 'Select Company'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {/* All Companies option */}
        <DropdownMenuItem
          onClick={handleViewAll}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate flex-1">{t('tenant.allCompanies', 'All Companies')}</span>
          {viewAll && (
            <Check className="h-4 w-4 text-primary shrink-0" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {tenants.map(tenant => {
          const logoSrc = tenant.companyLogoUrl ? buildAssetUrl(tenant.companyLogoUrl) : null;
          const isUploading = uploadingId === tenant.id;
          return (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => handleSwitch(tenant)}
              className="flex items-center gap-2 cursor-pointer pr-1"
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt=""
                  className="h-5 w-5 rounded object-cover shrink-0 border border-border/40"
                />
              ) : (
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={cn("truncate flex-1", !tenant.isActive && "text-muted-foreground italic")}>
                {tenant.companyName}
              </span>
              {tenant.isDefault && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">Default</Badge>
              )}
              {!tenant.isActive && (
                <Badge variant="outline" className="text-[10px] h-4 px-1">Inactive</Badge>
              )}
              {!viewAll && tenant.id === activeId && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
              <button
                type="button"
                onClick={(e) => handleUploadClick(e, tenant)}
                disabled={isUploading}
                title={t('tenant.uploadLogo', 'Upload logo')}
                className="ml-1 p-1 rounded hover:bg-accent disabled:opacity-50 shrink-0"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate('/dashboard/settings', { state: { section: 'companies' } })}
          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          <span>Manage Companies</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </DropdownMenu>
  );
}
