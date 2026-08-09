/**
 * Backend message → translated, ACTIONABLE reason.
 *
 * The API returns English, developer-flavoured sentences ("Cannot mark PO as
 * 'partially_received' without at least one line having a received quantity.").
 * Showing those raw is neither localized nor helpful — the user needs to know
 * WHAT TO DO ("Receive the goods first: create a goods receipt…").
 *
 * Each entry maps a stable fragment of the server message to an i18n key under
 * `purchases:errors.reasons.*`, extracting any useful values (quantities,
 * document numbers, statuses) for interpolation. Order matters: the first
 * match wins, so put specific patterns before generic ones.
 */

export interface MatchedReason {
  key: string;
  values: Record<string, string>;
}

type Rule = {
  test: RegExp;
  key: string;
  /** Named groups of `test` become interpolation values. */
};

const RULES: Rule[] = [
  // ── Purchase order status lifecycle ───────────────────────────────────────
  { test: /mark PO as 'partially_received'/i, key: 'poPartiallyReceivedNeedsReceipt' },
  { test: /mark PO as 'received'/i, key: 'poReceivedNeedsFullReceipt' },
  { test: /Status transition not allowed:\s*'(?<from>[^']+)'\s*(?:→|->)\s*'(?<to>[^']+)'/i, key: 'transitionNotAllowed' },
  { test: /Cancelled invoices cannot change status/i, key: 'invoiceCancelledFrozen' },
  { test: /Paid invoices cannot transition to '(?<to>[^']+)'/i, key: 'invoicePaidFrozen' },
  { test: /Cannot receive goods on a PO in status '(?<status>[^']+)'/i, key: 'receiveWrongStatus' },

  // ── Editing frozen documents ──────────────────────────────────────────────
  { test: /Items cannot be modified on a PO in status '(?<status>[^']+)'/i, key: 'poItemsFrozen' },
  { test: /Financial header fields .* cannot be modified on a PO in status '(?<status>[^']+)'/i, key: 'poTotalsFrozen' },
  { test: /Items can only be modified on draft invoices/i, key: 'invoiceItemsDraftOnly' },
  { test: /Cannot edit goods receipt: it is referenced by one or more supplier invoices/i, key: 'receiptLockedByInvoice' },
  { test: /Cannot change PurchaseOrderItemId on existing receipt item/i, key: 'receiptLineRelinkBlocked' },

  // ── Deletion / cancellation blocked by downstream documents ───────────────
  { test: /Cannot delete purchase order .* it has goods receipts/i, key: 'deletePoHasReceipts' },
  { test: /Cannot delete purchase order .* referenced by one or more supplier invoices/i, key: 'deletePoHasInvoices' },
  { test: /Cannot cancel purchase order .* referenced by one or more supplier invoices/i, key: 'cancelPoHasInvoices' },
  { test: /Cannot delete goods receipt .* referenced by one or more supplier invoices/i, key: 'deleteReceiptHasInvoices' },
  { test: /Cannot delete invoice .* already declared to the DGI/i, key: 'deleteInvoiceDeclared' },
  { test: /Cannot delete invoice .* (?:it has recorded payments|concurrent payment was recorded)/i, key: 'deleteInvoicePaid' },
  { test: /Cannot delete an item that already has received quantity/i, key: 'deleteItemReceived' },

  // ── Quantities & amounts ──────────────────────────────────────────────────
  { test: /only (?<received>[\d.,]+) has been received .*Record the goods receipt first/i, key: 'invoiceMoreThanReceived' },
  { test: /only (?<ordered>[\d.,]+) was ordered/i, key: 'invoiceMoreThanOrdered' },
  { test: /Over-receipt for (?:PO )?item .*remaining (?<remaining>[\d.,]+)/i, key: 'overReceiptRemaining' },
  { test: /Over-receipt for PO item .*exceed remaining capacity/i, key: 'overReceipt' },
  { test: /Quantity \((?<qty>[\d.,]+)\) cannot be less than already-received qty \((?<received>[\d.,]+)\)/i, key: 'qtyBelowReceived' },
  { test: /QuantityReceived cannot be negative/i, key: 'negativeReceived' },
  { test: /QuantityRejected cannot be negative/i, key: 'negativeRejected' },
  { test: /Line quantity must be greater than zero/i, key: 'lineQtyZero' },
  { test: /Line unit price cannot be negative/i, key: 'lineNegativePrice' },
  { test: /Line discount cannot be negative/i, key: 'lineNegativeDiscount' },
  { test: /Line tax rate must be between 0 and 100/i, key: 'lineTaxRange' },
  { test: /Line description is required/i, key: 'lineDescriptionRequired' },
  { test: /AmountPaid cannot be negative/i, key: 'negativeAmountPaid' },
  { test: /AmountPaid \((?<paid>[\d.,]+)\) exceeds GrandTotal \((?<total>[\d.,]+)\)/i, key: 'overpayment' },
  { test: /does not have enough stock to reverse/i, key: 'stockReverseShortage' },

  // ── Linking / ownership mismatches ────────────────────────────────────────
  { test: /belongs to a different supplier/i, key: 'differentSupplier' },
  { test: /do(?:es)? not belong to PO/i, key: 'itemNotOnOrder' },
  { test: /invoice that has no PurchaseOrderId/i, key: 'invoiceHasNoOrder' },
  { test: /This supplier is already linked to the article/i, key: 'supplierAlreadyLinked' },
  { test: /An invoice with reference '(?<ref>[^']+)' already exists for this supplier/i, key: 'duplicateInvoiceRef' },

  // ── Not found ─────────────────────────────────────────────────────────────
  { test: /^PurchaseOrder\b.*not found/i, key: 'poNotFound' },
  { test: /^GoodsReceipt\b.*not found/i, key: 'receiptNotFound' },
  { test: /^SupplierInvoice\b.*not found/i, key: 'invoiceNotFound' },
  { test: /^Supplier\b.*not found/i, key: 'supplierNotFound' },
  { test: /^ArticleSupplier\b.*not found/i, key: 'articleSupplierNotFound' },
  { test: /^Item .* not found/i, key: 'itemNotFound' },
];

/** Return the matching reason key + interpolation values, or null. */
export function matchPurchaseErrorReason(message?: string | null): MatchedReason | null {
  if (!message) return null;
  // Strip any "[CODE] " prefix and HTTP noise the client may have prepended.
  const clean = message.replace(/^\[[A-Z0-9_]+\]\s*/, '').replace(/^\[HTTP \d+\]\s*/, '').trim();
  for (const rule of RULES) {
    const m = rule.test.exec(clean);
    if (m) return { key: rule.key, values: { ...(m.groups ?? {}) } };
  }
  return null;
}
