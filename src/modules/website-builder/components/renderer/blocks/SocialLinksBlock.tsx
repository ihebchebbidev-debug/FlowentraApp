import React from 'react';
import { SiteTheme } from '../../../types';
import { DynamicIcon } from '../../editor/IconPicker';

interface SocialLinksBlockProps {
  title?: string;
  links: Array<{ platform: string; url: string }>;
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function SocialLinksBlock({ title, links, bgColor, theme, isEditing, onUpdate, style }: SocialLinksBlockProps) {
  return (
    <section className="py-12 px-6 text-center" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-3xl mx-auto">
        {title && (
          isEditing ? (
            <h3
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="text-xl font-semibold mb-6 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: theme.textColor, fontFamily: theme.headingFont }}
            >{title}</h3>
          ) : (
            <h3 className="text-xl font-semibold mb-6" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>
          )
        )}
        <div className="flex flex-wrap justify-center gap-4">
          {links.map((link, i) => (
            <a
              key={i}
              href={isEditing ? undefined : link.url}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: theme.primaryColor + '15', color: theme.primaryColor }}
              title={link.platform}
            >
              <DynamicIcon name={link.platform} className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
