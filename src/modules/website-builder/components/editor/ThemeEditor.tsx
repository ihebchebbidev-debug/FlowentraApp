import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SiteTheme } from '../../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Palette, Type, Maximize2, Languages, Navigation,
  ChevronDown, Sparkles, MousePointer2, LetterText, Settings2,
} from 'lucide-react';

interface ThemeEditorProps {
  theme: SiteTheme;
  onChange: (theme: SiteTheme) => void;
}

/* ─── Collapsible section ─── */
function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.FC<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/30 transition-colors"
      >
        <Icon className="h-3 w-3" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

/* ─── Categorized Fonts ─── */
const FONT_CATEGORIES: { category: string; fonts: string[] }[] = [
  {
    category: 'Sans Serif — Modern',
    fonts: [
      'Inter, sans-serif', 'DM Sans, sans-serif', 'Space Grotesk, sans-serif',
      'Plus Jakarta Sans, sans-serif', 'Outfit, sans-serif', 'Sora, sans-serif',
      'Urbanist, sans-serif', 'Figtree, sans-serif', 'Geist, sans-serif', 'Manrope, sans-serif',
    ],
  },
  {
    category: 'Sans Serif — Classic',
    fonts: [
      'Roboto, sans-serif', 'Open Sans, sans-serif', 'Lato, sans-serif', 'Poppins, sans-serif',
      'Montserrat, sans-serif', 'Nunito, sans-serif', 'Raleway, sans-serif',
      'Source Sans Pro, sans-serif', 'Work Sans, sans-serif', 'Rubik, sans-serif',
      'Mulish, sans-serif', 'Quicksand, sans-serif', 'Barlow, sans-serif',
      'Exo 2, sans-serif', 'Overpass, sans-serif', 'Karla, sans-serif',
      'Cabin, sans-serif', 'Josefin Sans, sans-serif', 'Archivo, sans-serif',
      'Red Hat Display, sans-serif',
    ],
  },
  {
    category: 'Serif — Elegant',
    fonts: [
      'Playfair Display, serif', 'Georgia, serif', 'Merriweather, serif', 'Lora, serif',
      'Cormorant Garamond, serif', 'Libre Baskerville, serif', 'Source Serif Pro, serif',
      'Crimson Text, serif', 'Noto Serif, serif', 'EB Garamond, serif',
      'Bitter, serif', 'Spectral, serif', 'DM Serif Display, serif', 'Fraunces, serif',
    ],
  },
  {
    category: 'Display — Bold',
    fonts: [
      'Bebas Neue, sans-serif', 'Oswald, sans-serif', 'Anton, sans-serif',
      'Righteous, cursive', 'Abril Fatface, cursive', 'Alfa Slab One, cursive',
      'Passion One, cursive', 'Teko, sans-serif', 'Russo One, sans-serif', 'Bungee, cursive',
    ],
  },
  {
    category: 'Monospace',
    fonts: [
      'JetBrains Mono, monospace', 'Fira Code, monospace', 'Source Code Pro, monospace',
      'IBM Plex Mono, monospace', 'Courier New, monospace', 'Space Mono, monospace',
      'Roboto Mono, monospace',
    ],
  },
  {
    category: 'Handwritten',
    fonts: [
      'Caveat, cursive', 'Dancing Script, cursive', 'Pacifico, cursive',
      'Satisfy, cursive', 'Great Vibes, cursive', 'Kalam, cursive', 'Patrick Hand, cursive',
    ],
  },
];

const ALL_FONTS = FONT_CATEGORIES.flatMap((c) => c.fonts);

