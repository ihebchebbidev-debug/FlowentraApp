import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { Heart, ShoppingCart, Eye, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useEcommerceStore, toProductId } from '../../../hooks/useEcommerceStore';
import { toast } from 'sonner';
import { sanitizeHtml } from '@/utils/sanitize';

interface Product {
  name: string;
  price: string;
  oldPrice?: string;
  imageUrl?: string;
  images?: string[];
  badge?: string;
  description?: string;
  rating?: number;
  liked?: boolean;
}

interface ProductCardBlockProps {
  title?: string;
  subtitle?: string;
  products: Product[];
  columns?: number;
  variant?: 'default' | 'compact' | 'horizontal' | 'overlay';
  showWishlist?: boolean;
  showQuickView?: boolean;
  showRating?: boolean;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

function ProductImageSlider({ images, name, borderRadius }: { images: string[]; name: string; borderRadius: number }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-4xl opacity-15">🛍️</span>
      </div>
    );
  }
  if (images.length === 1) {
    return <img src={images[0]} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
  }
  return (
    <div className="relative w-full h-full">
      <img src={images[idx]} alt={name} className="w-full h-full object-cover transition-opacity duration-300" />
      <button
        onClick={(e) => { e.stopPropagation(); setIdx(i => (i > 0 ? i - 1 : images.length - 1)); }}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <ChevronLeft className="h-3 w-3" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setIdx(i => (i < images.length - 1 ? i + 1 : 0)); }}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <ChevronRight className="h-3 w-3" />
      </button>
      <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
        {images.map((_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}

export function ProductCardBlock({
  title,
  subtitle,
  products,
  columns = 3,
  variant = 'default',
  showWishlist = true,
  showQuickView = false,
  showRating = true,
  theme,
  isEditing,
  onUpdate,
  style,
}: ProductCardBlockProps) {
  const { addToCart, isInCart, toggleWishlist, isInWishlist } = useEcommerceStore();

  const handleAddToCart = (product: Product) => {
    const pid = toProductId(product);
    addToCart({
      productId: pid,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      imageUrl: product.imageUrl || product.images?.[0],
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (product: Product) => {
    const pid = toProductId(product);
    toggleWishlist({
      productId: pid,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      imageUrl: product.imageUrl || product.images?.[0],
      inStock: true,
    });
    toast.success(isInWishlist(pid) ? `${product.name} removed from wishlist` : `${product.name} added to wishlist`);
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className="text-[10px]" style={{ color: s <= rating ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </div>
  );

  const getProductImages = (p: Product): string[] => {
    if (p.images && p.images.length > 0) return p.images;
    if (p.imageUrl) return [p.imageUrl];
    return [];
  };

  const AddToCartBtn = ({ product, compact = false }: { product: Product; compact?: boolean }) => {
    const pid = toProductId(product);
    const inCart = isInCart(pid);
    return (
      <button
        onClick={() => handleAddToCart(product)}
        className={`${compact ? 'px-4 py-1.5 text-xs' : 'w-full mt-3 py-2 text-sm'} rounded-lg font-medium text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5`}
        style={{ backgroundColor: inCart ? '#16a34a' : theme.primaryColor, borderRadius: theme.borderRadius }}
      >
        {inCart ? <Check className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> : <ShoppingCart className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
        {inCart ? 'In Cart' : compact ? 'Add' : 'Add to Cart'}
      </button>
    );
  };

  const WishlistBtn = ({ product, overlay = false }: { product: Product; overlay?: boolean }) => {
    const pid = toProductId(product);
    const liked = isInWishlist(pid);
    return (
      <button
        onClick={() => handleToggleWishlist(product)}
        className={overlay
          ? 'absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors'
          : 'absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform'
        }
      >
        <Heart className="h-4 w-4" fill={liked ? theme.accentColor : 'none'} stroke={overlay ? (liked ? theme.accentColor : '#fff') : (liked ? theme.accentColor : theme.secondaryColor)} />
      </button>
    );
  };

  if (variant === 'horizontal') {
    return (
      <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-6xl mx-auto">
          {title && <h3 className="text-2xl font-bold mb-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
          {subtitle && <p className="text-sm mb-8 opacity-70" style={{ color: theme.secondaryColor }}>{subtitle}</p>}
          <div className="space-y-4">
            {products.map((product, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 border rounded-xl overflow-hidden group hover:shadow-md transition-shadow" style={{ borderRadius: theme.borderRadius }}>
                <div className="w-full sm:w-40 h-48 sm:h-40 shrink-0 bg-gray-50 overflow-hidden relative">
                  {product.badge && (
                    <span className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.accentColor }}>
                      {product.badge}
                    </span>
                  )}
                  <ProductImageSlider images={getProductImages(product)} name={product.name} borderRadius={theme.borderRadius} />
                </div>
                <div className="flex-1 py-3 pr-4 flex flex-col justify-between">
                  <div>
                    {showRating && product.rating !== undefined && renderStars(product.rating)}
                    <h4 className="font-semibold text-sm" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{product.name}</h4>
                    {product.description && <p className="text-xs opacity-60 mt-1 line-clamp-2" style={{ color: theme.secondaryColor }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: theme.primaryColor }}>{product.price}</span>
                      {product.oldPrice && <span className="text-xs line-through opacity-50" style={{ color: theme.secondaryColor }}>{product.oldPrice}</span>}
                    </div>
                    <div className="flex gap-2">
                      {showWishlist && (
                        <button onClick={() => handleToggleWishlist(product)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors">
                          <Heart className="h-3.5 w-3.5" fill={isInWishlist(toProductId(product)) ? theme.accentColor : 'none'} stroke={isInWishlist(toProductId(product)) ? theme.accentColor : theme.secondaryColor} />
                        </button>
                      )}
                      <AddToCartBtn product={product} compact />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'overlay') {
    return (
      <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-6xl mx-auto">
          {title && <h3 className="text-2xl font-bold mb-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
          {subtitle && <p className="text-sm mb-8 opacity-70" style={{ color: theme.secondaryColor }}>{subtitle}</p>}
          <div className={`grid ${columns <= 2 ? 'grid-cols-1 sm:grid-cols-2' : columns <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} gap-5`}>
            {products.map((product, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden group aspect-[3/4]" style={{ borderRadius: theme.borderRadius }}>
                <div className="absolute inset-0 bg-gray-100">
                  <ProductImageSlider images={getProductImages(product)} name={product.name} borderRadius={theme.borderRadius} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {product.badge && (
                  <span className="absolute top-3 left-3 z-10 text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: theme.accentColor }}>
                    {product.badge}
                  </span>
                )}
                {showWishlist && <WishlistBtn product={product} overlay />}
                <div className="absolute bottom-0 inset-x-0 p-4 text-white">
                  {showRating && product.rating !== undefined && renderStars(product.rating)}
                  <h4 className="font-bold text-sm mt-1" style={{ fontFamily: theme.headingFont }}>{product.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{product.price}</span>
                      {product.oldPrice && <span className="text-xs line-through opacity-60">{product.oldPrice}</span>}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center gap-1"
                      style={{ borderRadius: theme.borderRadius }}
                    >
                      {isInCart(toProductId(product)) ? <><Check className="h-3 w-3" /> Added</> : <><ShoppingCart className="h-3 w-3" /> Add</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default & compact variants
  const isCompact = variant === 'compact';

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-6xl mx-auto">
        {title && <h3 className="text-2xl font-bold mb-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
        {subtitle && <p className="text-sm mb-8 opacity-70" style={{ color: theme.secondaryColor }}>{subtitle}</p>}
        <div className={`grid ${columns <= 2 ? 'grid-cols-1 sm:grid-cols-2' : columns <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} gap-6`}>
          {products.map((product, i) => (
            <div
              key={i}
              className="border rounded-xl overflow-hidden group hover:shadow-md transition-all relative"
              style={{ borderRadius: theme.borderRadius }}
            >
              {product.badge && (
                <span className="absolute top-3 left-3 z-10 text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: theme.accentColor }}>
                  {product.badge}
                </span>
              )}
              {showWishlist && <WishlistBtn product={product} />}
              <div className={`${isCompact ? 'aspect-[4/3]' : 'aspect-square'} bg-gray-50 overflow-hidden`}>
                <ProductImageSlider images={getProductImages(product)} name={product.name} borderRadius={theme.borderRadius} />
              </div>
              {showQuickView && (
                <div className="absolute inset-x-0 bottom-0 top-auto p-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ bottom: isCompact ? '60px' : '80px' }}>
                  <button className="w-full py-2 rounded-lg text-xs font-medium bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center gap-1.5 hover:bg-white transition-colors" style={{ borderRadius: theme.borderRadius, color: theme.textColor }}>
                    <Eye className="h-3.5 w-3.5" /> Quick View
                  </button>
                </div>
              )}
              <div className={isCompact ? 'p-3' : 'p-4'}>
                {showRating && product.rating !== undefined && renderStars(product.rating)}
                <h4 className={`font-semibold ${isCompact ? 'text-xs' : 'text-sm'} mb-1 line-clamp-1`} style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
                  {product.name}
                </h4>
                {!isCompact && product.description && (
                  <p className="text-xs opacity-60 mb-2 line-clamp-2" style={{ color: theme.secondaryColor }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
                )}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isCompact ? 'text-sm' : 'text-lg'}`} style={{ color: theme.primaryColor }}>{product.price}</span>
                    {product.oldPrice && <span className="text-xs line-through opacity-50" style={{ color: theme.secondaryColor }}>{product.oldPrice}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className={`w-full ${isCompact ? 'mt-2 py-1.5 text-xs' : 'mt-3 py-2 text-sm'} rounded-lg font-medium text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5`}
                  style={{ backgroundColor: isInCart(toProductId(product)) ? '#16a34a' : theme.primaryColor, borderRadius: theme.borderRadius }}
                >
                  {isInCart(toProductId(product))
                    ? <><Check className={isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> In Cart</>
                    : <><ShoppingCart className={isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> Add to Cart</>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
