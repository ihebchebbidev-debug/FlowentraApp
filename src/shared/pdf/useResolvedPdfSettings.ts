/**
 * useResolvedPdfSettings
 *
 * One hook for every screen that renders a PDF outside of a dedicated preview
 * modal (detail pages, quick-download buttons, share sheets). It loads the
 * module's saved PDF settings and merges in the OWNING company's identity, so
 * those documents get the exact same footer as the full report pages instead
 * of falling back to bare defaults.
 */
import { useEffect, useState } from 'react';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { getCompanyLogoBase64 } from '@/hooks/companyLogoUtils';
import { TARGET_TENANT_CHANGED_EVENT } from '@/utils/targetTenant';
import { resolveCompanyForPdf, type PdfCompanyBlock } from './resolveCompany';

interface WithCompany {
  company?: PdfCompanyBlock;
}

export function useResolvedPdfSettings<T extends WithCompany>(
  loadSettings: () => Promise<T>,
  defaults: T,
  /** Tenant that owns the printed record — keeps cross-company views correct. */
  ownerTenantId?: number,
): { settings: T; loaded: boolean } {
  const companyLogo = useCompanyLogo();
  const [settings, setSettings] = useState<T>(defaults);
  const [loaded, setLoaded] = useState(false);
  // Re-resolve when the company switcher fires or Company Information is saved,
  // otherwise a detail page keeps printing the previous company's footer.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick(t => t + 1);
    window.addEventListener(TARGET_TENANT_CHANGED_EVENT, bump);
    window.addEventListener('active-company-changed', bump);
    return () => {
      window.removeEventListener(TARGET_TENANT_CHANGED_EVENT, bump);
      window.removeEventListener('active-company-changed', bump);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const loadedSettings = await loadSettings();
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        const company = await resolveCompanyForPdf(
          loadedSettings.company,
          logoBase64 || '',
          ownerTenantId,
        );
        if (alive) setSettings({ ...loadedSettings, company } as T);
      } catch (error) {
        console.warn('[pdf] Failed to resolve PDF settings, using defaults:', error);
        if (alive) setSettings(defaults);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyLogo, ownerTenantId, tick]);

  return { settings, loaded };
}
