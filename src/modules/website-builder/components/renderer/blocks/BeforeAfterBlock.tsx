import React, { useState, useRef, useCallback } from 'react';
import { SiteTheme } from '../../../types';

interface BeforeAfterBlockProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  height?: number;
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function BeforeAfterBlock({ beforeImage, afterImage, beforeLabel = 'Before', afterLabel = 'After', height = 400, bgColor, theme, isEditing, onUpdate, style }: BeforeAfterBlockProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => handleMove(e.clientX), [handleMove]);
  const handleTouchMove = useCallback((e: React.TouchEvent) => handleMove(e.touches[0].clientX), [handleMove]);

  const hasImages = beforeImage && afterImage;

  return (
    <section className="py-10 px-4 sm:px-6" style={{ backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-4xl mx-auto">
        <div
          ref={containerRef}
          className="relative rounded-xl overflow-hidden cursor-col-resize select-none touch-none"
          style={{ height: 'clamp(250px, 50vw, ' + height + 'px)', borderRadius: theme.borderRadius }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {hasImages ? (
            <>
              {/* After (full) */}
              <img src={afterImage} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover" />
              {/* Before (clipped) */}
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
                <img src={beforeImage} alt={beforeLabel} className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: containerRef.current?.offsetWidth }} />
              </div>
              {/* Slider line */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10" style={{ left: `${position}%` }}>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">⟺</span>
                </div>
              </div>
              {/* Labels */}
              <span className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-bold text-white bg-black/50">{beforeLabel}</span>
              <span className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold text-white bg-black/50">{afterLabel}</span>
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Before / After Slider</p>
                {isEditing && (
                  <div className="flex gap-2">
                    <button onClick={() => { const u = prompt('Before image URL:'); if (u) onUpdate?.({ beforeImage: u }); }} className="text-xs text-primary hover:underline">Set Before</button>
                    <button onClick={() => { const u = prompt('After image URL:'); if (u) onUpdate?.({ afterImage: u }); }} className="text-xs text-primary hover:underline">Set After</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
