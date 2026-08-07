import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildXlsxI18n } from '../utils/xlsxI18n';
import type { XlsxI18n } from '../utils/exportReport';

/**
 * Localized string bundle for the Excel/CSV exporter, rebuilt when the active
 * language changes so every dashboard "Export" button honours EN/FR.
 */
export function useXlsxI18n(): XlsxI18n {
  const { t, i18n } = useTranslation('reporting');
  return useMemo(() => buildXlsxI18n(t), [t, i18n.language]);
}
