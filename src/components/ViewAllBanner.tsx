/**
 * ViewAllBanner — Shows an info banner when in cross-company view-all mode.
 * Informs the user that they are viewing all companies and should select a target company for writes.
 */
import { Layers } from 'lucide-react';
import { isViewAllMode } from '@/utils/tenant';
import { useTranslation } from 'react-i18next';
import { useTenantMap } from '@/contexts/TenantMapContext';

export function ViewAllBanner() {
  const { t } = useTranslation('settings');
  const { tenants, loaded } = useTenantMap();

  if (!isViewAllMode()) return null;
  // Hide entirely in single-tenant deployments — view-all is meaningless.
  if (loaded && tenants.length <= 1) return null;

  return (
    <div className="mx-3 mt-3 sm:mx-4 sm:mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary">
      <Layers className="h-4 w-4 shrink-0" />
      <span>
        {t('tenant.viewAllMode', 'Viewing all companies')} — {t('tenant.selectTargetCompany', 'Select target company when creating or editing records')}
      </span>
    </div>
  );
}
