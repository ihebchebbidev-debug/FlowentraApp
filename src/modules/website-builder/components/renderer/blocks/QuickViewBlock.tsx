import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useEcommerceStore, toProductId } from '../../../hooks/useEcommerceStore';
import { toast } from 'sonner';

interface QuickViewProduct {
  name: string;
  price: string;
  oldPrice?: string;
  images: string[];
  description?: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  variants?: Array<{ label: string; options: string[] }>;
  inStock?: boolean;
}

interface QuickViewBlockProps {
  product: QuickViewProduct;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function QuickViewBlock({ product, theme, isEditing, onUpdate, style }: QuickViewBlockProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const { addToCart, isInCart, toggleWishlist, isInWishlist } = useEcommerceStore();
  const pid = toProductId(product);
  const inCart = isInCart(pid);
  const liked = isInWishlist(pid);

  const images = product.images?.length ? product.images : [''];

  const prevImage = () => setSelectedImage(i => (i > 0 ? i - 1 : images.length - 1));
  const nextImage = () => setSelectedImage(i => (i < images.length - 1 ? i + 1 : 0));

  const variantStr = Object.values(selectedVariants).filter(Boolean).join(' / ') || undefined;

  const handleAddToCart = () => {
    addToCart({
      productId: pid,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      imageUrl: images[0] || undefined,
      variant: variantStr,
      quantity,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = () => {
    toggleWishlist({
      productId: pid,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      imageUrl: images[0] || undefined,
      inStock: product.inStock,
    });
    toast.success(liked ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-4xl mx-auto border rounded-2xl overflow-hidden bg-white shadow-lg" style={{ borderRadius: theme.borderRadius }}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Side */}
          <div className="relative bg-gray-50 aspect-square md:aspect-auto">
            {product.badge && (
              <span className="absolute top-4 left-4 z-10 text-[11px] font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: theme.accentColor }}>
                {product.badge}
              </span>
            )}
            <button
              onClick={handleToggleWishlist}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            >
              <Heart className="h-4 w-4" fill={liked ? theme.accentColor : 'none'} stroke={liked ? theme.accentColor : theme.secondaryColor} />
            </button>

            <div className="w-full h-full min-h-[320px] flex items-center justify-center">
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl opacity-15">📷</span>
              )}
            </div>

            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {images.length > 1 && (
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-primary ring-1 ring-primary/30 scale-105' : 'border-white/60 opacity-70 hover:opacity-100'}`}
                    style={{ borderRadius: theme.borderRadius }}
                  >
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Side */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
                  {product.name}
                </h2>
                {product.rating !== undefined && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="h-4 w-4" fill={s <= product.rating! ? '#f59e0b' : 'none'} stroke={s <= product.rating! ? '#f59e0b' : '#d1d5db'} />
                      ))}
                    </div>
                    {product.reviewCount && (
                      <span className="text-xs" style={{ color: theme.secondaryColor }}>({product.reviewCount} reviews)</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold" style={{ color: theme.primaryColor }}>{product.price}</span>
                {product.oldPrice && (
                  <span className="text-lg line-through opacity-50" style={{ color: theme.secondaryColor }}>{product.oldPrice}</span>
                )}
              </div>

              {product.description && (
                <p className="text-sm leading-relaxed" style={{ color: theme.secondaryColor }}>{product.description}</p>
              )}

              {product.variants?.map((v, i) => (
                <div key={i}>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: theme.textColor }}>
                    {v.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt, j) => (
                      <button
                        key={j}
                        onClick={() => setSelectedVariants(prev => ({ ...prev, [v.label]: opt }))}
                        className={`px-4 py-2 rounded-lg text-sm border-2 transition-all ${selectedVariants[v.label] === opt ? 'border-primary bg-primary/5 font-medium' : 'border-gray-200 hover:border-gray-300'}`}
                        style={{ borderRadius: theme.borderRadius }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {product.inStock === false ? (
                <p className="text-sm text-red-500 font-medium">Out of Stock</p>
              ) : (
                <p className="text-sm text-green-600 font-medium">✓ In Stock</p>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg" style={{ borderRadius: theme.borderRadius }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-gray-50 text-lg">−</button>
                  <span className="px-4 py-2 text-sm font-medium border-x">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-gray-50 text-lg">+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: inCart ? '#16a34a' : theme.primaryColor, borderRadius: theme.borderRadius }}
                  disabled={product.inStock === false}
                >
                  {inCart ? <><Check className="h-4 w-4" /> In Cart</> : <><ShoppingCart className="h-4 w-4" /> Add to Cart</>}
                </button>
              </div>
              <button
                onClick={handleToggleWishlist}
                className="w-full py-2.5 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                style={{ borderRadius: theme.borderRadius, color: liked ? theme.accentColor : theme.secondaryColor }}
              >
                <Heart className="h-4 w-4" fill={liked ? theme.accentColor : 'none'} />
                {liked ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
