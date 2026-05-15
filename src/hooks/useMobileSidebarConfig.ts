import { useState, useCallback } from 'react';

export type MobileSidebarSide = 'left' | 'right';
export type MobileSidebarWidth = 'compact' | 'default' | 'wide';
export type MobileSidebarAnimation = 'smooth' | 'spring' | 'snappy';
export type MobileSidebarItemStyle = 'rounded' | 'pill' | 'flat' | 'outlined' | 'filled';
export type MobileSidebarFontSize = 'small' | 'medium' | 'large';
export type MobileSidebarIconShape = 'rounded' | 'circle' | 'square' | 'none';

/** Predefined color presets the user can pick from */
export const COLOR_PRESETS = [
  { label: 'Default', value: '' },
  { label: 'Blue', value: '217 91% 60%' },
  { label: 'Violet', value: '263 70% 58%' },
  { label: 'Rose', value: '347 77% 50%' },
  { label: 'Orange', value: '25 95% 53%' },
  { label: 'Emerald', value: '160 84% 39%' },
  { label: 'Cyan', value: '189 94% 43%' },
  { label: 'Amber', value: '38 92% 50%' },
  { label: 'Slate', value: '215 16% 47%' },
] as const;

/** Sidebar theme presets (background + foreground + accent + border + primary) */
export const SIDEBAR_THEME_PRESETS = [
  { label: 'Default', bg: '', fg: '', accent: '', border: '', primary: '' },
  { label: 'Snow', bg: '0 0% 99%', fg: '220 14% 20%', accent: '220 14% 95%', border: '220 14% 90%', primary: '220 70% 55%' },
  { label: 'Slate', bg: '215 28% 17%', fg: '210 20% 92%', accent: '215 28% 22%', border: '215 28% 28%', primary: '210 70% 60%' },
  { label: 'Charcoal', bg: '220 16% 10%', fg: '220 14% 90%', accent: '220 16% 15%', border: '220 16% 22%', primary: '4 90% 58%' },
  { label: 'Navy', bg: '222 47% 11%', fg: '213 31% 91%', accent: '222 47% 16%', border: '222 47% 22%', primary: '199 89% 48%' },
  { label: 'Forest', bg: '155 30% 10%', fg: '155 10% 90%', accent: '155 30% 16%', border: '155 30% 22%', primary: '160 84% 39%' },
  { label: 'Wine', bg: '340 25% 12%', fg: '340 10% 90%', accent: '340 25% 18%', border: '340 25% 24%', primary: '347 77% 50%' },
  { label: 'Midnight', bg: '240 20% 6%', fg: '240 10% 90%', accent: '240 20% 12%', border: '240 20% 18%', primary: '263 70% 58%' },
  { label: 'Warm', bg: '30 20% 96%', fg: '30 10% 20%', accent: '30 20% 90%', border: '30 20% 85%', primary: '25 95% 53%' },
] as const;

export const ACTIVE_BG_PRESETS = [
  { label: 'Default', value: '' },
  { label: 'Primary tint', value: 'primary/10' },
  { label: 'Primary fill', value: 'primary/20' },
  { label: 'Accent', value: 'accent' },
  { label: 'Muted', value: 'muted' },
  { label: 'Blue tint', value: '[hsl(217,91%,60%)]/10' },
  { label: 'Rose tint', value: '[hsl(347,77%,50%)]/10' },
  { label: 'Emerald tint', value: '[hsl(160,84%,39%)]/10' },
] as const;

export interface MobileSidebarConfig {
  /** Which side the sidebar slides in from */
  side: MobileSidebarSide;
  /** Width preset */
  width: MobileSidebarWidth;
  /** Animation style */
  animation: MobileSidebarAnimation;
  /** Show item descriptions below titles */
  showDescriptions: boolean;
  /** Show group section headers (Workspace, CRM, etc.) */
  showGroupHeaders: boolean;
  /** Compact item height */
  compactMode: boolean;
  /** Show brand header with logo */
  showBrandHeader: boolean;
  /** Enable backdrop blur on overlay */
  backdropBlur: boolean;
  /** Swipe to open/close gesture */
  swipeGesture: boolean;