/* ─── Presets (expanded) ─── */
const PRESET_THEMES: { name: string; theme: Partial<SiteTheme> }[] = [
  { name: 'Ocean Blue', theme: { primaryColor: '#3b82f6', secondaryColor: '#64748b', accentColor: '#f59e0b', backgroundColor: '#ffffff', textColor: '#1e293b' } },
  { name: 'Forest Green', theme: { primaryColor: '#16a34a', secondaryColor: '#4b5563', accentColor: '#eab308', backgroundColor: '#fafaf9', textColor: '#1c1917' } },
  { name: 'Sunset', theme: { primaryColor: '#ef4444', secondaryColor: '#78716c', accentColor: '#f97316', backgroundColor: '#fffbeb', textColor: '#292524' } },
  { name: 'Purple Dream', theme: { primaryColor: '#8b5cf6', secondaryColor: '#6b7280', accentColor: '#ec4899', backgroundColor: '#faf5ff', textColor: '#1e1b4b' } },
  { name: 'Midnight', theme: { primaryColor: '#60a5fa', secondaryColor: '#9ca3af', accentColor: '#fbbf24', backgroundColor: '#0f172a', textColor: '#f1f5f9' } },
  { name: 'Coral', theme: { primaryColor: '#fb7185', secondaryColor: '#a1a1aa', accentColor: '#34d399', backgroundColor: '#fff1f2', textColor: '#18181b' } },
  { name: 'Monochrome', theme: { primaryColor: '#18181b', secondaryColor: '#71717a', accentColor: '#a1a1aa', backgroundColor: '#ffffff', textColor: '#09090b' } },
  { name: 'Teal Fresh', theme: { primaryColor: '#14b8a6', secondaryColor: '#64748b', accentColor: '#f59e0b', backgroundColor: '#f0fdfa', textColor: '#134e4a' } },
  { name: 'Rose Gold', theme: { primaryColor: '#e11d48', secondaryColor: '#a8a29e', accentColor: '#d97706', backgroundColor: '#fdf2f8', textColor: '#1c1917' } },
  { name: 'Electric', theme: { primaryColor: '#6366f1', secondaryColor: '#94a3b8', accentColor: '#06b6d4', backgroundColor: '#020617', textColor: '#e2e8f0' } },
  { name: 'Sage', theme: { primaryColor: '#4d7c0f', secondaryColor: '#78716c', accentColor: '#ca8a04', backgroundColor: '#f7fee7', textColor: '#1a2e05' } },
  { name: 'Arctic', theme: { primaryColor: '#0ea5e9', secondaryColor: '#94a3b8', accentColor: '#a78bfa', backgroundColor: '#f0f9ff', textColor: '#0c4a6e' } },
  { name: 'Noir', theme: { primaryColor: '#fafafa', secondaryColor: '#a1a1aa', accentColor: '#fbbf24', backgroundColor: '#09090b', textColor: '#fafafa' } },
  { name: 'Terracotta', theme: { primaryColor: '#c2410c', secondaryColor: '#78716c', accentColor: '#0d9488', backgroundColor: '#fffbeb', textColor: '#431407' } },
  { name: 'Lavender', theme: { primaryColor: '#a855f7', secondaryColor: '#9ca3af', accentColor: '#f472b6', backgroundColor: '#faf5ff', textColor: '#3b0764' } },
  { name: 'Corporate', theme: { primaryColor: '#1d4ed8', secondaryColor: '#6b7280', accentColor: '#059669', backgroundColor: '#f8fafc', textColor: '#1e293b' } },
];

