import React from 'react';
import type { AnimationSettings, EntranceAnimation, HoverEffect, TransitionSpeed } from '../../types';
import { DEFAULT_ANIMATION } from '../../types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { EditorSection } from './PropertyEditors';
import { Sparkles } from 'lucide-react';

const ENTRANCE_OPTIONS: { value: EntranceAnimation; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'zoom-out', label: 'Zoom Out' },
  { value: 'flip', label: 'Flip' },
  { value: 'bounce', label: 'Bounce' },
];

const HOVER_OPTIONS: { value: HoverEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'lift', label: 'Lift (Shadow)' },
  { value: 'scale', label: 'Scale Up' },
  { value: 'glow', label: 'Glow' },
  { value: 'border-pop', label: 'Border Pop' },
  { value: 'tilt', label: 'Tilt 3D' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
];

const SPEED_OPTIONS: { value: TransitionSpeed; label: string }[] = [
  { value: 'slow', label: 'Slow (0.8s)' },
  { value: 'normal', label: 'Normal (0.4s)' },
  { value: 'fast', label: 'Fast (0.2s)' },
];

interface AnimationEditorProps {
  animation: AnimationSettings | undefined;
  onChange: (animation: AnimationSettings) => void;
}

export function AnimationEditor({ animation, onChange }: AnimationEditorProps) {
  const anim = { ...DEFAULT_ANIMATION, ...animation };

  const update = (patch: Partial<AnimationSettings>) => {
    onChange({ ...anim, ...patch });
  };

  const hasAnimation = anim.entrance !== 'none' || anim.hover !== 'none';

  return (
    <EditorSection
      title="Animation"
      defaultOpen={hasAnimation}
    >
      <div className="space-y-3">
        {/* Entrance */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-foreground/70">Entrance Effect</Label>
          <Select value={anim.entrance} onValueChange={(v) => update({ entrance: v as EntranceAnimation })}>
            <SelectTrigger className="h-8 text-xs border-border/40 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTRANCE_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hover */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-foreground/70">Hover Effect</Label>
          <Select value={anim.hover} onValueChange={(v) => update({ hover: v as HoverEffect })}>
            <SelectTrigger className="h-8 text-xs border-border/40 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOVER_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Speed */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-foreground/70">Speed</Label>
          <Select value={anim.speed} onValueChange={(v) => update({ speed: v as TransitionSpeed })}>
            <SelectTrigger className="h-8 text-xs border-border/40 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEED_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Delay */}
        {anim.entrance !== 'none' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-foreground/70">Delay</Label>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">{anim.delay}ms</span>
            </div>
            <Slider
              value={[anim.delay]}
              min={0}
              max={2000}
              step={50}
              onValueChange={([v]) => update({ delay: v })}
            />
          </div>
        )}

        {/* Stagger */}
        {anim.entrance !== 'none' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-foreground/70">Stagger (children)</Label>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">{anim.stagger}ms</span>
            </div>
            <Slider
              value={[anim.stagger]}
              min={0}
              max={500}
              step={25}
              onValueChange={([v]) => update({ stagger: v })}
            />
          </div>
        )}

        {/* Repeat */}
        {anim.entrance !== 'none' && (
          <div className="flex items-center justify-between py-1">
            <Label className="text-[11px] font-medium text-foreground/70">Replay on scroll</Label>
            <Switch
              checked={anim.repeat}
              onCheckedChange={(checked) => update({ repeat: checked })}
            />
          </div>
        )}

        {/* Preview hint */}
        {hasAnimation && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10">
            <Sparkles className="h-3 w-3 text-primary/60 shrink-0" />
            <p className="text-[10px] text-primary/70">Use Preview to see animations in action</p>
          </div>
        )}
      </div>
    </EditorSection>
  );
}
