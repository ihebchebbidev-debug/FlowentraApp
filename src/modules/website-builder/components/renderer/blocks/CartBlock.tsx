import React from 'react';
import { SiteTheme } from '../../../types';
import { useEcommerceStore } from '../../../hooks/useEcommerceStore';
import { Minus, Plus, X, ShoppingCart } from 'lucide-react';

interface CartBlockProps {
  /** Static items — shown only when the global cart is empty (editor preview) */
  items?: Array<{ name: string; price: string; quantity: number; imageUrl?: string }>;
  subtotal?: string;
  shipping?: string;
  total?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function CartBlock({
  items: staticItems = [],
  subtotal: staticSubtotal = '$297',
  shipping = 'Free',
  total: staticTotal = '$297',
  theme,
  isEditing,
  onUpdate,
  style,
}: CartBlockProps) {
  const { cart, cartTotal, updateCartQuantity, removeFromCart } = useEcommerceStore();

  // Use global cart if it has items, otherwise fall back to static props (editor preview)
  const useGlobal = cart.length > 0 || !isEditing;
  const displayItems = useGlobal ? cart : staticItems.map((it, i) => ({
    productId: `static-${i}`,
    name: it.name,
    price: it.price,
    quantity: it.quantity,
    imageUrl: it.imageUrl,
  }));

  const displaySubtotal = useGlobal ? `$${cartTotal.toFixed(2)}` : staticSubtotal;
  const displayTotal = useGlobal ? `$${cartTotal.toFixed(2)}` : staticTotal;

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
          <ShoppingCart className="h-5 w-5 opacity-50" />
          Shopping Cart
          {displayItems.length > 0 && (
            <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-muted/30" style={{ color: theme.secondaryColor }}>
              {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>

        {displayItems.length === 0 ? (
          <div className="text-center py-16 border rounded-xl" style={{ borderRadius: theme.borderRadius }}>
            <span className="text-4xl mb-3 block">🛒</span>
            <p className="text-sm" style={{ color: theme.secondaryColor }}>Your cart is empty</p>
            <button className="mt-4 px-6 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {displayItems.map((item) => (
                <div key={item.productId} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 border rounded-xl" style={{ borderRadius: theme.borderRadius }}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0" style={{ borderRadius: theme.borderRadius }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl opacity-30">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: theme.textColor }}>{item.name}</p>
                    <p className="text-sm mt-0.5" style={{ color: theme.primaryColor }}>{item.price}</p>
                  </div>
                  <div className="flex items-center border rounded-lg" style={{ borderRadius: theme.borderRadius }}>
                    <button
                      className="px-2.5 py-1 text-sm hover:bg-gray-50"
                      onClick={() => useGlobal && updateCartQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium border-x">{item.quantity}</span>
                    <button
                      className="px-2.5 py-1 text-sm hover:bg-gray-50"
                      onClick={() => useGlobal && updateCartQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    className="text-red-400 hover:text-red-600 transition-colors"
                    onClick={() => useGlobal && removeFromCart(item.productId)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm" style={{ color: theme.secondaryColor }}>
                <span>Subtotal</span><span>{displaySubtotal}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: theme.secondaryColor }}>
                <span>Shipping</span><span>{shipping}</span>
              </div>
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
