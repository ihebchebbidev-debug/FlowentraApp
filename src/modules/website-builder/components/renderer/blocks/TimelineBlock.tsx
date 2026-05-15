import React from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';

interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

interface TimelineBlockProps {
  title?: string;
  items: TimelineItem[];
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function TimelineBlock({ title, items, bgColor, theme, isEditing, onUpdate, style }: TimelineBlockProps) {
  const updateItem = (index: number, field: keyof TimelineItem, value: string) => {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onUpdate?.({ items: updated });
  };

  const addItem = () => {
    onUpdate?.({ items: [...items, { date: '2025', title: 'New Event', description: 'Describe this milestone.' }] });
  };

  const removeItem = (index: number) => {
    onUpdate?.({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <section className="py-16 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-3xl mx-auto">
        {title && (
          isEditing ? (
            <h2
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="text-3xl font-bold text-center mb-12 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: theme.textColor, fontFamily: theme.headingFont }}
            >{title}</h2>
          ) : (
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h2>
          )
        )}
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ backgroundColor: theme.primaryColor + '30' }} />
          <div className="space-y-8">
            {items.map((item, i) => (
              <div key={i} className="relative pl-12 group/tl">
                {isEditing && (
                  <button onClick={() => removeItem(i)} className="absolute top-0 right-0 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/tl:opacity-100 transition-opacity hover:bg-destructive/20">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
                <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full border-2" style={{ borderColor: theme.primaryColor, backgroundColor: theme.backgroundColor }} />
                {isEditing ? (
                  <span
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateItem(i, 'date', e.currentTarget.textContent || '')}
                    className="text-xs font-medium uppercase tracking-wider outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                    style={{ color: theme.primaryColor }}
                  >{item.date}</span>
                ) : (
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.primaryColor }}>{item.date}</span>
                )}
                {isEditing ? (
                  <h3
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateItem(i, 'title', e.currentTarget.textContent || '')}
                    className="text-lg font-semibold mt-1 outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                    style={{ color: theme.textColor }}
                  >{item.title}</h3>
                ) : (
                  <h3 className="text-lg font-semibold mt-1" style={{ color: theme.textColor }}>{item.title}</h3>
                )}
                {isEditing ? (
                  <p
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateItem(i, 'description', e.currentTarget.innerHTML)}
                    className="text-sm opacity-70 mt-1 outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                    style={{ color: theme.secondaryColor }}
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                ) : (
                  <p className="text-sm opacity-70 mt-1" style={{ color: theme.secondaryColor }} dangerouslySetInnerHTML={{ __html: item.description }} />
                )}
              </div>
            ))}
          </div>
        </div>
        {isEditing && (
          <div className="text-center mt-6">
            <button onClick={addItem} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add Event
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
