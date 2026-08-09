/**
 * Single source of truth for purchase-module money math.
 *
 * These helpers mirror the backend exactly:
 *  - PurchaseOrderService.CalculateLineTotal / RecalculateTotals
 *  - SupplierInvoiceService.RecalculateInvoiceTotalsAsync
 *
 * Every monetary result is rounded to 2 decimals with away-from-zero
 * midpoints, the same convention the backend persists with, so the on-screen
 * preview can never drift by a cent from the stored document.
 */

export const money = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  const factor = 100;
  const scaled = value * factor;
  // Away-from-zero rounding (JS Math.round is half-up, which is wrong for negatives).
  const rounded = scaled >= 0 ? Math.round(scaled) : -Math.round(-scaled);
  return rounded / factor;
};

export interface LineLike {
  quantity?: number | null;
  unitPrice?: number | null;
  discount?: number | null;
  discountType?: string | null;
  taxRate?: number | null;
  lineTotal?: number | null;
}

/** Line total after the per-line discount, floored at 0. Backend: CalculateLineTotal. */
export const computeLineTotal = (line: LineLike): number => {
  const qty = Number(line.quantity) || 0;
  const price = Number(line.unitPrice) || 0;
  const disc = Number(line.discount) || 0;
  const sub = qty * price;
  const discAmt = (line.discountType || 'percentage') === 'percentage' ? (sub * disc) / 100 : disc;
  return money(Math.max(0, sub - discAmt));
};

export interface DocumentTotals {
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}

/**
 * Document totals with a pro-rated header discount, matching
 * RecalculateTotals / RecalculateInvoiceTotalsAsync:
 *   subtotal      = Σ lineTotal (post line discount)
 *   tax           = Σ (lineBase − headerDiscount * lineShare) * lineTaxRate
 *   grandTotal    = subtotal − headerDiscount + tax + fiscalStamp − rsAmount
 * The fiscal stamp only applies to a document that actually has lines.
 */
export const computeDocumentTotals = (
  lines: LineLike[],
  opts: {
    headerDiscount?: number;
    headerDiscountType?: 'fixed' | 'percentage';
    fiscalStamp?: number;
    rsAmount?: number;
    defaultTaxRate?: number;
  } = {},
): DocumentTotals => {
  const defaultTaxRate = opts.defaultTaxRate ?? 19;
  const bases = lines.map(l => ({
    base: Number(l.lineTotal ?? computeLineTotal(l)) || 0,
    rate: Number(l.taxRate ?? defaultTaxRate) || 0,
  }));
  const subtotal = money(bases.reduce((s, b) => s + b.base, 0));

  const rawDiscount = Number(opts.headerDiscount) || 0;
  const discAmt = money(
    opts.headerDiscountType === 'percentage' ? (subtotal * rawDiscount) / 100 : rawDiscount,
  );
  const afterDiscount = subtotal - discAmt;

  const taxAmount = subtotal > 0
    ? money(bases.reduce((s, b) => {
        const share = b.base / subtotal;
        return s + (b.base - discAmt * share) * (b.rate / 100);
      }, 0))
    : 0;

  const fiscalStamp = lines.length > 0 ? Number(opts.fiscalStamp) || 0 : 0;
  const rsAmount = Number(opts.rsAmount) || 0;
  const grandTotal = Math.max(0, money(afterDiscount + taxAmount + fiscalStamp - rsAmount));

  return { subtotal, taxAmount, grandTotal };
};
