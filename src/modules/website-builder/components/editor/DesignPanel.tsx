/**
 * DesignPanel — universal block-level design controls.
 *
 * Every website-builder block gets the same "Design" surface: Typography,
 * Background, Border, Effects. All values write to `component.styles[device]`
 * as plain React.CSSProperties so they merge cleanly in ComponentRenderer
 * without needing per-block support code.
 *
 * Per-device tabs (Desktop / Tablet / Mobile) let users override styles at
 * each breakpoint; non-desktop tabs inherit from desktop when a key is empty.
 * Spacing (padding/margin/width/height) is intentionally NOT duplicated here
 * because DimensionsEditor already owns that surface — DesignPanel focuses on
 * look-and-feel styling that had no dedicated editor before.
 */
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Type, Paintbrush2, Square as SquareIcon, Sparkles,
  Monitor, Tablet, Smartphone,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, Link as LinkIcon, Unlink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResponsiveStyles, DeviceView } from '../../types/component';
import { FONT_OPTIONS } from './property-editors/FontSelect';
import { ThemeSwatches } from './ThemeSwatches';

type TabKey = 'typography' | 'background' | 'border' | 'effects';

const DEVICE_TABS: { key: DeviceView; icon: React.FC<any>; label: string }[] = [
  { key: 'desktop', icon: Monitor, label: 'Desktop' },
  { key: 'tablet', icon: Tablet, label: 'Tablet' },
  { key: 'mobile', icon: Smartphone, label: 'Mobile' },
];

const TAB_META: { key: TabKey; icon: React.FC<any>; label: string }[] = [
  { key: 'typography', icon: Type,        label: 'Text' },
  { key: 'background', icon: Paintbrush2, label: 'Background' },
  { key: 'border',     icon: SquareIcon,  label: 'Border' },
  { key: 'effects',    icon: Sparkles,    label: 'Effects' },
];

/** Font-weight options with numeric CSS values. */
const FONT_WEIGHTS = [
  { label: 'Thin (100)',       value: 100 },
  { label: 'Light (300)',      value: 300 },
  { label: 'Regular (400)',    value: 400 },
  { label: 'Medium (500)',     value: 500 },
  { label: 'Semibold (600)',   value: 600 },
  { label: 'Bold (700)',       value: 700 },
  { label: 'Extrabold (800)',  value: 800 },
  { label: 'Black (900)',      value: 900 },
];

const BORDER_STYLES = ['none', 'solid', 'dashed', 'dotted', 'double', 'groove'] as const;