/* ─── Font search + picker ─── */
function FontPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const lowerSearch = search.toLowerCase();
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-medium">{label}</Label>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 rounded-lg border border-border/40 hover:border-primary/30 transition-colors text-left"
      >
        <span className="text-xs font-medium truncate" style={{ fontFamily: value }}>
          {value.split(',')[0]}
        </span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border border-border/40 rounded-lg overflow-hidden">
          <div className="p-1.5 border-b border-border/30">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('wb:theme.searchFonts')}
              className="h-6 text-[10px]"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {FONT_CATEGORIES.map((cat) => {
              const filtered = cat.fonts.filter((f) => f.toLowerCase().includes(lowerSearch));
              if (filtered.length === 0) return null;
              return (
                <div key={cat.category}>
                  <div className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40 bg-muted/20 sticky top-0">
                    {cat.category}
                  </div>
                  {filtered.map((font) => (
                    <button
                      key={font}
                      onClick={() => { onChange(font); setExpanded(false); setSearch(''); }}
                      className={`w-full px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent/50 ${value === font ? 'bg-primary/8 text-primary font-medium' : ''}`}
                      style={{ fontFamily: font }}
                    >
                      {font.split(',')[0]}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Chip picker ─── */
function ChipPicker<T extends string>({
  label, value, options, onChange,
}: {
  label: string; value: T; options: { label: string; value: T }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-medium">{label}</Label>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-2 py-1 rounded-md text-[9px] font-medium transition-all ${
              value === opt.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  Main ThemeEditor                              */
/* ═══════════════════════════════════════════════ */

export function ThemeEditor({ theme, onChange }: ThemeEditorProps) {
  const { t } = useTranslation();
  const update = (key: keyof SiteTheme, value: any) => {
    onChange({ ...theme, [key]: value });
  };

  const applyPreset = (preset: Partial<SiteTheme>) => {
    onChange({ ...theme, ...preset });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5" />
          {t('wb:theme.globalSettings')}
        </h3>

        {/* ─── PRESETS ─── */}
        <Section title={t('wb:theme.themePresets')} icon={Sparkles}>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_THEMES.map((preset) => {
              const isActive =
                preset.theme.primaryColor === theme.primaryColor &&
                preset.theme.backgroundColor === theme.backgroundColor;
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.theme)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-[10px] ${
                    isActive ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border/50 hover:border-primary/30 hover:bg-accent'
                  }`}
                >
                  <div className="flex gap-0.5 shrink-0">
                    <div className="w-3 h-3 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: preset.theme.primaryColor }} />
                    <div className="w-3 h-3 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: preset.theme.accentColor }} />
                    <div className="w-3 h-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.theme.backgroundColor }} />
                  </div>
                  <span className="truncate font-medium">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ─── COLORS ─── */}
        <Section title={t('wb:theme.colors')} icon={Palette}>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'primaryColor' as const, label: t('wb:theme.primary'), desc: t('wb:theme.buttonsCtas') },
              { key: 'secondaryColor' as const, label: t('wb:theme.secondary'), desc: t('wb:theme.subtleText') },
              { key: 'accentColor' as const, label: t('wb:theme.accent'), desc: t('wb:theme.highlights') },
              { key: 'backgroundColor' as const, label: t('wb:theme.background'), desc: t('wb:theme.pageBg') },
              { key: 'textColor' as const, label: t('wb:theme.text'), desc: t('wb:theme.bodyText') },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="rounded-lg border border-border/40 p-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={theme[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className="w-5 h-5 rounded border cursor-pointer shrink-0"
                  />
                  <div>
                    <Label className="text-[9px] font-semibold block leading-tight">{label}</Label>
                    <span className="text-[7px] text-muted-foreground/50">{desc}</span>
                  </div>
                </div>
                <Input
                  value={theme[key]}
                  onChange={(e) => update(key, e.target.value)}
                  className="h-5 text-[8px] font-mono"
                />
              </div>
            ))}
          </div>
          <div className="rounded-lg overflow-hidden flex h-4 shadow-inner border border-border/30">
            {[theme.primaryColor, theme.secondaryColor, theme.accentColor, theme.backgroundColor, theme.textColor].map((color, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
        </Section>

        {/* ─── TYPOGRAPHY ─── */}
        <Section title={t('wb:theme.typographySection')} icon={Type}>
          <FontPicker label={t('wb:theme.headingFont')} value={theme.headingFont} onChange={(v) => update('headingFont', v)} />
          <FontPicker label={t('wb:theme.bodyFont')} value={theme.bodyFont} onChange={(v) => update('bodyFont', v)} />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-medium">{t('wb:theme.fontScale')}</Label>
              <span className="text-[9px] text-muted-foreground font-mono">{(theme.fontScale ?? 1).toFixed(2)}×</span>
            </div>
            <Slider value={[theme.fontScale ?? 1]} min={0.85} max={1.25} step={0.05} onValueChange={([v]) => update('fontScale', v)} className="w-full" />
            <div className="flex justify-between text-[7px] text-muted-foreground/40">
              <span>{t('wb:theme.compact')}</span>
              <span>{t('wb:theme.normal')}</span>
              <span>{t('wb:theme.large')}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-medium">{t('wb:theme.headingLetterSpacing')}</Label>
              <span className="text-[9px] text-muted-foreground font-mono">{(theme.letterSpacing ?? 0).toFixed(2)}em</span>
            </div>
            <Slider value={[theme.letterSpacing ?? 0]} min={-0.05} max={0.2} step={0.01} onValueChange={([v]) => update('letterSpacing', v)} className="w-full" />
          </div>

          <ChipPicker
            label={t('wb:theme.headingStyle')}
            value={theme.headingTransform ?? 'none'}
            options={[
              { label: t('wb:theme.normalStyle'), value: 'none' },
              { label: t('wb:theme.uppercase'), value: 'uppercase' },
              { label: t('wb:theme.capitalize'), value: 'capitalize' },
            ]}
            onChange={(v) => update('headingTransform', v)}
          />

          <div className="rounded-lg border border-border/30 p-3 space-y-1" style={{ backgroundColor: theme.backgroundColor }}>
            <p
              className="text-sm font-bold"
              style={{
                color: theme.textColor,
                fontFamily: theme.headingFont,
                fontSize: `${14 * (theme.fontScale ?? 1)}px`,
                letterSpacing: `${theme.letterSpacing ?? 0}em`,
                textTransform: (theme.headingTransform ?? 'none') as any,
              }}
            >
              {t('wb:theme.headingPreview')}
            </p>
            <p
              className="text-xs"
              style={{
                color: theme.secondaryColor,
                fontFamily: theme.bodyFont,
                fontSize: `${12 * (theme.fontScale ?? 1)}px`,
              }}
            >
              {t('wb:theme.bodyTextPreview')}
            </p>
          </div>
        </Section>

        {/* ─── STYLE & SHAPE ─── */}
        <Section title={t('wb:theme.styleShape')} icon={Maximize2}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-medium">{t('wb:theme.borderRadius')}</Label>
              <span className="text-[9px] text-muted-foreground font-mono">{theme.borderRadius}px</span>
            </div>
            <Slider value={[theme.borderRadius]} min={0} max={24} step={1} onValueChange={([v]) => update('borderRadius', v)} className="w-full" />
            <div className="flex gap-1 pt-0.5">
              {[0, 4, 8, 12, 20].map((r) => (
                <button
                  key={r}
                  onClick={() => update('borderRadius', r)}
                  className={`flex-1 h-6 border transition-all ${theme.borderRadius === r ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-primary/30'}`}
                  style={{ borderRadius: r }}
                />
              ))}
            </div>
          </div>

          <ChipPicker
            label={t('wb:theme.shadowStyle')}
            value={theme.shadowStyle ?? 'subtle'}
            options={[
              { label: t('wb:theme.none'), value: 'none' },
              { label: t('wb:theme.subtle'), value: 'subtle' },
              { label: t('wb:theme.medium'), value: 'medium' },
              { label: t('wb:theme.dramatic'), value: 'dramatic' },
            ]}
            onChange={(v) => update('shadowStyle', v)}
          />

          <ChipPicker
            label={t('wb:theme.buttonStyle')}
            value={theme.buttonStyle ?? 'rounded'}
            options={[
              { label: t('wb:theme.rounded'), value: 'rounded' },
              { label: t('wb:theme.pill'), value: 'pill' },
              { label: t('wb:theme.square'), value: 'square' },
              { label: t('wb:theme.outlined'), value: 'outlined' },
            ]}
            onChange={(v) => update('buttonStyle', v)}
          />

          <div className="flex gap-2 pt-1">
            {(['rounded', 'pill', 'square', 'outlined'] as const).map((s) => {
              const isActive = (theme.buttonStyle ?? 'rounded') === s;
              const radius = s === 'pill' ? 999 : s === 'square' ? 0 : theme.borderRadius;
              const isOutlined = s === 'outlined';
              return (
                <button
                  key={s}
                  onClick={() => update('buttonStyle', s)}
                  className={`flex-1 py-1.5 text-[8px] font-semibold transition-all ${isActive ? 'ring-1 ring-primary/40' : ''}`}
                  style={{
                    borderRadius: radius,
                    backgroundColor: isOutlined ? 'transparent' : theme.primaryColor,
                    color: isOutlined ? theme.primaryColor : '#ffffff',
                    border: isOutlined ? `2px solid ${theme.primaryColor}` : 'none',
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </div>

          <ChipPicker
            label={t('wb:theme.linkStyle')}
            value={theme.linkStyle ?? 'hover-underline'}
            options={[
              { label: t('wb:theme.noUnderline'), value: 'none' },
              { label: t('wb:theme.alwaysUnderline'), value: 'underline' },
              { label: t('wb:theme.hoverUnderline'), value: 'hover-underline' },
            ]}
            onChange={(v) => update('linkStyle', v)}
          />
        </Section>

        {/* ─── SPACING & LAYOUT ─── */}
        <Section title={t('wb:theme.spacingLayout')} icon={Settings2} defaultOpen={false}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-medium">{t('wb:theme.baseSpacing')}</Label>
              <span className="text-[9px] text-muted-foreground font-mono">{theme.spacing}px</span>
            </div>
            <Slider value={[theme.spacing]} min={8} max={32} step={2} onValueChange={([v]) => update('spacing', v)} className="w-full" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-medium">{t('wb:theme.sectionPadding')}</Label>
              <span className="text-[9px] text-muted-foreground font-mono">{(theme.sectionPadding ?? 1).toFixed(1)}×</span>
            </div>
            <Slider value={[theme.sectionPadding ?? 1]} min={0.5} max={2} step={0.1} onValueChange={([v]) => update('sectionPadding', v)} className="w-full" />
            <div className="flex justify-between text-[7px] text-muted-foreground/40">
              <span>{t('wb:theme.compact')}</span>
              <span>{t('wb:theme.normal')}</span>
              <span>{t('wb:theme.spacious')}</span>
            </div>
          </div>
        </Section>

        {/* ─── TEXT DIRECTION ─── */}
        <Section title={t('wb:theme.textDirection')} icon={Languages} defaultOpen={false}>
          <div className="flex gap-1.5">
            <Button variant={theme.direction !== 'rtl' ? 'default' : 'outline'} size="sm" className="flex-1 h-8 text-xs" onClick={() => update('direction', 'ltr')}>
              LTR ←→
            </Button>
            <Button variant={theme.direction === 'rtl' ? 'default' : 'outline'} size="sm" className="flex-1 h-8 text-xs" onClick={() => update('direction', 'rtl')}>
              RTL →←
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground">
            {theme.direction === 'rtl' ? t('wb:theme.rtlDesc') : t('wb:theme.ltrDesc')}
          </p>
        </Section>

        {/* ─── NAVIGATION HINTS ─── */}
        <Section title={t('wb:theme.navigationStyles')} icon={Navigation} defaultOpen={false}>
          <div className="space-y-1.5">
            {[
              { label: t('wb:theme.matchTheme'), desc: t('wb:theme.matchThemeDesc'), bg: theme.backgroundColor, fg: theme.textColor, cta: theme.primaryColor },
              { label: t('wb:theme.inverted'), desc: t('wb:theme.invertedDesc'), bg: theme.textColor, fg: theme.backgroundColor, cta: theme.accentColor },
              { label: t('wb:theme.primaryBar'), desc: t('wb:theme.primaryBarDesc'), bg: theme.primaryColor, fg: '#ffffff', cta: theme.accentColor },
              { label: t('wb:theme.accentBar'), desc: t('wb:theme.accentBarDesc'), bg: theme.accentColor, fg: '#ffffff', cta: theme.primaryColor },
            ].map((opt) => (
              <div key={opt.label} className="flex items-center gap-2 p-2 rounded-lg border border-border/40">
                <div className="w-14 h-4 rounded flex items-center gap-0.5 px-1 shrink-0 border border-black/5" style={{ backgroundColor: opt.bg }}>
                  <div className="w-2.5 h-1 rounded-sm" style={{ backgroundColor: opt.fg }} />
                  <div className="flex-1" />
                  <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: opt.cta }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-medium truncate">{opt.label}</p>
                  <p className="text-[7px] text-muted-foreground/50 truncate">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[8px] text-muted-foreground/50" dangerouslySetInnerHTML={{ __html: t('wb:theme.navHint') }} />
        </Section>

        {/* ─── LIVE PREVIEW ─── */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{t('wb:theme.livePreview')}</Label>
          <div
            dir={theme.direction || 'ltr'}
            className="rounded-lg p-4 border space-y-2"
            style={{ backgroundColor: theme.backgroundColor, borderRadius: theme.borderRadius }}
          >
            <p
              className="font-bold"
              style={{
                color: theme.textColor,
                fontFamily: theme.headingFont,
                fontSize: `${14 * (theme.fontScale ?? 1)}px`,
                letterSpacing: `${theme.letterSpacing ?? 0}em`,
                textTransform: (theme.headingTransform ?? 'none') as any,
              }}
            >
              {t('wb:theme.headingStylePreview')}
            </p>
            <p
              style={{
                color: theme.secondaryColor,
                fontFamily: theme.bodyFont,
                fontSize: `${11 * (theme.fontScale ?? 1)}px`,
              }}
            >
              {t('wb:theme.bodyTextLivePreview')}
            </p>
            <div className="flex gap-2 pt-1">
              <div
                className="px-3 py-1.5 text-[10px] font-medium text-white"
                style={{
                  backgroundColor: theme.primaryColor,
                  borderRadius: theme.buttonStyle === 'pill' ? 999 : theme.buttonStyle === 'square' ? 0 : theme.borderRadius,
                  boxShadow: theme.shadowStyle === 'dramatic' ? '0 4px 14px rgba(0,0,0,0.15)' : theme.shadowStyle === 'medium' ? '0 2px 8px rgba(0,0,0,0.1)' : theme.shadowStyle === 'subtle' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {t('wb:theme.primaryButton')}
              </div>
              <div
                className="px-3 py-1.5 text-[10px] font-medium"
                style={{
                  backgroundColor: theme.buttonStyle === 'outlined' ? 'transparent' : theme.accentColor,
                  color: theme.buttonStyle === 'outlined' ? theme.accentColor : '#ffffff',
                  border: theme.buttonStyle === 'outlined' ? `1.5px solid ${theme.accentColor}` : 'none',
                  borderRadius: theme.buttonStyle === 'pill' ? 999 : theme.buttonStyle === 'square' ? 0 : theme.borderRadius,
                }}
              >
                {t('wb:theme.accentButton')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
