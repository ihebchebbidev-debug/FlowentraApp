import React from 'react';
import { SiteTheme } from '../../../types';

interface CookieConsentBlockProps {
  text: string;
  buttonText?: string;
  learnMoreText?: string;
  learnMoreUrl?: string;
  position?: 'bottom' | 'top';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function CookieConsentBlock({ text, buttonText = 'Accept All', learnMoreText = 'Learn More', learnMoreUrl = '#', position = 'bottom', theme, isEditing, onUpdate, style }: CookieConsentBlockProps) {
  return (
    <section className="py-4 px-6" style={style}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border shadow-lg" style={{ borderRadius: theme.borderRadius, backgroundColor: theme.backgroundColor }}>
          <p className="text-sm flex-1" style={{ color: theme.textColor, fontFamily: theme.bodyFont }}>
            {isEditing ? (
              <span
                contentEditable suppressContentEditableWarning
                onBlur={(e) => onUpdate?.({ text: e.currentTarget.textContent || '' })}
                className="outline-none"
              >{text}</span>
            ) : text}
          </p>
          <div className="flex gap-2 shrink-0">
            <a href={learnMoreUrl} className="px-4 py-2 rounded-lg text-xs font-medium border" style={{ borderRadius: theme.borderRadius, color: theme.textColor }}>{learnMoreText}</a>
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>{buttonText}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
