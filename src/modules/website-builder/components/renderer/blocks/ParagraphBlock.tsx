import React from 'react';
import { SiteTheme } from '../../../types';

interface ParagraphBlockProps {
  text: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  font?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ParagraphBlock({ text, alignment = 'left', color, font, fontSize = 'base', theme, isEditing, onUpdate, style }: ParagraphBlockProps) {
  const dir = theme.direction || 'ltr';
  const align = { left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify' }[alignment];
  const sizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl' }[fontSize] || 'text-base';
  const pColor = color || theme.secondaryColor;
  const pFont = font || theme.bodyFont;

  return (
    <section dir={dir} className={`py-3 px-6 ${align}`} style={{ fontFamily: pFont, ...style }}>
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <p
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ text: e.currentTarget.textContent || '' })}
            className={`${sizeClass} leading-relaxed outline-none focus:ring-1 focus:ring-primary/50 rounded px-1`}
            style={{ color: pColor }}
          >{text}</p>
        ) : (
          <p className={`${sizeClass} leading-relaxed`} style={{ color: pColor }}>{text}</p>
        )}
      </div>
    </section>
  );
}
