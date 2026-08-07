/**
 * Store Rules — pure business-logic engine for e-commerce blocks.
 *
 * This file is intentionally UI-free: it takes a cart + a rules config and
 * returns a fully broken-down totals object. Cart, Checkout, and Mini-Cart
 * blocks all consume the same output so behaviour is consistent.
 *
 * Everything is optional and additive:
 *   - No rules passed → totals = subtotal (backward compatible).
 *   - Any subset of rules can be provided; unspecified rules are skipped.
 *
 * All monetary values are numbers (major currency units, e.g. dollars).
 * Formatting for display stays in `storeCurrency.ts`.
 *
 * ─── Example ──────────────────────────────────────────────────────────
 *   const totals = computeCartTotals(cart, {
 *     freeShippingOver: 75,
 *     flatShipping: 6.99,
 *     taxRate: 0.08,
 *     coupons: [{ code: 'WELCOME20', kind: 'percent', value: 20 }],
 *     activeCoupon: 'WELCOME20',
 *   });
 *   // → { subtotal, discount, shipping, tax, total, appliedCoupon, notes }
 */

import type { CartItem } from '../hooks/useEcommerceStore';

// ═════════════════════════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════════════════════════

/** A coupon the buyer can apply at checkout. */
export interface CouponRule {
  code: string;
  /**
   * - `percent`   — `value` is 0–100, applied to subtotal
   * - `fixed`     — `value` is a currency amount subtracted from subtotal
   * - `shipping`  — waives shipping cost
   * - `bogo`      — buy `value` of same SKU, get one free (cheapest item)
   */
  kind: 'percent' | 'fixed' | 'shipping' | 'bogo';
  value: number;
  /** Minimum subtotal required to unlock the coupon. */
  minSubtotal?: number;
  /** Human label shown alongside the discount line. */
  label?: string;
}

/** A "spend X, save Y%" tier applied automatically. */
export interface SpendTier {
  minSubtotal: number;
  discountPercent: number;
  label?: string;
}

/** A "buy X of the same item, save Y%" tier per line item. */
export interface QuantityTier {
  minQty: number;
  discountPercent: number;
}

/** Region-scoped tax rate. `region` is opaque — match on your own key. */
export interface TaxRule {
  region: string;
  rate: number; // 0.08 = 8%
  label?: string;
  includedInPrice?: boolean; // when true, tax is displayed but not added
}

/** Complete rules config. All fields optional. */
export interface StoreRules {
  /** Auto-applied when subtotal ≥ threshold. */
  freeShippingOver?: number;
  /** Flat shipping fee applied when free-shipping threshold not met. */
  flatShipping?: number;
  /** Per-region tax rates. If provided along with `activeRegion`, tax is computed. */
  taxes?: TaxRule[];
  activeRegion?: string;
  /** Simple flat tax rate as a shortcut when regions aren't needed. */
  taxRate?: number;
  /** When true, tax also applies to the shipping cost (default: false). */
  taxOnShipping?: boolean;
  /** Automatic spend tiers — highest matching tier wins. */
  spendTiers?: SpendTier[];
  /** Per-item quantity discounts — matched against line quantity. */
  quantityTiers?: QuantityTier[];
  /** Coupons the buyer may enter. */
  coupons?: CouponRule[];
  /** Currently-applied coupon code (case-insensitive). */
  activeCoupon?: string | null;
  /** Cap the total discount at this fraction of subtotal (default 0.9 = 90%). */
  maxDiscountFraction?: number;
}

/** Fully broken-down totals for display. */
export interface CartTotals {
  subtotal: number;
  itemDiscount: number;   // from quantity tiers
  spendDiscount: number;  // from spend tiers
  couponDiscount: number; // from active coupon
  discount: number;       // sum of all discounts
  shipping: number;
  shippingWaived: boolean;
  tax: number;
  taxIncluded: boolean;
  total: number;
  appliedCoupon: CouponRule | null;
  /** Human-readable notes: "Free shipping unlocked", "Save 15% at $100", etc. */
  notes: string[];
  /** Buyer-facing errors: "Coupon expired", "Below minimum". */
  errors: string[];
}

// ═════════════════════════════════════════════════════════════════════════
// Internals
// ═════════════════════════════════════════════════════════════════════════

