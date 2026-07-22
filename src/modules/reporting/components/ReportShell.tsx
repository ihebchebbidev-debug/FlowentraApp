import { LucideIcon, RefreshCw, Download, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useTenantMap } from '@/contexts/TenantMapContext';
import { getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';

export type ShellTone = 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'purple' | 'gold';

const toneMap: Record<ShellTone, { bg: string; fg: string }> = {
  primary: { bg: 'bg-primary/10', fg: 'text-primary' },
  accent: { bg: 'bg-accent/10', fg: 'text-accent' },
  info: { bg: 'bg-info/10', fg: 'text-info' },
  success: { bg: 'bg-success/10', fg: 'text-success' },
  warning: { bg: 'bg-warning/10', fg: 'text-warning' },
  purple: { bg: 'bg-[hsl(var(--chart-6)/0.12)]', fg: 'text-[hsl(var(--chart-6))]' },
  gold: { bg: 'bg-warning/10', fg: 'text-warning' },
};

interface ReportShellProps {
  icon: LucideIcon;
  tone?: ShellTone;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onExport?: () => void;
  error?: unknown;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const ReportShell = ({
  icon: Icon,
  tone = 'primary',
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  onExport,
  error,
  actions,
  children,
}: ReportShellProps) => {
  const t = toneMap[tone];
  const { t: tr } = useTranslation('reporting');
  const { tenants, getCompanyName } = useTenantMap();
  const viewAll = isActiveCompanyViewAll();
  const activeId = getActiveCompanyId();
  const scopeLabel = viewAll
    ? tr('scope.allCompanies', 'All companies')
    : activeId != null
      ? getCompanyName(activeId)
      : tenants[0] ? getCompanyName(tenants[0].id) : tr('scope.currentCompany', 'Current company');
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', t.bg)}>
            <Icon className={cn('h-5 w-5', t.fg)} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold leading-tight text-foreground md:text-lg">{title}</h1>
              <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
                <Building2 className="h-3 w-3" />
                <span className="max-w-[160px] truncate">{scopeLabel}</span>
              </Badge>
            </div>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onExport && (
            <Button variant="outline" size="sm" className="h-8" onClick={onExport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tr('actions.export', 'Export')}</span>
            </Button>
          )}
          {onRefresh && (
            <Button size="sm" className="h-8" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              <span className="hidden sm:inline">{tr('actions.refresh', 'Refresh')}</span>
            </Button>
          )}
        </div>
      </header>
      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {tr('general.loadError', 'Failed to load report')}
            {(error as { message?: string })?.message ? ` — ${(error as { message?: string }).message}` : ''}
          </span>
          {onRefresh && (
            <Button size="sm" variant="outline" className="h-7" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('mr-1.5 h-3 w-3', isRefreshing && 'animate-spin')} />
              {tr('general.retry', 'Retry')}
            </Button>
          )}
        </div>
      ) : null}
      {children}
    </div>
  );
};