const SHADOW_PRESETS: { label: string; value: string }[] = [
  { label: 'None',   value: 'none' },
  { label: 'XS',     value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
  { label: 'SM',     value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
  { label: 'MD',     value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
  { label: 'LG',     value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
  { label: 'XL',     value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
  { label: '2XL',    value: '0 25px 50px -12px rgb(0 0 0 / 0.25)' },
  { label: 'Inner',  value: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' },
  { label: 'Glow',   value: '0 0 24px 4px rgb(59 130 246 / 0.35)' },
];

// ── Small reusable inline color input ──
function InlineColor({ value, onChange, allowEmpty = true }: { value: string; onChange: (v: string) => void; allowEmpty?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-md border border-border/30 cursor-pointer appearance-none"
          style={{ backgroundColor: value || 'transparent' }}
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={allowEmpty ? 'inherit' : '#000000'}
          className="h-7 text-px-10 font-mono border-border/30 bg-background flex-1"
        />
        {allowEmpty && value && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/60" title="Clear" onClick={() => onChange('')}>
            <span className="text-sm leading-none">×</span>
          </Button>
        )}
      </div>
      <ThemeSwatches currentValue={value} onSelect={onChange} compact />
    </div>
  );
}

function LabeledSlider({ label, value, min, max, step = 1, unit, onChange, allowUnset }: {
  label: string; value: number | undefined; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number | undefined) => void; allowUnset?: boolean;
}) {
  const v = value ?? min;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-px-10 font-medium text-foreground/60">{label}</Label>
        <div className="flex items-center gap-1">
          <span className="text-px-10 text-muted-foreground/60 tabular-nums">
            {value === undefined ? '—' : `${value}${unit || ''}`}
          </span>
          {allowUnset && value !== undefined && (
            <button className="text-px-9 text-muted-foreground/50 hover:text-foreground" onClick={() => onChange(undefined)}>reset</button>
          )}
        </div>
      </div>
      <Slider value={[v]} min={min} max={max} step={step} onValueChange={([n]) => onChange(n)} />
    </div>
  );
}

// ── Border-radius: single value + per-corner ──
function CornerRadius({ styles, patch }: { styles: React.CSSProperties; patch: (p: React.CSSProperties) => void }) {
  const [linked, setLinked] = useState(() =>
    styles.borderTopLeftRadius === undefined &&
    styles.borderTopRightRadius === undefined &&
    styles.borderBottomLeftRadius === undefined &&
    styles.borderBottomRightRadius === undefined
  );
  const num = (v: any): number | undefined =>
    typeof v === 'number' ? v : typeof v === 'string' && /^\d+/.test(v) ? parseInt(v, 10) : undefined;

  const all = num(styles.borderRadius) ?? 0;

  if (linked) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-px-10 font-medium text-foreground/60">Radius</Label>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-primary bg-primary/10" onClick={() => setLinked(false)} title="Unlink corners">
            <LinkIcon className="h-3 w-3" />
          </Button>
        </div>
        <Slider value={[all]} min={0} max={64} step={1} onValueChange={([v]) => patch({ borderRadius: v })} />
        <div className="text-px-10 text-right text-muted-foreground/60 tabular-nums">{all}px</div>
      </div>
    );
  }

  const corner = (key: keyof React.CSSProperties, val: number | undefined) => (
    <Input
      value={val ?? ''} placeholder="0"
      onChange={(e) => patch({ [key]: e.target.value === '' ? undefined : Number(e.target.value) } as any)}
      className="h-6 text-px-10 w-full text-center border-border/30 bg-background"
    />
  );
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-px-10 font-medium text-foreground/60">Radius (per corner)</Label>
        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground/60" onClick={() => { setLinked(true); patch({ borderTopLeftRadius: undefined, borderTopRightRadius: undefined, borderBottomLeftRadius: undefined, borderBottomRightRadius: undefined }); }} title="Link corners">
          <Unlink className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {corner('borderTopLeftRadius', num(styles.borderTopLeftRadius))}
        {corner('borderTopRightRadius', num(styles.borderTopRightRadius))}
        {corner('borderBottomLeftRadius', num(styles.borderBottomLeftRadius))}
        {corner('borderBottomRightRadius', num(styles.borderBottomRightRadius))}
      </div>
    </div>
  );
}

// ── Main panel ──
interface DesignPanelProps {
  styles: ResponsiveStyles;
  onChange: (styles: ResponsiveStyles) => void;
}

