import React from 'react';
import { SiteTheme } from '../../../types';

interface BannerBlockProps {
  text: string;
  linkText?: string;
  linkUrl?: string;
  variant?: 'info' | 'success' | 'warning' | 'promo';
  dismissible?: boolean;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

const variantColors: Record<string, { bg: string; text: string }> = {
  info: { bg: '#3b82f6', text: '#ffffff' },
  success: { bg: '#22c55e', text: '#ffffff' },
  warning: { bg: '#f59e0b', text: '#000000' },
  promo: { bg: '#8b5cf6', text: '#ffffff' },
};

export function BannerBlock({ text, linkText, linkUrl, variant = 'info', theme, isEditing, onUpdate, style }: BannerBlockProps) {
  const colors = variantColors[variant] || variantColors.info;

  return (
    <div className="py-3 px-6 text-center" style={{ backgroundColor: colors.bg, ...style }}>
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
        {isEditing ? (
          <span
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ text: e.currentTarget.textContent || '' })}
            className="text-sm font-medium outline-none focus:ring-1 focus:ring-white/30 rounded px-1"
            style={{ color: colors.text }}
          >{text}</span>
        ) : (
          <span className="text-sm font-medium" style={{ color: colors.text }}>{text}</span>
        )}
        {(linkText || isEditing) && (
          isEditing ? (
            <span
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ linkText: e.currentTarget.textContent || '' })}
              className="text-sm font-bold underline underline-offset-2 outline-none focus:ring-1 focus:ring-white/30 rounded px-0.5"
              style={{ color: colors.text }}
            >{linkText || 'Link Text'}</span>
          ) : linkText ? (
            <a href={linkUrl} className="text-sm font-bold underline underline-offset-2" style={{ color: colors.text }}>{linkText}</a>
          ) : null
        )}
      </div>
    </div>
  );
}
