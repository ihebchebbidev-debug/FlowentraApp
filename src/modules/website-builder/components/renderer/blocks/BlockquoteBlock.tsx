import React from 'react';
import { SiteTheme } from '../../../types';

interface BlockquoteBlockProps {
  quote: string;
  author?: string;
  source?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function BlockquoteBlock({ quote, author, source, theme, isEditing, onUpdate, style }: BlockquoteBlockProps) {
  return (
    <section className="py-8 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-3xl mx-auto">
        <blockquote className="border-l-4 pl-6 py-2" style={{ borderColor: theme.primaryColor }}>
          {isEditing ? (
            <p
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ quote: e.currentTarget.textContent || '' })}
              className="text-xl italic leading-relaxed outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
              style={{ color: theme.textColor, fontFamily: theme.headingFont }}
            >{quote}</p>
          ) : (
            <p className="text-xl italic leading-relaxed" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{quote}</p>
          )}
          <footer className="mt-3 text-sm flex items-center gap-1" style={{ color: theme.secondaryColor }}>
            {isEditing ? (
              <>
                <span>—</span>
                <span
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ author: e.currentTarget.textContent || '' })}
                  className="font-medium outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                >{author || 'Author'}</span>
                {(source || isEditing) && (
                  <>
                    <span>,</span>
                    <cite
                      contentEditable suppressContentEditableWarning
                      onBlur={(e) => onUpdate?.({ source: e.currentTarget.textContent || '' })}
                      className="opacity-75 outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                    >{source || 'Source'}</cite>
                  </>
                )}
              </>
            ) : (
              <>
                {author && <span className="font-medium">— {author}</span>}
                {source && <cite className="ml-1 opacity-75">, {source}</cite>}
              </>
            )}
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
