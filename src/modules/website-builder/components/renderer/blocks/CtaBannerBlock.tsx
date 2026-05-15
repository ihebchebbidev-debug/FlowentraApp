import React from 'react';
import { SiteTheme } from '../../../types';
import { ComponentAction } from '../../../types/shared';
import { ActionButton } from '../ActionButton';
import { sanitizeHtml } from '@/utils/sanitize';
import {
  getBaseSectionStyle,
  getFullHeadingStyle,
  getBodyTextStyle,
  getButtonStyle,
  getThemeShadow,
} from '../../../utils/themeUtils';

interface CtaBannerBlockProps {
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink?: string;
  ctaAction?: ComponentAction;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  secondaryCtaAction?: ComponentAction;
  ctaColor?: string;
  ctaTextColor?: string;
  bgColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  alignment?: 'left' | 'center' | 'right';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function CtaBannerBlock({
  heading, subheading, ctaText, ctaLink, ctaAction, secondaryCtaText, secondaryCtaLink, secondaryCtaAction,
  ctaColor, ctaTextColor, bgColor, gradientFrom, gradientTo, alignment = 'center',
  theme, isEditing, onUpdate, style,
}: CtaBannerBlockProps) {
  const dir = theme.direction || 'ltr';
  const from = gradientFrom || theme.primaryColor;
  const to = gradientTo || theme.accentColor;
  const bg = bgColor || `linear-gradient(135deg, ${from}, ${to})`;
  const alignClass = alignment === 'left' ? 'text-left' : alignment === 'right' ? 'text-right' : 'text-center';
  const btnAlign = alignment === 'left' ? 'justify-start' : alignment === 'right' ? 'justify-end' : 'justify-center';

  // Theme-aware styles
  const sectionStyle = getBaseSectionStyle(theme);
  const headingStyle = getFullHeadingStyle(theme, 36, '#ffffff');
  const subheadingStyle = getBodyTextStyle(theme, 18, '#ffffffcc');
  
  // Primary button style (inverted for CTA banners - white bg on gradient)
  const primaryBtnStyle: React.CSSProperties = {
    backgroundColor: ctaColor || '#fff',
    color: ctaTextColor || theme.primaryColor,
    borderRadius: theme.buttonStyle === 'pill' ? '9999px' : theme.buttonStyle === 'square' ? '0px' : `${theme.borderRadius}px`,
    boxShadow: theme.shadowStyle !== 'none' ? getThemeShadow(theme) : undefined,
    fontFamily: theme.bodyFont,
  };
  
  // Secondary button style (outline)
  const secondaryBtnStyle = getButtonStyle('outline', theme, '#ffffff', '#ffffff');

  return (
    <section
      dir={dir}
      className={alignClass}
      style={{
        ...sectionStyle,
        background: bgColor ? bgColor : bg,
        ...style,
      }}
    >
      <div className="max-w-3xl mx-auto">
        {isEditing ? (
          <h2
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ heading: e.currentTarget.textContent || '' })}
            className="font-bold mb-4 text-2xl sm:text-3xl lg:text-4xl outline-none focus:ring-1 focus:ring-white/30 rounded px-1"
            style={headingStyle}
          >{heading}</h2>
        ) : (
          <h2 className="font-bold mb-4 text-2xl sm:text-3xl lg:text-4xl" style={{ ...headingStyle, fontSize: undefined }}>{heading}</h2>
        )}
        {isEditing ? (
          <p
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ subheading: e.currentTarget.innerHTML })}
            className="mb-8 outline-none focus:ring-1 focus:ring-white/30 rounded px-1"
            style={subheadingStyle}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(subheading) }}
          />
        ) : (
          <p className="mb-8" style={subheadingStyle} dangerouslySetInnerHTML={{ __html: sanitizeHtml(subheading) }} />
        )}
        <div className={`flex flex-wrap gap-3 ${btnAlign}`}>
          {isEditing ? (
            <span
              contentEditable suppressContentEditableWarning
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => onUpdate?.({ ctaText: e.currentTarget.textContent || '' })}
              className="inline-block px-8 py-3 font-semibold outline-none focus:ring-2 focus:ring-white/50"
              style={primaryBtnStyle}
            >{ctaText}</span>
          ) : (
            <ActionButton
              action={ctaAction}
              href={ctaLink}
              className="px-8 py-3 font-semibold transition-all hover:scale-105 hover:shadow-lg"
              style={primaryBtnStyle}
            >
              {ctaText}
            </ActionButton>
          )}
          {(secondaryCtaText || isEditing) && (
            isEditing ? (
              <span
                contentEditable suppressContentEditableWarning
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => onUpdate?.({ secondaryCtaText: e.currentTarget.textContent || '' })}
                className="inline-block px-8 py-3 font-semibold outline-none focus:ring-2 focus:ring-white/50"
                style={{ ...secondaryBtnStyle, borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff' }}
              >{secondaryCtaText || 'Secondary CTA'}</span>
            ) : secondaryCtaText ? (
              <ActionButton
                action={secondaryCtaAction}
                href={secondaryCtaLink}
                className="px-8 py-3 font-semibold transition-all hover:scale-105"
                style={{ ...secondaryBtnStyle, borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff' }}
              >
                {secondaryCtaText}
              </ActionButton>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}
