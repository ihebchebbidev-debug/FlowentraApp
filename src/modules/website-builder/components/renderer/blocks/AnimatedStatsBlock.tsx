import React, { useState, useEffect, useRef } from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';
import {
  getScaledFontSize,
  getSectionPaddingStyle,
  getFullHeadingStyle,
  getBodyTextStyle,
} from '../../../utils/themeUtils';

interface Stat {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: string;
}

interface AnimatedStatsBlockProps {
  title?: string;
  subtitle?: string;
  stats: Stat[];
  bgColor?: string;
  valueColor?: string;
  labelColor?: string;
  columns?: number;
  variant?: 'default' | 'cards' | 'minimal' | 'gradient' | 'glass';
  animationStyle?: 'count' | 'fade' | 'slide' | 'none';
  showDividers?: boolean;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

/** Parse numeric value from string like "25,000+" or "4.9" */
function parseStatValue(value: string): { num: number; isDecimal: boolean } {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned) || 0;
  return { num, isDecimal: cleaned.includes('.') };
}

/** Animated counter hook */
function useCountUp(end: number, duration: number = 2000, isVisible: boolean, isDecimal: boolean) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * end;
      
      setCount(isDecimal ? Math.round(current * 10) / 10 : Math.floor(current));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(step);
  }, [end, duration, isVisible, isDecimal]);

  return count;
}

