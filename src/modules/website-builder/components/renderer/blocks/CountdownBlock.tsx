import React from 'react';
import { SiteTheme } from '../../../types';

interface CountdownBlockProps {
  title?: string;
  targetDate: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function CountdownBlock({ title, targetDate, theme, isEditing, onUpdate, style }: CountdownBlockProps) {
  const target = new Date(targetDate || Date.now() + 7 * 86400000);
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const units = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: seconds, label: 'Seconds' },
  ];

  return (
    <section className="py-16 px-6 text-center" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-3xl mx-auto">
        {(title || isEditing) && (
          isEditing ? (
            <h2
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="text-3xl font-bold mb-4 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: theme.textColor, fontFamily: theme.headingFont }}
            >{title || 'Add title...'}</h2>
          ) : title ? (
            <h2 className="text-3xl font-bold mb-8" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h2>
          ) : null
        )}
        {isEditing && (
          <div className="mb-6">
            <label className="text-xs text-muted-foreground mr-2">Target Date:</label>
            <input
              type="datetime-local"
              value={targetDate ? targetDate.slice(0, 16) : ''}
              onChange={(e) => onUpdate?.({ targetDate: new Date(e.target.value).toISOString() })}
              className="px-3 py-1.5 text-xs border rounded-lg bg-background outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        )}
        <div className="flex justify-center gap-3 sm:gap-4 md:gap-8">
          {units.map((u, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold"
                style={{ backgroundColor: theme.primaryColor + '12', color: theme.primaryColor, borderRadius: theme.borderRadius }}>
                {u.value}
              </div>
              <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 opacity-60" style={{ color: theme.secondaryColor }}>{u.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
