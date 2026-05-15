import React from 'react';
import { SiteTheme } from '../../../types';

interface ParallaxBlockProps {
  imageUrl: string;
  heading?: string;
  subheading?: string;
  height?: 'small' | 'medium' | 'large';
  overlayOpacity?: number;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ParallaxBlock({ imageUrl, heading, subheading, height = 'medium', overlayOpacity = 40, theme, isEditing, onUpdate, style }: ParallaxBlockProps) {
  const heightClass = { small: 'min-h-[300px]', medium: 'min-h-[500px]', large: 'min-h-[700px]' }[height];

  return (
    <section
      className={`relative ${heightClass} flex items-center justify-center`}
      style={{
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundColor: imageUrl ? undefined : '#1e293b',
        ...style,
      }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }} />
      <div className="relative z-10 text-center max-w-3xl px-6">
        {heading && (
          isEditing ? (
            <h2
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ heading: e.currentTarget.textContent || '' })}
              className="text-3xl md:text-5xl font-bold text-white mb-4 outline-none"
              style={{ fontFamily: theme.headingFont }}
            >{heading}</h2>
          ) : (
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: theme.headingFont }}>{heading}</h2>
          )
        )}
        {subheading && <p className="text-lg text-white/80" style={{ fontFamily: theme.bodyFont }}>{subheading}</p>}
      </div>
      {isEditing && (
        <button
          onClick={() => { const u = prompt('Image URL:', imageUrl); if (u !== null) onUpdate?.({ imageUrl: u }); }}
          className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/60 text-white hover:bg-black/80"
        >{imageUrl ? 'Change Image' : 'Add Image'}</button>
      )}
    </section>
  );
}
