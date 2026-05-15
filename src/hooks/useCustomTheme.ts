import { useState, useEffect } from 'react';

export interface CustomTheme {
  primary: string;
  primaryHover: string;
  primaryLight: string;
}

const DEFAULT_THEME: CustomTheme = {
  primary: '4 90% 58%',
  primaryHover: '4 90% 48%',
  primaryLight: '4 90% 95%'
};

// Convert hex to HSL
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s; const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Generate variations of the color
function generateThemeFromColor(color: string): CustomTheme {
  const hsl = hexToHsl(color);
  const [h, s, l] = hsl.split(' ').map((val, idx) => {
    if (idx === 0) return parseInt(val);
    return parseInt(val.replace('%', ''));
  });

  return {
    primary: `${h} ${s}% ${l}%`,
    primaryHover: `${h} ${s}% ${Math.max(l - 10, 10)}%`,
    primaryLight: `${h} ${s}% ${Math.min(l + 30, 95)}%`
  };
}

export function useCustomTheme() {
  const [customTheme, setCustomTheme] = useState<CustomTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowsolution-custom-theme');
      return saved ? JSON.parse(saved) : DEFAULT_THEME;
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply custom theme
    root.style.setProperty('--primary', customTheme.primary);
    root.style.setProperty('--primary-hover', customTheme.primaryHover);
    root.style.setProperty('--primary-light', customTheme.primaryLight);
    
    // Update chart colors to match
    root.style.setProperty('--chart-1', customTheme.primary);
    root.style.setProperty('--info', customTheme.primary);
    root.style.setProperty('--chart-6', customTheme.primaryHover);
  }, [customTheme]);

  const updateTheme = (color: string) => {
    const newTheme = generateThemeFromColor(color);
    setCustomTheme(newTheme);
    localStorage.setItem('flowsolution-custom-theme', JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setCustomTheme(DEFAULT_THEME);
    localStorage.removeItem('flowsolution-custom-theme');
  };

  return {
    customTheme,
    updateTheme,
    resetTheme
  };
}