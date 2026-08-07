import React from 'react';
import { SiteTheme } from '../../../types';

interface GalleryMasonryBlockProps {
  images: Array<{ url: string; caption?: string }>;
  columns?: number;
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function GalleryMasonryBlock({ images, columns = 3, theme, style }: GalleryMasonryBlockProps) {
  // On mobile, always 1 column; on sm 2 columns; on md+ use requested columns
  const effectiveCols = columns;
  const cols: Array<Array<{ url: string; caption?: string }>> = Array.from({ length: effectiveCols }, () => []);
  images.forEach((img, i) => cols[i % effectiveCols].push(img));

  // Build responsive grid classes
  const gridClass = effectiveCols <= 2
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4';

  return (
    <section className="py-12 px-6" style={style}>
      <div className={`max-w-5xl mx-auto ${gridClass}`}>
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-4">
            {col.map((img, i) => (
              <div key={i} className="rounded-lg overflow-hidden group relative" style={{ borderRadius: theme.borderRadius }}>
                <img src={img.url} alt={img.caption || ''} className="w-full object-cover" />
                {img.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-lg flex items-center justify-center" style={{ height: 120 + (i % 3) * 40, borderRadius: theme.borderRadius }}>
                  <span className="text-xs text-muted-foreground">Image {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
