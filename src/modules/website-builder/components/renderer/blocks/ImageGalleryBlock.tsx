import React from 'react';
import { SiteTheme } from '../../../types';

interface ImageGalleryBlockProps {
  images: string[];
  columns?: number;
  gap?: number;
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function ImageGalleryBlock({ images, columns = 3, gap = 8, theme, style }: ImageGalleryBlockProps) {
  // Build responsive grid classes instead of hardcoded inline columns
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
  }[columns] || 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3';

  return (
    <section className="py-8 px-6" style={style}>
      <div className={`max-w-5xl mx-auto grid ${colClass}`} style={{ gap }}>
        {images.length > 0 ? (
          images.map((img, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted" style={{ borderRadius: theme.borderRadius }}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted flex items-center justify-center" style={{ borderRadius: theme.borderRadius }}>
              <span className="text-muted-foreground text-xs">Image {i + 1}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
