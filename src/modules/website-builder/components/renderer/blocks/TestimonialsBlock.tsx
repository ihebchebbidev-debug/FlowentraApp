import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { sanitizeHtml } from '@/utils/sanitize';
import {
  getBaseSectionStyle,
  getFullHeadingStyle,
  getBodyTextStyle,
  getThemeShadow,
  getThemeShadowHover,
  isDarkColor,
  getCardBgColor,
} from '../../../utils/themeUtils';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar?: string;
  rating?: number;
}

type TestimonialVariant = 'grid' | 'carousel' | 'masonry' | 'bubble' | 'spotlight';

interface TestimonialsBlockProps {
  title: string;
  subtitle?: string;
  testimonials: Testimonial[];
  columns?: number;
  bgColor?: string;
  titleColor?: string;
  showRating?: boolean;
  cardStyle?: 'bordered' | 'shadow' | 'minimal';
  variant?: TestimonialVariant;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function TestimonialsBlock({
  title, subtitle, testimonials, columns = 2, bgColor, titleColor, showRating = true,
  cardStyle = 'bordered', variant = 'grid', theme, isEditing, onUpdate, style,
}: TestimonialsBlockProps) {
  const dir = theme.direction || 'ltr';
  const isDark = isDarkColor(bgColor) || isDarkColor(theme.backgroundColor);
  const cardBg = getCardBgColor(theme, bgColor);
  
  // Theme-aware styles
  const _sectionStyle = getBaseSectionStyle(theme, bgColor);
  const headingStyle = getFullHeadingStyle(theme, 30, titleColor || theme.textColor);
  const subtitleStyle = getBodyTextStyle(theme, 16, theme.secondaryColor, { opacity: 0.7 });
  const _textStyle = getBodyTextStyle(theme, 14, theme.textColor, { opacity: 0.8, fontStyle: 'italic' });
  const _nameStyle = getBodyTextStyle(theme, 14, theme.textColor, { fontWeight: 600 });
  const _roleStyle = getBodyTextStyle(theme, 12, theme.secondaryColor, { opacity: 0.6 });
  const cardShadow = getThemeShadow(theme);
  const _cardHoverShadow = getThemeShadowHover(theme);

  const updateTestimonial = (index: number, field: keyof Testimonial, value: string | number) => {
    const updated = testimonials.map((t, i) => i === index ? { ...t, [field]: value } : t);
    onUpdate?.({ testimonials: updated });
  };

  const addTestimonial = () => {
    onUpdate?.({ testimonials: [...testimonials, { name: 'New Person', role: 'Role', text: 'Their testimonial here...', rating: 5 }] });
  };

  const removeTestimonial = (index: number) => {
    onUpdate?.({ testimonials: testimonials.filter((_, i) => i !== index) });
  };

  // Shared header
  const header = (
    <div className="text-center mb-12">
      {isEditing ? (
        <h2
          contentEditable suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
          className="font-bold mb-3 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
          style={headingStyle}
        >{title}</h2>
      ) : (
        <h2 className="font-bold mb-3" style={headingStyle}>{title}</h2>
      )}
      {(subtitle || isEditing) && (
        isEditing ? (
          <p
            contentEditable suppressContentEditableWarning
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

  // Shared rating component
  const renderRating = (t: Testimonial, i: number) => (
    showRating && t.rating !== undefined ? (
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, j) => (
          <span
            key={j}
            className={`cursor-${isEditing ? 'pointer' : 'default'} ${j < (t.rating ?? 0) ? 'text-amber-400' : 'text-muted-foreground/30'}`}
            onClick={isEditing ? () => updateTestimonial(i, 'rating', j + 1) : undefined}
          >★</span>
        ))}
      </div>
    ) : null
  );

  // Shared avatar component
  const renderAvatar = (t: Testimonial) => (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold overflow-hidden shrink-0"
      style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}>
      {t.avatar ? <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" /> : t.name.charAt(0)}
    </div>
  );

  // Shared info component
  const renderInfo = (t: Testimonial, i: number) => (
    <div>
      {isEditing ? (
        <p contentEditable suppressContentEditableWarning onBlur={(e) => updateTestimonial(i, 'name', e.currentTarget.textContent || '')}
          className="text-sm font-semibold outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
          style={{ color: theme.textColor }}>{t.name}</p>
      ) : (
        <p className="text-sm font-semibold" style={{ color: theme.textColor }}>{t.name}</p>
      )}
      {isEditing ? (
        <p contentEditable suppressContentEditableWarning onBlur={(e) => updateTestimonial(i, 'role', e.currentTarget.textContent || '')}
          className="text-xs opacity-60 outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
          style={{ color: theme.secondaryColor }}>{t.role}</p>
      ) : (
        <p className="text-xs opacity-60" style={{ color: theme.secondaryColor }}>{t.role}</p>
      )}
    </div>
  );

  // Shared text component
  const renderText = (t: Testimonial, i: number) => (
    isEditing ? (
      <p contentEditable suppressContentEditableWarning
        onBlur={(e) => updateTestimonial(i, 'text', e.currentTarget.innerHTML)}
        className="text-sm italic mb-4 opacity-80 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
        style={{ color: theme.textColor }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(`"${t.text}"`) }}
      />
    ) : (
      <p className="text-sm italic mb-4 opacity-80" style={{ color: theme.textColor }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(`"${t.text}"`) }} />
    )
  );

