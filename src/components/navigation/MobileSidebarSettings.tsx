import React, { useState } from 'react';
import { Settings, RotateCcw, PanelLeft, PanelRight, Zap, Wind, Sparkles, Eye, EyeOff, Rows3, AlignJustify, Image, ImageOff, Pointer, PointerOff, Palette, Type, RectangleHorizontal, Circle, Square, Minus, ChevronLeft, Paintbrush, Pipette } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MobileSidebarConfig,
  MobileSidebarWidth,
  MobileSidebarAnimation,
  MobileSidebarItemStyle,
  MobileSidebarFontSize,
  MobileSidebarIconShape,
  COLOR_PRESETS,
  ACTIVE_BG_PRESETS,
  SIDEBAR_THEME_PRESETS,
} from '@/hooks/useMobileSidebarConfig';
import { cn } from '@/lib/utils';

interface MobileSidebarSettingsProps {
  config: MobileSidebarConfig;
  onUpdate: (partial: Partial<MobileSidebarConfig>) => void;
  onReset: () => void;
  onClose: () => void;
}

function OptionButton({ 
  active, 
  onClick, 
  children, 
  icon: Icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
        active
          ? 'bg-primary/15 text-primary border-primary/30 shadow-sm'
          : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60 hover:text-foreground'
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

function ColorSwatch({ color, active, onClick, label }: { color: string; active: boolean; onClick: () => void; label: string }) {
  const bg = color ? `hsl(${color})` : undefined;
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'w-8 h-8 rounded-full border-2 transition-all duration-150 flex items-center justify-center',
        active ? 'border-primary scale-110 shadow-md' : 'border-border hover:scale-105'
      )}
      style={bg ? { backgroundColor: bg } : undefined}
    >
      {!color && <span className="text-[10px] text-muted-foreground font-medium">—</span>}
    </button>
  );
}

/** Custom color input with native color picker + text input (supports hex and HSL) */
function CustomColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [text, setText] = useState(value || '');

  // Convert HSL string to hex for the native picker
  const toHex = (val: string): string => {
    if (!val) return '#6366f1';
    if (val.startsWith('#')) return val;
    // Parse HSL "h s% l%" format
    const parts = val.match(/([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
    if (!parts) return '#6366f1';
    const h = parseFloat(parts[1]);
    const s = parseFloat(parts[2]) / 100;
    const l = parseFloat(parts[3]) / 100;
    const a2 = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a2 * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const handleTextChange = (v: string) => {
    setText(v);
    if (v.startsWith('#') || v.match(/^\d+\s+\d+%?\s+\d+%?$/)) {
      onChange(v);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={toHex(value)}
        onChange={(e) => { setText(e.target.value); onChange(e.target.value); }}
        className="w-7 h-7 rounded-md border border-border cursor-pointer bg-background p-0.5"
        title={label}
      />
      <input
        type="text"
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="#ff0000 or 217 91% 60%"
        className="flex-1 h-7 px-2 text-[11px] border rounded-md bg-background text-foreground placeholder:text-muted-foreground/50"
      />
      {value && (
        <button
          onClick={() => { setText(''); onChange(''); }}
          className="text-[10px] text-muted-foreground hover:text-destructive"
          title="Clear custom color"
        >✕</button>
      )}
    </div>
  );
}

/** Individual HSL color input with swatch */
function HslColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  const bg = value ? `hsl(${value})` : undefined;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setEditing(!editing)}
        className={cn(
          'w-6 h-6 rounded-md border-2 transition-all shrink-0',
          value ? 'border-border/40' : 'border-dashed border-border/60'
        )}
        style={bg ? { backgroundColor: bg } : undefined}
        title={label}
      >
        {!value && <Pipette className="h-3 w-3 mx-auto text-muted-foreground/50" />}
      </button>
      <span className="text-[11px] text-muted-foreground flex-1 min-w-0">{label}</span>
      {editing && (
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); onChange(e.target.value); }}
          onBlur={() => setEditing(false)}
          placeholder="210 20% 98%"
          className="w-28 h-6 px-1.5 text-[10px] border rounded bg-background text-foreground"
          autoFocus
        />
      )}
    </div>
  );
}

