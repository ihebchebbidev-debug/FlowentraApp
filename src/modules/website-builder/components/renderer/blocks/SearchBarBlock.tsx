import React from 'react';
import { SiteTheme } from '../../../types';

interface SearchBarBlockProps {
  placeholder?: string;
  buttonText?: string;
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function SearchBarBlock({ placeholder = 'Search...', buttonText = 'Search', theme, style }: SearchBarBlockProps) {
  return (
    <section className="py-6 px-6" style={style}>
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            className="flex-1 px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
            style={{ borderRadius: theme.borderRadius, fontFamily: theme.bodyFont }}
          />
          <button
            className="px-6 py-2.5 rounded-lg font-medium text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius, fontFamily: theme.bodyFont }}
          >{buttonText}</button>
        </div>
      </div>
    </section>
  );
}
