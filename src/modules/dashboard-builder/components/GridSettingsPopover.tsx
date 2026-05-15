import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LayoutGrid, Square, Layers, Box, Sparkles, ArrowUp, Maximize2, Zap, Rows3, AlignJustify, Columns3 } from 'lucide-react';

export type WidgetAnimation = 'none' | 'fade' | 'slide' | 'scale' | 'bounce';

export interface GridSettings {
  gap: number;       // 4–24
  rowHeight: number;  // 40–80
  radius: number;     // 0–20
  cardStyle: 'default' | 'flat' | 'elevated' | 'bordered';
  widgetAnimation: WidgetAnimation;
}

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  gap: 12,
  rowHeight: 45,
  radius: 12,
  cardStyle: 'default',
  widgetAnimation: 'fade',
};

const CARD_STYLES: { value: GridSettings['cardStyle']; icon: typeof Square; tKey: string }[] = [
  { value: 'default', icon: Square, tKey: 'default' },
  { value: 'flat', icon: Box, tKey: 'flat' },
  { value: 'elevated', icon: Layers, tKey: 'elevated' },
  { value: 'bordered', icon: LayoutGrid, tKey: 'bordered' },
];

const WIDGET_ANIMATIONS: { value: WidgetAnimation; icon: typeof Square; tKey: string }[] = [
  { value: 'none', icon: Square, tKey: 'none' },
  { value: 'fade', icon: Sparkles, tKey: 'fade' },
  { value: 'slide', icon: ArrowUp, tKey: 'slide' },
  { value: 'scale', icon: Maximize2, tKey: 'scale' },
  { value: 'bounce', icon: Zap, tKey: 'bounce' },
];

const PRESETS: { tKey: string; icon: typeof Square; gap: number; rowHeight: number; radius: number }[] = [
  { tKey: 'compact', icon: Rows3, gap: 4, rowHeight: 40, radius: 6 },
  { tKey: 'comfortable', icon: AlignJustify, gap: 10, rowHeight: 55, radius: 12 },
  { tKey: 'spacious', icon: Columns3, gap: 20, rowHeight: 70, radius: 16 },
];

interface Props {
  settings: GridSettings;
  onChange: (settings: GridSettings) => void;
}

export function GridSettingsPopover({ settings, onChange }: Props) {
  const { t } = useTranslation('dashboard');
  const gs = (key: string) => t(`dashboardBuilder.gridSettings.${key}`);

  const update = <K extends keyof GridSettings>(key: K, value: GridSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5">
          <LayoutGrid className="h-3 w-3" />
          {gs('grid')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-0.5">{gs('title')}</h4>
            <p className="text-[10px] text-muted-foreground">{gs('subtitle')}</p>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{gs('preset')}</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESETS.map(({ tKey, icon: Icon, gap, rowHeight, radius }) => {
                const isActive = settings.gap === gap && settings.rowHeight === rowHeight && settings.radius === radius;
                return (
                  <button
                    key={tKey}
                    onClick={() => onChange({ ...settings, gap, rowHeight, radius })}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md text-[10px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {gs(tKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Gap */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">{gs('spacing')}</Label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{settings.gap}px</span>
            </div>
            <Slider
              value={[settings.gap]}
              onValueChange={([v]) => update('gap', v)}
              min={4}
              max={24}
              step={2}
              className="w-full"
            />
          </div>

          {/* Row Height */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">{gs('rowHeight')}</Label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{settings.rowHeight}px</span>
            </div>
            <Slider
              value={[settings.rowHeight]}
              onValueChange={([v]) => update('rowHeight', v)}
              min={40}
              max={80}
              step={5}
              className="w-full"
            />
          </div>

          {/* Corner Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">{gs('cornerRadius')}</Label>
              <span className="text-[10px] text-muted-foreground tabular-nums">{settings.radius}px</span>
            </div>
            <Slider
              value={[settings.radius]}
              onValueChange={([v]) => update('radius', v)}
              min={0}
              max={20}
              step={2}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Card Style */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{gs('cardStyle')}</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {CARD_STYLES.map(({ value, icon: Icon, tKey }) => (
                <button
                  key={value}
                  onClick={() => update('cardStyle', value)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md text-[10px] font-medium transition-all duration-150 ${
                    settings.cardStyle === value
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {gs(tKey)}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Widget Animation */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{gs('widgetEntrance')}</Label>
            <div className="grid grid-cols-5 gap-1">
              {WIDGET_ANIMATIONS.map(({ value, icon: Icon, tKey }) => (
                <button
                  key={value}
                  onClick={() => update('widgetAnimation', value)}
                  className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-md text-[10px] font-medium transition-all duration-150 ${
                    settings.widgetAnimation === value
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {gs(tKey)}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(DEFAULT_GRID_SETTINGS)}
            className="w-full h-7 text-xs"
          >
            {gs('resetToDefault')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
