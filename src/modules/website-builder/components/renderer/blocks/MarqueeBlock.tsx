import React from 'react';
import { SiteTheme } from '../../../types';

interface MarqueeBlockProps {
  text: string;
  speed?: number;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function MarqueeBlock({ text, speed = 30, theme, isEditing, onUpdate, style }: MarqueeBlockProps) {
  return (
    <section className="py-4 overflow-hidden" style={{ backgroundColor: theme.primaryColor, ...style }}>
      <div className={isEditing ? '' : 'animate-marquee whitespace-nowrap'} style={!isEditing ? { animation: `marquee ${speed}s linear infinite` } : undefined}>
        {isEditing ? (
          <p
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ text: e.currentTarget.textContent || '' })}
            className="text-sm font-medium text-white px-6 outline-none focus:ring-1 focus:ring-white/30 rounded"
            style={{ fontFamily: theme.bodyFont }}
          >{text}</p>
        ) : (
          <p className="text-sm font-medium text-white inline-block" style={{ fontFamily: theme.bodyFont }}>
            {text} &nbsp;&nbsp;&nbsp; {text} &nbsp;&nbsp;&nbsp; {text}
          </p>
        )}
      </div>
      <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }`}</style>
    </section>
  );
}
