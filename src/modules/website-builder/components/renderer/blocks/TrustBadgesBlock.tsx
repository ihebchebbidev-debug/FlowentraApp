import React from 'react';
import { SiteTheme } from '../../../types';
import { DynamicIcon } from '../../editor/IconPicker';

interface TrustBadgesBlockProps {
  title?: string;
  badges: Array<{ icon: string; label: string }>;
  bgColor?: string;
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function TrustBadgesBlock({ title, badges, bgColor, theme, style }: TrustBadgesBlockProps) {
  return (
    <section className="py-8 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-4xl mx-auto text-center">
        {title && <p className="text-sm font-medium mb-4" style={{ color: theme.secondaryColor }}>{title}</p>}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border min-h-[44px]" style={{ borderRadius: theme.borderRadius }}>
              <DynamicIcon name={b.icon} className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium" style={{ color: theme.textColor }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
