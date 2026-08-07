import React from 'react';
import { SiteTheme } from '../../../types';

interface ListBlockProps {
  items: string[];
  ordered?: boolean;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ListBlock({ items, ordered = false, theme, isEditing, onUpdate, style }: ListBlockProps) {
  const Tag = ordered ? 'ol' : 'ul';
  const listStyle = ordered ? 'list-decimal' : 'list-disc';

  return (
    <section className="py-4 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-4xl mx-auto">
        <Tag className={`${listStyle} pl-6 space-y-2`}>
          {items.map((item, i) => (
            <li key={i} className="text-base" style={{ color: theme.textColor }}>
              {isEditing ? (
                <span
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => {
                    const updated = [...items];
                    updated[i] = e.currentTarget.textContent || '';
                    onUpdate?.({ items: updated });
                  }}
                  className="outline-none focus:ring-1 focus:ring-primary/50 rounded px-0.5"
                >{item}</span>
              ) : (
                <span>{item}</span>
              )}
            </li>
          ))}
        </Tag>
        {isEditing && (
          <button
            onClick={() => onUpdate?.({ items: [...items, 'New item'] })}
            className="mt-2 text-xs text-primary hover:underline"
          >+ Add item</button>
        )}
      </div>
    </section>
  );
}
