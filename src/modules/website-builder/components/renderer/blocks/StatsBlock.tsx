import React from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';
import {
  getHeadingStyle,
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
}

interface StatsBlockProps {
  title?: string;
  subtitle?: string;
  stats: Stat[];
  bgColor?: string;
  valueColor?: string;
  labelColor?: string;
  columns?: number;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function StatsBlock({
  title, subtitle, stats, bgColor, valueColor, labelColor, columns,
  theme, isEditing, onUpdate, style,
}: StatsBlockProps) {
  const dir = theme.direction || 'ltr';
  const cols = columns || Math.min(stats.length, 4);
  const colClass = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-2 md:grid-cols-3', 4: 'grid-cols-2 md:grid-cols-4' }[cols] || 'grid-cols-2 md:grid-cols-4';

  // Theme-derived styles
  const sectionPadding = getSectionPaddingStyle(theme);
  const headingStyles = getFullHeadingStyle(theme, 30, theme.textColor);
  const subtitleStyles = getBodyTextStyle(theme, 16, theme.secondaryColor, { opacity: 0.7 });
  const statValueColor = valueColor || theme.primaryColor;
  const statLabelColor = labelColor || theme.secondaryColor;

  const updateStat = (index: number, field: keyof Stat, value: string) => {
    const updated = stats.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onUpdate?.({ stats: updated });
  };

  const addStat = () => {
    onUpdate?.({ stats: [...stats, { value: '0', label: 'New Stat' }] });
  };

  const removeStat = (index: number) => {
    onUpdate?.({ stats: stats.filter((_, i) => i !== index) });
  };

  return (
    <section 
      dir={dir} 
      style={{ 
        ...sectionPadding, 
        backgroundColor: bgColor || theme.primaryColor + '08', 
        fontFamily: theme.bodyFont, 
        ...style 
      }}
    >
      <div className="max-w-5xl mx-auto">
        {(title || isEditing) && (
          isEditing ? (
            <h2
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="font-bold text-center mb-3 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={headingStyles}
            >{title || 'Add title...'}</h2>
          ) : title ? (
            <h2 className="font-bold text-center mb-3" style={headingStyles}>{title}</h2>
          ) : null
        )}
        {(subtitle || isEditing) && (
          isEditing ? (
            <p
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
              className="text-center mb-10 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 max-w-2xl mx-auto"
              style={subtitleStyles}
            >{subtitle || 'Add subtitle...'}</p>
          ) : subtitle ? (
            <p className="text-center mb-10 max-w-2xl mx-auto" style={subtitleStyles}>{subtitle}</p>
          ) : null
        )}
        <div className={`grid ${colClass} gap-8`}>
          {stats.map((stat, i) => (
            <div key={i} className="text-center relative group/stat">
              {isEditing && (
                <button 
                  onClick={() => removeStat(i)} 
                  className="absolute -top-1 -right-1 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/stat:opacity-100 transition-opacity hover:bg-destructive/20"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              {isEditing ? (
                <p
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => updateStat(i, 'value', e.currentTarget.textContent || '')}
                  className="font-bold mb-1 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                  style={{ color: statValueColor, fontSize: getScaledFontSize(36, theme), fontFamily: theme.headingFont }}
                >{stat.prefix || ''}{stat.value}{stat.suffix || ''}</p>
              ) : (
                <p 
                  className="font-bold mb-1" 
                  style={{ color: statValueColor, fontSize: getScaledFontSize(36, theme), fontFamily: theme.headingFont }}
                >
                  {stat.prefix || ''}{stat.value}{stat.suffix || ''}
                </p>
              )}
              {isEditing ? (
                <p
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => updateStat(i, 'label', e.currentTarget.textContent || '')}
                  className="opacity-70 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                  style={{ color: statLabelColor, fontSize: getScaledFontSize(14, theme) }}
                >{stat.label}</p>
              ) : (
                <p className="opacity-70" style={{ color: statLabelColor, fontSize: getScaledFontSize(14, theme) }}>{stat.label}</p>
              )}
            </div>
          ))}
        </div>
        {isEditing && (
          <div className="text-center mt-6">
            <button 
              onClick={addStat} 
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              style={{ fontSize: getScaledFontSize(12, theme) }}
            >
              <Plus className="h-3 w-3" /> Add Stat
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