/** Parse "$12.99", "12,99 €", "USD 15" → 12.99/12.99/15. Locale-lenient. */
export function parsePrice(price: string | number | undefined): number {
  if (typeof price === 'number') return Number.isFinite(price) ? price : 0;
  if (!price) return 0;
  const cleaned = String(price).replace(/[^0-9.,\-]/g, '');
  if (!cleaned) return 0;
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  let normalized = cleaned;
  if (lastDot >= 0 && lastComma >= 0) {
    // Both present — the rightmost separator is the decimal.
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    // Only commas — treat as decimal separator if it's the last group of 1-2 digits.
    const afterComma = cleaned.length - lastComma - 1;
    normalized = afterComma > 0 && afterComma <= 2
      ? cleaned.replace(',', '.')
      : cleaned.replace(/,/g, '');
  }
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Best-matching quantity tier for a given qty. */
function pickQuantityTier(qty: number, tiers?: QuantityTier[]): QuantityTier | null {
  if (!tiers?.length) return null;
  const matching = tiers.filter((t) => qty >= t.minQty);
  if (!matching.length) return null;
  return matching.reduce((best, t) => (t.minQty > best.minQty ? t : best));
}

/** Best-matching spend tier for a subtotal. */
function pickSpendTier(subtotal: number, tiers?: SpendTier[]): SpendTier | null {
  if (!tiers?.length) return null;
  const matching = tiers.filter((t) => subtotal >= t.minSubtotal);
  if (!matching.length) return null;
  return matching.reduce((best, t) => (t.minSubtotal > best.minSubtotal ? t : best));
}

/** BOGO: for each SKU, every Nth item is free (cheapest wins per line). */
function bogoDiscount(cart: CartItem[], n: number): number {
  if (n < 1) return 0;
  return cart.reduce((sum, item) => {
    const freeCount = Math.floor(item.quantity / (n + 1));
    return sum + freeCount * parsePrice(item.price);
  }, 0);
}

// ═════════════════════════════════════════════════════════════════════════
// Public API
// ═════════════════════════════════════════════════════════════════════════

/** Look up a coupon by code (case-insensitive), returns null if not found. */
export function findCoupon(code: string | null | undefined, coupons?: CouponRule[]): CouponRule | null {
  if (!code || !coupons?.length) return null;
  const upper = code.trim().toUpperCase();
  return coupons.find((c) => c.code.toUpperCase() === upper) || null;
}

/**
 * Compute a complete totals breakdown for a cart under the given rules.
 * Never throws — invalid rules degrade gracefully and populate `errors`.
 */
export function computeCartTotals(cart: CartItem[], rules: StoreRules = {}): CartTotals {
  const notes: string[] = [];
  const errors: string[] = [];

  // ── Line items → subtotal + per-line quantity discount ──────────────
  let subtotal = 0;
  let itemDiscount = 0;
  for (const item of cart) {
    const unit = parsePrice(item.price);
    const lineTotal = unit * item.quantity;
    subtotal += lineTotal;

    const tier = pickQuantityTier(item.quantity, rules.quantityTiers);
    if (tier) {
      itemDiscount += lineTotal * (tier.discountPercent / 100);
    }
  }

  // ── Automatic spend tier ────────────────────────────────────────────
  let spendDiscount = 0;
  const spendTier = pickSpendTier(subtotal, rules.spendTiers);
  if (spendTier) {
    spendDiscount = subtotal * (spendTier.discountPercent / 100);
    notes.push(spendTier.label || `Save ${spendTier.discountPercent}% on orders over ${spendTier.minSubtotal}`);
  } else if (rules.spendTiers?.length) {
    // Show the next tier as motivation.
    const next = rules.spendTiers
      .filter((t) => t.minSubtotal > subtotal)
      .sort((a, b) => a.minSubtotal - b.minSubtotal)[0];
    if (next) {
      const away = round2(next.minSubtotal - subtotal);
      notes.push(`Add ${away} more to save ${next.discountPercent}%`);
    }
  }

  // ── Coupon ──────────────────────────────────────────────────────────
  let couponDiscount = 0;
  let shippingWaivedByCoupon = false;
  const appliedCoupon = findCoupon(rules.activeCoupon, rules.coupons);
  if (rules.activeCoupon && !appliedCoupon) {
    errors.push(`Coupon "${rules.activeCoupon}" not recognized`);
  }
  if (appliedCoupon) {
    if (appliedCoupon.minSubtotal && subtotal < appliedCoupon.minSubtotal) {
      errors.push(
        `Coupon ${appliedCoupon.code} requires a subtotal of at least ${appliedCoupon.minSubtotal}`,
      );
    } else {
      switch (appliedCoupon.kind) {
        case 'percent':
          couponDiscount = subtotal * (Math.min(appliedCoupon.value, 100) / 100);
          break;
        case 'fixed':
          couponDiscount = Math.min(appliedCoupon.value, subtotal);
          break;
        case 'shipping':
          shippingWaivedByCoupon = true;
          break;
        case 'bogo':
          couponDiscount = bogoDiscount(cart, appliedCoupon.value);
          break;
      }
      notes.push(appliedCoupon.label || `${appliedCoupon.code} applied`);
    }
  }

  // ── Cap total discount so subtotal never goes negative ──────────────
  const totalDiscountRaw = itemDiscount + spendDiscount + couponDiscount;
  const cap = subtotal * (rules.maxDiscountFraction ?? 0.9);
  const discount = Math.min(totalDiscountRaw, cap);
  // Distribute the cap proportionally so the breakdown adds up.
  const scale = totalDiscountRaw > 0 ? discount / totalDiscountRaw : 1;
  itemDiscount = round2(itemDiscount * scale);
  spendDiscount = round2(spendDiscount * scale);
  couponDiscount = round2(couponDiscount * scale);

  const discountedSubtotal = Math.max(0, subtotal - (itemDiscount + spendDiscount + couponDiscount));

  // ── Shipping ────────────────────────────────────────────────────────
  const shippingBase = rules.flatShipping ?? 0;
  let shipping = shippingBase;
  let shippingWaived = false;
  if (shippingWaivedByCoupon) {
    shippingWaived = true;
    shipping = 0;
  } else if (rules.freeShippingOver !== undefined && discountedSubtotal >= rules.freeShippingOver) {
    shippingWaived = true;
    shipping = 0;
    if (shippingBase > 0) notes.push('Free shipping unlocked');
  } else if (rules.freeShippingOver !== undefined && shippingBase > 0) {
    const away = round2(rules.freeShippingOver - discountedSubtotal);
    if (away > 0) notes.push(`Add ${away} more for free shipping`);
  }

  // ── Tax ─────────────────────────────────────────────────────────────
  let tax = 0;
  let taxIncluded = false;
  const regionRule = rules.taxes?.find((t) => t.region === rules.activeRegion);
  const rate = regionRule?.rate ?? rules.taxRate ?? 0;
  taxIncluded = !!regionRule?.includedInPrice;
  if (rate > 0) {
    const taxable = discountedSubtotal + (rules.taxOnShipping ? shipping : 0);
    if (taxIncluded) {
      // Tax is already inside the displayed price — back it out for display only.
      tax = taxable - taxable / (1 + rate);
    } else {
      tax = taxable * rate;
    }
  }

  const totalBeforeTax = discountedSubtotal + shipping;
  const total = taxIncluded ? totalBeforeTax : totalBeforeTax + tax;

  return {
    subtotal: round2(subtotal),
    itemDiscount: round2(itemDiscount),
    spendDiscount: round2(spendDiscount),
    couponDiscount: round2(couponDiscount),
    discount: round2(itemDiscount + spendDiscount + couponDiscount),
    shipping: round2(shipping),
    shippingWaived,
    tax: round2(tax),
    taxIncluded,
    total: round2(total),
    appliedCoupon,
    notes,
    errors,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// Inventory helpers (optional)
// ═════════════════════════════════════════════════════════════════════════

export interface StockLevel {
  productId: string;
  available: number;
}

/** Returns cart items whose quantity exceeds available stock. */
export function checkInventory(cart: CartItem[], stock: StockLevel[]): CartItem[] {
  const byId = new Map(stock.map((s) => [s.productId, s.available]));
  return cart.filter((item) => {
    const avail = byId.get(item.productId);
    return avail !== undefined && item.quantity > avail;
  });
}