  // ── Styling options ──────────────────────────
  /** Custom icon color (HSL string like '217 91% 60%') – empty = theme primary */
  iconColor: string;
  /** Icon container shape */
  iconShape: MobileSidebarIconShape;
  /** Nav item style variant */
  itemStyle: MobileSidebarItemStyle;
  /** Font size for item labels */
  fontSize: MobileSidebarFontSize;
  /** Active item background color token (e.g. 'primary/10') – empty = default */
  activeBg: string;
  /** Show icon background container */
  showIconBg: boolean;

  // ── Sidebar Theme Colors (HSL strings) ──────────────────
  /** Custom sidebar background – empty = CSS default */
  sidebarBg: string;
  /** Custom sidebar text color */
  sidebarFg: string;
  /** Custom sidebar accent/hover background */
  sidebarAccent: string;
  /** Custom sidebar border color */
  sidebarBorder: string;
  /** Custom sidebar primary/active color */
  sidebarPrimary: string;
}

const STORAGE_KEY = 'mobile-sidebar-config';

const DEFAULT_CONFIG: MobileSidebarConfig = {
  side: 'left',
  width: 'default',
  animation: 'smooth',
  showDescriptions: true,
  showGroupHeaders: true,
  compactMode: false,
  showBrandHeader: true,
  backdropBlur: true,
  swipeGesture: true,
  // Styling defaults
  iconColor: '',
  iconShape: 'rounded',
  itemStyle: 'rounded',
  fontSize: 'medium',
  activeBg: '',
  showIconBg: true,
  // Theme colors
  sidebarBg: '',
  sidebarFg: '',
  sidebarAccent: '',
  sidebarBorder: '',
  sidebarPrimary: '',
};

function loadConfig(): MobileSidebarConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: MobileSidebarConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export const WIDTH_MAP: Record<MobileSidebarWidth, string> = {
  compact: 'w-72',
  default: 'w-80',
  wide: 'w-[22rem]',
};

export const ANIMATION_DURATIONS: Record<MobileSidebarAnimation, { open: string; close: string }> = {
  smooth: { open: '400ms', close: '350ms' },
  spring: { open: '500ms', close: '400ms' },
  snappy: { open: '200ms', close: '150ms' },
};

export const FONT_SIZE_MAP: Record<MobileSidebarFontSize, { label: string; sub: string }> = {
  small: { label: 'text-xs', sub: 'text-[10px]' },
  medium: { label: 'text-sm', sub: 'text-[11px]' },
  large: { label: 'text-base', sub: 'text-xs' },
};

export const ICON_SHAPE_MAP: Record<MobileSidebarIconShape, string> = {
  rounded: 'rounded-lg',
  circle: 'rounded-full',
  square: 'rounded-none',
  none: '',
};

export const ITEM_STYLE_CLASSES = {
  rounded: {
    base: 'rounded-xl',
    active: 'bg-primary/10 shadow-sm',
    inactive: 'hover:bg-sidebar-accent/50',
  },
  pill: {
    base: 'rounded-full',
    active: 'bg-primary/10 shadow-sm',
    inactive: 'hover:bg-sidebar-accent/50',
  },
  flat: {
    base: 'rounded-none',
    active: 'bg-primary/10 border-l-2 border-primary',
    inactive: 'hover:bg-sidebar-accent/30',
  },
  outlined: {
    base: 'rounded-xl border',
    active: 'border-primary/40 bg-primary/5 shadow-sm',
    inactive: 'border-transparent hover:border-border hover:bg-sidebar-accent/30',
  },
  filled: {
    base: 'rounded-xl',
    active: 'bg-primary text-primary-foreground shadow-md',
    inactive: 'hover:bg-sidebar-accent/50',
  },
} as const;

export function useMobileSidebarConfig() {
  const [config, setConfigState] = useState<MobileSidebarConfig>(loadConfig);

  const updateConfig = useCallback((partial: Partial<MobileSidebarConfig>) => {
    setConfigState(prev => {
      const next = { ...prev, ...partial };
      saveConfig(next);
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_CONFIG);
    saveConfig(DEFAULT_CONFIG);
  }, []);

  return { config, updateConfig, resetConfig };
}
