import type { KpiBgConfig } from '../../types';

/** Build inline background style from KpiBgConfig */
export function buildBgStyle(bg: KpiBgConfig | undefined, fallbackColor: string) {
  const c1 = bg?.color1 || fallbackColor;
  const c2 = bg?.color2 || c1;
  const opacity = (bg?.opacity ?? 8) / 100;
  const angle = bg?.gradientAngle ?? 135;
  const style = bg?.style || 'subtle';

  switch (style) {
    case 'solid':
      return { backgroundColor: c1, opacity };
    case 'gradient':
      return {
        background: `linear-gradient(${angle}deg, ${c1}, ${c2})`,
        opacity,
      };
    case 'glass':
      return {
        background: `linear-gradient(${angle}deg, ${c1}40, ${c2}20)`,
        backdropFilter: 'blur(12px)',
        opacity: Math.max(opacity, 0.3),
      };
    case 'subtle':
    default:
      return {
        background: `linear-gradient(${angle}deg, ${c1} 0%, ${c1}88 50%, transparent 100%)`,
        opacity: 0.07,
      };
  }
}

/** SVG/CSS background effect patterns */
export function BgEffect({ effect, color, id }: { effect: string; color: string; id?: string }) {
  const effectOpacity = 0.06;
  const uid = id || 'w';

  switch (effect) {
    case 'wave':
      return (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none" style={{ opacity: effectOpacity }}>
          <path d="M0,120 C80,180 160,100 240,140 C320,180 360,100 400,120 L400,200 L0,200Z" fill={color} />
          <path d="M0,160 C100,120 200,180 300,140 C350,120 380,160 400,150 L400,200 L0,200Z" fill={color} opacity="0.5" />
        </svg>
      );
    case 'dots':
      return (
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: effectOpacity }}>
          <defs>
            <pattern id={`bg-dots-${uid}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.5" fill={color} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#bg-dots-${uid})`} />
        </svg>
      );
    case 'rings':
      return (
        <svg className="absolute top-1/2 right-0 translate-x-1/4 -translate-y-1/2 h-[200%] aspect-square" style={{ opacity: effectOpacity }}>
          <circle cx="50%" cy="50%" r="20%" stroke={color} strokeWidth="1" fill="none" />
          <circle cx="50%" cy="50%" r="35%" stroke={color} strokeWidth="1" fill="none" />
          <circle cx="50%" cy="50%" r="50%" stroke={color} strokeWidth="1" fill="none" />
        </svg>
      );
    case 'diagonal':
      return (
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: effectOpacity }}>
          <defs>
            <pattern id={`bg-diag-${uid}`} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="14" stroke={color} strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#bg-diag-${uid})`} />
        </svg>
      );
    case 'glow':
      return (
        <div
          className="absolute -top-1/2 -right-1/4 w-3/4 h-[200%] rounded-full blur-3xl"
          style={{ backgroundColor: color, opacity: 0.12 }}
        />
      );
    case 'mesh':
      return (
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: effectOpacity * 0.8 }}>
          <defs>
            <pattern id={`bg-mesh-${uid}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M0,15 L15,0 L30,15 L15,30Z" stroke={color} strokeWidth="0.8" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#bg-mesh-${uid})`} />
        </svg>
      );
    case 'hexagons':
      return (
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: effectOpacity }}>
          <defs>
            <pattern id={`bg-hex-${uid}`} x="0" y="0" width="28" height="49" patternUnits="userSpaceOnUse">
              <polygon points="14,2 26,10 26,25 14,33 2,25 2,10" stroke={color} strokeWidth="0.8" fill="none" />
              <polygon points="14,18 26,26 26,41 14,49 2,41 2,26" stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#bg-hex-${uid})`} />
        </svg>
      );
    case 'noise':
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      );
    case 'crosshatch':
      return (
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: effectOpacity }}>
          <defs>
            <pattern id={`bg-cross-${uid}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="16" y2="16" stroke={color} strokeWidth="0.6" />
              <line x1="16" y1="0" x2="0" y2="16" stroke={color} strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#bg-cross-${uid})`} />
        </svg>
      );
    case 'aurora':
      return (
        <>
          <div
            className="absolute -top-1/3 -left-1/4 w-2/3 h-[150%] rounded-full blur-3xl"
            style={{ backgroundColor: color, opacity: 0.08 }}
          />
          <div
            className="absolute -bottom-1/3 -right-1/4 w-1/2 h-[120%] rounded-full blur-3xl"
            style={{ backgroundColor: color, opacity: 0.06, filter: 'hue-rotate(40deg)' }}
          />
        </>
      );
    default:
      return null;
  }
}

/** Preset gradient configurations */
export const BG_PRESETS = [
  { c1: '#6366f1', c2: '#a855f7', label: 'Indigo→Purple' },
  { c1: '#3b82f6', c2: '#06b6d4', label: 'Blue→Cyan' },
  { c1: '#10b981', c2: '#84cc16', label: 'Emerald→Lime' },
  { c1: '#f59e0b', c2: '#ef4444', label: 'Amber→Red' },
  { c1: '#ec4899', c2: '#8b5cf6', label: 'Pink→Violet' },
  { c1: '#1e293b', c2: '#334155', label: 'Slate Dark' },
  { c1: '#0ea5e9', c2: '#6366f1', label: 'Sky→Indigo' },
  { c1: '#f97316', c2: '#ec4899', label: 'Orange→Pink' },
  { c1: '#14b8a6', c2: '#3b82f6', label: 'Teal→Blue' },
  { c1: '#8b5cf6', c2: '#ec4899', label: 'Violet→Rose' },
  { c1: '#059669', c2: '#0d9488', label: 'Emerald Dark' },
  { c1: '#dc2626', c2: '#9333ea', label: 'Red→Purple' },
];

/** Effect options list */
export const BG_EFFECTS = [
  { key: 'none', label: 'None' },
  { key: 'wave', label: '🌊 Wave' },
  { key: 'dots', label: '⬡ Dots' },
  { key: 'rings', label: '◎ Rings' },
  { key: 'diagonal', label: '⟋ Lines' },
  { key: 'glow', label: '✦ Glow' },
  { key: 'mesh', label: '◇ Mesh' },
  { key: 'hexagons', label: '⬢ Hex' },
  { key: 'noise', label: '░ Noise' },
  { key: 'crosshatch', label: '✕ Cross' },
  { key: 'aurora', label: '🌈 Aurora' },
] as const;

interface WidgetBackgroundProps {
  bg: KpiBgConfig | undefined;
  fallbackColor: string;
  widgetId: string;
  children: React.ReactNode;
}

/**
 * Wraps any widget content with configurable background layers.
 * Use this in any widget to add background styles + effects.
 */
export function WidgetBackground({ bg, fallbackColor, widgetId, children }: WidgetBackgroundProps) {
  const bgStyle = buildBgStyle(bg, fallbackColor);
  const effectKey = bg?.effect || ((!bg || bg.style === 'subtle') ? 'none' : 'none');
  const effectColor = bg?.color1 || fallbackColor;

  // If no bg config at all, just render children directly
  if (!bg || bg.style === 'subtle') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
        {children}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
      <div className="absolute inset-0" style={bgStyle} />
      <BgEffect effect={effectKey} color={effectColor} id={widgetId} />
      <div className="relative h-full w-full">
        {children}
      </div>
    </div>
  );
}
