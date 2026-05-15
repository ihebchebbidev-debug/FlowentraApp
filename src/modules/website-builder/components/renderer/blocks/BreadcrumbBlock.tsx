import React from 'react';
import { SiteTheme } from '../../../types';

interface BreadcrumbBlockProps {
  items: Array<{ label: string; href?: string }>;
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function BreadcrumbBlock({ items, theme, style }: BreadcrumbBlockProps) {
  return (
    <nav className="py-3 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="opacity-40" style={{ color: theme.secondaryColor }}>/</span>}
            {item.href && i < items.length - 1 ? (
              <a href={item.href} className="opacity-60 hover:opacity-100 transition-opacity" style={{ color: theme.primaryColor }}>{item.label}</a>
            ) : (
              <span className={i === items.length - 1 ? 'font-medium' : 'opacity-60'} style={{ color: theme.textColor }}>{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}
