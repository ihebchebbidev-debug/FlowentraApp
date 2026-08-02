import { describe, expect, it } from 'vitest';
import {
  computeSaleTotals,
  getPostGate,
  reconcileSaleInvoices,
  type ReconInvoice,
  type ReconSale,
} from './reconciliation';

const sale: ReconSale = {
  id: 1,
  saleNumber: 'S-1',
  status: 'in_progress',
  currency: 'TND',
  discount: 10,
  discountType: 'percentage',
  taxes: 19,
  taxType: 'percentage',
  fiscalStamp: 1,
  items: [
    { id: 11, itemName: 'Pump', quantity: 2, unitPrice: 100, totalPrice: 200 },
    { id: 12, itemName: 'Labour', quantity: 1, unitPrice: 300, totalPrice: 300 },
  ],
};

// subtotal 500 → discount 50 → afterDiscount 450 → tax 85.5 → stamp 1 → 536.5
const fullInvoice = (over: Partial<ReconInvoice> = {}): ReconInvoice => ({
  id: 99,
  invoiceNumber: 'INV-1',
  status: 'draft',
  currency: 'TND',
  subtotal: 451,
  taxAmount: 85.5,
  grandTotal: 536.5,
  amountPaid: 0,
  amountDue: 536.5,
  lines: [
    { id: 1, sourceType: 'sale_item', sourceId: '11', itemName: 'Pump', quantity: 2, unitPrice: 90, taxRate: 19, lineTotal: 180, taxAmount: 34.2 },
    { id: 2, sourceType: 'sale_item', sourceId: '12', itemName: 'Labour', quantity: 1, unitPrice: 270, taxRate: 19, lineTotal: 270, taxAmount: 51.3 },
    { id: 3, sourceType: 'fiscal_stamp', itemName: 'Fiscal stamp', quantity: 1, unitPrice: 1, taxRate: 0, lineTotal: 1, taxAmount: 0 },
  ],
  ...over,
});

describe('computeSaleTotals', () => {
  it('applies discount, then tax on the discounted base, then the stamp', () => {
    const t = computeSaleTotals(sale);
    expect(t.subtotal).toBe(500);
    expect(t.discountAmount).toBe(50);
    expect(t.afterDiscount).toBe(450);
    expect(t.taxAmount).toBe(85.5);
    expect(t.grandTotal).toBe(536.5);
  });

  it('caps a fixed discount at the subtotal', () => {
    const t = computeSaleTotals({ ...sale, discount: 9999, discountType: 'fixed', taxes: 0, fiscalStamp: 0 });
    expect(t.discountAmount).toBe(500);
    expect(t.grandTotal).toBe(0);
  });
});

describe('reconcileSaleInvoices', () => {
  it('reports a fully covered sale as balanced', () => {
    const r = reconcileSaleInvoices({ sale, invoices: [fullInvoice()] });
    expect(r.invoicedTotal).toBe(536.5);
    expect(r.remaining).toBe(0);
    expect(r.coveragePct).toBe(100);
    expect(r.errors).toHaveLength(0);
    expect(r.items.every((i) => i.coverage === 'full')).toBe(true);
  });

  it('flags an invoice whose header total does not match its lines', () => {
    const r = reconcileSaleInvoices({ sale, invoices: [fullInvoice({ grandTotal: 600, amountDue: 600 })] });
    expect(r.errors.map((e) => e.code)).toContain('invoice_grand_total_mismatch');
    expect(r.invoices[0].delta).toBe(63.5);
  });

  it('flags over-invoicing across invoices and excludes voided ones', () => {
    const second = fullInvoice({ id: 100, invoiceNumber: 'INV-2' });
    const over = reconcileSaleInvoices({ sale, invoices: [fullInvoice(), second] });
    expect(over.errors.map((e) => e.code)).toContain('over_invoiced');
    expect(over.errors.map((e) => e.code)).toContain('duplicate_sale_item');
    expect(over.errors.map((e) => e.code)).toContain('duplicate_fiscal_stamp');

    const voided = reconcileSaleInvoices({
      sale,
      invoices: [fullInvoice(), fullInvoice({ id: 100, status: 'void', amountDue: 0 })],
    });
    expect(voided.invoicedTotal).toBe(536.5);
    expect(voided.voidedTotal).toBe(536.5);
    expect(voided.errors.map((e) => e.code)).not.toContain('over_invoiced');
  });

  it('reports partial coverage as info, not an error', () => {
    const partial = fullInvoice({
      subtotal: 180,
      taxAmount: 34.2,
      grandTotal: 214.2,
      amountDue: 214.2,
      lines: [fullInvoice().lines![0]],
    });
    const r = reconcileSaleInvoices({ sale, invoices: [partial] });
    expect(r.errors).toHaveLength(0);
    expect(r.infos.map((i) => i.code)).toContain('under_invoiced');
    expect(r.items.find((i) => i.saleItemId === 12)?.coverage).toBe('none');
  });

  it('flags currency, payment and orphan-lineage problems', () => {
    const bad = fullInvoice({ currency: 'EUR', amountPaid: 10, amountDue: 500 });
    bad.lines![0].sourceId = '777';
    const r = reconcileSaleInvoices({ sale, invoices: [bad] });
    const codes = r.findings.map((f) => f.code);
    expect(codes).toContain('currency_mismatch');
    expect(codes).toContain('invoice_payment_mismatch');
    expect(codes).toContain('orphan_line');
  });

  it('flags stale stored sale totals', () => {
    const r = reconcileSaleInvoices({ sale: { ...sale, totalAmount: 999 }, invoices: [fullInvoice()] });
    expect(r.warnings.map((w) => w.code)).toContain('sale_totals_stale');
  });
});

describe('getPostGate', () => {
  it('allows posting a clean invoice without acknowledgement', () => {
    const r = reconcileSaleInvoices({ sale, invoices: [fullInvoice()] });
    const gate = getPostGate(r, 99);
    expect(gate.canPost).toBe(true);
    expect(gate.requiresAcknowledgement).toBe(false);
  });

  it('blocks posting when the invoice itself is inconsistent', () => {
    const r = reconcileSaleInvoices({ sale, invoices: [fullInvoice({ grandTotal: 600, amountDue: 600 })] });
    const gate = getPostGate(r, 99);
    expect(gate.canPost).toBe(false);
    expect(gate.blocking.length).toBeGreaterThan(0);
  });

  it('requires acknowledgement when another invoice is the broken one', () => {
    const other = fullInvoice({ id: 100, subtotal: 10, taxAmount: 0, grandTotal: 999, amountDue: 999, lines: [
      { sourceType: 'sale_item', sourceId: '11', itemName: 'Pump', quantity: 1, unitPrice: 10, taxRate: 0, lineTotal: 10, taxAmount: 0 },
    ] });
    const r = reconcileSaleInvoices({ sale, invoices: [fullInvoice(), other] });
    const gate = getPostGate(r, 99);
    // Errors owned by another invoice never block this one; sale-level errors do.
    expect(gate.blocking.some((b) => b.invoiceId === 100)).toBe(false);
    expect(gate.warnings.some((w) => w.invoiceId === 100)).toBe(true);
  });
});
