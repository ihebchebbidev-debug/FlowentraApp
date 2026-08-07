import React from 'react';
import { SiteTheme } from '../../../types';
import { sanitizeHtml } from '@/utils/sanitize';

interface CustomHtmlBlockProps {
  html: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function CustomHtmlBlock({ html, theme, isEditing, onUpdate, style }: CustomHtmlBlockProps) {
  return (
    <section className="py-4 px-6" style={style}>
      <div className="max-w-5xl mx-auto">
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded bg-gray-100 font-mono">&lt;/&gt;</span>
              <span>Custom HTML</span>
            </div>
            <textarea
              value={html}
              onChange={(e) => onUpdate?.({ html: e.target.value })}
              className="w-full p-3 bg-gray-900 text-green-400 font-mono text-xs rounded-lg min-h-[120px] resize-y outline-none"
              style={{ borderRadius: theme.borderRadius }}
              spellCheck={false}
            />
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
        )}
      </div>
    </section>
  );
}
