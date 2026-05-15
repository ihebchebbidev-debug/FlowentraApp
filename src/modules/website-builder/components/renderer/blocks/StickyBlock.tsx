import React from 'react';
import { SiteTheme } from '../../../types';

interface StickyBlockProps {
  content: string;
  position?: 'top' | 'bottom';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function StickyBlock({ content, position = 'top', theme, isEditing, onUpdate, style }: StickyBlockProps) {
  return (
    <section
      className={`${isEditing ? 'relative' : 'sticky z-40'} ${position === 'top' ? 'top-0' : 'bottom-0'}`}
      style={style}
    >
      <div className="py-3 px-6 text-center text-sm font-medium" style={{ backgroundColor: theme.primaryColor, color: '#fff', fontFamily: theme.bodyFont }}>
        {isEditing ? (
          <span
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ content: e.currentTarget.textContent || '' })}
            className="outline-none"
          >{content}</span>
        ) : (
          <span>{content}</span>
        )}
      </div>
    </section>
  );
}
