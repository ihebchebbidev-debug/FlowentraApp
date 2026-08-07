import React, { useState, useCallback } from 'react';
import { SiteTheme } from '../../../types';
import { useImageDrop } from '../../../hooks/useImageDrop';

interface ProductDetailBlockProps {
  name: string;
  price: string;
  oldPrice?: string;
  description: string;
  images: string[];
  badge?: string;
  variants?: Array<{ label: string; options: string[] }>;
  features?: string[];
  inStock?: boolean;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ProductDetailBlock({ name, price, oldPrice, description, images, badge, variants, features, inStock = true, theme, isEditing, onUpdate, style }: ProductDetailBlockProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const handleImageDrop = useCallback((dataUri: string) => {
    onUpdate?.({ images: [...images, dataUri] });
  }, [images, onUpdate]);

  const { isDragOver, dropProps } = useImageDrop(handleImageDrop);

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image gallery */}
        <div className="space-y-3" {...(isEditing ? dropProps : {})}>
          <div className="aspect-square rounded-xl overflow-hidden bg-muted relative" style={{ borderRadius: theme.borderRadius }}>
            {isDragOver && isEditing && (
              <div className="absolute inset-0 z-20 bg-primary/20 border-2 border-dashed border-primary flex items-center justify-center rounded-xl backdrop-blur-sm">
                <p className="text-sm font-medium text-primary">Drop product image</p>
              </div>
            )}
            {badge && <span className="absolute top-3 left-3 z-10 text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: theme.accentColor }}>{badge}</span>}
            {images.length > 0 ? (
              <img src={images[selectedImage] || images[0]} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl opacity-20">📷</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${i === selectedImage ? 'border-primary' : 'border-transparent'}`}
                  style={{ borderRadius: theme.borderRadius }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {isEditing && (
            <button onClick={() => { const u = prompt('Image URL:'); if (u) onUpdate?.({ images: [...images, u] }); }} className="text-xs text-primary hover:underline">+ Add image</button>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {isEditing ? (
            <h1
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ name: e.currentTarget.textContent || '' })}
              className="text-3xl font-bold outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
              style={{ color: theme.textColor, fontFamily: theme.headingFont }}
            >{name}</h1>
          ) : (
            <h1 className="text-3xl font-bold" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{name}</h1>
          )}

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: theme.primaryColor }}>{price}</span>
            {oldPrice && <span className="text-lg line-through opacity-50" style={{ color: theme.secondaryColor }}>{oldPrice}</span>}
            {!inStock && <span className="text-sm text-red-500 font-medium">Out of Stock</span>}
          </div>

          {isEditing ? (
            <p
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ description: e.currentTarget.textContent || '' })}
              className="text-base leading-relaxed outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
              style={{ color: theme.secondaryColor }}
            >{description}</p>
          ) : (
            <p className="text-base leading-relaxed" style={{ color: theme.secondaryColor }}>{description}</p>
          )}

          {/* Variants */}
          {variants && variants.length > 0 && (
            <div className="space-y-4">
              {variants.map((v, i) => (
                <div key={i}>
                  <label className="text-sm font-medium mb-2 block" style={{ color: theme.textColor }}>{v.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt, j) => (
                      <button
                        key={j}
                        onClick={() => setSelectedVariants(prev => ({ ...prev, [v.label]: opt }))}
                        className={`px-4 py-2 rounded-lg text-sm border-2 transition-colors ${selectedVariants[v.label] === opt ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                        style={{ borderRadius: theme.borderRadius }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderRadius: theme.borderRadius }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-gray-50 text-lg">−</button>
              <span className="px-4 py-2 text-sm font-medium border-x">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-gray-50 text-lg">+</button>
            </div>
            <button
              className="flex-1 py-3 rounded-lg font-medium text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
              disabled={!inStock}
            >🛒 Add to Cart</button>
          </div>

          {/* Features list */}
          {features && features.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: theme.textColor }}>Features</h4>
              <ul className="space-y-1.5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: theme.secondaryColor }}>
                    <span style={{ color: theme.primaryColor }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
