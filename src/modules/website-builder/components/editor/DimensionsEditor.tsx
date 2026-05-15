/**
 * DimensionsEditor — WordPress-style dimensions editor with:
 * - Per-device overrides (Desktop / Tablet / Mobile)
 * - Width, Height, Min-Height, Max-Width
 * - Padding with link toggle (all sides at once or individual)
 * - Margin with link toggle
 */
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Ruler, MoveVertical, MoveHorizontal, Maximize2,
  Monitor, Tablet, Smartphone, Link, Unlink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResponsiveStyles, DeviceView } from '../../types/component';

interface DimensionsEditorProps {
  styles: ResponsiveStyles;
  onChange: (styles: ResponsiveStyles) => void;
}

type DimKey =
  | 'width' | 'height' | 'minHeight' | 'maxWidth'
  | 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight'
  | 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight';

const DEVICE_TABS: { key: DeviceView; icon: React.FC<any>; label: string }[] = [
  { key: 'desktop', icon: Monitor, label: 'Desktop' },
  { key: 'tablet', icon: Tablet, label: 'Tablet' },
  { key: 'mobile', icon: Smartphone, label: 'Mobile' },
];

function toCssString(val: string | number | undefined): string {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') return `${val}px`;
  return String(val);
}

function parseCssValue(raw: string): string | number {
  const cleaned = raw.trim();
  if (!cleaned) return '';
  const num = Number(cleaned);
  return !isNaN(num) && cleaned === String(num) ? num : cleaned;
}

