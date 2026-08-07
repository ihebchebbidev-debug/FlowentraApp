/**
 * Invoice reconciliation — pure comparison logic between a Sale and every
 * invoice generated from it.
 *
 * This mirrors, on the client, the exact money rules the backend enforces:
 *   - Sale grand total  = Subtotal → header discount → tax on afterDiscount → fiscal stamp
 *     (Backend/Modules/Sales/Services/SaleTotalsCalculator.cs, src/lib/calculateTotal.ts)
 *   - An invoice has NO header discount and NO fiscal-stamp field: the sale's
 *     header discount is spread pro-rata over the lines and the fiscal stamp
 *     becomes its own untaxed line, stamped SourceType = "fiscal_stamp".
 *     (Backend/Modules/Invoices/Services/InvoiceService.CreateDraftFromSaleAsync)
 *   - Every invoice line carries SourceType/SourceId lineage; sale items are
 *     stamped SourceType = "sale_item", SourceId = saleItem.Id, and the backend
 *     refuses to bill the same sale item (or the fiscal stamp) twice on any live
 *     (non-void) invoice.
 *
 * Voided invoices are excluded from every money aggregate — voiding releases the
 * amount back to the sale, which is exactly how the backend guards behave.
 *
 * Everything here is deterministic and side-effect free so it can be unit tested
 * and reused by both the reconciliation screen and the pre-post gate.
 */

export type ReconSeverity = 'error' | 'warning' | 'info';

/** Money tolerance: the backend rounds to 2 decimals and allows 0.009 slack. */
export const MONEY_TOLERANCE = 0.01;

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // Away-from-zero at 2 decimals, matching SaleTotalsCalculator.Round.
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * 100 + Number.EPSILON)) / 100;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function differs(a: number, b: number, tolerance = MONEY_TOLERANCE): boolean {
  return Math.abs(round2(a) - round2(b)) > tolerance;
}

// ---------------------------------------------------------------------------
// Inputs (structural — accepts the shapes returned by salesApi / invoices API)
// ---------------------------------------------------------------------------

export interface ReconSaleItem {
  id?: number;
  itemName?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  discountType?: string;
  /** Backend SaleItemDto.TotalPrice — authoritative line total when present. */
  totalPrice?: number;
  taxRate?: number;
}

export interface ReconSale {
  id: number;
  saleNumber?: string;
  status?: string;
  currency?: string;
  discount?: number;
  discountType?: string;
  taxes?: number;
  taxType?: string;
  fiscalStamp?: number;
  /** Stored header total — compared against the recomputed one. */
  totalAmount?: number;
  items?: ReconSaleItem[];
}

export interface ReconInvoiceLine {
  id?: number;
  sourceType?: string;
  sourceId?: string;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
  taxRate?: number;
  lineTotal?: number;
  taxAmount?: number;
}

