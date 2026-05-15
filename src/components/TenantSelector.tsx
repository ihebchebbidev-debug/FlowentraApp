/**
 * TenantSelector — Dropdown for selecting target company when creating/editing in view-all mode.
 * Shows list of active tenants from TenantMapContext.
 */
import { useEffect } from 'react';
import { Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenantMap } from '@/contexts/TenantMapContext';
import { isViewAllMode } from '@/utils/tenant';
import { Label } from '@/components/ui/label';
import { useUserType } from '@/hooks/useUserType';

interface TenantSelectorProps {
  /** Currently selected tenant ID */
  value?: number;
  /** Callback when tenant is selected */
  onChange: (tenantId: number) => void;
  /** Label text */
  label?: string;
  /** Whether this field is required */
  required?: boolean;
  /** If true, the selector is read-only (for edit forms showing which company owns the record) */
  readOnly?: boolean;
  /** Compact mode for inline usage */
  compact?: boolean;
}

export function TenantSelector({
  value,
  onChange,
  label = 'Target Company',
  required = true,
  readOnly = false,
  compact = false,
}: TenantSelectorProps) {
  const { tenants, getCompanyName, loaded } = useTenantMap();
  const { isMainAdminUser } = useUserType();

  // Only main admins ever see the tenant picker. Regular users always create
  // under their own (default) company — backend resolves tenant from session.
  if (!isMainAdminUser) return null;

  // Only show in view-all mode
  if (!isViewAllMode()) return null;

  if (!loaded) return null;

  // Single-tenant deployments: auto-select the only tenant, don't render a picker.
  useEffect(() => {
    if (loaded && tenants.length === 1 && value !== tenants[0].id) {
      onChange(tenants[0].id);
    }
  }, [loaded, tenants, value, onChange]);

  if (tenants.length <= 1) return null;

  if (readOnly && value) {
    return (
      <div className={compact ? 'flex items-center gap-2' : 'space-y-2'}>
        {!compact && <Label className="text-sm font-medium">{label}</Label>}
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 bg-muted/30 text-sm">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span>{getCompanyName(value)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'flex items-center gap-2' : 'space-y-2'}>
      {!compact && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Select
        value={value?.toString() ?? ''}
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger className={compact ? 'w-[180px]' : 'w-full'}>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <SelectValue placeholder="Select company..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id.toString()}>
              {tenant.companyName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
