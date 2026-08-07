import React from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';

interface ProgressItem {
  label: string;
  value: number;
}

interface ProgressBlockProps {
  title?: string;
  items: ProgressItem[];
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ProgressBlock({ title, items, theme, isEditing, onUpdate, style }: ProgressBlockProps) {
  const updateItem = (index: number, field: keyof ProgressItem, value: string | number) => {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onUpdate?.({ items: updated });
  };

  const addItem = () => {
    onUpdate?.({ items: [...items, { label: 'New Skill', value: 50 }] });
  };

  const removeItem = (index: number) => {
    onUpdate?.({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-3xl mx-auto">
        {title && (
          isEditing ? (
            <h2
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="text-2xl font-bold mb-8 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: theme.textColor, fontFamily: theme.headingFont }}
            >{title}</h2>
          ) : (
            <h2 className="text-2xl font-bold mb-8" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h2>
          )
        )}
        <div className="space-y-5">
          {items.map((item, i) => (
            <div key={i} className="group/prog">
              <div className="flex justify-between mb-1.5 items-center">
                {isEditing ? (
                  <span
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateItem(i, 'label', e.currentTarget.textContent || '')}
                    className="text-sm font-medium outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                    style={{ color: theme.textColor }}
                  >{item.label}</span>
                ) : (
                  <span className="text-sm font-medium" style={{ color: theme.textColor }}>{item.label}</span>
                )}
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.value}
                      onChange={(e) => updateItem(i, 'value', Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-14 text-sm font-medium text-right bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                      style={{ color: theme.primaryColor }}
                    />
                  ) : (
                    <span className="text-sm font-medium" style={{ color: theme.primaryColor }}>{item.value}%</span>
                  )}
                  {isEditing && (
                    <button onClick={() => removeItem(i)} className="p-0.5 rounded text-destructive opacity-0 group-hover/prog:opacity-100 transition-opacity">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: theme.primaryColor + '15' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, item.value))}%`, backgroundColor: theme.primaryColor }}
                />
              </div>
            </div>
          ))}
        </div>
        {isEditing && (
          <div className="text-center mt-4">
            <button onClick={addItem} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add Bar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