export interface ReconInvoice {
  id: number;
  invoiceNumber?: string;
  status: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  grandTotal?: number;
  amountPaid?: number;
  amountDue?: number;
  lines?: ReconInvoiceLine[];
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

export type ReconCode =
  | 'sale_totals_stale'
  | 'sale_no_items'
  | 'sale_zero_total'
  | 'currency_mismatch'
  | 'invoice_subtotal_mismatch'
  | 'invoice_tax_mismatch'
  | 'invoice_grand_total_mismatch'
  | 'invoice_line_math'
  | 'invoice_line_tax_math'
  | 'invoice_payment_mismatch'
  | 'invoice_zero_total'
  | 'invoice_no_lines'
  | 'duplicate_sale_item'
  | 'duplicate_fiscal_stamp'
  | 'orphan_line'
  | 'quantity_mismatch'
  | 'over_invoiced'
  | 'under_invoiced'
  | 'sale_status_out_of_sync';

export interface ReconFinding {
  code: ReconCode;
  severity: ReconSeverity;
  /** i18n key under invoices:reconciliation.findings */
  messageKey: string;
  params?: Record<string, string | number>;
  /** Set when the finding belongs to one specific invoice. */
  invoiceId?: number;
  /** Fallback English text so the screen never renders a bare key. */
  fallback: string;
}

export interface ReconSaleTotals {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  taxAmount: number;
  fiscalStamp: number;
  grandTotal: number;
  storedTotal: number;
}

export interface ReconInvoiceRow {
  id: number;
  invoiceNumber?: string;
  status: string;
  currency?: string;
  isLive: boolean;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  linesSubtotal: number;
  linesTax: number;
  computedGrandTotal: number;
  /** grandTotal - computedGrandTotal (0 when internally consistent). */
  delta: number;
  amountPaid: number;
  amountDue: number;
  findings: ReconFinding[];
  hasBlocking: boolean;
}

export interface ReconItemCoverageRow {
  saleItemId?: number;
  itemName: string;
  saleQuantity: number;
  saleLineTotal: number;
  invoicedQuantity: number;
  invoicedLineTotal: number;
  invoiceIds: number[];
  /** none | partial | full | over — coverage of this sale line by live invoices. */
  coverage: 'none' | 'partial' | 'full' | 'over';
}

export interface ReconResult {
  saleId: number;
  saleNumber?: string;
  currency: string;
  sale: ReconSaleTotals;
  invoicedTotal: number;
  paidTotal: number;
  dueTotal: number;
  voidedTotal: number;
  remaining: number;
  /** 0-100, clamped. */
  coveragePct: number;
  invoices: ReconInvoiceRow[];
  items: ReconItemCoverageRow[];
  findings: ReconFinding[];
  errors: ReconFinding[];
  warnings: ReconFinding[];
  infos: ReconFinding[];
  /** True when nothing at all is off. */
  balanced: boolean;
}

function finding(
  code: ReconCode,
  severity: ReconSeverity,
  fallback: string,
  params?: Record<string, string | number>,
  invoiceId?: number,
): ReconFinding {
  return { code, severity, messageKey: `reconciliation.findings.${code}`, fallback, params, invoiceId };
}

/** Line total = qty × unit price − line discount (never negative). */
export function computeSaleLineTotal(item: ReconSaleItem): number {
  const gross = num(item.quantity) * num(item.unitPrice);
  const d = num(item.discount);
  let discountAmount = 0;
  if (d > 0) discountAmount = item.discountType === 'percentage' ? gross * (d / 100) : d;
  return round2(Math.max(0, gross - discountAmount));
}

/** Sale header math — identical sequence to the backend calculator. */
export function computeSaleTotals(sale: ReconSale): ReconSaleTotals {
  const items = sale.items ?? [];
  const subtotal = round2(
    items.reduce((sum, i) => sum + (typeof i.totalPrice === 'number' ? num(i.totalPrice) : computeSaleLineTotal(i)), 0),
  );

  const d = num(sale.discount);
  let discountAmount = 0;
  if (d > 0) discountAmount = sale.discountType === 'percentage' ? subtotal * (d / 100) : d;
  discountAmount = round2(Math.min(discountAmount, subtotal));

  const afterDiscount = round2(subtotal - discountAmount);

  const t = num(sale.taxes);
  let taxAmount = 0;
  if (t > 0) taxAmount = sale.taxType === 'percentage' ? afterDiscount * (t / 100) : t;
  taxAmount = round2(taxAmount);

  const fiscalStamp = round2(num(sale.fiscalStamp));
  const grandTotal = round2(afterDiscount + taxAmount + fiscalStamp);

  return {
    subtotal,
    discountAmount,
    afterDiscount,
    taxAmount,
    fiscalStamp,
    grandTotal,
    storedTotal: round2(num(sale.totalAmount)),
  };
}

const LIVE_STATUSES = new Set(['draft', 'posted', 'paid']);
export function isLiveInvoice(invoice: Pick<ReconInvoice, 'status'>): boolean {
  return LIVE_STATUSES.has(String(invoice.status ?? '').toLowerCase());
}

/**
 * Compare a sale against every invoice generated from it.
 * `invoices` should be ALL invoices of the sale (voided included — they are
 * reported separately and excluded from the money aggregates).
 */
export function reconcileSaleInvoices(input: {
  sale: ReconSale;
  invoices: ReconInvoice[];
  tolerance?: number;
}): ReconResult {
  const { sale } = input;
  const tolerance = input.tolerance ?? MONEY_TOLERANCE;
  const invoices = input.invoices ?? [];
  const currency = sale.currency || invoices.find((i) => i.currency)?.currency || '';
  const totals = computeSaleTotals(sale);
  const saleItems = sale.items ?? [];

  const globalFindings: ReconFinding[] = [];

  // ---- sale-level sanity -------------------------------------------------
  if (saleItems.length === 0) {
    globalFindings.push(finding('sale_no_items', 'error', 'This sale has no items, so there is nothing to invoice.'));
  }
  if (saleItems.length > 0 && totals.grandTotal <= 0) {
    globalFindings.push(
      finding('sale_zero_total', 'error', 'The sale total is zero — invoicing it would bill the customer nothing.'),
    );
  }
  if (totals.storedTotal > 0 && differs(totals.storedTotal, totals.grandTotal, tolerance)) {
    globalFindings.push(
      finding(
        'sale_totals_stale',
        'warning',
        'The sale header total stored on the record does not match its lines; re-save the sale to refresh it.',
        { stored: totals.storedTotal, computed: totals.grandTotal },
      ),
    );
  }

  // ---- per-invoice checks ------------------------------------------------
  const liveSaleItemHits = new Map<string, { invoiceIds: number[]; quantity: number; lineTotal: number }>();
  let fiscalStampLines = 0;

  const rows: ReconInvoiceRow[] = invoices.map((inv) => {
    const live = isLiveInvoice(inv);
    const lines = inv.lines ?? [];
    const linesSubtotal = round2(lines.reduce((s, l) => s + num(l.lineTotal), 0));
    const linesTax = round2(lines.reduce((s, l) => s + num(l.taxAmount), 0));
    const subtotal = round2(num(inv.subtotal));
    const taxAmount = round2(num(inv.taxAmount));
    const grandTotal = round2(num(inv.grandTotal));
    const computedGrandTotal = round2(linesSubtotal + linesTax);
    const f: ReconFinding[] = [];

    if (currency && inv.currency && inv.currency !== currency) {
      f.push(
        finding('currency_mismatch', 'error', 'Invoice currency differs from the sale currency.', {
          invoiceCurrency: inv.currency,
          saleCurrency: currency,
        }, inv.id),
      );
    }
    if (lines.length === 0) {
      f.push(finding('invoice_no_lines', 'error', 'Invoice has no lines.', {}, inv.id));
    }
    if (differs(linesSubtotal, subtotal, tolerance)) {
      f.push(
        finding('invoice_subtotal_mismatch', 'error', 'Sum of the invoice lines does not match the invoice subtotal.', {
          lines: linesSubtotal,
          header: subtotal,
        }, inv.id),
      );
    }
    if (differs(linesTax, taxAmount, tolerance)) {
      f.push(
        finding('invoice_tax_mismatch', 'error', 'Sum of the line tax does not match the invoice tax amount.', {
          lines: linesTax,
          header: taxAmount,
        }, inv.id),
      );
    }
    if (differs(subtotal + taxAmount, grandTotal, tolerance)) {
      f.push(
        finding('invoice_grand_total_mismatch', 'error', 'Subtotal + tax does not equal the invoice total.', {
          expected: round2(subtotal + taxAmount),
          actual: grandTotal,
        }, inv.id),
      );
    }
    if (live && grandTotal <= 0) {
      f.push(finding('invoice_zero_total', 'error', 'Invoice total is zero.', {}, inv.id));
    }
    if (differs(num(inv.amountPaid) + num(inv.amountDue), grandTotal, tolerance) && inv.status !== 'void') {
      f.push(
        finding('invoice_payment_mismatch', 'error', 'Paid + due does not equal the invoice total.', {
          paid: round2(num(inv.amountPaid)),
          due: round2(num(inv.amountDue)),
          total: grandTotal,
        }, inv.id),
      );
    }

    // per-line math + lineage bookkeeping
    const seenInThisInvoice = new Set<string>();
    lines.forEach((l) => {
      const expected = round2(num(l.quantity) * num(l.unitPrice));
      if (differs(expected, num(l.lineTotal), tolerance)) {
        f.push(
          finding('invoice_line_math', 'error', 'Line total does not equal quantity × unit price.', {
            item: l.itemName || '-',
            expected,
            actual: round2(num(l.lineTotal)),
          }, inv.id),
        );
      }
      const expectedTax = round2(num(l.lineTotal) * (num(l.taxRate) / 100));
      if (differs(expectedTax, num(l.taxAmount), tolerance)) {
        f.push(
          finding('invoice_line_tax_math', 'warning', 'Line tax does not match its tax rate.', {
            item: l.itemName || '-',
            expected: expectedTax,
            actual: round2(num(l.taxAmount)),
          }, inv.id),
        );
      }

      if (!live) return;

      const sourceType = (l.sourceType || '').toLowerCase();
      if (sourceType === 'fiscal_stamp') {
        fiscalStampLines += 1;
        return;
      }
      if (sourceType === 'sale_item' && l.sourceId) {
        const key = String(l.sourceId);
        const hit = liveSaleItemHits.get(key) ?? { invoiceIds: [], quantity: 0, lineTotal: 0 };
        if (!hit.invoiceIds.includes(inv.id)) hit.invoiceIds.push(inv.id);
        hit.quantity = round2(hit.quantity + num(l.quantity));
        hit.lineTotal = round2(hit.lineTotal + num(l.lineTotal));
        liveSaleItemHits.set(key, hit);

        if (seenInThisInvoice.has(key)) {
          f.push(
            finding('duplicate_sale_item', 'error', 'The same sale item is billed twice on this invoice.', {
              item: l.itemName || `#${key}`,
            }, inv.id),
          );
        }
        seenInThisInvoice.add(key);

        if (!saleItems.some((si) => si.id != null && String(si.id) === key)) {
          f.push(
            finding('orphan_line', 'warning', 'Invoice line points at a sale item that no longer exists on the sale.', {
              item: l.itemName || `#${key}`,
            }, inv.id),
          );
        }
      }
    });

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      currency: inv.currency,
      isLive: live,
      subtotal,
      taxAmount,
      grandTotal,
      linesSubtotal,
      linesTax,
      computedGrandTotal,
      delta: round2(grandTotal - computedGrandTotal),
      amountPaid: round2(num(inv.amountPaid)),
      amountDue: round2(num(inv.amountDue)),
      findings: f,
      hasBlocking: f.some((x) => x.severity === 'error'),
    };
  });

