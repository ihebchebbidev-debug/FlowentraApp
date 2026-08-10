import i18n from '@/lib/i18n';

const humanize = (raw: string): string =>
  raw
    .replace(/[_&]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const lookupLabel = (list: any[] | undefined, value: string): string | null => {
  const norm = value.trim().toLowerCase();
  const hit = (list ?? []).find((i: any) => {
    const v = (i?.value || i?.name?.toLowerCase().replace(/\s+/g, '_') || '').toLowerCase();
    return v === norm || i?.name?.toLowerCase() === norm;
  });
  return hit?.name ?? null;
};

export interface SaleItemLabelOptions {
  expenseTypes?: any[];
  workTypes?: any[];
  fallback?: string | null;
}

/**
 * Sale / invoice lines transferred from service orders and dispatches are stored
 * with an English machine label ("Expense: materials_&_consumables",
 * "Labor: administration_&_management"). Render them translated and humanized.
 */
export function formatSaleItemLabel(
  itemName?: string | null,
  options: SaleItemLabelOptions = {},
): string {
  const name = (itemName ?? '').trim();
  if (!name) return options.fallback?.trim() || '';

  const t = (key: string, defaultValue: string) =>
    i18n.t(`sales:${key}`, { defaultValue }) as string;

  const expense = name.match(/^Expense:\s*(.+)$/i);
  if (expense) {
    const raw = expense[1];
    return `${t('expenseLinePrefix', 'Expense')}: ${lookupLabel(options.expenseTypes, raw) ?? humanize(raw)}`;
  }

  const labor = name.match(/^Labor:\s*(.+)$/i);
  if (labor) {
    const raw = labor[1];
    return `${t('laborLinePrefix', 'Labor')}: ${lookupLabel(options.workTypes, raw) ?? humanize(raw)}`;
  }

  return name;
}
