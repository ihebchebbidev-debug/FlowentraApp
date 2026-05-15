/**
 * CTA / Button list editor — manage multiple buttons with text, link, variant, and colors.
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export interface CTAButton {
  text: string;
  link: string;
  color?: string;
  textColor?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

interface ButtonListEditorProps {
  label: string;
  buttons: CTAButton[];
  onChange: (buttons: CTAButton[]) => void;
  maxButtons?: number;
}

export function ButtonListEditor({ label, buttons, onChange, maxButtons = 4 }: ButtonListEditorProps) {
  const updateButton = (index: number, field: keyof CTAButton, value: string) => {
    const updated = buttons.map((b, i) => i === index ? { ...b, [field]: value } : b);
    onChange(updated);
  };

  const addButton = () => {
    if (buttons.length >= maxButtons) return;
    onChange([...buttons, { text: 'Button', link: '#', variant: 'primary' }]);
  };

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-medium text-foreground/70">{label}</Label>
      {buttons.map((btn, i) => (
        <div key={i} className="p-2.5 rounded-lg border border-border/30 bg-muted/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground/60">Button {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/60 hover:text-destructive" onClick={() => removeButton(i)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Input
            value={btn.text}
            onChange={(e) => updateButton(i, 'text', e.target.value)}
            className="h-7 text-xs border-border/30 bg-background"
            placeholder="Button text"
          />
          <Input
            value={btn.link}
            onChange={(e) => updateButton(i, 'link', e.target.value)}
            className="h-7 text-xs border-border/30 bg-background"
            placeholder="Link URL"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <Select value={btn.variant || 'primary'} onValueChange={(v) => updateButton(i, 'variant', v)}>
              <SelectTrigger className="h-7 text-[10px] border-border/30 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary" className="text-xs">Primary</SelectItem>
                <SelectItem value="secondary" className="text-xs">Secondary</SelectItem>
                <SelectItem value="outline" className="text-xs">Outline</SelectItem>
                <SelectItem value="ghost" className="text-xs">Ghost</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={btn.color || '#3b82f6'}
                onChange={(e) => updateButton(i, 'color', e.target.value)}
                className="w-7 h-7 rounded-md border border-border/30 cursor-pointer"
              />
              <input
                type="color"
                value={btn.textColor || '#ffffff'}
                onChange={(e) => updateButton(i, 'textColor', e.target.value)}
                className="w-7 h-7 rounded-md border border-border/30 cursor-pointer"
                title="Text color"
              />
            </div>
          </div>
        </div>
      ))}
      {buttons.length < maxButtons && (
        <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashed border-border/40 text-muted-foreground" onClick={addButton}>
          <Plus className="h-3 w-3 mr-1" /> Add Button
        </Button>
      )}
    </div>
  );
}
