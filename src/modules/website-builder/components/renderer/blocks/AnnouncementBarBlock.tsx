import React from 'react';
import { SiteTheme } from '../../../types';

interface AnnouncementBarBlockProps {
  text: string;
  linkText?: string;
  linkUrl?: string;
  dismissible?: boolean;
  variant?: 'primary' | 'accent' | 'dark';
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function AnnouncementBarBlock({ text, linkText, linkUrl, dismissible = true, variant = 'primary', bgColor, theme, isEditing, onUpdate, style }: AnnouncementBarBlockProps) {
  const variantBg = variant === 'dark' ? '#1e293b' : variant === 'accent' ? theme.accentColor : theme.primaryColor;

  return (
    <section className="relative" style={style}>
      <div className="py-2.5 px-4 text-center text-sm font-medium text-white" style={{ backgroundColor: bgColor || variantBg }}>
        {isEditing ? (
          <span
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ text: e.currentTarget.textContent || '' })}
            className="outline-none"
          >{text}</span>
        ) : (
          <span>{text}</span>
        )}
        {linkText && (
          <a href={isEditing ? undefined : linkUrl} className="underline ml-2 hover:opacity-80">{linkText}</a>
        )}
        {dismissible && !isEditing && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">✕</button>
        )}
      </div>
    </section>
  );
}