  // Card style classes - use theme shadow for 'shadow' style
  const getCardClasses = () => {
    if (cardStyle === 'shadow') return '';
    if (cardStyle === 'minimal') return '';
    return 'border';
  };
  
  const _getCardShadowStyles = (): React.CSSProperties => {
    if (cardStyle !== 'shadow') return {};
    return { boxShadow: cardShadow };
  };
  
  const cardClasses = getCardClasses();

  // ═══ CAROUSEL VARIANT ═══
  if (variant === 'carousel') {
    return (
      <CarouselTestimonials
        testimonials={testimonials} theme={theme} isEditing={isEditing}
        bgColor={bgColor} style={style} dir={dir} header={header}
        renderRating={renderRating} renderAvatar={renderAvatar} renderInfo={renderInfo} renderText={renderText}
        addTestimonial={addTestimonial} removeTestimonial={removeTestimonial}
      />
    );
  }

  // ═══ BUBBLE VARIANT ═══
  if (variant === 'bubble') {
    return (
      <section dir={dir} className="py-16 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-3xl mx-auto">
          {header}
          <div className="space-y-6">
            {testimonials.map((t, i) => (
              <div key={i} className="flex gap-4 items-start relative group/test">
                {isEditing && (
                  <button onClick={() => removeTestimonial(i)} className="absolute top-0 right-0 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/test:opacity-100 transition-opacity hover:bg-destructive/20">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
                {renderAvatar(t)}
                <div className="flex-1">
                  <div className="bg-muted/40 rounded-2xl rounded-tl-none p-4 mb-2" style={{ borderRadius: theme.borderRadius }}>
                    {renderRating(t, i)}
                    {renderText(t, i)}
                  </div>
                  {renderInfo(t, i)}
                </div>
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="text-center mt-6">
              <button onClick={addTestimonial} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3 w-3" /> Add Testimonial
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ═══ MASONRY VARIANT ═══
  if (variant === 'masonry') {
    const cols = Math.min(columns, 3);
    const colArrays: Testimonial[][] = Array.from({ length: cols }, () => []);
    testimonials.forEach((t, i) => colArrays[i % cols].push(t));

    const responsiveColClass = cols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                                cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';

    return (
      <section dir={dir} className="py-16 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-5xl mx-auto">
          {header}
          <div className={`grid ${responsiveColClass} gap-6`}>
            {colArrays.map((col, ci) => (
              <div key={ci} className="space-y-6">
                {col.map((t, ti) => {
                  const origIdx = ci + ti * cols;
                  return (
                    <div key={origIdx} className={`p-5 rounded-xl relative group/test ${!cardBg ? 'bg-card' : ''} ${cardClasses}`} style={{ borderRadius: theme.borderRadius, ...(cardBg ? { backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : undefined } : {}) }}>
                      {isEditing && (
                        <button onClick={() => removeTestimonial(origIdx)} className="absolute top-2 right-2 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/test:opacity-100 transition-opacity hover:bg-destructive/20">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                      {renderRating(t, origIdx)}
                      {renderText(t, origIdx)}
                      <div className="flex items-center gap-3">
                        {renderAvatar(t)}
                        {renderInfo(t, origIdx)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="text-center mt-6">
              <button onClick={addTestimonial} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3 w-3" /> Add Testimonial
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ═══ SPOTLIGHT VARIANT ═══
  if (variant === 'spotlight' && testimonials.length > 0) {
    const featured = testimonials[0];
    const rest = testimonials.slice(1);

    return (
      <section dir={dir} className="py-16 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-5xl mx-auto">
          {header}
          {/* Featured testimonial */}
          <div className={`p-8 rounded-2xl mb-8 relative group/test ${!cardBg ? 'bg-card' : ''} ${cardStyle === 'shadow' ? 'shadow-xl' : 'border-2'}`} style={{ borderRadius: theme.borderRadius, borderColor: theme.primaryColor + '30', ...(cardBg ? { backgroundColor: cardBg } : {}) }}>
            {isEditing && (
              <button onClick={() => removeTestimonial(0)} className="absolute top-3 right-3 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/test:opacity-100 transition-opacity hover:bg-destructive/20">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            <Quote className="h-8 w-8 mb-4 opacity-20" style={{ color: theme.primaryColor }} />
            {renderRating(featured, 0)}
            <p className="text-lg italic mb-6 opacity-80 leading-relaxed" style={{ color: theme.textColor }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(`"${featured.text}"`) }} />
            <div className="flex items-center gap-3">
              {renderAvatar(featured)}
              {renderInfo(featured, 0)}
            </div>
          </div>
          {/* Rest in grid */}
          {rest.length > 0 && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6`}>
              {rest.map((t, i) => (
                <div key={i + 1} className={`p-5 rounded-xl relative group/test ${!cardBg ? 'bg-card' : ''} ${cardClasses}`} style={{ borderRadius: theme.borderRadius, ...(cardBg ? { backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : undefined } : {}) }}>
                  {isEditing && (
                    <button onClick={() => removeTestimonial(i + 1)} className="absolute top-2 right-2 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/test:opacity-100 transition-opacity hover:bg-destructive/20">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  {renderRating(t, i + 1)}
                  {renderText(t, i + 1)}
                  <div className="flex items-center gap-3">
                    {renderAvatar(t)}
                    {renderInfo(t, i + 1)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isEditing && (
            <div className="text-center mt-6">
              <button onClick={addTestimonial} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3 w-3" /> Add Testimonial
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ═══ DEFAULT GRID VARIANT ═══
  const colClass = { 1: 'grid-cols-1', 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-3' }[columns] || 'grid-cols-1 md:grid-cols-2';

  return (
    <section dir={dir} className="py-16 px-6" style={{ backgroundColor: bgColor || theme.primaryColor + '06', fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-5xl mx-auto">
        {header}
        <div className={`grid ${colClass} gap-8`}>
          {testimonials.map((t, i) => (
            <div key={i} className={`p-6 rounded-xl relative group/test ${!cardBg ? 'bg-card' : ''} ${cardClasses}`} style={{ borderRadius: theme.borderRadius, ...(cardBg ? { backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : undefined } : {}) }}>
              {isEditing && (
                <button onClick={() => removeTestimonial(i)} className="absolute top-2 right-2 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/test:opacity-100 transition-opacity hover:bg-destructive/20">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              {renderRating(t, i)}
              {renderText(t, i)}
              <div className="flex items-center gap-3">
                {renderAvatar(t)}
                {renderInfo(t, i)}
              </div>
            </div>
          ))}
        </div>
        {isEditing && (
          <div className="text-center mt-6">
            <button onClick={addTestimonial} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add Testimonial
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Carousel sub-component ── */
function CarouselTestimonials({
  testimonials, theme, isEditing, bgColor, style, dir, header,
  renderRating, renderAvatar, renderInfo, renderText: _renderText,
  addTestimonial, removeTestimonial,
}: {
  testimonials: Testimonial[];
  theme: SiteTheme;
  isEditing?: boolean;
  bgColor?: string;
  style?: React.CSSProperties;
  dir: string;
  header: React.ReactNode;
  renderRating: (t: Testimonial, i: number) => React.ReactNode;
  renderAvatar: (t: Testimonial) => React.ReactNode;
  renderInfo: (t: Testimonial, i: number) => React.ReactNode;
  renderText: (t: Testimonial, i: number) => React.ReactNode;
  addTestimonial: () => void;
  removeTestimonial: (i: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;

  if (total === 0) return null;
  const t = testimonials[current];

  return (
    <section dir={dir} className="py-16 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-2xl mx-auto">
        {header}
        <div className="relative">
          {/* Navigation arrows */}
          {total > 1 && !isEditing && (
            <>
              <button
                onClick={() => setCurrent((current - 1 + total) % total)}
                className="absolute -left-2 sm:-left-4 md:-left-12 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors z-10"
              >
                <ChevronLeft className="h-4 w-4" style={{ color: theme.textColor }} />
              </button>
              <button
                onClick={() => setCurrent((current + 1) % total)}
                className="absolute -right-2 sm:-right-4 md:-right-12 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors z-10"
              >
                <ChevronRight className="h-4 w-4" style={{ color: theme.textColor }} />
              </button>
            </>
          )}

          <div className="text-center relative group/test">
            {isEditing && (
              <button onClick={() => removeTestimonial(current)} className="absolute top-0 right-0 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/test:opacity-100 transition-opacity hover:bg-destructive/20">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            <Quote className="h-10 w-10 mx-auto mb-4 opacity-15" style={{ color: theme.primaryColor }} />
            <div className="flex justify-center">{renderRating(t, current)}</div>
            <p className="text-lg italic mb-6 opacity-80 leading-relaxed" style={{ color: theme.textColor }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(`"${t.text}"`) }} />
            <div className="flex items-center gap-3 justify-center">
              {renderAvatar(t)}
              {renderInfo(t, current)}
            </div>
          </div>

          {/* Dots */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 h-2' : 'w-2 h-2 opacity-40 hover:opacity-70'
                  }`}
                  style={{ backgroundColor: theme.primaryColor }}
                />
              ))}
            </div>
          )}
        </div>
        {isEditing && (
          <div className="text-center mt-6">
            <button onClick={addTestimonial} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add Testimonial
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
