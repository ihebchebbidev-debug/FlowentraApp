/**
 * Centralized total calculation for Offers & Sales.
 *
 * Business rule (sequential):
 *   Subtotal  →  Discount  →  TVA (on afterDiscount)  →  Fiscal Stamp (added last)
 *
 * Tax is always applied to the balance AFTER discount, never on the raw subtotal.
 */

export interface TotalCalculationInput {
  /** Items subtotal (sum of item totalPrice). Falls back to `amount` when items are empty. */
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed' | string;
  tax?: number;
  taxType?: 'percentage' | 'fixed' | string;
  fiscalStamp?: number;
  /** Optional shipping cost (sales only) */
  shippingCost?: number;
}

export interface TotalCalculationResult {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  taxAmount: number;
  fiscalStamp: number;
  shippingCost: number;
  total: number;
}

export function calculateDocumentTotal(input: TotalCalculationInput): TotalCalculationResult {
  const subtotal = input.subtotal || 0;

  // 1. Discount
  const discountAmount =
    (input.discount ?? 0) > 0
      ? input.discountType === 'percentage'
        ? subtotal * ((input.discount ?? 0) / 100)
        : (input.discount ?? 0)
      : 0;

  const afterDiscount = subtotal - discountAmount;

  // 2. Tax (applied on afterDiscount)
  const taxAmount =
    (input.tax ?? 0) > 0
      ? input.taxType === 'percentage'
        ? afterDiscount * ((input.tax ?? 0) / 100)
        : (input.tax ?? 0)
      : 0;

  // 3. Fiscal stamp + shipping
  const fiscalStamp = input.fiscalStamp ?? 0;
  const shippingCost = input.shippingCost ?? 0;

  const total = afterDiscount + taxAmount + fiscalStamp + shippingCost;

  return { subtotal, discountAmount, afterDiscount, taxAmount, fiscalStamp, shippingCost, total };
}

/**
 * Convenience: compute total from a Sale / Offer entity object.
 * Works with any object that has items[], discount, taxes, fiscalStamp, etc.
 */
export function calculateEntityTotal(entity: {
  items?: { totalPrice?: number; quantity?: number; unitPrice?: number }[];
  amount?: number;
  totalAmount?: number;
  discount?: number;
  discountType?: string;
  taxes?: number;
  taxType?: string;
  fiscalStamp?: number;
  shippingCost?: number;
}): TotalCalculationResult {
  let subtotal = 0;
  if (entity.items && entity.items.length > 0) {
    subtotal = entity.items.reduce((sum, item) => sum + (item.totalPrice ?? (item.quantity ?? 0) * (item.unitPrice ?? 0)), 0);
  } else {
    subtotal = entity.amount ?? 0;
  }

  return calculateDocumentTotal({
    subtotal,
    discount: entity.discount,
    discountType: entity.discountType as 'percentage' | 'fixed' | undefined,
    tax: entity.taxes,
    taxType: entity.taxType as 'percentage' | 'fixed' | undefined,
    fiscalStamp: entity.fiscalStamp,
    shippingCost: entity.shippingCost,
  });
}
