import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { useEcommerceStore } from '../../../hooks/useEcommerceStore';
import { formatStorePrice } from '../../../utils/storeCurrency';
import { computeCartTotals, StoreRules } from '../../../utils/storeRules';
import { Minus, Plus, X, ShoppingCart, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

interface CartBlockProps {
  /** Static items — shown only when the global cart is empty (editor preview) */
  items?: Array<{ name: string; price: string; quantity: number; imageUrl?: string }>;
  subtotal?: string;
  shipping?: string;
  total?: string;
  /**
   * Business rules — coupons, free-shipping threshold, tax, tiered discounts, etc.
   * When present, cart totals are computed by `computeCartTotals` and the
   * breakdown (discount / shipping / tax) is shown live. Omit to keep the
   * simple flat-total behaviour.
   */
  rules?: StoreRules;
  /** Show the coupon input row (defaults to true when `rules.coupons` is set). */
  showCouponInput?: boolean;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function CartBlock({
  items: staticItems = [],
  subtotal: staticSubtotal = '$297',
  shipping: staticShipping = 'Free',
  total: staticTotal = '$297',
  rules,
  showCouponInput,
  theme,
  isEditing,
  style,
}: CartBlockProps) {
  const { cart, cartTotal, updateCartQuantity, removeFromCart } = useEcommerceStore();
  const [couponInput, setCouponInput] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<string | null>(rules?.activeCoupon ?? null);

  // Use global cart if it has items, otherwise fall back to static props (editor preview)
  const useGlobal = cart.length > 0 || !isEditing;
  const displayItems = useGlobal
    ? cart
    : staticItems.map((it, i) => ({
        productId: `static-${i}`,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        imageUrl: it.imageUrl,
      }));

  // Compute rich totals when rules are present, otherwise fall back to the
  // simple subtotal → single-line total behaviour.
  const rulesActive = !!rules;
  const totals = rulesActive
    ? computeCartTotals(displayItems, { ...rules, activeCoupon: activeCoupon ?? rules?.activeCoupon ?? null })
    : null;

  const displaySubtotal = totals
    ? formatStorePrice(totals.subtotal, theme)
    : useGlobal ? formatStorePrice(cartTotal, theme) : staticSubtotal;
  const displayTotal = totals
    ? formatStorePrice(totals.total, theme)
    : useGlobal ? formatStorePrice(cartTotal, theme) : staticTotal;
  const displayShipping = totals
    ? totals.shippingWaived ? 'Free' : formatStorePrice(totals.shipping, theme)
    : staticShipping;

  const showCoupons = showCouponInput ?? !!rules?.coupons?.length;

  const handleApplyCoupon = () => {
    const code = couponInput.trim();
    if (!code) return;
    setActiveCoupon(code);
  };
  const handleClearCoupon = () => {
    setActiveCoupon(null);
    setCouponInput('');
  };

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-2xl font-bold mb-6 flex items-center gap-2"
          style={{ color: theme.textColor, fontFamily: theme.headingFont }}
        >
          <ShoppingCart className="h-5 w-5 opacity-50" />
          Shopping Cart
          {displayItems.length > 0 && (
            <span
              className="text-sm font-normal px-2 py-0.5 rounded-full bg-muted/30"
              style={{ color: theme.secondaryColor }}
            >
              {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>

        {displayItems.length === 0 ? (
          <div className="text-center py-16 border rounded-xl" style={{ borderRadius: theme.borderRadius }}>
            <span className="text-4xl mb-3 block">🛒</span>
            <p className="text-sm" style={{ color: theme.secondaryColor }}>Your cart is empty</p>
            <button
              className="mt-4 px-6 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Line items */}
            <div className="space-y-3">
              {displayItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 border rounded-xl"
                  style={{ borderRadius: theme.borderRadius }}
                >
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0"
                    style={{ borderRadius: theme.borderRadius }}
                  >
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl opacity-30">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: theme.textColor }}>{item.name}</p>
                    <p className="text-sm mt-0.5" style={{ color: theme.primaryColor }}>{item.price}</p>
                  </div>
                  <div className="flex items-center border rounded-lg" style={{ borderRadius: theme.borderRadius }}>
                    <button
                      className="px-2.5 py-1 text-sm hover:bg-gray-50"
                      onClick={() => useGlobal && updateCartQuantity(item.productId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium border-x">{item.quantity}</span>
                    <button
                      className="px-2.5 py-1 text-sm hover:bg-gray-50"
                      onClick={() => useGlobal && updateCartQuantity(item.productId, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    className="text-red-400 hover:text-red-600 transition-colors"
                    onClick={() => useGlobal && removeFromCart(item.productId)}
                    aria-label="Remove item"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            {showCoupons && (
              <div
                className="flex items-center gap-2 p-3 border rounded-xl"
                style={{ borderRadius: theme.borderRadius }}
              >
                <Tag className="h-4 w-4 shrink-0" style={{ color: theme.primaryColor }} />
                {totals?.appliedCoupon ? (
                  <>
                    <span className="text-sm font-medium flex-1 flex items-center gap-1.5" style={{ color: theme.textColor }}>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      {totals.appliedCoupon.code}
                      <span className="text-xs font-normal" style={{ color: theme.secondaryColor }}>
                        applied
                      </span>
                    </span>
                    <button
                      onClick={handleClearCoupon}
                      className="text-xs px-2 py-1 rounded hover:bg-muted/40"
                      style={{ color: theme.secondaryColor }}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="flex-1 text-sm bg-transparent outline-none placeholder:opacity-40 uppercase"
                      style={{ color: theme.textColor }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="text-xs font-semibold px-3 py-1.5 rounded-md text-white"
                      style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
                      disabled={!couponInput.trim()}
                    >
                      Apply
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Rule notes (progress toward free shipping / next tier) */}
            {totals && totals.notes.length > 0 && (
              <div className="space-y-1">
                {totals.notes.map((note, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/5"
                    style={{ color: theme.primaryColor }}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            )}
            {totals && totals.errors.length > 0 && (
              <div className="space-y-1">
                {totals.errors.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700"
                  >
                    <AlertCircle className="h-3 w-3" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals breakdown */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm" style={{ color: theme.secondaryColor }}>
                <span>Subtotal</span><span>{displaySubtotal}</span>
              </div>
              {totals && totals.discount > 0 && (
                <div className="flex justify-between text-sm" style={{ color: theme.primaryColor }}>
                  <span>Discount</span><span>−{formatStorePrice(totals.discount, theme)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm" style={{ color: theme.secondaryColor }}>
                <span>Shipping</span>
                <span>{displayShipping}</span>
              </div>
              {totals && totals.tax > 0 && (
                <div className="flex justify-between text-sm" style={{ color: theme.secondaryColor }}>
                  <span>{totals.taxIncluded ? 'Tax (included)' : 'Tax'}</span>
                  <span>{formatStorePrice(totals.tax, theme)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ color: theme.textColor }}>
                <span>Total</span><span>{displayTotal}</span>
              </div>
            </div>

            <button
              className="w-full py-3 rounded-lg font-medium text-white text-sm"
              style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
