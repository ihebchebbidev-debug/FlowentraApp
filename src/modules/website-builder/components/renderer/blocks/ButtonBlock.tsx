import React from 'react';
import { SiteTheme } from '../../../types';
import { ComponentAction } from '../../../types/shared';
import { DynamicIcon } from '../../editor/IconPicker';
import { ActionButton } from '../ActionButton';
import { getButtonStyle, getThemeShadow, getFontScale } from '../../../utils/themeUtils';

interface ButtonBlockProps {
  text: string;
  link?: string;
  action?: ComponentAction;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  textColor?: string;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ButtonBlock({
  text, link, action, variant = 'primary', size = 'md', color, textColor, fullWidth,
  icon, iconPosition = 'left', theme, isEditing, onUpdate, style,
}: ButtonBlockProps) {
  const dir = theme.direction || 'ltr';
  const fontScale = getFontScale(theme);
  
  // Scale size classes based on fontScale
  const baseSizes = { sm: 14, md: 16, lg: 18 };
  const scaledFontSize = Math.round(baseSizes[size] * fontScale);
  
  const sizeClasses = { sm: 'px-4 py-2', md: 'px-6 py-3', lg: 'px-8 py-4' };
  const iconSizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

  // Get theme-aware button styles
  const buttonStyles = getButtonStyle(variant, theme, color, textColor);
  
  // Apply shadow for primary/secondary variants based on theme.shadowStyle
  const shadowStyle = (variant === 'primary' || variant === 'secondary') && theme.shadowStyle !== 'none'
    ? { boxShadow: getThemeShadow(theme) }
    : {};

  const iconEl = icon ? <DynamicIcon name={icon} className={iconSizes[size]} /> : null;

  const combinedStyles: React.CSSProperties = {
    ...buttonStyles,
    ...shadowStyle,
    fontSize: `${scaledFontSize}px`,
  };

  return (
    <div dir={dir} className={`py-4 px-6 flex ${fullWidth ? '' : 'justify-center'}`} style={style}>
      {isEditing ? (
        <span
          contentEditable suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ text: e.currentTarget.textContent || '' })}
          className={`${fullWidth ? 'w-full text-center' : 'inline-flex items-center gap-2'} font-semibold outline-none focus:ring-2 focus:ring-primary/50 ${sizeClasses[size]}`}
          style={combinedStyles}
        >{text}</span>
      ) : (
        <ActionButton
          action={action}
          href={link}
          variant={variant}
          size={size}
          theme={theme}
          bgColor={color}
          textColor={textColor}
          fullWidth={fullWidth}
          icon={iconEl}
          iconPosition={iconPosition}
          className={`font-semibold transition-all hover:scale-105 hover:shadow-lg ${sizeClasses[size]}`}
          style={combinedStyles}
        >
          {text}
        </ActionButton>
      )}
    </div>
  );
}
