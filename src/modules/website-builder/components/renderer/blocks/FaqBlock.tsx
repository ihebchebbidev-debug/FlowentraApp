import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { sanitizeHtml } from '@/utils/sanitize';
import {
  getBaseSectionStyle,
  getFullHeadingStyle,
  getBodyTextStyle,
  getScaledFontSize,
  getCardStyle,
  getThemeShadow,
  isDarkColor,
} from '../../../utils/themeUtils';

interface FaqItem {
  question: string;
  answer: string;
}

type FaqVariant = 'accordion' | 'accordion-bordered' | 'grid' | 'side-by-side';

interface FaqBlockProps {
  title: string;
  subtitle?: string;
  items: FaqItem[];
  bgColor?: string;
  variant?: FaqVariant;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function FaqBlock({ title, subtitle, items, bgColor, variant = 'accordion', theme, isEditing, onUpdate, style }: FaqBlockProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isDark = isDarkColor(bgColor) || isDarkColor(theme.backgroundColor);

  const updateItem = (index: number, field: keyof FaqItem, value: string) => {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onUpdate?.({ items: updated });
  };

  const addItem = () => {
    onUpdate?.({ items: [...items, { question: 'New Question?', answer: 'Answer goes here.' }] });
  };

  const removeItem = (index: number) => {
    onUpdate?.({ items: items.filter((_, i) => i !== index) });
  };

  // Theme-aware styles
  const textColor = isDark ? '#f1f5f9' : theme.textColor;
  const subColor = isDark ? '#94a3b8' : theme.secondaryColor;
  const sectionStyle = getBaseSectionStyle(theme, bgColor);
  const headingStyle = getFullHeadingStyle(theme, 30, textColor);
  const subtitleStyle = getBodyTextStyle(theme, 16, subColor, { opacity: 0.7 });
  const questionStyle = getBodyTextStyle(theme, 14, textColor, { fontWeight: 600 });
  const answerStyle = getBodyTextStyle(theme, 14, subColor, { opacity: 0.8, lineHeight: 1.6 });
  const cardStyles = getCardStyle(theme);
  const cardShadow = getThemeShadow(theme);

  // Shared header
  const header = (
    <div className="text-center mb-10">
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
    <div className="text-center mt-4">
      <button onClick={addItem} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        style={{ fontSize: getScaledFontSize(12, theme) }}>
        <Plus className="h-3 w-3" /> Add FAQ
      </button>
    </div>
  ) : null;

  // ═══ GRID VARIANT ═══
  if (variant === 'grid') {
    return (
      <section style={{ ...sectionStyle, ...style }}>
        <div className="max-w-5xl mx-auto">
          {header}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item, i) => (
              <div key={i} className="p-6 relative group/faq" style={{ ...cardStyles, boxShadow: cardShadow }}>
                {isEditing && (
                  <button onClick={() => removeItem(i)} className="absolute top-3 right-3 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/faq:opacity-100 transition-opacity hover:bg-destructive/20">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
                {isEditing ? (
                  <h3 contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateItem(i, 'question', e.currentTarget.textContent || '')}
                    className="font-semibold mb-3 outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                    style={questionStyle}
                  >{item.question}</h3>
                ) : (
                  <h3 className="font-semibold mb-3" style={questionStyle}>{item.question}</h3>
                )}
                {isEditing ? (
                  <p contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateItem(i, 'answer', e.currentTarget.innerHTML)}
                    className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                    style={answerStyle}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }}
                  />
                ) : (
                  <p style={answerStyle} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }} />
                )}
              </div>
            ))}
          </div>
          {addButton}
        </div>
      </section>
    );
  }

  // ═══ SIDE-BY-SIDE VARIANT ═══
  if (variant === 'side-by-side') {
    return (
      <section style={{ ...sectionStyle, ...style }}>
        <div className="max-w-4xl mx-auto">
          {header}
          <div className="space-y-8">
            {items.map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 relative group/faq pb-8 border-b border-border/30 last:border-b-0">
                {isEditing && (
                  <button onClick={() => removeItem(i)} className="absolute top-0 right-0 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/faq:opacity-100 transition-opacity hover:bg-destructive/20">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
                <div className="md:w-2/5">
                  {isEditing ? (
                    <h3 contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateItem(i, 'question', e.currentTarget.textContent || '')}
                      className="font-semibold outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                      style={{ ...questionStyle, fontSize: getScaledFontSize(16, theme) }}
                    >{item.question}</h3>
                  ) : (
                    <h3 className="font-semibold" style={{ ...questionStyle, fontSize: getScaledFontSize(16, theme) }}>{item.question}</h3>
                  )}
                </div>
                <div className="md:w-3/5">
                  {isEditing ? (
                    <p contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateItem(i, 'answer', e.currentTarget.innerHTML)}
                      className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                      style={answerStyle}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }}
                    />
                  ) : (
                    <p style={answerStyle} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }} />
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

  // ═══ ACCORDION-BORDERED VARIANT ═══
  if (variant === 'accordion-bordered') {
    return (
      <section style={{ ...sectionStyle, ...style }}>
        <div className="max-w-3xl mx-auto">
          {header}
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="border-2 overflow-hidden relative group/faq transition-colors"
                style={{ 
                  ...cardStyles,
                  borderColor: openIndex === i || isEditing ? theme.primaryColor + '40' : isDark ? '#334155' : '#e2e8f0',
                }}>
                {isEditing && (
                  <button onClick={() => removeItem(i)} className="absolute top-3 right-10 z-10 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/faq:opacity-100 transition-opacity hover:bg-destructive/20">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
                  onClick={() => !isEditing && setOpenIndex(openIndex === i ? null : i)}
                >
                  {isEditing ? (
                    <span contentEditable suppressContentEditableWarning
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => updateItem(i, 'question', e.currentTarget.textContent || '')}
                      className="font-semibold outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5 flex-1"
                      style={questionStyle}
                    >{item.question}</span>
                  ) : (
                    <span className="font-semibold" style={questionStyle}>{item.question}</span>
                  )}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: openIndex === i || isEditing ? theme.primaryColor + '15' : 'transparent' }}>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openIndex === i || isEditing ? 'rotate-180' : ''}`}
                      style={{ color: openIndex === i || isEditing ? theme.primaryColor : subColor }} />
                  </div>
                </button>
                {(openIndex === i || isEditing) && (
                  <div className="px-4 pb-4 animate-fade-in">
                    {isEditing ? (
                      <p contentEditable suppressContentEditableWarning
                        onBlur={(e) => updateItem(i, 'answer', e.currentTarget.innerHTML)}
                        className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                        style={answerStyle}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }}
                      />
                    ) : (
                      <p style={answerStyle} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {addButton}
        </div>
      </section>
    );
  }

  // ═══ DEFAULT ACCORDION VARIANT ═══
  return (
    <section style={{ ...sectionStyle, ...style }}>
      <div className="max-w-3xl mx-auto">
        {header}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border overflow-hidden relative group/faq" style={cardStyles}>
              {isEditing && (
                <button onClick={() => removeItem(i)} className="absolute top-3 right-10 z-10 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/faq:opacity-100 transition-opacity hover:bg-destructive/20">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                onClick={() => !isEditing && setOpenIndex(openIndex === i ? null : i)}
              >
                {isEditing ? (
                  <span contentEditable suppressContentEditableWarning
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => updateItem(i, 'question', e.currentTarget.textContent || '')}
                    className="font-medium outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5 flex-1"
                    style={questionStyle}
                  >{item.question}</span>
                ) : (
                  <span className="font-medium" style={questionStyle}>{item.question}</span>
                )}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openIndex === i || isEditing ? 'rotate-180' : ''}`} style={{ color: subColor }} />
              </button>
              {(openIndex === i || isEditing) && (
                <div className="px-4 pb-4">
                  {isEditing ? (
                    <p contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateItem(i, 'answer', e.currentTarget.innerHTML)}
                      className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
                      style={answerStyle}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }}
                    />
                  ) : (
                    <p style={answerStyle} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {addButton}
      </div>
    </section>
  );
}
