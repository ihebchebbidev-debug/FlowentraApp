import React from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';
import {
  getHeadingStyle,
  getScaledFontSize,
  getSectionPaddingStyle,
  getFullHeadingStyle,
  getBodyTextStyle,
  getThemeShadow,
  getCardStyle,
} from '../../../utils/themeUtils';

interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
  email?: string;
}

interface TeamGridBlockProps {
  title: string;
  subtitle?: string;
  members: TeamMember[];
  columns?: number;
  bgColor?: string;
  showBio?: boolean;
  cardStyle?: 'minimal' | 'bordered' | 'shadow';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function TeamGridBlock({
  title, subtitle, members, columns = 4, bgColor, showBio = true,
  cardStyle = 'minimal', theme, isEditing, onUpdate, style,
}: TeamGridBlockProps) {
  const dir = theme.direction || 'ltr';
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  // Theme-derived styles
  const sectionPadding = getSectionPaddingStyle(theme);
  const headingStyles = getFullHeadingStyle(theme, 30, theme.textColor);
  const subtitleStyles = getBodyTextStyle(theme, 16, theme.secondaryColor, { opacity: 0.7 });
  const themeCardStyle = getCardStyle(theme);

  const getCardClasses = () => {
    switch (cardStyle) {
      case 'bordered': return 'border p-4';
      case 'shadow': return 'p-4';
      default: return '';
    }
  };

  const getCardInlineStyle = (): React.CSSProperties => {
    switch (cardStyle) {
      case 'bordered': 
        return { borderRadius: `${theme.borderRadius}px` };
      case 'shadow': 
        return { ...themeCardStyle, boxShadow: getThemeShadow(theme) };
      default: 
        return {};
    }
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = members.map((m, i) => i === index ? { ...m, [field]: value } : m);
    onUpdate?.({ members: updated });
  };

  const addMember = () => {
    onUpdate?.({ members: [...members, { name: 'New Member', role: 'Role', avatar: '', bio: '' }] });
  };

  const removeMember = (index: number) => {
    onUpdate?.({ members: members.filter((_, i) => i !== index) });
  };

  return (
    <section 
      dir={dir} 
      style={{ 
        ...sectionPadding, 
        fontFamily: theme.bodyFont, 
        backgroundColor: bgColor || 'transparent', 
        ...style 
      }}
    >
      <div className="max-w-5xl mx-auto">
        {isEditing ? (
          <h2
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
            className="font-bold text-center mb-3 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
            style={headingStyles}
          >{title}</h2>
        ) : (
          <h2 className="font-bold text-center mb-3" style={headingStyles}>{title}</h2>
        )}
        {(subtitle || isEditing) && (
          isEditing ? (
            <p
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
              className="text-center mb-12 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 max-w-2xl mx-auto"
              style={subtitleStyles}
            >{subtitle || 'Add subtitle...'}</p>
          ) : subtitle ? (
            <p className="text-center mb-12 max-w-2xl mx-auto" style={subtitleStyles}>{subtitle}</p>
          ) : <div className="mb-12" />
        )}
        {!subtitle && !isEditing && <div className="mb-12" />}
        <div className={`grid ${colClass} gap-8`}>
          {members.map((member, i) => (
            <div 
              key={i} 
              className={`text-center relative group/member ${getCardClasses()}`}
              style={getCardInlineStyle()}
            >
              {isEditing && (
                <button 
                  onClick={() => removeMember(i)} 
                  className="absolute -top-1 -right-1 z-10 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/member:opacity-100 transition-opacity hover:bg-destructive/20"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              <div 
                className="w-24 h-24 mx-auto rounded-full mb-4 flex items-center justify-center overflow-hidden" 
                style={{ backgroundColor: theme.primaryColor + '15' }}
              >
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold" style={{ color: theme.primaryColor, fontSize: getScaledFontSize(24, theme) }}>{member.name.charAt(0)}</span>
                )}
              </div>
              {isEditing ? (
                <h3
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => updateMember(i, 'name', e.currentTarget.textContent || '')}
                  className="font-semibold outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                  style={{ color: theme.textColor, fontSize: getScaledFontSize(14, theme), fontFamily: theme.headingFont }}
                >{member.name}</h3>
              ) : (
                <h3 
                  className="font-semibold" 
                  style={{ color: theme.textColor, fontSize: getScaledFontSize(14, theme), fontFamily: theme.headingFont }}
                >{member.name}</h3>
              )}
              {isEditing ? (
                <p
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => updateMember(i, 'role', e.currentTarget.textContent || '')}
                  className="opacity-60 mt-0.5 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                  style={{ color: theme.secondaryColor, fontSize: getScaledFontSize(12, theme) }}
                >{member.role}</p>
              ) : (
                <p className="opacity-60 mt-0.5" style={{ color: theme.secondaryColor, fontSize: getScaledFontSize(12, theme) }}>{member.role}</p>
              )}
              {showBio && (member.bio || isEditing) && (
                isEditing ? (
                  <p
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateMember(i, 'bio', e.currentTarget.textContent || '')}
                    className="opacity-50 mt-2 leading-relaxed outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                    style={{ color: theme.secondaryColor, fontSize: getScaledFontSize(12, theme) }}
                  >{member.bio || 'Add bio...'}</p>
                ) : member.bio ? (
                  <p 
                    className="opacity-50 mt-2 leading-relaxed" 
                    style={{ color: theme.secondaryColor, fontSize: getScaledFontSize(12, theme) }}
                  >{member.bio}</p>
                ) : null
              )}
            </div>
          ))}
        </div>
        {isEditing && (
          <div className="text-center mt-6">
            <button 
              onClick={addMember} 
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              style={{ fontSize: getScaledFontSize(12, theme) }}
            >
              <Plus className="h-3 w-3" /> Add Member
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
