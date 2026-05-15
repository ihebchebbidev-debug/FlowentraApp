import React, { useState, useEffect } from 'react';
import { SiteTheme } from '../../../types';
import { DynamicIcon } from '../../editor/IconPicker';

interface ScrollToTopBlockProps {
  icon: string;
  position: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'middle-right' | 'middle-left';
  backgroundColor: string;
  iconColor: string;
  size: number;
  showAfterScroll: number;
  smooth: boolean;
  rounded: boolean;
  shadow: boolean;
  offsetX: number;
  offsetY: number;
  animation: 'fade' | 'slide-up' | 'scale' | 'none';
  displayMode: 'floating' | 'sticky-side';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ScrollToTopBlock({
  icon = 'ArrowUp',
  position = 'bottom-right',
  backgroundColor = '',
  iconColor = '#ffffff',
  size = 44,
  showAfterScroll = 300,
  smooth = true,
  rounded = true,
  shadow = true,
  offsetX = 24,
  offsetY = 24,
  animation = 'fade',
  displayMode = 'floating',
  theme,
  isEditing,
  onUpdate,
  style,
}: ScrollToTopBlockProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    const handleScroll = () => {
      setVisible(window.scrollY > showAfterScroll);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll, isEditing]);

  const handleClick = () => {
    if (isEditing) return;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  };

  const bgColor = backgroundColor || theme.primaryColor;

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'fixed', zIndex: 85 };

    if (displayMode === 'sticky-side') {
      // Sticky side: vertically centered on left or right edge
      const side = position.includes('left') ? 'left' : 'right';
      base[side] = offsetX;
      base.top = '50%';
      base.transform = 'translateY(-50%)';
      return base;
    }

    // Floating positions
    if (position === 'bottom-right') { base.right = offsetX; base.bottom = offsetY; }
    else if (position === 'bottom-left') { base.left = offsetX; base.bottom = offsetY; }
    else if (position === 'bottom-center') { base.left = '50%'; base.bottom = offsetY; base.transform = 'translateX(-50%)'; }
    else if (position === 'middle-right') { base.right = offsetX; base.top = '50%'; base.transform = 'translateY(-50%)'; }
    else if (position === 'middle-left') { base.left = offsetX; base.top = '50%'; base.transform = 'translateY(-50%)'; }
    return base;
  };

  const animationClass = {
    fade: 'animate-fade-in',
    'slide-up': 'animate-fade-in',
    scale: 'animate-scale-in',
    none: '',
  }[animation];

  const modeLabel = displayMode === 'sticky-side' ? 'Sticky Side' : 'Floating';

  if (isEditing) {
    return (
      <div className="mx-4 my-3" style={style}>
        <div
          className="border border-dashed rounded-xl p-4 text-center"
          style={{ borderColor: bgColor + '40', backgroundColor: bgColor + '08' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: theme.textColor }}>
            Scroll to Top — {modeLabel}
          </p>
          <div className="inline-flex items-center justify-center">
            <button
              className="transition-all duration-300"
              style={{
                width: size,
                height: size,
                backgroundColor: bgColor,
                color: iconColor,
                borderRadius: rounded ? '50%' : theme.borderRadius,
                boxShadow: shadow ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'default',
              }}
              aria-label="Scroll to top"
            >
              <DynamicIcon name={icon} className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[9px] mt-2 opacity-40" style={{ color: theme.textColor }}>
            Mode: {modeLabel} • Position: {position} • Shows after {showAfterScroll}px
          </p>
        </div>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <button
      onClick={handleClick}
      className={`transition-all duration-300 hover:scale-110 ${animationClass}`}
      style={{
        ...getPositionStyles(),
        width: size,
        height: size,
        backgroundColor: bgColor,
        color: iconColor,
        borderRadius: rounded ? '50%' : theme.borderRadius,
        boxShadow: shadow ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
      }}
      aria-label="Scroll to top"
    >
      <DynamicIcon name={icon} className="w-5 h-5" />
    </button>
  );
}
