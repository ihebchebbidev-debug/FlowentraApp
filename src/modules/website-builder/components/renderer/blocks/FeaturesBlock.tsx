import React from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';
import { DynamicIcon } from '../../editor/IconPicker';
import { sanitizeHtml } from '@/utils/sanitize';
import {
  getBaseSectionStyle,
  getFullHeadingStyle,
  getBodyTextStyle,
  getCardStyle,
  getThemeShadow,
  getThemeShadowHover,
  getFontScale,
  isDarkColor,
  getCardBgColor,
} from '../../../utils/themeUtils';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

type FeaturesVariant = 'grid' | 'list';

interface FeaturesBlockProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: number;
  bgColor?: string;
  titleColor?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  cardBorder?: boolean;
  cardShadow?: boolean;
  variant?: FeaturesVariant;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function FeaturesBlock({
  title, subtitle, features, columns = 3, bgColor, titleColor, iconSize = 'md',
  cardBorder = true, cardShadow = false, variant = 'grid',
  theme, isEditing, onUpdate, style,
}: FeaturesBlockProps) {
  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const updated = features.map((f, i) => i === index ? { ...f, [field]: value } : f);
    onUpdate?.({ features: updated });
  };

  const addFeature = () => {
    onUpdate?.({ features: [...features, { icon: 'Sparkles', title: 'New Feature', description: 'Describe this feature' }] });
  };

  const removeFeature = (index: number) => {
    onUpdate?.({ features: features.filter((_, i) => i !== index) });
  };

  const dir = theme.direction || 'ltr';
  const isDark = isDarkColor(bgColor) || isDarkColor(theme.backgroundColor);
  const textColor = isDark ? '#f1f5f9' : (titleColor || theme.textColor);
  const subColor = isDark ? '#94a3b8' : theme.secondaryColor;
  const cardBg = getCardBgColor(theme, bgColor);
  
  // Scale icon sizes based on fontScale
  const _fontScale = getFontScale(theme);
  const iconSizeMap = { sm: 'h-6 w-6', md: 'h-8 w-8', lg: 'h-10 w-10' };
  const iconContainerMap = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-16 h-16' };

  // Theme-aware styles
  const sectionStyle = { ...getBaseSectionStyle(theme, bgColor), ...style };
  const headingStyle = getFullHeadingStyle(theme, 30, textColor);
  const subtitleStyle = getBodyTextStyle(theme, 16, subColor, { opacity: 0.7 });
  const featureTitleStyle = getFullHeadingStyle(theme, 18, textColor);
  const featureDescStyle = getBodyTextStyle(theme, 14, subColor, { opacity: 0.7 });
  
  // Card shadow from theme
  const cardShadowStyle = cardShadow ? { boxShadow: getThemeShadow(theme) } : {};
  const cardHoverShadow = cardShadow ? getThemeShadowHover(theme) : undefined;

  // Shared header
  const header = (
    <div className="text-center mb-12">
      {isEditing ? (
        <h2 contentEditable suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
          className="font-bold mb-3 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
          style={headingStyle}
        >{title}</h2>
      ) : (
        <h2 className="font-bold mb-3" style={headingStyle}>{title}</h2>
      )}
      {(subtitle || isEditing) && (
        isEditing ? (
          <p contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
            className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 max-w-2xl mx-auto"
            style={subtitleStyle}
          >{subtitle || 'Add subtitle...'}</p>
        ) : subtitle ? (
          <p className="max-w-2xl mx-auto" style={subtitleStyle}>{subtitle}</p>
        ) : null
      )}
    </div>
  );

  const addButton = isEditing ? (
    <div className="text-center mt-6">
      <button onClick={addFeature} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        <Plus className="h-3 w-3" /> Add Feature
      </button>
    </div>
  ) : null;

  // ═══ LIST VARIANT ═══
  if (variant === 'list') {
    return (
      <section dir={dir} style={sectionStyle}>
        <div className="max-w-3xl mx-auto">
          {header}
          <div className="space-y-6">
            {features.map((f, i) => (
              <div key={i} className="flex gap-5 items-start relative group/feat">
                {isEditing && (
                  <button onClick={() => removeFeature(i)} className="absolute top-0 right-0 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/feat:opacity-100 transition-opacity hover:bg-destructive/20">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
                <div className={`${iconContainerMap[iconSize]} rounded-xl flex items-center justify-center shrink-0`}
                  style={{ backgroundColor: theme.primaryColor + '12', color: theme.primaryColor }}>
                  <DynamicIcon name={f.icon} className={iconSizeMap[iconSize]} />
                </div>
                <div className="flex-1 pt-1">
                  {isEditing ? (
                    <h3 contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateFeature(i, 'title', e.currentTarget.textContent || '')}
                      className="font-semibold mb-1 outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                      style={getFullHeadingStyle(theme, 16, textColor)}
                    >{f.title}</h3>
                  ) : (
                    <h3 className="font-semibold mb-1" style={getFullHeadingStyle(theme, 16, textColor)}>{f.title}</h3>
                  )}
                  {isEditing ? (
                    <p contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateFeature(i, 'description', e.currentTarget.innerHTML)}
                      className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5 leading-relaxed"
                      style={featureDescStyle}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.description) }}
                    />
                  ) : (
                    <p className="leading-relaxed" style={featureDescStyle} dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.description) }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          {addButton}
        </div>
      </section>
    );
  }

  // ═══ DEFAULT GRID VARIANT ═══
  const colClass = { 1: 'grid-cols-1', 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-3', 4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' }[columns] || 'grid-cols-1 md:grid-cols-3';

  return (
    <section dir={dir} style={sectionStyle}>
      <div className="max-w-5xl mx-auto">
        {header}
        <div className={`grid ${colClass} gap-8`}>
          {features.map((f, i) => (
            <div
              key={i}
              className={`text-center p-6 rounded-xl relative group/feat transition-shadow ${!cardBg ? 'bg-card' : ''} ${cardBorder && !isDark ? 'border' : ''}`}
              style={{
                ...getCardStyle(theme),
                ...cardShadowStyle,
                ...(cardBg ? { backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : undefined, borderWidth: cardBorder ? 1 : undefined, borderStyle: cardBorder ? 'solid' : undefined } : {}),
              }}
              onMouseEnter={(e) => cardHoverShadow && (e.currentTarget.style.boxShadow = cardHoverShadow)}
              onMouseLeave={(e) => cardShadow && (e.currentTarget.style.boxShadow = getThemeShadow(theme))}
            >
              {isEditing && (
                <button onClick={() => removeFeature(i)} className="absolute top-2 right-2 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/feat:opacity-100 transition-opacity hover:bg-destructive/20">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              <div className={`${iconContainerMap[iconSize]} rounded-xl mx-auto mb-4 flex items-center justify-center`} style={{ backgroundColor: theme.primaryColor + '12' }}>
                <DynamicIcon name={f.icon} className={iconSizeMap[iconSize]} />
              </div>
              {isEditing ? (
                <h3 contentEditable suppressContentEditableWarning
                  onBlur={(e) => updateFeature(i, 'title', e.currentTarget.textContent || '')}
                  className="font-semibold mb-2 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                  style={featureTitleStyle}
                >{f.title}</h3>
              ) : (
                <h3 className="font-semibold mb-2" style={featureTitleStyle}>{f.title}</h3>
              )}
              {isEditing ? (
                <p contentEditable suppressContentEditableWarning
                  onBlur={(e) => updateFeature(i, 'description', e.currentTarget.innerHTML)}
                  className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                  style={featureDescStyle}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.description) }}
                />
              ) : (
                <p style={featureDescStyle} dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.description) }} />
              )}
            </div>
          ))}
        </div>
        {addButton}
      </div>
    </section>
  );
}
