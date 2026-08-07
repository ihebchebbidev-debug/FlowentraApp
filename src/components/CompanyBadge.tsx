/**
 * CompanyBadge — Shows the company name for a given tenantId.
 * Only renders when in view-all mode. Uses TenantMapContext for name resolution.
 */
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { useTenantMap } from '@/contexts/TenantMapContext';
import { isViewAllMode } from '@/utils/tenant';

interface CompanyBadgeProps {
  tenantId?: number;
  /** Force show even when not in view-all mode */
  forceShow?: boolean;
  className?: string;
  /** When true, render an "Unknown" badge instead of nothing when tenantId is missing */
  showUnknown?: boolean;
}

export function CompanyBadge({ tenantId, forceShow = false, className, showUnknown = false }: CompanyBadgeProps) {
  const { getCompanyName, tenants, loaded } = useTenantMap();

  if (!forceShow && !isViewAllMode()) return null;
  // In single-tenant setups every record belongs to the same company —
  // showing a badge adds noise, so hide unless the caller forces it.
  if (!forceShow && loaded && tenants.length <= 1) return null;

  const hasTenant =
    tenantId !== undefined &&
    tenantId !== null &&
    !Number.isNaN(tenantId as number);

  if (!hasTenant) {
    if (!showUnknown) return null;
    return (
      <Badge
        variant="outline"
        className={`gap-1 text-xs font-normal text-muted-foreground ${className || ''}`}
      >
        <Building2 className="h-3 w-3" />
        Unknown
      </Badge>
    );
  }

  let name: string;
  try {
    name = getCompanyName(tenantId as number);
  } catch {
    name = `Company #${tenantId}`;
  }

  return (
    <Badge variant="outline" className={`gap-1 text-xs font-normal ${className || ''}`}>
      <Building2 className="h-3 w-3" />
      {name}
    </Badge>
  );
}
