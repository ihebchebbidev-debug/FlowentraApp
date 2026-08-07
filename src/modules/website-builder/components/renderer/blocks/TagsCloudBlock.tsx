import React from 'react';
import { SiteTheme } from '../../../types';

interface TagsCloudBlockProps {
  title?: string;
  tags: Array<{ label: string; href?: string; count?: number }>;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function TagsCloudBlock({ title, tags, theme, isEditing, onUpdate, style }: TagsCloudBlockProps) {
  return (
    <section className="py-8 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-3xl mx-auto">
        {title && <h3 className="text-lg font-bold mb-4" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <a
              key={i}
              href={isEditing ? undefined : tag.href || '#'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border hover:shadow-sm transition-shadow"
              style={{
                borderRadius: 999,
                color: theme.primaryColor,
                borderColor: theme.primaryColor + '30',
                backgroundColor: theme.primaryColor + '08',
                fontFamily: theme.bodyFont,
              }}
            >
              {tag.label}
              {tag.count !== undefined && (
                <span className="text-xs opacity-60">({tag.count})</span>
              )}
            </a>
          ))}
        </div>
        {isEditing && (
          <button
            onClick={() => onUpdate?.({ tags: [...tags, { label: 'New Tag', count: 0 }] })}
            className="mt-3 text-xs text-primary hover:underline"
          >+ Add tag</button>
        )}
      </div>
    </section>
  );
}
