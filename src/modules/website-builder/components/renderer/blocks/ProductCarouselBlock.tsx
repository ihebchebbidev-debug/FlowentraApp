import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SiteTheme } from '../../../types';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Eye, Check } from 'lucide-react';
import { useEcommerceStore, toProductId } from '../../../hooks/useEcommerceStore';
import { toast } from 'sonner';
import { sanitizeHtml } from '@/utils/sanitize';

interface CarouselProduct {
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

interface ProductCarouselBlockProps {
  title?: string;
  subtitle?: string;
  products: CarouselProduct[];
  autoPlay?: boolean;
  autoPlaySpeed?: number;
  showDots?: boolean;
  showArrows?: boolean;
  cardStyle?: 'default' | 'minimal' | 'elevated' | 'bordered';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ProductCarouselBlock({
  title, subtitle, products,
  autoPlay = false, autoPlaySpeed = 4000,
  showDots = true, showArrows = true,
  cardStyle = 'default',
  theme, isEditing, onUpdate: _onUpdate, style,
}: ProductCarouselBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { addToCart, isInCart, toggleWishlist, isInWishlist } = useEcommerceStore();

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll, products]);

  useEffect(() => {
    if (!autoPlay || isEditing) return;
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      const cardWidth = el.firstElementChild?.clientWidth ?? 300;
      const nextPos = el.scrollLeft + cardWidth + 24;
      if (nextPos >= el.scrollWidth - el.clientWidth) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
      }
    }, autoPlaySpeed);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlaySpeed, isEditing]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 300;
    el.scrollBy({ left: dir === 'left' ? -(cardWidth + 24) : cardWidth + 24, behavior: 'smooth' });
  };

  const handleAddToCart = (product: CarouselProduct) => {
    addToCart({
      productId: toProductId(product),
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      imageUrl: product.imageUrl || product.images?.[0],
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (product: CarouselProduct) => {
    const pid = toProductId(product);
    toggleWishlist({
      productId: pid,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      imageUrl: product.imageUrl || product.images?.[0],
      inStock: true,
    });
    toast.success(isInWishlist(pid) ? `Removed from wishlist` : `Added to wishlist`);
  };

  const cardClasses = {
    default: 'bg-white shadow-sm hover:shadow-lg',
    minimal: 'bg-transparent',
    elevated: 'bg-white shadow-md hover:shadow-xl hover:-translate-y-1',
    bordered: 'border-2 hover:border-primary/40',
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className="text-xs" style={{ color: s <= rating ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </div>
  );

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="flex items-end justify-between mb-8">
            <div>
              {title && <h3 className="text-2xl font-bold" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
              {subtitle && <p className="text-sm mt-1 opacity-70" style={{ color: theme.secondaryColor }}>{subtitle}</p>}
            </div>
            {showArrows && (
              <div className="flex gap-2">
                <button onClick={() => scroll('left')} disabled={!canScrollLeft} className="w-9 h-9 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 hover:bg-gray-50" style={{ borderRadius: '50%' }}>
                  <ChevronLeft className="h-4 w-4" style={{ color: theme.textColor }} />
                </button>
                <button onClick={() => scroll('right')} disabled={!canScrollRight} className="w-9 h-9 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 hover:bg-gray-50" style={{ borderRadius: '50%' }}>
                  <ChevronRight className="h-4 w-4" style={{ color: theme.textColor }} />
                </button>
              </div>
            )}
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, i) => {
            const pid = toProductId(product);
            const inCart = isInCart(pid);
            const liked = isInWishlist(pid);

            return (
              <div
                key={i}
                className={`flex-shrink-0 w-[280px] rounded-xl overflow-hidden group transition-all duration-300 snap-start relative ${cardClasses[cardStyle]}`}
                style={{ borderRadius: theme.borderRadius }}
              >
                {product.badge && (
                  <span className="absolute top-3 left-3 z-10 text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: theme.accentColor }}>
                    {product.badge}
                  </span>
                )}

                <button
                  onClick={() => handleToggleWishlist(product)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <Heart className="h-4 w-4 transition-colors" fill={liked ? theme.accentColor : 'none'} stroke={liked ? theme.accentColor : theme.secondaryColor} />
                </button>

                <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative">
                  {product.imageUrl || (product.images && product.images[0]) ? (
                    <img src={product.imageUrl || product.images?.[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl opacity-15">🛍️</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 justify-center">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-all hover:scale-105"
                      style={{ backgroundColor: inCart ? '#16a34a' : theme.primaryColor, borderRadius: theme.borderRadius }}
                    >
                      {inCart ? <><Check className="h-3.5 w-3.5" /> In Cart</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</>}
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white transition-colors" style={{ borderRadius: theme.borderRadius }}>
                      <Eye className="h-4 w-4" style={{ color: theme.textColor }} />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {product.rating !== undefined && renderStars(product.rating)}
                  <h4 className="font-semibold text-sm mt-1 line-clamp-1" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{product.name}</h4>
                  {product.description && (
                    <p className="text-xs mt-1 opacity-60 line-clamp-2" style={{ color: theme.secondaryColor }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-base" style={{ color: theme.primaryColor }}>{product.price}</span>
                    {product.oldPrice && <span className="text-xs line-through opacity-50" style={{ color: theme.secondaryColor }}>{product.oldPrice}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showDots && products.length > 3 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  const cardWidth = el.firstElementChild?.clientWidth ?? 280;
                  el.scrollTo({ left: i * (cardWidth + 24), behavior: 'smooth' });
                }}
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: theme.primaryColor, opacity: 0.3 }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
