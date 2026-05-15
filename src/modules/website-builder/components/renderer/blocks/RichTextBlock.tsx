import React from 'react';
import { SiteTheme } from '../../../types';
import { sanitizeHtml } from '@/utils/sanitize';

interface RichTextBlockProps {
  content: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function RichTextBlock({ content, theme, isEditing, onUpdate, style }: RichTextBlockProps) {
  if (isEditing) {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onUpdate?.({ content: e.currentTarget.innerHTML })}
        className="py-6 px-6 prose prose-sm max-w-none outline-none focus:ring-1 focus:ring-primary/30 rounded min-h-[60px]"
        style={{ fontFamily: theme.bodyFont, color: theme.textColor, ...style }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  return (
    <div
      className="py-6 px-6 prose prose-sm max-w-none"
      style={{ fontFamily: theme.bodyFont, color: theme.textColor, ...style }}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}
