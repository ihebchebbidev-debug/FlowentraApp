import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReconFinding, ReconSeverity } from '../utils/reconciliation';

const ICON: Record<ReconSeverity, typeof Info> = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONE: Record<ReconSeverity, string> = {
  error: 'border-destructive/40 bg-destructive/5 text-destructive',
  warning: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  info: 'border-border bg-muted/40 text-muted-foreground',
};

export function ReconciliationFindingList({
  findings,
  emptyLabel,
}: {
  findings: ReconFinding[];
  emptyLabel?: string;
}) {
  const { t } = useTranslation('invoices');

  const sorted = useMemo(() => {
    const rank: Record<ReconSeverity, number> = { error: 0, warning: 1, info: 2 };
    return [...findings].sort((a, b) => rank[a.severity] - rank[b.severity]);
  }, [findings]);

  if (sorted.length === 0) {
    return (
      <Alert className="border-emerald-500/40 bg-emerald-500/5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-700 dark:text-emerald-400">
          {emptyLabel ?? t('reconciliation.balanced', 'Sale and invoices match — nothing to fix.')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((f, idx) => {
        const Icon = ICON[f.severity];
        return (
          <div
            key={`${f.code}-${f.invoiceId ?? 'sale'}-${idx}`}
            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${TONE[f.severity]}`}
          >
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="min-w-0 space-y-0.5">
              <p>{t(f.messageKey, { ...(f.params ?? {}), defaultValue: f.fallback })}</p>
            </div>
            {f.invoiceId != null && (
              <Badge variant="outline" className="ml-auto shrink-0">#{f.invoiceId}</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ReconciliationFindingList;