/** Individual stat item with animation */
function AnimatedStat({
  stat,
  index,
  isVisible,
  variant,
  valueColor,
  labelColor,
  theme,
  animationStyle,
  isEditing,
  onUpdate,
  onRemove,
}: {
  stat: Stat;
  index: number;
  isVisible: boolean;
  variant: string;
  valueColor: string;
  labelColor: string;
  theme: SiteTheme;
  animationStyle: string;
  isEditing?: boolean;
  onUpdate: (field: keyof Stat, value: string) => void;
  onRemove: () => void;
}) {
  const { num, isDecimal } = parseStatValue(stat.value);
  const animatedValue = useCountUp(num, 2000 + index * 200, isVisible && animationStyle === 'count', isDecimal);
  
  // Format the display value
  const displayValue = animationStyle === 'count' && isVisible
    ? (isDecimal ? animatedValue.toFixed(1) : animatedValue.toLocaleString())
    : stat.value.replace(/[0-9.,]+/, (match) => {
        const parsed = parseFloat(match.replace(/,/g, ''));
        return isNaN(parsed) ? match : parsed.toLocaleString();
      });

  // Animation delay for staggered effect
  const delay = index * 100;
  
  const cardClasses = {
    default: '',
    cards: 'bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/30 shadow-lg',
    minimal: 'border-l-2 pl-6',
    gradient: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10',
    glass: 'bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl',
  }[variant] || '';

  const animationClasses = {
    fade: `transition-all duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`,
    slide: `transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`,
    count: 'transition-opacity duration-500',
    none: '',
  }[animationStyle] || '';

  return (
    <div 
      className={`text-center relative group/stat ${cardClasses} ${animationClasses} px-2 sm:px-0`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {isEditing && (
        <button 
          onClick={onRemove} 
          className="absolute -top-1 -right-1 p-1.5 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover/stat:opacity-100 transition-all hover:scale-110 shadow-lg z-10"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
      
      {/* Stat value with animation */}
      <div className="relative">
        {isEditing ? (
          <p
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdate('value', e.currentTarget.textContent || '')}
            className="font-bold mb-2 outline-none focus:ring-2 focus:ring-primary/30 rounded-lg px-2 py-1"
            style={{ 
              color: valueColor, 
              fontSize: getScaledFontSize(48, theme), 
              fontFamily: theme.headingFont,
              lineHeight: 1.1,
            }}
          >
            {stat.prefix || ''}{stat.value}{stat.suffix || ''}
          </p>
        ) : (
          <p 
            className="font-bold mb-2 tracking-tight" 
            style={{ 
              color: valueColor, 
              fontSize: getScaledFontSize(48, theme), 
              fontFamily: theme.headingFont,
              lineHeight: 1.1,
              textShadow: variant === 'gradient' || variant === 'glass' ? '0 2px 10px rgba(0,0,0,0.2)' : undefined,
            }}
          >
            <span className="inline-block">{stat.prefix || ''}</span>
            <span className="inline-block tabular-nums">{displayValue}</span>
            <span className="inline-block">{stat.suffix || ''}</span>
          </p>
        )}
      </div>

      {/* Label */}
      {isEditing ? (
        <p
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdate('label', e.currentTarget.textContent || '')}
          className="text-sm uppercase tracking-wider font-medium outline-none focus:ring-2 focus:ring-primary/30 rounded px-1"
          style={{ color: labelColor, opacity: 0.8 }}
        >
          {stat.label}
        </p>
      ) : (
        <p 
          className="text-sm uppercase tracking-wider font-medium" 
          style={{ color: labelColor, opacity: 0.8 }}
        >
          {stat.label}
        </p>
      )}
    </div>
  );
}

export function AnimatedStatsBlock({
  title,
  subtitle,
  stats,
  bgColor,
  valueColor,
  labelColor,
  columns,
  variant = 'default',
  animationStyle = 'count',
  showDividers = false,
  theme,
  isEditing,
  onUpdate,
  style,
}: AnimatedStatsBlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for triggering animations
  useEffect(() => {
    if (isEditing) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isEditing]);

  const dir = theme.direction || 'ltr';
  const cols = columns || Math.min(stats.length, 4);
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
  }[cols] || 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';

  // Theme-derived styles
  const sectionPadding = getSectionPaddingStyle(theme);
  const headingStyles = getFullHeadingStyle(theme, 32, variant === 'gradient' || variant === 'glass' ? '#ffffff' : theme.textColor);
  const subtitleStyles = getBodyTextStyle(theme, 16, variant === 'gradient' || variant === 'glass' ? 'rgba(255,255,255,0.7)' : theme.secondaryColor);
  
  const statValueColor = valueColor || (variant === 'gradient' || variant === 'glass' ? '#ffffff' : theme.primaryColor);
  const statLabelColor = labelColor || (variant === 'gradient' || variant === 'glass' ? 'rgba(255,255,255,0.8)' : theme.secondaryColor);

  // Background styles based on variant
  const getBgStyle = (): React.CSSProperties => {
    if (bgColor) {
      if (bgColor.includes('gradient')) {
        return { background: bgColor };
      }
      return { backgroundColor: bgColor };
    }
    
    switch (variant) {
      case 'gradient':
        return { background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor || theme.secondaryColor})` };
      case 'glass':
        return { background: `linear-gradient(135deg, ${theme.primaryColor}dd, ${theme.primaryColor}99)` };
      default:
        return { backgroundColor: theme.primaryColor + '08' };
    }
  };

  const updateStat = (index: number, field: keyof Stat, value: string) => {
    const updated = stats.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    onUpdate?.({ stats: updated });
  };

  const addStat = () => {
    onUpdate?.({ stats: [...stats, { value: '100+', label: 'New Stat' }] });
  };

  const removeStat = (index: number) => {
    onUpdate?.({ stats: stats.filter((_, i) => i !== index) });
  };

  return (
    <section
      ref={containerRef}
      dir={dir}
      className="relative overflow-hidden"
      style={{
        ...sectionPadding,
        ...getBgStyle(),
        fontFamily: theme.bodyFont,
        ...style,
      }}
    >
      {/* Decorative elements for gradient/glass variants */}
      {(variant === 'gradient' || variant === 'glass') && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Title */}
        {(title || isEditing) && (
          isEditing ? (
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="font-bold text-center mb-3 outline-none focus:ring-2 focus:ring-primary/30 rounded px-2"
              style={headingStyles}
            >
              {title || 'Add title...'}
            </h2>
          ) : title ? (
            <h2 className="font-bold text-center mb-3" style={headingStyles}>
              {title}
            </h2>
          ) : null
        )}

        {/* Subtitle */}
        {(subtitle || isEditing) && (
          isEditing ? (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
              className="text-center mb-12 outline-none focus:ring-2 focus:ring-primary/30 rounded px-2 max-w-2xl mx-auto"
              style={subtitleStyles}
            >
              {subtitle || 'Add subtitle...'}
            </p>
          ) : subtitle ? (
            <p className="text-center mb-12 max-w-2xl mx-auto" style={subtitleStyles}>
              {subtitle}
            </p>
          ) : null
        )}

        {/* Stats grid */}
        <div className={`grid ${colClass} gap-4 sm:gap-8 lg:gap-12`}>
          {stats.map((stat, i) => (
            <React.Fragment key={i}>
              <AnimatedStat
                stat={stat}
                index={i}
                isVisible={isVisible}
                variant={variant}
                valueColor={statValueColor}
                labelColor={statLabelColor}
                theme={theme}
                animationStyle={animationStyle}
                isEditing={isEditing}
                onUpdate={(field, value) => updateStat(i, field, value)}
                onRemove={() => removeStat(i)}
              />
              {/* Dividers between stats */}
              {showDividers && i < stats.length - 1 && variant === 'default' && (
                <div className="hidden lg:block absolute left-1/2 top-1/4 bottom-1/4 w-px bg-border/30" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Add stat button */}
        {isEditing && (
          <div className="text-center mt-8">
            <button
              onClick={addStat}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              style={{ fontSize: getScaledFontSize(13, theme) }}
            >
              <Plus className="h-4 w-4" />
              Add Stat
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
