import React from 'react';
import { SiteTheme } from '../../../types';

interface AvatarBlockProps {
  name: string;
  imageUrl?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function AvatarBlock({ name, imageUrl, subtitle, size = 'md', theme, style }: AvatarBlockProps) {
  const sizes = { sm: 'w-10 h-10 text-sm', md: 'w-16 h-16 text-lg', lg: 'w-24 h-24 text-2xl' };
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <section className="py-4 px-6" style={style}>
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <div
          className={`${sizes[size]} rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0`}
          style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <p className="font-semibold" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{name}</p>
          {subtitle && <p className="text-sm opacity-75" style={{ color: theme.secondaryColor }}>{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}
