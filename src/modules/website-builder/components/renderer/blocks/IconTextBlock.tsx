import React from 'react';
import { SiteTheme } from '../../../types';
import { DynamicIcon } from '../../editor/IconPicker';

interface IconTextBlockProps {
  items: Array<{ icon: string; title: string; description: string }>;
  layout?: 'horizontal' | 'vertical';
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function IconTextBlock({ items, layout = 'horizontal', bgColor, theme, isEditing, onUpdate, style }: IconTextBlockProps) {
  return (
    <section className="py-10 px-4 sm:px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-5xl mx-auto">
        <div className={layout === 'horizontal' ? 'space-y-6' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'}>
          {items.map((item, i) => (
            <div key={i} className={`flex gap-3 sm:gap-4 ${layout === 'vertical' ? 'flex-col items-center text-center' : 'items-start'}`}>
              <DynamicIcon name={item.icon} className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
              <div className="min-w-0">
                {isEditing ? (
                  <h4
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => {
                      const updated = [...items];
                      updated[i] = { ...updated[i], title: e.currentTarget.textContent || '' };
                      onUpdate?.({ items: updated });
                    }}
                    className="font-semibold text-sm sm:text-base mb-1 outline-none focus:ring-1 focus:ring-primary/50 rounded px-0.5"
                    style={{ color: theme.textColor, fontFamily: theme.headingFont }}
                  >{item.title}</h4>
                ) : (
                  <h4 className="font-semibold text-sm sm:text-base mb-1" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{item.title}</h4>
                )}
                <p className="text-xs sm:text-sm opacity-75" style={{ color: theme.secondaryColor }} dangerouslySetInnerHTML={{ __html: item.description }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
