import React, { useState, useEffect } from 'react';
import { SiteTheme } from '../../../types';
import { DynamicIcon } from '../../editor/IconPicker';

interface FloatingCtaBlockProps {
  text: string;
  link: string;
  icon: string;
  position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
  backgroundColor: string;
  textColorOverride: string;
  showAfterScroll: number;
  animation: 'slide-up' | 'fade-in' | 'bounce' | 'none';
  dismissible: boolean;
  pill: boolean;
  offsetX: number;
  offsetY: number;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function FloatingCtaBlock({
  text = 'Get Started Now',
  link = '#',
  icon = 'ArrowRight',
  position = 'bottom-center',
  backgroundColor = '',
  textColorOverride = '#ffffff',
  showAfterScroll = 0,
  animation = 'slide-up',
  dismissible = true,
  pill = true,
  offsetX = 24,
  offsetY = 24,
  theme,
  isEditing,
  onUpdate,
  style,
}: FloatingCtaBlockProps) {
  const [visible, setVisible] = useState(showAfterScroll === 0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isEditing || showAfterScroll === 0) return;
    const handleScroll = () => {
      if (window.scrollY > showAfterScroll) setVisible(true);
      else setVisible(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll, isEditing]);

  if (dismissed && !isEditing) return null;

  const bgColor = backgroundColor || theme.primaryColor;

  const getPositionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'fixed', zIndex: 80 };
    if (position.includes('right')) base.right = offsetX;
    else if (position.includes('left') && !position.includes('center')) base.left = offsetX;
    else { base.left = '50%'; base.transform = 'translateX(-50%)'; }
    if (position.includes('bottom')) base.bottom = offsetY;
    else base.top = offsetY;
    return base;
  };

  const animationMap: Record<string, string> = {
    'slide-up': 'animate-fade-in',
    'fade-in': 'animate-fade-in',
    'bounce': 'animate-[bounce_1s_ease-in-out]',
    'none': '',
  };

  if (isEditing) {
    return (
      <div className="mx-4 my-3" style={style}>
        <div className="border border-dashed rounded-xl p-4 text-center" style={{ borderColor: bgColor + '40', backgroundColor: bgColor + '08' }}>
          <p className="text-xs font-medium mb-2" style={{ color: theme.textColor }}>Floating CTA Button</p>
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 font-semibold text-sm shadow-lg ${pill ? 'rounded-full' : 'rounded-xl'}`}
            style={{ backgroundColor: bgColor, color: textColorOverride }}
          >
            {text}
            {icon && <DynamicIcon name={icon} className="h-4 w-4" />}
          </div>
          <p className="text-[9px] mt-2 opacity-40" style={{ color: theme.textColor }}>
            Position: {position} • Shows after {showAfterScroll}px • Offset: {offsetX}x {offsetY}y
          </p>
        </div>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div className={`${animationMap[animation]}`} style={getPositionStyle()}>
      <div className="flex items-center gap-2">
        <a
          href={link}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm shadow-2xl transition-transform hover:scale-105 ${pill ? 'rounded-full' : 'rounded-xl'}`}
          style={{ backgroundColor: bgColor, color: textColorOverride, fontFamily: theme.bodyFont }}
        >
          {text}
          {icon && <DynamicIcon name={icon} className="h-4 w-4" />}
        </a>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="w-6 h-6 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white text-xs hover:bg-black/40 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