  // ---- cross-invoice checks ---------------------------------------------
  liveSaleItemHits.forEach((hit, key) => {
    if (hit.invoiceIds.length > 1) {
      const item = saleItems.find((si) => si.id != null && String(si.id) === key);
      globalFindings.push(
        finding('duplicate_sale_item', 'error', 'A sale item is billed on more than one live invoice.', {
          item: item?.itemName || `#${key}`,
          invoices: hit.invoiceIds.join(', '),
        }),
      );
    }
  });
  if (fiscalStampLines > 1) {
    globalFindings.push(
      finding('duplicate_fiscal_stamp', 'error', 'The fiscal stamp is billed on more than one live invoice.', {
        count: fiscalStampLines,
      }),
    );
  }

  // ---- item coverage ----------------------------------------------------
  const items: ReconItemCoverageRow[] = saleItems.map((si) => {
    const key = si.id != null ? String(si.id) : '';
    const hit = key ? liveSaleItemHits.get(key) : undefined;
    const saleLineTotal = typeof si.totalPrice === 'number' ? round2(num(si.totalPrice)) : computeSaleLineTotal(si);
    const invoicedLineTotal = round2(hit?.lineTotal ?? 0);
    const invoicedQuantity = round2(hit?.quantity ?? 0);

    // Invoice lines are net of the sale's pro-rata header discount, so compare
    // against the discounted share of this line rather than its gross total.
    const scale = totals.subtotal > 0 ? totals.afterDiscount / totals.subtotal : 1;
    const expectedNet = round2(saleLineTotal * scale);

    let coverage: ReconItemCoverageRow['coverage'] = 'none';
    if (invoicedLineTotal > 0) {
      if (invoicedLineTotal > expectedNet + tolerance) coverage = 'over';
      else if (Math.abs(invoicedLineTotal - expectedNet) <= tolerance) coverage = 'full';
      else coverage = 'partial';
    }

    if (hit && differs(invoicedQuantity, num(si.quantity), tolerance)) {
      globalFindings.push(
        finding('quantity_mismatch', 'warning', 'Invoiced quantity differs from the quantity on the sale line.', {
          item: si.itemName || `#${key}`,
          sale: round2(num(si.quantity)),
          invoiced: invoicedQuantity,
        }),
      );
    }

    return {
      saleItemId: si.id,
      itemName: si.itemName || si.description || '-',
      saleQuantity: round2(num(si.quantity)),
      saleLineTotal,
      invoicedQuantity,
      invoicedLineTotal,
      invoiceIds: hit?.invoiceIds ?? [],
      coverage,
    };
  });

