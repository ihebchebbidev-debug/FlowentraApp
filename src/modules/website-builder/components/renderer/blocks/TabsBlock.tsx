import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';
import { sanitizeHtml } from '@/utils/sanitize';
import { isDarkColor, getBaseSectionStyle, getFullHeadingStyle, getBodyTextStyle, getCardStyle, getThemeShadow } from '../../../utils/themeUtils';

interface Tab {
  label: string;
  content: string;
  icon?: string;
}

type TabsVariant = 'underline' | 'pills' | 'cards' | 'vertical' | 'boxed';

interface TabsBlockProps {
  tabs: Tab[];
  title?: string;
  subtitle?: string;
  bgColor?: string;
  variant?: TabsVariant;
  tabAlignment?: 'left' | 'center' | 'right';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function TabsBlock({
  tabs, title, subtitle, bgColor, variant = 'underline',
  tabAlignment = 'center', theme, isEditing, onUpdate, style,
}: TabsBlockProps) {
  const [activeTab, setActiveTab] = useState(0);
  const isDark = isDarkColor(bgColor) || isDarkColor(theme.backgroundColor);
  const textColor = isDark ? '#f1f5f9' : theme.textColor;
  const subColor = isDark ? '#94a3b8' : theme.secondaryColor;
  const sectionStyle = getBaseSectionStyle(theme, bgColor);
  const borderRadius = theme.borderRadius ?? 8;

  const updateTab = (index: number, field: keyof Tab, value: string) => {
    const updated = tabs.map((t, i) => i === index ? { ...t, [field]: value } : t);
    onUpdate?.({ tabs: updated });
  };

  const addTab = () => {
    onUpdate?.({ tabs: [...tabs, { label: 'New Tab', content: '<p>Tab content here.</p>' }] });
  };

  const removeTab = (index: number) => {
    const updated = tabs.filter((_, i) => i !== index);
    onUpdate?.({ tabs: updated });
    if (activeTab >= updated.length) setActiveTab(Math.max(0, updated.length - 1));
  };

  const alignClass = { left: 'justify-start', center: 'justify-center', right: 'justify-end' }[tabAlignment];

  // Header
  const header = (title || subtitle || isEditing) ? (
    <div className={`mb-8 ${tabAlignment === 'center' ? 'text-center' : ''}`}>
      {title && (
        isEditing ? (
          <h2 contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
            className="font-bold mb-2 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
            style={getFullHeadingStyle(theme, 28, textColor)}
          >{title}</h2>
        ) : (
          <h2 className="font-bold mb-2" style={getFullHeadingStyle(theme, 28, textColor)}>{title}</h2>
        )
      )}
      {(subtitle || isEditing) && (
        isEditing ? (
          <p contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
            className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 max-w-2xl mx-auto"
            style={getBodyTextStyle(theme, 15, subColor, { opacity: 0.7 })}
          >{subtitle || 'Add subtitle...'}</p>
        ) : subtitle ? (
          <p className="max-w-2xl mx-auto" style={getBodyTextStyle(theme, 15, subColor, { opacity: 0.7 })}>{subtitle}</p>
        ) : null
      )}
    </div>
  ) : null;

  // Content renderer
  const renderContent = () => (
    <div className="min-h-[100px] animate-fade-in" key={activeTab}>
      {isEditing ? (
        <div
          contentEditable suppressContentEditableWarning
          onBlur={(e) => updateTab(activeTab, 'content', e.currentTarget.innerHTML)}
          className="prose prose-sm max-w-none outline-none focus:ring-1 focus:ring-primary/30 rounded p-3 min-h-[80px]"
          style={{ color: textColor }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(tabs[activeTab]?.content || '') }}
        />
      ) : (
        <div className="prose prose-sm max-w-none" style={{ color: textColor }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(tabs[activeTab]?.content || '') }}
        />
      )}
    </div>
  );

  // Tab button renderer per variant
  const renderTabButton = (tab: Tab, i: number) => {
    const isActive = activeTab === i;
    const handleClick = () => setActiveTab(i);

    const baseContent = isEditing ? (
      <span contentEditable suppressContentEditableWarning
        onClick={handleClick}
        onBlur={(e) => updateTab(i, 'label', e.currentTarget.textContent || '')}
        className="outline-none"
      >{tab.label}</span>
    ) : tab.label;

    switch (variant) {
      case 'pills':
        return (
          <button onClick={handleClick}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
              isActive ? 'text-white shadow-md' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: isActive ? theme.primaryColor : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'),
              color: isActive ? '#fff' : subColor,
              borderRadius: '9999px',
            }}
          >{baseContent}</button>
        );

      case 'cards':
        return (
          <button onClick={handleClick}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 ${
              isActive ? 'shadow-sm' : 'opacity-60 hover:opacity-80'
            }`}
            style={{
              ...getCardStyle(theme),
              borderBottomColor: isActive ? theme.primaryColor : 'transparent',
              backgroundColor: isActive ? (isDark ? 'rgba(255,255,255,0.06)' : '#fff') : 'transparent',
              color: isActive ? theme.primaryColor : subColor,
              boxShadow: isActive ? getThemeShadow(theme) : 'none',
            }}
          >{baseContent}</button>
        );

      case 'boxed':
        return (
          <button onClick={handleClick}
            className={`px-5 py-2.5 text-sm font-medium transition-all border ${
              isActive ? '' : 'border-transparent hover:opacity-80'
            }`}
            style={{
              borderColor: isActive ? theme.primaryColor : 'transparent',
              backgroundColor: isActive ? `${theme.primaryColor}10` : 'transparent',
              color: isActive ? theme.primaryColor : subColor,
              borderRadius: `${borderRadius}px`,
            }}
          >{baseContent}</button>
        );

      default: // underline
        return (
          <button onClick={handleClick}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              isActive ? 'border-current' : 'border-transparent opacity-60 hover:opacity-80'
            }`}
            style={{ color: isActive ? theme.primaryColor : subColor }}
          >{baseContent}</button>
        );
    }
  };

  // Vertical variant has a different layout
  if (variant === 'vertical') {
    return (
      <section style={{ ...sectionStyle, ...style }}>
        <div className="max-w-5xl mx-auto">
          {header}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-48 shrink-0 flex flex-col gap-1">
              {tabs.map((tab, i) => {
                const isActive = activeTab === i;
                return (
                  <div key={i} className="relative group/tab flex items-center">
                    <button onClick={() => setActiveTab(i)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all rounded-lg ${
                        isActive ? '' : 'opacity-60 hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: isActive ? `${theme.primaryColor}12` : 'transparent',
                        color: isActive ? theme.primaryColor : subColor,
                        borderLeft: isActive ? `3px solid ${theme.primaryColor}` : '3px solid transparent',
                      }}
                    >
                      {isEditing ? (
                        <span contentEditable suppressContentEditableWarning
                          onClick={(e) => { e.stopPropagation(); setActiveTab(i); }}
                          onBlur={(e) => updateTab(i, 'label', e.currentTarget.textContent || '')}
                          className="outline-none"
                        >{tab.label}</span>
                      ) : tab.label}
                    </button>
                    {isEditing && tabs.length > 1 && (
                      <button onClick={() => removeTab(i)} className="absolute right-1 p-0.5 text-destructive opacity-0 group-hover/tab:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              {isEditing && (
                <button onClick={addTab} className="flex items-center gap-1 px-4 py-2 text-xs text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  <Plus className="h-3 w-3" /> Add tab
                </button>
              )}
            </div>
            <div className="flex-1 p-4 rounded-xl" style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              borderRadius: `${borderRadius}px`,
            }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Horizontal variants
  return (
    <section style={{ ...sectionStyle, ...style }}>
      <div className="max-w-4xl mx-auto">
        {header}
        <div className={`flex ${alignClass} gap-1 mb-6 items-center overflow-x-auto scrollbar-none -mx-1 px-1 ${
          variant === 'underline' ? 'border-b border-border/40' : ''
        }`}>
          {tabs.map((tab, i) => (
            <div key={i} className="relative group/tab flex items-center">
              {renderTabButton(tab, i)}
              {isEditing && tabs.length > 1 && (
                <button onClick={() => removeTab(i)} className="p-0.5 text-destructive opacity-0 group-hover/tab:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <button onClick={addTab} className="ml-2 p-1.5 text-primary hover:bg-primary/10 rounded transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {renderContent()}
      </div>
    </section>
  );
}
