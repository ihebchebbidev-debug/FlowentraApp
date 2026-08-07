import type { TFunction } from 'i18next';
import type { XlsxI18n } from './exportReport';

/**
 * Build the localized string bundle for the Excel/CSV exporter from the
 * project's i18next `t` function (namespace: 'reporting'). Falls through to
 * the same English defaults defined in exportReport when a key is missing.
 */
export function buildXlsxI18n(t: TFunction): XlsxI18n {
  return {
    cover: {
      title: t('xlsx.cover.title', 'Reporting Export'),
      generated: t('xlsx.cover.generated', 'Generated {{when}}').replace('{{when}}', '{when}'),
      colScope: t('xlsx.cover.colScope', 'Scope'),
      colSections: t('xlsx.cover.colSections', 'Sections'),
      colTotalRows: t('xlsx.cover.colTotalRows', 'Total Rows'),
      colNotes: t('xlsx.cover.colNotes', 'Notes'),
      allPopulated: t('xlsx.cover.allPopulated', 'All sections populated'),
      emptySections: (n: number) =>
        t('xlsx.cover.emptySections', {
          count: n,
          defaultValue: `${n} empty section${n > 1 ? 's' : ''}`,
        }),
      footerNote: t(
        'xlsx.cover.footerNote',
        'Each sheet contains its own title band, filterable header, banded rows, number formatting and a totals row where applicable.',
      ),
      sheetName: t('xlsx.cover.sheetName', 'Overview'),
    },
    section: {
      subtitle: (scope: string, count: number, when: string) =>
        t('xlsx.section.subtitle', {
          scope,
          count,
          when,
          defaultValue: `${scope} report  •  ${count} row${count === 1 ? '' : 's'}  •  Generated ${when}`,
        }),
      total: t('xlsx.section.total', 'Total'),
      noData: t('xlsx.section.noData', 'No data available for this section.'),
    },
    scopes: {
      sales: t('xlsx.scopes.sales', 'Sales'),
      service: t('xlsx.scopes.service', 'Service'),
      finance: t('xlsx.scopes.finance', 'Finance'),
      hr: t('xlsx.scopes.hr', 'HR'),
      purchase: t('xlsx.scopes.purchase', 'Purchase'),
    },
    // Section names are used as keys internally by buildSections. Translations
    // come from the flat map under xlsx.sections in the locale JSON.
    sections: pickSubtree(t, 'xlsx.sections', [
      'Offers by Status', 'Sales by Status', 'Conversion Trend', 'YoY Comparison', 'Top Customers',
      'Completion by Month', 'Orders by Status', 'Orders by Type', 'Dispatches per Tech',
      'Consumed vs Planned', 'Technicians',
      'KPIs', 'Invoice Status', 'Expenses by Category', 'Invoices',
      'Headcount by Dept', 'Salary by Dept', 'Performance', 'Hiring vs Turnover', 'Employees',
      'Spend by Supplier', 'Spend by Category', 'Receipt Status', 'PO Spend Trend', 'Purchase Orders',
    ]),
    headers: pickSubtree(t, 'xlsx.headers', [
      'KPI', 'Value', 'Trend', 'Status',
      'Name', 'Target', 'Series1', 'Series2', 'Series3',
      'ID', 'Title', 'Subtitle', 'Amount', 'Date', 'Info', 'Total',
    ]),
  };
}

function pickSubtree(t: TFunction, prefix: string, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    // The key inside the JSON literally contains spaces (e.g. "Offers by Status").
    // i18next supports this when the key is looked up directly.
    out[k] = t(`${prefix}.${k}`, k) as string;
  }
  return out;
}