  // ---- money aggregates -------------------------------------------------
  const liveRows = rows.filter((r) => r.isLive);
  const invoicedTotal = round2(liveRows.reduce((s, r) => s + r.grandTotal, 0));
  const paidTotal = round2(liveRows.reduce((s, r) => s + r.amountPaid, 0));
  const dueTotal = round2(liveRows.reduce((s, r) => s + r.amountDue, 0));
  const voidedTotal = round2(rows.filter((r) => !r.isLive).reduce((s, r) => s + r.grandTotal, 0));
  const remaining = round2(totals.grandTotal - invoicedTotal);
  const coveragePct = totals.grandTotal > 0 ? Math.max(0, Math.min(100, (invoicedTotal / totals.grandTotal) * 100)) : 0;

  if (totals.grandTotal > 0 && invoicedTotal > totals.grandTotal + tolerance) {
    globalFindings.push(
      finding('over_invoiced', 'error', 'Invoiced amount exceeds the sale total.', {
        invoiced: invoicedTotal,
        saleTotal: totals.grandTotal,
        excess: round2(invoicedTotal - totals.grandTotal),
      }),
    );
  } else if (rows.length > 0 && remaining > tolerance) {
    globalFindings.push(
      finding('under_invoiced', 'info', 'Part of the sale is not invoiced yet.', {
        remaining,
        saleTotal: totals.grandTotal,
      }),
    );
  }

