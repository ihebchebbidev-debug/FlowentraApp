import React from 'react';
import { SiteTheme } from '../../../types';

interface RatingBlockProps {
  rating: number;
  maxRating?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function RatingBlock({ rating, maxRating = 5, label, size = 'md', theme, style }: RatingBlockProps) {
  const starSize = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }[size];

  return (
    <section className="py-4 px-6" style={style}>
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <div className={`flex gap-0.5 ${starSize}`}>
          {Array.from({ length: maxRating }).map((_, i) => (
            <span key={i} style={{ color: i < rating ? theme.accentColor : '#d1d5db' }}>★</span>
          ))}
        </div>
        {label && <span className="text-sm" style={{ color: theme.secondaryColor, fontFamily: theme.bodyFont }}>{label}</span>}
      </div>
    </section>
  );
}
