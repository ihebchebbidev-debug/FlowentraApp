import React from 'react';
import { SiteTheme } from '../../../types';

interface CalloutBlockProps {
  title: string;
  text: string;
  variant?: 'info' | 'warning' | 'success' | 'error';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

const variantStyles = {
  info: { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'ℹ️', text: 'text-blue-900' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-300', icon: '⚠️', text: 'text-amber-900' },
  success: { bg: 'bg-green-50', border: 'border-green-300', icon: '✅', text: 'text-green-900' },
  error: { bg: 'bg-red-50', border: 'border-red-300', icon: '❌', text: 'text-red-900' },
};

export function CalloutBlock({ title, text, variant = 'info', theme, isEditing, onUpdate, style }: CalloutBlockProps) {
  const v = variantStyles[variant] || variantStyles.info;

  return (
    <section className="py-4 px-6" style={style}>
      <div className="max-w-4xl mx-auto">
        <div className={`${v.bg} ${v.border} border-l-4 rounded-r-lg p-4`} style={{ borderRadius: theme.borderRadius }}>
          <div className="flex gap-3">
            <span className="text-lg shrink-0">{v.icon}</span>
            <div>
              {isEditing ? (
                <h4
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
                  className={`font-semibold text-sm mb-1 ${v.text} outline-none focus:ring-1 focus:ring-primary/50 rounded px-0.5`}
                >{title}</h4>
              ) : (
                <h4 className={`font-semibold text-sm mb-1 ${v.text}`}>{title}</h4>
              )}
              {isEditing ? (
                <p
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ text: e.currentTarget.textContent || '' })}
                  className={`text-sm ${v.text} opacity-90 outline-none focus:ring-1 focus:ring-primary/50 rounded px-0.5`}
                >{text}</p>
              ) : (
                <p className={`text-sm ${v.text} opacity-90`}>{text}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
