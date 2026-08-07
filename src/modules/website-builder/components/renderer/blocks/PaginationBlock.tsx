import React from 'react';
import { SiteTheme } from '../../../types';

interface PaginationBlockProps {
  totalPages?: number;
  currentPage?: number;
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function PaginationBlock({ totalPages = 5, currentPage = 1, theme, style }: PaginationBlockProps) {
  return (
    <section className="py-6 px-6" style={style}>
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-1">
        <button className="px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderRadius: theme.borderRadius, color: theme.secondaryColor }}>← Prev</button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`w-9 h-9 rounded-lg text-sm font-medium ${i + 1 === currentPage ? 'text-white' : 'border hover:bg-gray-50'}`}
            style={{
              borderRadius: theme.borderRadius,
              backgroundColor: i + 1 === currentPage ? theme.primaryColor : undefined,
              color: i + 1 === currentPage ? '#fff' : theme.textColor,
            }}
          >{i + 1}</button>
        ))}
        <button className="px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderRadius: theme.borderRadius, color: theme.secondaryColor }}>Next →</button>
      </div>
    </section>
  );
}
