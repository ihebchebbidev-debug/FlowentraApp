/**
 * ThemeSwatches — renders a row of theme token swatches that resolve to real
 * hex values from the running CSS variables (--primary, --secondary, --accent,
 * --background, --foreground, --muted, --border, --card). Clicking a swatch
 * emits the resolved hex, so downstream style storage stays framework-agnostic
 * (no `hsl(var(--…))` strings that would break export or lose meaning
 * outside the editor).
 */
import React, { useEffect, useState } from 'react';

const TOKENS: { key: string; label: string; cssVar: string }[] = [
  { key: 'primary',     label: 'Primary',     cssVar: '--primary' },
  { key: 'secondary',   label: 'Secondary',   cssVar: '--secondary' },
  { key: 'accent',      label: 'Accent',      cssVar: '--accent' },
  { key: 'foreground',  label: 'Text',        cssVar: '--foreground' },
  { key: 'background',  label: 'Background',  cssVar: '--background' },
  { key: 'muted',       label: 'Muted',       cssVar: '--muted' },
  { key: 'border',      label: 'Border',      cssVar: '--border' },
  { key: 'card',        label: 'Card',        cssVar: '--card' },
];

/** Resolve `hsl(H S% L%)` → `#rrggbb`. Returns '' if unparseable. */
function hslTripletToHex(triplet: string): string {
  // Accepts either "220 40% 50%" or "hsl(220 40% 50%)"
  const m = triplet
    .replace(/^hsl\(/, '')
    .replace(/\)$/, '')
    .trim()
    .match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) return '';
  const h = parseFloat(m[1]);
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m0 = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) => Math.round((n + m0) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Read the resolved value of a CSS custom property from :root. */
function readCssVar(cssVar: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
}

export interface ResolvedToken {
  key: string;
  label: string;
  hex: string;
}

/** Public hook for anywhere else that wants the resolved theme tokens. */
export function useThemeSwatches(): ResolvedToken[] {
  const [tokens, setTokens] = useState<ResolvedToken[]>([]);
  useEffect(() => {
    const resolve = () =>
      TOKENS.map(t => {
        const raw = readCssVar(t.cssVar);
        // Values in this project are stored as HSL triplets ("220 40% 50%"),
        // but be defensive: accept hex or rgb() as-is.
        let hex = '';
        if (!raw) hex = '';
        else if (raw.startsWith('#')) hex = raw;
        else if (raw.startsWith('rgb')) hex = raw;   // preserve rgb() for downstream
        else hex = hslTripletToHex(raw);
        return { key: t.key, label: t.label, hex };
      }).filter(t => t.hex);
    setTokens(resolve());
    // Re-resolve when the class list on <html> flips (dark/light mode toggles).
    const observer = new MutationObserver(() => setTokens(resolve()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    return () => observer.disconnect();
  }, []);
  return tokens;
}

interface ThemeSwatchesProps {
  currentValue?: string;
  onSelect: (hex: string) => void;
  compact?: boolean;
}

export function ThemeSwatches({ currentValue, onSelect, compact = false }: ThemeSwatchesProps) {
  const tokens = useThemeSwatches();
  if (tokens.length === 0) return null;
  return (
    <div className={compact ? 'flex flex-wrap gap-1' : 'grid grid-cols-8 gap-1.5'}>
      {tokens.map(t => {
        const isActive = currentValue && currentValue.toLowerCase() === t.hex.toLowerCase();
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.hex)}
            title={`${t.label} · ${t.hex}`}
            className={`h-5 w-5 rounded-md border border-border/30 transition-transform hover:scale-110 ${
              isActive ? 'ring-2 ring-primary ring-offset-1' : ''
            }`}
            style={{ backgroundColor: t.hex }}
          />
        );
      })}
    </div>
  );
}