import React, { useState, useEffect } from 'react';
import { SiteTheme } from '../../../types';

interface LoadingScreenBlockProps {
  variant: 'spinner' | 'progress' | 'logo-fade' | 'dots' | 'bars' | 'pulse-ring';
  logoText: string;
  logoImage: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  loadingText: string;
  showPercentage: boolean;
  duration: number; // seconds
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

function Spinner({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <div
      className="rounded-full border-2 animate-spin"
      style={{
        width: size,
        height: size,
        borderColor: color + '25',
        borderTopColor: color,
      }}
    />
  );
}

function DotsLoader({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: color,
            animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function BarsLoader({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="w-1.5 rounded-full"
          style={{
            backgroundColor: color,
            animation: `barBounce 1.2s ease-in-out ${i * 0.1}s infinite`,
            height: '100%',
          }}
        />
      ))}
      <style>{`
        @keyframes barBounce {
          0%, 40%, 100% { transform: scaleY(0.4); }
          20% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

function PulseRing({ color }: { color: string }) {
  return (
    <div className="relative w-12 h-12">
      <div
        className="absolute inset-0 rounded-full animate-ping"
        style={{ backgroundColor: color + '30' }}
      />
      <div
        className="absolute inset-2 rounded-full animate-pulse"
        style={{ backgroundColor: color + '60' }}
      />
      <div
        className="absolute inset-4 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export function LoadingScreenBlock({
  variant = 'spinner',
  logoText = '',
  logoImage = '',
  backgroundColor = '#ffffff',
  accentColor = '#3B82F6',
  textColor = '#333333',
  loadingText = 'Loading...',
  showPercentage = false,
  duration = 3,
  theme,
  isEditing,
  onUpdate,
  style,
}: LoadingScreenBlockProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!showPercentage && variant !== 'progress') return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.random() * 15;
      });
    }, (duration * 1000) / 20);
    return () => clearInterval(interval);
  }, [duration, showPercentage, variant]);

  const displayProgress = Math.min(Math.round(progress), 100);

  const renderLoader = () => {
    switch (variant) {
      case 'spinner': return <Spinner color={accentColor} />;
      case 'dots': return <DotsLoader color={accentColor} />;
      case 'bars': return <BarsLoader color={accentColor} />;
      case 'pulse-ring': return <PulseRing color={accentColor} />;
      case 'progress':
        return (
          <div className="w-48">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: accentColor + '20' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${displayProgress}%`, backgroundColor: accentColor }}
              />
            </div>
          </div>
        );
      case 'logo-fade':
        return (
          <div className="animate-pulse">
            {logoImage ? (
              <img src={logoImage} alt={logoText} className="h-16 w-auto" />
            ) : (
              <span className="text-3xl font-bold" style={{ color: accentColor, fontFamily: theme.headingFont }}>
                {logoText || '⚡'}
              </span>
            )}
          </div>
        );
      default: return <Spinner color={accentColor} />;
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${isEditing ? 'py-16 mx-4 rounded-xl border border-dashed border-border/40' : 'min-h-[300px]'}`}
      style={{ backgroundColor, ...style }}
    >
      {/* Logo (for non-logo-fade variants) */}
      {variant !== 'logo-fade' && (logoImage || logoText) && (
        <div className="mb-2">
          {logoImage ? (
            <img src={logoImage} alt={logoText} className="h-10 w-auto" />
          ) : (
            <span className="text-xl font-bold" style={{ color: textColor, fontFamily: theme.headingFont }}>
              {logoText}
            </span>
          )}
        </div>
      )}

      {renderLoader()}

      {/* Loading text */}
      {loadingText && (
        <p className="text-sm font-medium" style={{ color: textColor + 'aa' }}>
          {loadingText}
        </p>
      )}

      {/* Percentage */}
      {showPercentage && (
        <p className="text-xs tabular-nums font-mono" style={{ color: textColor + '80' }}>
          {displayProgress}%
        </p>
      )}

      {isEditing && (
        <p className="text-[9px] mt-2 opacity-40" style={{ color: textColor }}>
          Variant: {variant} • Duration: {duration}s
        </p>
      )}
    </div>
  );
}
