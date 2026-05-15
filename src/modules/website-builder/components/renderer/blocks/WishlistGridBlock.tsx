import React from 'react';
import { SiteTheme } from '../../../types';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { useEcommerceStore, toProductId } from '../../../hooks/useEcommerceStore';
import { toast } from 'sonner';

interface WishlistItemProp {
  name: string;
  price: string;
  oldPrice?: string;
  imageUrl?: string;
  inStock?: boolean;
}

interface WishlistGridBlockProps {
  title?: string;
  /** Static items — shown only as editor preview when global wishlist is empty */
  items: WishlistItemProp[];
  columns?: number;
  showMoveToCart?: boolean;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function WishlistGridBlock({
  title = 'My Wishlist',
  items: staticItems,
  columns = 4,
  showMoveToCart = true,
  theme,
  isEditing,
  onUpdate,
  style,
}: WishlistGridBlockProps) {
  const { wishlist, removeFromWishlist, moveWishlistToCart } = useEcommerceStore();

  // Use global wishlist if available, else fall back to static props
  const useGlobal = wishlist.length > 0 || !isEditing;
  const displayItems = useGlobal
    ? wishlist
    : staticItems.map(it => ({
        productId: toProductId(it),
        name: it.name,
        price: it.price,
        oldPrice: it.oldPrice,
        imageUrl: it.imageUrl,
        inStock: it.inStock,
      }));

  const handleRemove = (productId: string, name: string) => {
    if (useGlobal) {
      removeFromWishlist(productId);
      toast.success(`${name} removed from wishlist`);
    } else if (onUpdate) {
      // Editor fallback: remove from static array
      onUpdate({ items: staticItems.filter(it => toProductId(it) !== productId) });
    }
  };

  const handleMoveToCart = (productId: string, name: string) => {
    if (useGlobal) {
      moveWishlistToCart(productId);
      toast.success(`${name} moved to cart`);
    }
  };

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5" fill={theme.accentColor} stroke={theme.accentColor} />
            <h2 className="text-2xl font-bold" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
              {title}
            </h2>
            <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100" style={{ color: theme.secondaryColor }}>
              {displayItems.length} items
            </span>
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center py-16 border rounded-xl border-dashed" style={{ borderRadius: theme.borderRadius }}>
            <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm" style={{ color: theme.secondaryColor }}>Your wishlist is empty</p>
            <button
              className="mt-4 px-6 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            columns <= 2 ? 'grid-cols-1 sm:grid-cols-2' :
            columns <= 3 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            {displayItems.map((item) => (
              <div
                key={item.productId}
                className="border rounded-xl overflow-hidden group relative hover:shadow-md transition-shadow"
                style={{ borderRadius: theme.borderRadius }}
              >
                <button
                  onClick={() => handleRemove(item.productId, item.name)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5 text-red-500" />
                </button>

                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-15">💝</span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h4 className="font-medium text-sm line-clamp-1" style={{ color: theme.textColor }}>{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-sm" style={{ color: theme.primaryColor }}>{item.price}</span>
                    {item.oldPrice && (
                      <span className="text-xs line-through opacity-50" style={{ color: theme.secondaryColor }}>{item.oldPrice}</span>
                    )}
                  </div>
                  {item.inStock === false && (
                    <span className="text-[10px] text-red-500 font-medium">Out of Stock</span>
                  )}
                  {showMoveToCart && item.inStock !== false && (
                    <button
                      onClick={() => handleMoveToCart(item.productId, item.name)}
                      className="w-full mt-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border hover:bg-gray-50 transition-colors"
                      style={{ borderRadius: theme.borderRadius, color: theme.primaryColor, borderColor: theme.primaryColor + '40' }}
                    >
                      <ShoppingCart className="h-3 w-3" /> Move to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
