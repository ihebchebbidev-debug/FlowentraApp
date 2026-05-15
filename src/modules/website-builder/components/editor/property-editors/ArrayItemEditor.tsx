/**
 * Generic array item editor — handles lists of structured items (features, testimonials, etc.).
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { RichTextInput } from '../RichTextInput';

interface ArrayItemEditorProps {
  label: string;
  items: Record<string, any>[];
  fields: { key: string; label: string; type?: 'text' | 'textarea' | 'color' | 'number' }[];
  onChange: (items: Record<string, any>[]) => void;
  defaultItem: Record<string, any>;
  maxItems?: number;
}

export function ArrayItemEditor({ label, items, fields, onChange, defaultItem, maxItems = 20 }: ArrayItemEditorProps) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const updateItem = (index: number, field: string, value: any) => {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onChange(updated);
  };

  const addItem = () => {
    if (items.length >= maxItems) return;
    onChange([...items, { ...defaultItem }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-medium text-foreground/70">{label}</Label>
        <span className="text-[10px] text-muted-foreground/40 tabular-nums">{items.length} items</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border/30 bg-muted/10 overflow-hidden">
          <div
            className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setCollapsed(prev => ({ ...prev, [i]: !prev[i] }))}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {collapsed[i] ? <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
              <span className="text-[10px] font-medium truncate max-w-[140px] text-foreground/60">
                {item[fields[0]?.key] || `Item ${i + 1}`}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/50 hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeItem(i); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {!collapsed[i] && (
            <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-border/20">
              {fields.map(field => (
                <div key={field.key} className="space-y-0.5 pt-1.5">
                  <Label className="text-[10px] text-muted-foreground/60">{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <RichTextInput
                      value={item[field.key] || ''}
                      onChange={(html) => updateItem(i, field.key, html)}
                      placeholder={`Enter ${field.label}`}
                      minHeight={40}
                    />
                  ) : field.type === 'color' ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={item[field.key] || '#000000'}
                        onChange={(e) => updateItem(i, field.key, e.target.value)}
                        className="w-6 h-6 rounded-md border border-border/30 cursor-pointer"
                      />
                      <Input
                        value={item[field.key] || ''}
                        onChange={(e) => updateItem(i, field.key, e.target.value)}
                        className="h-6 text-[10px] font-mono flex-1 border-border/30 bg-background"
                      />
                    </div>
                  ) : field.type === 'number' ? (
                    <Input
                      type="number"
                      value={item[field.key] || 0}
                      onChange={(e) => updateItem(i, field.key, Number(e.target.value))}
                      className="h-7 text-xs border-border/30 bg-background"
                    />
                  ) : (
                    <Input
                      value={item[field.key] || ''}
                      onChange={(e) => updateItem(i, field.key, e.target.value)}
                      className="h-7 text-xs border-border/30 bg-background"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {items.length < maxItems && (
        <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashed border-border/40 text-muted-foreground" onClick={addItem}>
          <Plus className="h-3 w-3 mr-1" /> Add {label.replace(/s$/, '')}
        </Button>
      )}
    </div>
  );
}
