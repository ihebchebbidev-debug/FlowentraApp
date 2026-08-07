import { useEffect } from 'react';
import type { MobileSidebarConfig } from './useMobileSidebarConfig';

/**
 * Applies sidebar color overrides as CSS custom properties on :root.
 * When a value is empty, the variable is removed (falling back to the CSS default).
 */
const VAR_MAP: { key: keyof MobileSidebarConfig; cssVar: string }[] = [
  { key: 'sidebarBg', cssVar: '--sidebar-background' },
  { key: 'sidebarFg', cssVar: '--sidebar-foreground' },
  { key: 'sidebarAccent', cssVar: '--sidebar-accent' },
  { key: 'sidebarBorder', cssVar: '--sidebar-border' },
  { key: 'sidebarPrimary', cssVar: '--sidebar-primary' },
];

export function useSidebarThemeApply(config: MobileSidebarConfig) {
  useEffect(() => {
    const root = document.documentElement;
    VAR_MAP.forEach(({ key, cssVar }) => {
      const value = config[key] as string;
      if (value) {
        root.style.setProperty(cssVar, value);
      } else {
        root.style.removeProperty(cssVar);
      }
    });

    return () => {
      // Clean up on unmount
      VAR_MAP.forEach(({ cssVar }) => {
        root.style.removeProperty(cssVar);
      });
    };
  }, [
    config.sidebarBg,
    config.sidebarFg,
    config.sidebarAccent,
    config.sidebarBorder,
    config.sidebarPrimary,
  ]);
}