export function DesignPanel({ styles, onChange }: DesignPanelProps) {
  const [tab, setTab] = useState<TabKey>('typography');
  const [device, setDevice] = useState<DeviceView>('desktop');

  const deviceStyles: React.CSSProperties = (styles?.[device] as React.CSSProperties) || {};
  const patch = (p: React.CSSProperties) => {
    const next: React.CSSProperties = { ...deviceStyles };
    Object.entries(p).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) delete (next as any)[k];
      else (next as any)[k] = v;
    });
    onChange({ ...styles, [device]: next });
  };

  const hasOverride = (d: DeviceView) => {
    const s = styles?.[d];
    return s && Object.keys(s).length > 0;
  };

  // Small display helpers
  const num = (v: any): number | undefined =>
    typeof v === 'number' ? v : typeof v === 'string' && /^\d+/.test(v) ? parseInt(v, 10) : undefined;

  return (
    <div className="space-y-3">
      {/* Device selector */}
      <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/30 border border-border/30">
        {DEVICE_TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setDevice(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-px-10 font-medium transition-all relative',
              device === key
                ? 'bg-background text-foreground shadow-sm border border-border/40'
                : 'text-muted-foreground hover:text-foreground/70 hover:bg-muted/20'
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
            {hasOverride(key) && key !== 'desktop' && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
      {device !== 'desktop' && (
        <p className="text-px-9 text-muted-foreground/50 leading-snug px-0.5">
          {device === 'tablet' ? 'Tablet' : 'Mobile'} overrides. Empty = inherits from desktop.
        </p>
      )}

      {/* Sub-tabs */}
      <div className="grid grid-cols-4 gap-0.5 p-0.5 rounded-lg bg-muted/30 border border-border/30">
        {TAB_META.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md text-px-9 font-medium transition-all',
              tab === key
                ? 'bg-background text-foreground shadow-sm border border-border/40'
                : 'text-muted-foreground hover:text-foreground/70'
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Typography */}
      {tab === 'typography' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-px-10 font-medium text-foreground/60">Font Family</Label>
            <Select value={(deviceStyles.fontFamily as string) || ''} onValueChange={(v) => patch({ fontFamily: v || undefined })}>
              <SelectTrigger className="h-7 text-xs border-border/40 bg-background">
                <SelectValue placeholder="Inherit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__inherit__" className="text-xs italic" onSelect={(e) => { e.preventDefault(); patch({ fontFamily: undefined }); }}>Inherit</SelectItem>
                {FONT_OPTIONS.map(f => (
                  <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>{f.split(',')[0]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-px-10 font-medium text-foreground/60">Weight</Label>
              <Select value={String(deviceStyles.fontWeight ?? '')} onValueChange={(v) => patch({ fontWeight: v ? Number(v) : undefined })}>
                <SelectTrigger className="h-7 text-xs border-border/40 bg-background">
                  <SelectValue placeholder="Inherit" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map(w => <SelectItem key={w.value} value={String(w.value)} className="text-xs">{w.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-px-10 font-medium text-foreground/60">Transform</Label>
              <Select value={(deviceStyles.textTransform as string) || 'none'} onValueChange={(v) => patch({ textTransform: v === 'none' ? undefined : (v as any) })}>
                <SelectTrigger className="h-7 text-xs border-border/40 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">Normal</SelectItem>
                  <SelectItem value="uppercase" className="text-xs">UPPERCASE</SelectItem>
                  <SelectItem value="lowercase" className="text-xs">lowercase</SelectItem>
                  <SelectItem value="capitalize" className="text-xs">Capitalize</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <LabeledSlider label="Size" value={num(deviceStyles.fontSize)} min={8} max={96} unit="px" onChange={(v) => patch({ fontSize: v === undefined ? undefined : v })} allowUnset />
          <LabeledSlider label="Line height" value={typeof deviceStyles.lineHeight === 'number' ? deviceStyles.lineHeight * 100 : undefined} min={80} max={300} step={5} unit="%" onChange={(v) => patch({ lineHeight: v === undefined ? undefined : v / 100 })} allowUnset />
          <LabeledSlider label="Letter spacing" value={typeof deviceStyles.letterSpacing === 'string' ? Math.round(parseFloat(deviceStyles.letterSpacing) * 100) : undefined} min={-10} max={50} step={1} unit="em/100" onChange={(v) => patch({ letterSpacing: v === undefined ? undefined : `${(v / 100).toFixed(2)}em` })} allowUnset />

          <div className="space-y-1">
            <Label className="text-px-10 font-medium text-foreground/60">Align</Label>
            <div className="flex gap-0.5 p-0.5 rounded-md bg-muted/30 border border-border/30">
              {[
                { v: 'left',   Icon: AlignLeft },
                { v: 'center', Icon: AlignCenter },
                { v: 'right',  Icon: AlignRight },
                { v: 'justify',Icon: AlignJustify },
              ].map(({ v, Icon }) => (
                <button
                  key={v}
                  onClick={() => patch({ textAlign: deviceStyles.textAlign === v ? undefined : (v as any) })}
                  className={cn('flex-1 flex items-center justify-center py-1 rounded transition-all', deviceStyles.textAlign === v ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground/70')}
                  title={v}
                >
                  <Icon className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => patch({ fontStyle: deviceStyles.fontStyle === 'italic' ? undefined : 'italic' })}
              className={cn('flex-1 h-7 rounded-md border border-border/30 flex items-center justify-center text-px-11', deviceStyles.fontStyle === 'italic' ? 'bg-primary/10 text-primary border-primary/40' : 'bg-background hover:bg-muted/40')}
            ><Italic className="h-3 w-3" /></button>
            <button
              onClick={() => patch({ textDecoration: deviceStyles.textDecoration === 'underline' ? undefined : 'underline' })}
              className={cn('flex-1 h-7 rounded-md border border-border/30 flex items-center justify-center text-px-11', deviceStyles.textDecoration === 'underline' ? 'bg-primary/10 text-primary border-primary/40' : 'bg-background hover:bg-muted/40')}
            ><Underline className="h-3 w-3" /></button>
            <button
              onClick={() => patch({ fontWeight: (deviceStyles.fontWeight === 700 || deviceStyles.fontWeight === '700') ? undefined : 700 })}
              className={cn('flex-1 h-7 rounded-md border border-border/30 flex items-center justify-center text-px-11', (deviceStyles.fontWeight === 700 || deviceStyles.fontWeight === '700') ? 'bg-primary/10 text-primary border-primary/40' : 'bg-background hover:bg-muted/40')}
            ><Bold className="h-3 w-3" /></button>
          </div>

          <div className="space-y-1">
            <Label className="text-px-10 font-medium text-foreground/60">Text color</Label>
            <InlineColor value={(deviceStyles.color as string) || ''} onChange={(v) => patch({ color: v || undefined })} />
          </div>
        </div>
      )}

      {/* Background */}
      {tab === 'background' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-px-10 font-medium text-foreground/60">Solid color</Label>
            <InlineColor value={(deviceStyles.backgroundColor as string) || ''} onChange={(v) => patch({ backgroundColor: v || undefined })} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-px-10 font-medium text-foreground/60">Gradient presets</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { from: '#667eea', to: '#764ba2' },
                { from: '#f093fb', to: '#f5576c' },
                { from: '#4facfe', to: '#00f2fe' },
                { from: '#43e97b', to: '#38f9d7' },
                { from: '#fa709a', to: '#fee140' },
                { from: '#a18cd1', to: '#fbc2eb' },
                { from: '#1e3c72', to: '#2a5298' },
                { from: '#232526', to: '#414345' },
              ].map(g => {
                const val = `linear-gradient(135deg, ${g.from}, ${g.to})`;
                const active = deviceStyles.backgroundImage === val;
                return (
                  <button
                    key={g.from + g.to}
                    onClick={() => patch({ backgroundImage: active ? undefined : val, backgroundColor: undefined })}
                    className={cn('h-6 rounded-md transition-transform hover:scale-105 border border-border/20', active && 'ring-2 ring-primary ring-offset-1')}
                    style={{ background: val }}
                  />
                );
              })}
            </div>
            {deviceStyles.backgroundImage && (
              <button className="text-px-9 text-muted-foreground/60 hover:text-foreground" onClick={() => patch({ backgroundImage: undefined })}>Clear gradient</button>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-px-10 font-medium text-foreground/60">Background image URL</Label>
            <Input
              value={typeof deviceStyles.backgroundImage === 'string' && !deviceStyles.backgroundImage.startsWith('linear-') && !deviceStyles.backgroundImage.startsWith('radial-') ? deviceStyles.backgroundImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '') : ''}
              placeholder="https://..."
              onChange={(e) => patch({ backgroundImage: e.target.value ? `url('${e.target.value}')` : undefined })}
              className="h-7 text-px-10 border-border/30 bg-background"
            />
          </div>

          {deviceStyles.backgroundImage && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-px-10 font-medium text-foreground/60">Size</Label>
                <Select value={(deviceStyles.backgroundSize as string) || 'cover'} onValueChange={(v) => patch({ backgroundSize: v as any })}>
                  <SelectTrigger className="h-7 text-xs border-border/40 bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover" className="text-xs">Cover</SelectItem>
                    <SelectItem value="contain" className="text-xs">Contain</SelectItem>
                    <SelectItem value="auto" className="text-xs">Auto</SelectItem>
                    <SelectItem value="100% 100%" className="text-xs">Stretch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-px-10 font-medium text-foreground/60">Position</Label>
                <Select value={(deviceStyles.backgroundPosition as string) || 'center'} onValueChange={(v) => patch({ backgroundPosition: v as any })}>
                  <SelectTrigger className="h-7 text-xs border-border/40 bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center" className="text-xs">Center</SelectItem>
                    <SelectItem value="top" className="text-xs">Top</SelectItem>
                    <SelectItem value="bottom" className="text-xs">Bottom</SelectItem>
                    <SelectItem value="left" className="text-xs">Left</SelectItem>
                    <SelectItem value="right" className="text-xs">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Border */}
      {tab === 'border' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-px-10 font-medium text-foreground/60">Style</Label>
              <Select value={(deviceStyles.borderStyle as string) || 'none'} onValueChange={(v) => patch({ borderStyle: v === 'none' ? undefined : (v as any) })}>
                <SelectTrigger className="h-7 text-xs border-border/40 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BORDER_STYLES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <LabeledSlider label="Width" value={num(deviceStyles.borderWidth)} min={0} max={16} unit="px" onChange={(v) => patch({ borderWidth: v === undefined ? undefined : v })} allowUnset />
          </div>
          <div className="space-y-1">
            <Label className="text-px-10 font-medium text-foreground/60">Border color</Label>
            <InlineColor value={(deviceStyles.borderColor as string) || ''} onChange={(v) => patch({ borderColor: v || undefined })} />
          </div>
          <CornerRadius styles={deviceStyles} patch={patch} />
          <div className="space-y-1">
            <Label className="text-px-10 font-medium text-foreground/60">Outline (focus ring)</Label>
            <div className="grid grid-cols-2 gap-2">
              <LabeledSlider label="Width" value={num(deviceStyles.outlineWidth)} min={0} max={8} unit="px" onChange={(v) => patch({ outlineWidth: v === undefined ? undefined : v, outlineStyle: v && v > 0 ? 'solid' : undefined })} allowUnset />
              <div className="space-y-1">
                <Label className="text-px-10 font-medium text-foreground/60">Color</Label>
                <InlineColor value={(deviceStyles.outlineColor as string) || ''} onChange={(v) => patch({ outlineColor: v || undefined })} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Effects */}
      {tab === 'effects' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-px-10 font-medium text-foreground/60">Shadow presets</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {SHADOW_PRESETS.map(s => {
                const active = (deviceStyles.boxShadow || 'none') === s.value;
                return (
                  <button
                    key={s.label}
                    onClick={() => patch({ boxShadow: s.value === 'none' ? undefined : s.value })}
                    className={cn('h-10 rounded-md bg-background border border-border/30 text-px-9 flex items-center justify-center transition-all', active ? 'ring-2 ring-primary ring-offset-1' : 'hover:border-border/60')}
                    style={{ boxShadow: s.value === 'none' ? undefined : s.value }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <LabeledSlider label="Opacity" value={deviceStyles.opacity !== undefined ? Math.round(Number(deviceStyles.opacity) * 100) : undefined} min={0} max={100} step={5} unit="%" onChange={(v) => patch({ opacity: v === undefined ? undefined : v / 100 })} allowUnset />

          <LabeledSlider label="Rotate" value={typeof deviceStyles.transform === 'string' ? (deviceStyles.transform.match(/rotate\((-?\d+)deg\)/)?.[1] ? Number(RegExp.$1) : undefined) : undefined} min={-180} max={180} unit="°" onChange={(v) => patch({ transform: v === undefined || v === 0 ? undefined : `rotate(${v}deg)` })} allowUnset />

          <LabeledSlider label="Blur (filter)" value={typeof deviceStyles.filter === 'string' ? (deviceStyles.filter.match(/blur\((\d+)px\)/)?.[1] ? Number(RegExp.$1) : undefined) : undefined} min={0} max={20} unit="px" onChange={(v) => patch({ filter: v === undefined || v === 0 ? undefined : `blur(${v}px)` })} allowUnset />

          <div className="space-y-1">
            <Label className="text-px-10 font-medium text-foreground/60">Cursor</Label>
            <Select value={(deviceStyles.cursor as string) || 'auto'} onValueChange={(v) => patch({ cursor: v === 'auto' ? undefined : (v as any) })}>
              <SelectTrigger className="h-7 text-xs border-border/40 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto" className="text-xs">Auto</SelectItem>
                <SelectItem value="pointer" className="text-xs">Pointer</SelectItem>
                <SelectItem value="grab" className="text-xs">Grab</SelectItem>
                <SelectItem value="not-allowed" className="text-xs">Not-allowed</SelectItem>
                <SelectItem value="zoom-in" className="text-xs">Zoom-in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(deviceStyles.boxShadow || deviceStyles.opacity !== undefined || deviceStyles.transform || deviceStyles.filter) && (
            <button className="text-px-10 text-muted-foreground/60 hover:text-destructive" onClick={() => patch({ boxShadow: undefined, opacity: undefined, transform: undefined, filter: undefined })}>Clear all effects</button>
          )}
        </div>
      )}
    </div>
  );
}