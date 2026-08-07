import React, { useState, useMemo } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { SiteTheme } from '../../../types';
import { useEcommerceStore } from '../../../hooks/useEcommerceStore';
import { formatStorePrice } from '../../../utils/storeCurrency';
import { computeCartTotals, StoreRules } from '../../../utils/storeRules';

/**
 * MiniCartBlock — a persistent, Shopify-style floating cart.
 *
 * A fixed cart button with a live item-count badge that opens a slide-out drawer
 * showing the real cart (line items, quantity steppers, remove, subtotal) with a
 * checkout link. Reads the shared `useEcommerceStore`, so it stays in sync with
 * product "Add to cart" buttons across every page. Place it once (ideally as a
 * global block) for a site-wide cart.
 */
interface MiniCartBlockProps {
  corner?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  buttonColor?: string;
  iconColor?: string;
  title?: string;
  checkoutLink?: string;
  checkoutText?: string;
  emptyText?: string;
  /** Show the button even when the cart is empty. */
  showWhenEmpty?: boolean;
  /** Live discount/shipping/tax preview using the same engine as Cart/Checkout. */
  rules?: StoreRules;
  theme: SiteTheme;
  isEditing?: boolean;
  style?: React.CSSProperties;
}

const POSITION_CLASS: Record<NonNullable<MiniCartBlockProps['corner']>, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export function MiniCartBlock({
  corner = 'top-right',
  buttonColor,
  iconColor = '#ffffff',
  title = 'Your Cart',
  checkoutLink = '#checkout',
  checkoutText = 'Checkout',
  emptyText = 'Your cart is empty',
  showWhenEmpty = true,
  rules,
  theme,
  isEditing = false,
  style,
}: MiniCartBlockProps) {
  const { cart, cartCount, cartTotal, updateCartQuantity, removeFromCart } = useEcommerceStore();
  const [open, setOpen] = useState(false);

  const accent = buttonColor || theme.primaryColor;
  const money = (n: number) => formatStorePrice(n, theme);

  const totals = useMemo(
    () => (rules ? computeCartTotals(cart, rules) : null),
    [rules, cart],
  );

  if (!showWhenEmpty && cartCount === 0 && !isEditing) return null;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        aria-label="Open cart"
        onClick={() => setOpen(true)}
        className={`fixed z-[55] flex items-center justify-center h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${POSITION_CLASS[corner]}`}
        style={{ backgroundColor: accent, ...style }}
      >
        <ShoppingCart className="h-5 w-5" style={{ color: iconColor }} />
        {cartCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full text-px-11 font-bold border-2 border-background"
            style={{ backgroundColor: theme.accentColor || '#ef4444', color: '#fff' }}
          >
            {cartCount}
          </span>
        )}
      </button>

      {/* Drawer + overlay */}
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in"
            onClick={() => setOpen(false)}
          />
          <aside
            className="absolute top-0 right-0 h-full w-full max-w-sm flex flex-col shadow-2xl animate-in slide-in-from-right"
            style={{ backgroundColor: theme.backgroundColor || '#fff', color: theme.textColor }}
            role="dialog"
            aria-label={title}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${theme.textColor}15` }}>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" style={{ color: accent }} />
                <span className="font-semibold text-sm">{title}</span>
                {cartCount > 0 && (
                  <span className="text-xs opacity-60">({cartCount})</span>
                )}
              </div>
              <button type="button" aria-label="Close cart" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 opacity-60">
                  <ShoppingCart className="h-10 w-10 mb-3" />
                  <p className="text-sm">{emptyText}</p>
                </div>
              ) : (
                cart.map((item, i) => (
                  <div key={`${item.productId}-${item.variant || ''}-${i}`} className="flex gap-3">
                    <div
                      className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-center bg-cover flex items-center justify-center"
                      style={{ backgroundColor: `${theme.textColor}0d`, backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined }}
                    >
                      {!item.imageUrl && <ShoppingCart className="h-5 w-5 opacity-20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.variant && <p className="text-px-11 opacity-60">{item.variant}</p>}
                      <p className="text-sm font-semibold mt-0.5" style={{ color: accent }}>{item.price}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center rounded-md border" style={{ borderColor: `${theme.textColor}20` }}>
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="h-6 w-6 flex items-center justify-center hover:bg-black/5 disabled:opacity-30"
                            disabled={item.quantity <= 1}
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.variant)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className="h-6 w-6 flex items-center justify-center hover:bg-black/5"
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.variant)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove item"
                          className="p-1 rounded text-destructive/70 hover:text-destructive hover:bg-destructive/5"
                          onClick={() => removeFromCart(item.productId, item.variant)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: `${theme.textColor}15` }}>
                {totals ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs opacity-70">
                      <span>Subtotal</span>
                      <span>{money(totals.subtotal)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex items-center justify-between text-xs" style={{ color: accent }}>
                        <span>Discount</span>
                        <span>−{money(totals.discount)}</span>
                      </div>
                    )}
                    {totals.notes.slice(0, 1).map((n, i) => (
                      <div key={i} className="text-px-10 opacity-60">{n}</div>
                    ))}
                    <div className="flex items-center justify-between text-sm pt-1 border-t" style={{ borderColor: `${theme.textColor}15` }}>
                      <span className="opacity-70">Total</span>
                      <span className="font-semibold text-base">{money(totals.total)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-70">Subtotal</span>
                    <span className="font-semibold text-base">{money(cartTotal)}</span>
                  </div>
                )}
                <a
                  href={isEditing ? undefined : checkoutLink}
                  onClick={(e) => { if (isEditing) e.preventDefault(); }}
                  className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent, color: iconColor }}
                >
                  {checkoutText}
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-2 rounded-lg text-xs font-medium hover:bg-black/5"
                >
                  Continue shopping
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