  const status = String(sale.status ?? '').toLowerCase();
  const fullyCovered = totals.grandTotal > 0 && Math.abs(remaining) <= tolerance;
  if (status === 'invoiced' && !fullyCovered) {
    globalFindings.push(
      finding('sale_status_out_of_sync', 'warning', 'Sale is marked as invoiced but is not fully covered by invoices.', {
        remaining,
      }),
    );
  } else if (fullyCovered && status && status !== 'invoiced' && status !== 'closed' && status !== 'cancelled') {
    globalFindings.push(
      finding('sale_status_out_of_sync', 'info', 'Sale is fully invoiced but its status has not been updated yet.', {
        status,
      }),
    );
  }

  const findings = [...globalFindings, ...rows.flatMap((r) => r.findings)];

  return {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    currency,
    sale: totals,
    invoicedTotal,
    paidTotal,
    dueTotal,
    voidedTotal,
    remaining,
    coveragePct,
    invoices: rows,
    items,
    findings,
    errors: findings.filter((f) => f.severity === 'error'),
    warnings: findings.filter((f) => f.severity === 'warning'),
    infos: findings.filter((f) => f.severity === 'info'),
    balanced: findings.every((f) => f.severity === 'info'),
  };
}

export interface PostGate {
  /** Hard mismatches that must be resolved before posting. */
  blocking: ReconFinding[];
  /** Soft mismatches — user must acknowledge them. */
  warnings: ReconFinding[];
  infos: ReconFinding[];
  canPost: boolean;
  requiresAcknowledgement: boolean;
}

/**
 * Gate for posting one specific invoice.
 * Blocking = sale-level errors + errors on THIS invoice. Errors that belong to a
 * different invoice are surfaced as warnings: they don't make this document wrong,
 * but the user should know the sale as a whole is off.
 */
export function getPostGate(result: ReconResult, invoiceId: number): PostGate {
  const blocking: ReconFinding[] = [];
  const warnings: ReconFinding[] = [];

  result.findings.forEach((f) => {
    if (f.severity === 'info') return;
    const mine = f.invoiceId == null || f.invoiceId === invoiceId;
    if (f.severity === 'error') {
      if (mine) blocking.push(f);
      else warnings.push(f);
      return;
    }
    warnings.push(f);
  });

  return {
    blocking,
    warnings,
    infos: result.infos,
    canPost: blocking.length === 0,
    requiresAcknowledgement: blocking.length === 0 && warnings.length > 0,
  };
}
