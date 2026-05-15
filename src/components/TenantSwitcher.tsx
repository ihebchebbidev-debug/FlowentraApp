/**
 * TenantSwitcher — Dropdown in sidebar/header for switching between companies.
 * Only visible to MainAdminUser when multiple tenants exist.
 * Includes "All Companies" option for cross-company view mode.
 */
import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus, Layers } from 'lucide-react';
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
import { getCurrentTenant, setTenantOverride, isViewAllMode, VIEW_ALL_SENTINEL } from '@/utils/tenant';
import { usePermissions } from '@/hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function TenantSwitcher() {
  const { isMainAdmin } = usePermissions();
  const navigate = useNavigate();
  const { t } = useTranslation('settings');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const currentSlug = getCurrentTenant();
  const viewAll = isViewAllMode();

  useEffect(() => {
    if (!isMainAdmin) {
      setLoading(false);
      return;
    }

    tenantsApi.list()
      .then(data => {
        setTenants(data);
      })
      .catch(() => {
        setTenants([]);
      })
      .finally(() => setLoading(false));
  }, [isMainAdmin]);

  // Don't render if not admin or fewer than two tenants exist (active or not)
  if (!isMainAdmin || loading || tenants.length <= 1) return null;

  const currentTenant = viewAll
    ? null
    : tenants.find(t => t.slug === currentSlug) 
      || tenants.find(t => t.isDefault) 
      || tenants[0];

  const handleSwitch = (tenant: Tenant) => {
    const targetSlug = tenant.slug;
    if (targetSlug === currentSlug) return;
    setTenantOverride(targetSlug);
  };

  const handleViewAll = () => {
    if (viewAll) return;
    setTenantOverride(VIEW_ALL_SENTINEL);
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

        {tenants.map(tenant => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleSwitch(tenant)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className={cn("truncate flex-1", !tenant.isActive && "text-muted-foreground italic")}>
              {tenant.companyName}
            </span>
            {tenant.isDefault && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">Default</Badge>
            )}
            {!tenant.isActive && (
              <Badge variant="outline" className="text-[10px] h-4 px-1">Inactive</Badge>
            )}
            {!viewAll && tenant.slug === currentSlug && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate('/dashboard/settings', { state: { section: 'companies' } })}
          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          <span>Manage Companies</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
