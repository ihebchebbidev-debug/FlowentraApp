import React from 'react';
import { SiteTheme } from '../../../types';

interface BackgroundVideoBlockProps {
  videoUrl: string;
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
  height?: 'medium' | 'large' | 'fullscreen';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function BackgroundVideoBlock({ videoUrl, heading, subheading, ctaText, ctaLink, overlayOpacity = 50, height = 'medium', theme, isEditing, onUpdate, style }: BackgroundVideoBlockProps) {
  const heightClass = { medium: 'min-h-[500px]', large: 'min-h-[700px]', fullscreen: 'min-h-screen' }[height];

  return (
    <section className={`relative ${heightClass} flex items-center justify-center overflow-hidden`} style={style}>
      {videoUrl ? (
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
      )}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }} />
      <div className="relative z-10 text-center max-w-3xl px-6">
        {heading && (
          isEditing ? (
            <h2
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ heading: e.currentTarget.textContent || '' })}
              className="text-4xl md:text-5xl font-bold text-white mb-4 outline-none"
              style={{ fontFamily: theme.headingFont }}
            >{heading}</h2>
          ) : (
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: theme.headingFont }}>{heading}</h2>
          )
        )}
        {subheading && <p className="text-lg text-white/80 mb-6" style={{ fontFamily: theme.bodyFont }}>{subheading}</p>}
        {ctaText && (
          <a href={isEditing ? undefined : ctaLink} className="inline-block px-8 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>
            {ctaText}
          </a>
        )}
      </div>
      {isEditing && (
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={() => { const u = prompt('Video URL:', videoUrl); if (u !== null) onUpdate?.({ videoUrl: u }); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black/60 text-white hover:bg-black/80"
          >{videoUrl ? 'Change Video' : 'Add Video URL'}</button>
        </div>
      )}
    </section>
  );
}
