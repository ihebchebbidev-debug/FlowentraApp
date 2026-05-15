/**
 * LTR / RTL direction toggle.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface DirectionToggleProps {
  value: 'ltr' | 'rtl';
  onChange: (value: 'ltr' | 'rtl') => void;
}

export function DirectionToggle({ value, onChange }: DirectionToggleProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-foreground/70">Text Direction</Label>
      <div className="flex gap-1">
        <Button
          variant={value === 'ltr' ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={() => onChange('ltr')}
        >
          LTR ←→
        </Button>
        <Button
          variant={value === 'rtl' ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={() => onChange('rtl')}
        >
          RTL →←
        </Button>
      </div>
    </div>
  );
}
