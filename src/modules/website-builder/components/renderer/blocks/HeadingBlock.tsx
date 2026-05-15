import React from 'react';
import { SiteTheme } from '../../../types';
import { DynamicIcon } from '../../editor/IconPicker';
import {
  getHeadingStyle,
  getBodyTextStyle,
  getFontScale,
} from '../../../utils/themeUtils';

interface HeadingBlockProps {
  text: string;
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  alignment?: 'left' | 'center' | 'right';
  color?: string;
  font?: string;
  icon?: string;
  iconPosition?: 'left' | 'right' | 'top';
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  decoration?: 'none' | 'underline' | 'gradient-underline' | 'dot' | 'line-left';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

// Base sizes in pixels for each heading level
const baseSizeMap = {
  h1: 48, h2: 36, h3: 30, h4: 24, h5: 20, h6: 18,
};

const iconSizeMap = {
  h1: 'h-10 w-10 md:h-12 md:w-12',
  h2: 'h-8 w-8 md:h-10 md:w-10',
  h3: 'h-7 w-7 md:h-8 md:w-8',
  h4: 'h-6 w-6 md:h-7 md:w-7',
  h5: 'h-5 w-5 md:h-6 md:w-6',
  h6: 'h-4 w-4 md:h-5 md:w-5',
};

const subtitleSizeMap = {
  h1: 20, h2: 18, h3: 16, h4: 14, h5: 13, h6: 12,
};

export function HeadingBlock({
  text, level = 'h2', alignment = 'left', color, font,
  icon, iconPosition = 'left', subtitle, badge, badgeColor,
  decoration = 'none',
  theme, isEditing, onUpdate, style,
}: HeadingBlockProps) {
  const Tag = level;
  const dir = theme.direction || 'ltr';
  const align = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
  const headingColor = color || theme.textColor;
  const headingFont = font || theme.headingFont;
  const primaryColor = theme.primaryColor;
  
  // Apply fontScale to heading sizes
  const fontScale = getFontScale(theme);
  const scaledSize = Math.round(baseSizeMap[level] * fontScale);
  const scaledSubtitleSize = Math.round(subtitleSizeMap[level] * fontScale);
  
  // Get heading style with letterSpacing and textTransform
  const headingStyles = getHeadingStyle(theme, { 
    color: headingColor, 
    fontFamily: headingFont,
    fontSize: `clamp(${Math.round(scaledSize * 0.7)}px, 3vw, ${scaledSize}px)`,
  });
  
  const subtitleStyles = getBodyTextStyle(theme, scaledSubtitleSize, headingColor, { opacity: 0.6 });

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ color: primaryColor }}
      >
        <DynamicIcon name={icon} className={iconSizeMap[level]} />
      </div>
    );
  };

  const renderBadge = () => {
    if (!badge) return null;
    return (
      <span
        className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
        style={{
          backgroundColor: (badgeColor || primaryColor) + '15',
          color: badgeColor || primaryColor,
        }}
      >
        {badge}
      </span>
    );
  };

  const renderDecoration = () => {
    if (decoration === 'none') return null;

    if (decoration === 'underline') {
      return (
        <div
          className={`mt-3 h-1 rounded-full ${alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : ''}`}
          style={{ width: 60, backgroundColor: primaryColor }}
        />
      );
    }

    if (decoration === 'gradient-underline') {
      return (
        <div
          className={`mt-3 h-1 rounded-full ${alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : ''}`}
          style={{
            width: 100,
            background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}40)`,
          }}
        />
      );
    }

    if (decoration === 'dot') {
      return (
        <div className={`mt-3 flex gap-1.5 ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : ''}`}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor + '60' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor + '30' }} />
        </div>
      );
    }

    return null;
  };

  const isLineLeft = decoration === 'line-left';

  const headingEl = isEditing ? (
    <Tag
      contentEditable suppressContentEditableWarning
      onBlur={(e) => onUpdate?.({ text: e.currentTarget.textContent || '' })}
      className="font-bold outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 leading-tight"
      style={headingStyles}
    >{text}</Tag>
  ) : (
    <Tag className="font-bold leading-tight" style={headingStyles}>
      {text}
    </Tag>
  );

  const subtitleEl = subtitle ? (
    isEditing ? (
      <p
        contentEditable suppressContentEditableWarning
        onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
        className="mt-2 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
        style={subtitleStyles}
      >{subtitle}</p>
    ) : (
      <p className="mt-2" style={subtitleStyles}>
        {subtitle}
      </p>
    )
  ) : null;

  const isTopIcon = iconPosition === 'top';
  const isRightIcon = iconPosition === 'right';

  return (
    <section dir={dir} className={`py-6 px-6 ${align}`} style={{ fontFamily: headingFont, ...style }}>
      <div className="max-w-5xl mx-auto">
        {/* Badge */}
        {renderBadge()}

        {/* Line-left decoration wrapper */}
        <div className={isLineLeft ? 'flex items-start gap-4' : ''}>
          {isLineLeft && (
            <div
              className="w-1 rounded-full shrink-0 mt-1"
              style={{
                backgroundColor: primaryColor,
                height: subtitle ? 60 : 36,
              }}
            />
          )}

          <div className="flex-1">
            {/* Icon on top */}
            {icon && isTopIcon && (
              <div className={`mb-4 ${alignment === 'center' ? 'flex justify-center' : alignment === 'right' ? 'flex justify-end' : ''}`}>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: primaryColor + '12' }}
                >
                  {renderIcon()}
                </div>
              </div>
            )}

            {/* Heading row with optional left/right icon */}
            {icon && !isTopIcon ? (
              <div className={`flex items-center gap-3 ${
                alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : ''
              } ${isRightIcon ? 'flex-row-reverse' : ''}`}>
                {renderIcon()}
                <div>
                  {headingEl}
                </div>
              </div>
            ) : (
              headingEl
            )}

            {/* Subtitle */}
            {subtitleEl}

            {/* Decoration */}
            {!isLineLeft && renderDecoration()}
          </div>
        </div>
      </div>
    </section>
  );
}
