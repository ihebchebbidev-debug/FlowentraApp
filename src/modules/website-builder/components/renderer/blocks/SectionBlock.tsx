import React from 'react';
import { SiteTheme } from '../../../types';
import { getSectionPaddingStyle, isDarkColor } from '../../../utils/themeUtils';

type SectionVariant = 'default' | 'glass' | 'gradient' | 'bordered' | 'pattern' | 'wave';

interface SectionBlockProps {
  padding?: string;
  background?: string;
  variant?: SectionVariant;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  patternType?: 'dots' | 'grid' | 'diagonal' | 'none';
  patternOpacity?: number;
  borderColor?: string;
  children?: React.ReactNode;
  theme?: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

const MAX_WIDTH_MAP: Record<string, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

const PATTERN_STYLES: Record<string, (opacity: number) => React.CSSProperties> = {
  dots: (op) => ({
    backgroundImage: `radial-gradient(circle, currentColor ${op * 0.8}px, transparent 1px)`,
    backgroundSize: '20px 20px',
    opacity: op,
  }),
  grid: (op) => ({
    backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
    opacity: op,
  }),
  diagonal: (op) => ({
    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)`,
    opacity: op,
  }),
  none: () => ({}),
};

export function SectionBlock({
  padding,
  background,
  variant = 'default',
  maxWidth = 'md',
  gradientFrom,
  gradientTo,
  gradientAngle = 135,
  patternType = 'none',
  patternOpacity = 0.05,
  borderColor,
  children,
  theme,
  isEditing,
  style,
}: SectionBlockProps) {
  const paddingStyle = theme && !padding ? getSectionPaddingStyle(theme) : {};
  const widthClass = MAX_WIDTH_MAP[maxWidth] || 'max-w-5xl';

  let sectionStyle: React.CSSProperties = {
    backgroundColor: background || 'transparent',
    ...paddingStyle,
    ...style,
  };

  let extraClassName = '';

  switch (variant) {
    case 'glass':
      sectionStyle = {
        ...sectionStyle,
        backgroundColor: background || 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: `1px solid ${borderColor || 'rgba(255,255,255,0.18)'}`,
      };
      extraClassName = 'rounded-2xl mx-4 my-4';
      break;

    case 'gradient': {
      const from = gradientFrom || theme?.primaryColor || '#6366f1';
      const to = gradientTo || theme?.accentColor || '#8b5cf6';
      sectionStyle = {
        ...sectionStyle,
        background: `linear-gradient(${gradientAngle}deg, ${from}, ${to})`,
      };
      break;
    }

    case 'bordered':
      sectionStyle = {
        ...sectionStyle,
        border: `2px solid ${borderColor || theme?.primaryColor || '#e2e8f0'}`,
      };
      extraClassName = 'rounded-xl mx-4 my-4';
      break;

    case 'wave':
      // Wave uses a pseudo background via clip-path
      break;

    case 'pattern':
      // Pattern overlay is rendered separately
      break;
  }

  const emptyPlaceholder = (
    <div className="min-h-[80px] border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
      Drop components here
    </div>
  );

  return (
    <section
      className={`relative overflow-hidden ${padding || ''} ${extraClassName}`}
      style={sectionStyle}
    >
      {/* Pattern overlay */}
      {variant === 'pattern' && patternType !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            ...PATTERN_STYLES[patternType]?.(patternOpacity),
            color: isDarkColor(background) ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
          }}
        />
      )}

      {/* Wave top decoration */}
      {variant === 'wave' && (
        <div className="absolute top-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" className="w-full h-auto" preserveAspectRatio="none" fill={theme?.primaryColor || '#6366f1'} opacity={0.08}>
            <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,0 L0,0 Z" />
          </svg>
        </div>
      )}

      <div className={`${widthClass} mx-auto relative z-[1]`}>
        {children || emptyPlaceholder}
      </div>

      {/* Wave bottom decoration */}
      {variant === 'wave' && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" className="w-full h-auto" preserveAspectRatio="none" fill={theme?.primaryColor || '#6366f1'} opacity={0.08}>
            <path d="M0,30 C360,0 720,60 1080,30 C1260,15 1380,45 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      )}

      {/* Editor badge */}
      {isEditing && variant !== 'default' && (
        <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-md capitalize">
          {variant} section
        </div>
      )}
    </section>
  );
}
