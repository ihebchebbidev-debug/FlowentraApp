import React, { useState, useCallback } from 'react';
import { SiteTheme } from '../../../types';
import { useImageDrop } from '../../../hooks/useImageDrop';

interface LightboxGalleryBlockProps {
  title?: string;
  images: Array<{ url: string; caption?: string }>;
  columns?: number;
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function LightboxGalleryBlock({ title, images, columns = 3, bgColor, theme, isEditing, onUpdate, style }: LightboxGalleryBlockProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const handleAddImage = useCallback((dataUri: string) => {
    onUpdate?.({ images: [...images, { url: dataUri, caption: '' }] });
  }, [images, onUpdate]);

  const { isDragOver, dropProps } = useImageDrop(handleAddImage);

  return (
    <section className="py-12 px-6" style={{ backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-6xl mx-auto">
        {title && <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}

        {/* Use static responsive classes instead of dynamic grid-cols-${columns} */}
        <div
          className={`grid ${
            columns <= 2 ? 'grid-cols-1 sm:grid-cols-2' :
            columns <= 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          } gap-4 relative`}
          {...(isEditing ? dropProps : {})}
        >
          {isDragOver && isEditing && (
            <div className="absolute inset-0 z-20 bg-primary/10 border-2 border-dashed border-primary rounded-xl flex items-center justify-center backdrop-blur-sm">
              <p className="text-sm font-medium text-primary">Drop images here</p>
            </div>
          )}
          {images.map((img, i) => {
            // Make every 3rd image span 2 columns for visual interest
            const isWide = (i % 5 === 0 || i % 5 === 3) && columns >= 3;
            return (
              <div
                key={i}
                className={`group relative overflow-hidden cursor-pointer ${isWide ? 'md:col-span-2 aspect-[2/1]' : 'aspect-square'}`}
                style={{ borderRadius: theme.borderRadius + 4 }}
                onClick={() => !isEditing && setLightboxIdx(i)}
              >
                <img
                  src={img.url}
                  alt={img.caption || ''}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                {/* Caption + zoom icon on hover */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 transform scale-50 group-hover:scale-100 transition-transform duration-500">
                    <span className="text-white text-xl">🔍</span>
                  </div>
                </div>
                {img.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-sm font-medium text-white" style={{ fontFamily: theme.bodyFont }}>{img.caption}</p>
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdate?.({ images: images.filter((_, j) => j !== i) }); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                )}
              </div>
            );
          })}
          {images.length === 0 && (
            <div className="col-span-full aspect-video bg-muted rounded-lg flex items-center justify-center" style={{ borderRadius: theme.borderRadius }}>
              <div className="text-center space-y-2">
                <span className="text-3xl opacity-30">🖼️</span>
                <p className="text-xs text-muted-foreground">{isEditing ? 'Drag & drop images or add via properties' : 'No images'}</p>
              </div>
            </div>
          )}
        </div>

        {isEditing && (
          <button
            onClick={() => { const u = prompt('Image URL:'); if (u) onUpdate?.({ images: [...images, { url: u, caption: '' }] }); }}
            className="mt-3 text-xs text-primary hover:underline"
          >+ Add image URL</button>
        )}
      </div>

      {/* Lightbox modal */}
      {lightboxIdx !== null && images[lightboxIdx] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 text-white text-2xl hover:opacity-70" onClick={() => setLightboxIdx(null)}>✕</button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:opacity-70"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.max(0, lightboxIdx - 1)); }}
          >‹</button>
          <img
            src={images[lightboxIdx].url}
            alt={images[lightboxIdx].caption || ''}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:opacity-70"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.min(images.length - 1, lightboxIdx + 1)); }}
          >›</button>
          {images[lightboxIdx].caption && (
            <p className="absolute bottom-6 text-center text-white text-sm w-full">{images[lightboxIdx].caption}</p>
          )}
        </div>
      )}
    </section>
  );
}