/** Sidebar Theme section with preset themes + individual color controls */
function SidebarThemeSection({ config, onUpdate }: { config: MobileSidebarConfig; onUpdate: (p: Partial<MobileSidebarConfig>) => void }) {
  const [showCustom, setShowCustom] = useState(false);

  const applyTheme = (preset: typeof SIDEBAR_THEME_PRESETS[number]) => {
    onUpdate({
      sidebarBg: preset.bg,
      sidebarFg: preset.fg,
      sidebarAccent: preset.accent,
      sidebarBorder: preset.border,
      sidebarPrimary: preset.primary,
    });
  };

  const currentMatchesPreset = (preset: typeof SIDEBAR_THEME_PRESETS[number]) =>
    config.sidebarBg === preset.bg && config.sidebarFg === preset.fg &&
    config.sidebarAccent === preset.accent && config.sidebarBorder === preset.border &&
    config.sidebarPrimary === preset.primary;

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Paintbrush className="h-3.5 w-3.5" /> Sidebar Theme
      </Label>

      {/* Theme presets */}
      <div className="grid grid-cols-3 gap-2">
        {SIDEBAR_THEME_PRESETS.map(preset => {
          const isActive = currentMatchesPreset(preset);
          const previewBg = preset.bg ? `hsl(${preset.bg})` : undefined;
          const previewFg = preset.fg ? `hsl(${preset.fg})` : undefined;
          const previewAccent = preset.accent ? `hsl(${preset.accent})` : undefined;
          const previewPrimary = preset.primary ? `hsl(${preset.primary})` : undefined;

          return (
            <button
              key={preset.label}
              onClick={() => applyTheme(preset)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all text-[10px] font-medium',
                isActive
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border/40 hover:border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Mini preview */}
              <div
                className="w-full h-8 rounded-md border border-border/20 flex items-end p-1 gap-0.5 overflow-hidden"
                style={{ backgroundColor: previewBg || 'hsl(var(--sidebar-background))' }}
              >
                {/* Mini sidebar items */}
                <div className="w-1.5 h-2 rounded-sm" style={{ backgroundColor: previewAccent || 'hsl(var(--sidebar-accent))' }} />
                <div className="w-1.5 h-3 rounded-sm" style={{ backgroundColor: previewPrimary || 'hsl(var(--sidebar-primary))' }} />
                <div className="w-1.5 h-2 rounded-sm" style={{ backgroundColor: previewAccent || 'hsl(var(--sidebar-accent))' }} />
                <div className="flex-1" />
                <div className="w-3 h-1 rounded-full" style={{ backgroundColor: previewFg || 'hsl(var(--sidebar-foreground))', opacity: 0.4 }} />
              </div>
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom colors toggle */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        className="text-[11px] text-primary hover:underline flex items-center gap-1"
      >
        <Pipette className="h-3 w-3" />
        {showCustom ? 'Hide custom colors' : 'Customize individual colors'}
      </button>

      {showCustom && (
        <div className="space-y-2 pl-1">
          <HslColorInput label="Background" value={config.sidebarBg} onChange={(v) => onUpdate({ sidebarBg: v })} />
          <HslColorInput label="Text" value={config.sidebarFg} onChange={(v) => onUpdate({ sidebarFg: v })} />
          <HslColorInput label="Accent / Hover" value={config.sidebarAccent} onChange={(v) => onUpdate({ sidebarAccent: v })} />
          <HslColorInput label="Border" value={config.sidebarBorder} onChange={(v) => onUpdate({ sidebarBorder: v })} />
          <HslColorInput label="Primary / Active" value={config.sidebarPrimary} onChange={(v) => onUpdate({ sidebarPrimary: v })} />
          <p className="text-[9px] text-muted-foreground/50">Use HSL format: e.g. "217 33% 17%"</p>
        </div>
      )}
    </div>
  );
}

export function MobileSidebarSettings({ config, onUpdate, onReset, onClose }: MobileSidebarSettingsProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Settings className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Sidebar Settings</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
          Done
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-5">
          {/* ─── Sidebar Theme ─── */}
          <SidebarThemeSection config={config} onUpdate={onUpdate} />

          <Separator />

          {/* ─── Layout ─── */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position</Label>
            <div className="flex gap-2">
              <OptionButton active={config.side === 'left'} onClick={() => onUpdate({ side: 'left' })} icon={PanelLeft}>Left</OptionButton>
              <OptionButton active={config.side === 'right'} onClick={() => onUpdate({ side: 'right' })} icon={PanelRight}>Right</OptionButton>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Width</Label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'compact' as MobileSidebarWidth, label: 'Compact' },
                { value: 'default' as MobileSidebarWidth, label: 'Default' },
                { value: 'wide' as MobileSidebarWidth, label: 'Wide' },
              ]).map(opt => (
                <OptionButton key={opt.value} active={config.width === opt.value} onClick={() => onUpdate({ width: opt.value })}>
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Animation</Label>
            <div className="flex gap-2 flex-wrap">
              <OptionButton active={config.animation === 'smooth'} onClick={() => onUpdate({ animation: 'smooth' })} icon={Wind}>Smooth</OptionButton>
              <OptionButton active={config.animation === 'spring'} onClick={() => onUpdate({ animation: 'spring' })} icon={Sparkles}>Spring</OptionButton>
              <OptionButton active={config.animation === 'snappy'} onClick={() => onUpdate({ animation: 'snappy' })} icon={Zap}>Snappy</OptionButton>
            </div>
          </div>

          <Separator />

          {/* ─── Styling ─── */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" /> Global Icon Color
            </Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map(cp => (
                <ColorSwatch
                  key={cp.label}
                  color={cp.value}
                  label={cp.label}
                  active={config.iconColor === cp.value}
                  onClick={() => onUpdate({ iconColor: cp.value })}
                />
              ))}
            </div>
            {/* Custom color input */}
            <CustomColorInput
              value={config.iconColor}
              onChange={(v) => onUpdate({ iconColor: v })}
              label="Custom icon color"
            />
            <p className="text-[9px] text-muted-foreground/50">
              Override per item in sidebar item settings. Supports hex (#ff0000) or HSL (217 91% 60%).
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Icon Shape</Label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'rounded' as MobileSidebarIconShape, label: 'Rounded', icon: RectangleHorizontal },
                { value: 'circle' as MobileSidebarIconShape, label: 'Circle', icon: Circle },
                { value: 'square' as MobileSidebarIconShape, label: 'Square', icon: Square },
                { value: 'none' as MobileSidebarIconShape, label: 'None', icon: Minus },
              ]).map(opt => (
                <OptionButton key={opt.value} active={config.iconShape === opt.value} onClick={() => onUpdate({ iconShape: opt.value })} icon={opt.icon}>
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item Style</Label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'rounded' as MobileSidebarItemStyle, label: 'Rounded' },
                { value: 'pill' as MobileSidebarItemStyle, label: 'Pill' },
                { value: 'flat' as MobileSidebarItemStyle, label: 'Flat' },
                { value: 'outlined' as MobileSidebarItemStyle, label: 'Outlined' },
                { value: 'filled' as MobileSidebarItemStyle, label: 'Filled' },
              ]).map(opt => (
                <OptionButton key={opt.value} active={config.itemStyle === opt.value} onClick={() => onUpdate({ itemStyle: opt.value })}>
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" /> Font Size
            </Label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'small' as MobileSidebarFontSize, label: 'Small' },
                { value: 'medium' as MobileSidebarFontSize, label: 'Medium' },
                { value: 'large' as MobileSidebarFontSize, label: 'Large' },
              ]).map(opt => (
                <OptionButton key={opt.value} active={config.fontSize === opt.value} onClick={() => onUpdate({ fontSize: opt.value })}>
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Background</Label>
            <div className="flex gap-2 flex-wrap">
              {ACTIVE_BG_PRESETS.map(cp => (
                <OptionButton key={cp.label} active={config.activeBg === cp.value} onClick={() => onUpdate({ activeBg: cp.value })}>
                  {cp.label}
                </OptionButton>
              ))}
            </div>
          </div>

          <Separator />

          {/* ─── Display Toggles ─── */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display</Label>
            
            <ToggleRow
              icon={config.showDescriptions ? Eye : EyeOff}
              label="Item descriptions"
              checked={config.showDescriptions}
              onChange={(val) => onUpdate({ showDescriptions: val })}
            />
            <ToggleRow
              icon={config.showGroupHeaders ? AlignJustify : Rows3}
              label="Group headers"
              checked={config.showGroupHeaders}
              onChange={(val) => onUpdate({ showGroupHeaders: val })}
            />
            <ToggleRow
              icon={Rows3}
              label="Compact mode"
              checked={config.compactMode}
              onChange={(val) => onUpdate({ compactMode: val })}
            />
            <ToggleRow
              icon={config.showBrandHeader ? Image : ImageOff}
              label="Brand header"
              checked={config.showBrandHeader}
              onChange={(val) => onUpdate({ showBrandHeader: val })}
            />
            <ToggleRow
              icon={Wind}
              label="Backdrop blur"
              checked={config.backdropBlur}
              onChange={(val) => onUpdate({ backdropBlur: val })}
            />
            <ToggleRow
              icon={config.swipeGesture ? Pointer : PointerOff}
              label="Swipe gesture"
              checked={config.swipeGesture}
              onChange={(val) => onUpdate({ swipeGesture: val })}
            />
            <ToggleRow
              icon={Square}
              label="Icon background"
              checked={config.showIconBg}
              onChange={(val) => onUpdate({ showIconBg: val })}
            />
          </div>

          <Separator />

          {/* Reset */}
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, checked, onChange }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