// ── WordPress-style spacing box ──
function SpacingBox({
  label,
  icon,
  topKey,
  rightKey,
  bottomKey,
  leftKey,
  values,
  onUpdate,
}: {
  label: string;
  icon: React.ReactNode;
  topKey: DimKey;
  rightKey: DimKey;
  bottomKey: DimKey;
  leftKey: DimKey;
  values: React.CSSProperties;
  onUpdate: (key: DimKey, value: string) => void;
}) {
  const [linked, setLinked] = useState(true);

  const top = toCssString((values as any)[topKey]);
  const right = toCssString((values as any)[rightKey]);
  const bottom = toCssString((values as any)[bottomKey]);
  const left = toCssString((values as any)[leftKey]);

  const handleLinkedChange = (val: string) => {
    onUpdate(topKey, val);
    onUpdate(rightKey, val);
    onUpdate(bottomKey, val);
    onUpdate(leftKey, val);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-medium text-foreground/50 flex items-center gap-1">
          {icon}
          {label}
        </Label>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-5 w-5 rounded',
            linked ? 'text-primary bg-primary/10' : 'text-muted-foreground/40 hover:text-muted-foreground'
          )}
          onClick={() => setLinked(!linked)}
          title={linked ? 'Unlink sides' : 'Link all sides'}
        >
          {linked ? <Link className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
        </Button>
      </div>

      {linked ? (
        /* Linked: single input */
        <Input
          value={top}
          onChange={(e) => handleLinkedChange(e.target.value)}
          placeholder="0"
          className="h-7 text-[10px] border-border/30 bg-background text-center"
        />
      ) : (
        /* Unlinked: WordPress-style box layout */
        <div className="relative">
          {/* Visual box outline */}
          <div className="border border-dashed border-border/40 rounded-lg p-1">
            {/* Top */}
            <div className="flex justify-center mb-0.5">
              <div className="text-center">
                <span className="text-[7px] text-muted-foreground/40 block leading-none">Top</span>
                <Input
                  value={top}
                  onChange={(e) => onUpdate(topKey, e.target.value)}
                  placeholder="0"
                  className="h-5 w-14 text-[9px] border-border/20 bg-muted/20 text-center px-1 mt-0.5"
                />
              </div>
            </div>
            {/* Left — Center indicator — Right */}
            <div className="flex items-center justify-between gap-1 my-0.5">
              <div className="text-center">
                <span className="text-[7px] text-muted-foreground/40 block leading-none">Left</span>
                <Input
                  value={left}
                  onChange={(e) => onUpdate(leftKey, e.target.value)}
                  placeholder="0"
                  className="h-5 w-14 text-[9px] border-border/20 bg-muted/20 text-center px-1 mt-0.5"
                />
              </div>
              <div className="flex-1 h-6 mx-1 rounded border border-border/20 bg-muted/10 flex items-center justify-center">
                <span className="text-[7px] text-muted-foreground/30 uppercase tracking-wider font-medium">{label}</span>
              </div>
              <div className="text-center">
                <span className="text-[7px] text-muted-foreground/40 block leading-none">Right</span>
                <Input
                  value={right}
                  onChange={(e) => onUpdate(rightKey, e.target.value)}
                  placeholder="0"
                  className="h-5 w-14 text-[9px] border-border/20 bg-muted/20 text-center px-1 mt-0.5"
                />
              </div>
            </div>
            {/* Bottom */}
            <div className="flex justify-center mt-0.5">
              <div className="text-center">
                <span className="text-[7px] text-muted-foreground/40 block leading-none">Bottom</span>
                <Input
                  value={bottom}
                  onChange={(e) => onUpdate(bottomKey, e.target.value)}
                  placeholder="0"
                  className="h-5 w-14 text-[9px] border-border/20 bg-muted/20 text-center px-1 mt-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Editor ──
export function DimensionsEditor({ styles, onChange }: DimensionsEditorProps) {
  const [activeDevice, setActiveDevice] = useState<DeviceView>('desktop');

  const deviceStyles = styles?.[activeDevice] || {};

  const update = (key: DimKey, raw: string) => {
    const cleaned = raw.trim();
    const newDeviceStyles = { ...deviceStyles };
    if (!cleaned) {
      delete (newDeviceStyles as any)[key];
    } else {
      (newDeviceStyles as any)[key] = parseCssValue(cleaned);
    }
    onChange({ ...styles, [activeDevice]: newDeviceStyles });
  };

  const renderDimField = (key: DimKey, label: string, icon: React.ReactNode, placeholder: string) => {
    const val = toCssString((deviceStyles as any)[key]);
    return (
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-foreground/50 flex items-center gap-1">
          {icon}
          {label}
        </Label>
        <div className="flex gap-1">
          <Input
            value={val}
            onChange={(e) => update(key, e.target.value)}
            placeholder={placeholder}
            className="h-7 text-[10px] border-border/30 bg-background flex-1"
          />
          <Select
            value={val || '__auto__'}
            onValueChange={(v) => update(key, v === '__auto__' ? '' : v)}
          >
            <SelectTrigger className="h-7 w-[52px] text-[9px] border-border/30 bg-background px-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="__auto__" className="text-[10px]">Auto</SelectItem>
              <SelectItem value="100%" className="text-[10px]">100%</SelectItem>
              <SelectItem value="50%" className="text-[10px]">50%</SelectItem>
              <SelectItem value="100vh" className="text-[10px]">100vh</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // Check if device has overrides
  const hasOverride = (device: DeviceView) => {
    const s = styles?.[device];
    return s && Object.keys(s).length > 0;
  };

  return (
    <div className="space-y-3">
      {/* Device tabs */}
      <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/30 border border-border/30">
        {DEVICE_TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveDevice(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all relative',
              activeDevice === key
                ? 'bg-background text-foreground shadow-sm border border-border/40'
                : 'text-muted-foreground hover:text-foreground/70 hover:bg-muted/20'
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
            {/* Override dot */}
            {hasOverride(key) && key !== 'desktop' && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {activeDevice !== 'desktop' && (
        <p className="text-[9px] text-muted-foreground/50 leading-snug px-0.5">
          {activeDevice === 'tablet' ? 'Tablet' : 'Mobile'} overrides. Empty = inherits from desktop.
        </p>
      )}

      {/* Width & Height */}
      <div className="grid grid-cols-2 gap-2">
        {renderDimField('width', 'Width', <MoveHorizontal className="h-3 w-3" />, 'auto')}
        {renderDimField('height', 'Height', <MoveVertical className="h-3 w-3" />, 'auto')}
      </div>

      {/* Min Height & Max Width */}
      <div className="grid grid-cols-2 gap-2">
        {renderDimField('minHeight', 'Min H', <Maximize2 className="h-3 w-3" />, 'none')}
        {renderDimField('maxWidth', 'Max W', <Ruler className="h-3 w-3" />, 'none')}
      </div>

      {/* Padding — WordPress-style */}
      <SpacingBox
        label="Padding"
        icon={<svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="14" height="14" rx="2" strokeDasharray="3 2" /><rect x="4" y="4" width="8" height="8" rx="1" /></svg>}
        topKey="paddingTop"
        rightKey="paddingRight"
        bottomKey="paddingBottom"
        leftKey="paddingLeft"
        values={deviceStyles}
        onUpdate={update}
      />

      {/* Margin — WordPress-style */}
      <SpacingBox
        label="Margin"
        icon={<svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="14" height="14" rx="2" /><rect x="4" y="4" width="8" height="8" rx="1" strokeDasharray="3 2" /></svg>}
        topKey="marginTop"
        rightKey="marginRight"
        bottomKey="marginBottom"
        leftKey="marginLeft"
        values={deviceStyles}
        onUpdate={update}
      />
    </div>
  );
}
