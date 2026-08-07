/**
 * lastOrder — sessionStorage bridge between CheckoutBlock and any
 * downstream "Thank you" / order-confirmation view.
 *
 * We deliberately avoid persisting anything sensitive (no full PAN, no CVV).
 * The snapshot contains only what a confirmation page needs to render.
 */

import type { CartTotals } from './storeRules';

export interface LastOrderSnapshot {
  orderId: string;
  placedAt: string; // ISO
  items: Array<{ name: string; price: string; quantity: number; imageUrl?: string; variant?: string }>;
  totals: CartTotals | null;
  displaySubtotal: string;
  displayShipping: string;
  displayTax: string;
  displayTotal: string;
  shippingAddress: Record<string, string>;
  shippingMethod?: { label: string; price: string; estimate: string };
  payment: { method: string; last4?: string };
  couponCode?: string | null;
  orderNotes?: string;
}

const KEY = 'wb:last-order';

/** Cryptographically-random WB-XXXX-XXXX id. */
export function generateOrderId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint8Array(8);
  (globalThis.crypto ?? crypto).getRandomValues(buf);
  const chars = Array.from(buf, (b) => alphabet[b % alphabet.length]).join('');
  return `WB-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

export function saveLastOrder(order: LastOrderSnapshot): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    /* storage full or blocked — non-fatal */
  }
}

export function readLastOrder(): LastOrderSnapshot | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastOrderSnapshot) : null;
  } catch {
    return null;
  }
}

export function clearLastOrder(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* noop */ }
}