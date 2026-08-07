import React from 'react';
import { SiteTheme } from '../../../types';

interface AudioPlayerBlockProps {
  src: string;
  title?: string;
  artist?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function AudioPlayerBlock({ src, title, artist, theme, isEditing, onUpdate, style }: AudioPlayerBlockProps) {
  return (
    <section className="py-6 px-6" style={style}>
      <div className="max-w-lg mx-auto p-4 rounded-xl border" style={{ borderRadius: theme.borderRadius }}>
        {(title || artist) && (
          <div className="mb-3">
            {title && <p className="font-semibold text-sm" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</p>}
            {artist && <p className="text-xs opacity-60" style={{ color: theme.secondaryColor }}>{artist}</p>}
          </div>
        )}
        <audio controls className="w-full" src={src || undefined}>
          Your browser does not support the audio element.
        </audio>
        {isEditing && !src && (
          <button
            onClick={() => { const u = prompt('Audio URL:'); if (u) onUpdate?.({ src: u }); }}
            className="mt-2 text-xs text-primary hover:underline"
          >Set audio URL</button>
        )}
      </div>
    </section>
  );
}
