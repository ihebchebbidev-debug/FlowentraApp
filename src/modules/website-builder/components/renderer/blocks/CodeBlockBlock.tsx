import React from 'react';
import { SiteTheme } from '../../../types';

interface CodeBlockBlockProps {
  code: string;
  language?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function CodeBlockBlock({ code, language = 'javascript', theme, isEditing, onUpdate, style }: CodeBlockBlockProps) {
  return (
    <section className="py-6 px-6" style={style}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg overflow-hidden border" style={{ borderRadius: theme.borderRadius }}>
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-xs">
            <span>{language}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="hover:text-white transition-colors"
            >Copy</button>
          </div>
          {isEditing ? (
            <textarea
              value={code}
              onChange={(e) => onUpdate?.({ code: e.target.value })}
              className="w-full p-4 bg-gray-900 text-green-400 font-mono text-sm resize-y min-h-[120px] outline-none"
              spellCheck={false}
            />
          ) : (
            <pre className="p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-x-auto">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}
