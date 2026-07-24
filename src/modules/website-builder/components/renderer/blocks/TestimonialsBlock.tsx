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

type TestimonialVariant = 'grid' | 'carousel' | 'masonry' | 'bubble' | 'spotlight' | 'editorial-quote';

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

  // ═══ EDITORIAL QUOTE VARIANT — single massive pull-quote, thumbnail nav ═══
  if (variant === 'editorial-quote' && testimonials.length > 0) {
    return (
      <EditorialQuoteTestimonials
        testimonials={testimonials} theme={theme} isEditing={isEditing}
        bgColor={bgColor} style={style} dir={dir} title={title} subtitle={subtitle}
        onUpdate={onUpdate} addTestimonial={addTestimonial} removeTestimonial={removeTestimonial}
        showRating={showRating}
      />
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

/* ═══════════════════════════════════════
   EDITORIAL QUOTE — single huge pull-quote with thumbnail navigation
   ═══════════════════════════════════════ */
function EditorialQuoteTestimonials({
  testimonials, theme, isEditing, bgColor, style, dir, title, subtitle,
  onUpdate, addTestimonial, removeTestimonial, showRating,
}: {
  testimonials: Testimonial[];
  theme: SiteTheme;
  isEditing?: boolean;
  bgColor?: string;
  style?: React.CSSProperties;
  dir: string;
  title: string;
  subtitle?: string;
  onUpdate?: (props: Record<string, any>) => void;
  addTestimonial: () => void;
  removeTestimonial: (i: number) => void;
  showRating?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;
  const t = testimonials[current] || testimonials[0];

  if (!t) return null;

  const isDark = isDarkColor(bgColor) || isDarkColor(theme.backgroundColor);
  const textColor = isDark ? '#f1f5f9' : theme.textColor;
  const mutedColor = isDark ? '#94a3b8' : theme.secondaryColor;

  return (
    <section
      dir={dir}
      className="py-20 md:py-28 px-6 relative overflow-hidden"
      style={{ backgroundColor: bgColor || theme.backgroundColor, fontFamily: theme.bodyFont, ...style }}
    >
      {/* Massive faded background quote mark */}
      <div
        aria-hidden
        className="absolute -top-8 left-4 md:left-12 select-none pointer-events-none font-bold leading-none"
        style={{
          fontFamily: theme.headingFont,
          color: theme.primaryColor,
          fontSize: 'clamp(280px, 40vw, 520px)',
          opacity: 0.06,
        }}
      >
        “
      </div>

      <div className="max-w-5xl mx-auto relative">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-12" style={{ backgroundColor: theme.primaryColor }} />
          {isEditing ? (
            <span
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="text-px-11 tracking-[0.35em] uppercase font-semibold outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: theme.primaryColor }}
            >{title}</span>
          ) : (
            <span className="text-px-11 tracking-[0.35em] uppercase font-semibold" style={{ color: theme.primaryColor }}>{title}</span>
          )}
        </div>

        {/* Quote text — oversized serif */}
        <blockquote
          className="font-bold leading-[1.05] tracking-tight mb-10"
          style={{
            fontFamily: theme.headingFont,
            color: textColor,
            fontSize: 'clamp(28px, 4.5vw, 56px)',
            letterSpacing: '-0.02em',
          }}
        >
          {isEditing ? (
            <span
              contentEditable suppressContentEditableWarning
              onBlur={(e) => {
                const updated = testimonials.map((tx, i) => i === current ? { ...tx, text: e.currentTarget.textContent || '' } : tx);
                onUpdate?.({ testimonials: updated });
              }}
              className="outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
            >“{t.text}”</span>
          ) : (
            <>“{t.text}”</>
          )}
        </blockquote>

        {/* Attribution row */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-8 border-b" style={{ borderColor: mutedColor + '30' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-offset-2" style={{ ringColor: theme.primaryColor } as React.CSSProperties}>
              {t.avatar ? (
                <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold" style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}>{t.name.charAt(0)}</div>
              )}
            </div>
            <div>
              <div className="text-base font-semibold" style={{ color: textColor, fontFamily: theme.headingFont }}>{t.name}</div>
              <div className="text-xs tracking-wider uppercase opacity-60" style={{ color: mutedColor }}>{t.role}</div>
            </div>
          </div>
          {showRating && t.rating !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <span key={j} className={j < (t.rating ?? 0) ? 'text-amber-400' : 'text-muted-foreground/30'}>★</span>
                ))}
              </div>
              <span className="text-px-10 tracking-widest uppercase opacity-50 ml-2" style={{ color: mutedColor }}>Verified</span>
            </div>
          )}
        </div>

        {/* Thumbnail navigator */}
        {total > 1 && (
          <div className="flex items-center gap-3 mt-8">
            <span className="text-px-10 tracking-[0.3em] uppercase opacity-50 mr-3" style={{ color: mutedColor }}>
              {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {testimonials.map((tx, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`group/thumb relative transition-all ${i === current ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-80 scale-90'}`}
                  aria-label={`View testimonial from ${tx.name}`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-1" style={{ ringColor: i === current ? theme.primaryColor : 'transparent' } as React.CSSProperties}>
                    {tx.avatar ? (
                      <img src={tx.avatar} alt={tx.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}>{tx.name.charAt(0)}</div>
                    )}
                  </div>
                  {i === current && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                  )}
                  {isEditing && total > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTestimonial(i); if (current >= total - 1) setCurrent(Math.max(0, current - 1)); }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-px-10 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center"
                    >×</button>
                  )}
                </button>
              ))}
              {isEditing && (
                <button onClick={addTestimonial} className="w-10 h-10 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {(subtitle || isEditing) && (
          isEditing ? (
            <p
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
              className="text-sm max-w-md mt-8 opacity-60 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: mutedColor }}
            >{subtitle || 'Add subtitle...'}</p>
          ) : subtitle ? (
            <p className="text-sm max-w-md mt-8 opacity-60" style={{ color: mutedColor }}>{subtitle}</p>
          ) : null
        )}
      </div>
    </section>
  );
}
