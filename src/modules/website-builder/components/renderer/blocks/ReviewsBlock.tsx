import React, { useState } from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2, Star, ThumbsUp, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { sanitizeHtml } from '@/utils/sanitize';

export type ReviewVariant = 'grid' | 'list' | 'carousel' | 'featured' | 'masonry';

interface ReviewItem {
  name: string;
  rating: number;
  text: string;
  date?: string;
  avatar?: string;
  verified?: boolean;
  helpful?: number;
  photos?: string[];
  title?: string;
  source?: string;
}

interface ReviewsBlockProps {
  title?: string;
  subtitle?: string;
  reviews: ReviewItem[];
  variant?: ReviewVariant;
  columns?: number;
  bgColor?: string;
  showAverage?: boolean;
  showPhotos?: boolean;
  showVerified?: boolean;
  showHelpful?: boolean;
  showSource?: boolean;
  cardStyle?: 'bordered' | 'shadow' | 'minimal' | 'filled';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

function StarRating({ rating, size = 'sm', interactive, onChange }: { rating: number; size?: 'sm' | 'lg'; interactive?: boolean; onChange?: (r: number) => void }) {
  const cls = size === 'lg' ? 'text-lg' : 'text-xs';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`${cls} ${interactive ? 'cursor-pointer' : ''} ${i < rating ? 'text-amber-400' : 'text-muted-foreground/30'}`}
          onClick={interactive ? () => onChange?.(i + 1) : undefined}>★</span>
      ))}
    </div>
  );
}

function AverageRating({ reviews, theme }: { reviews: ReviewItem[]; theme: SiteTheme }) {
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map(s => ({ stars: s, count: reviews.filter(r => r.rating === s).length }));
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8 p-4 sm:p-6 rounded-xl border" style={{ borderRadius: theme.borderRadius }}>
      <div className="text-center">
        <div className="text-4xl font-bold" style={{ color: theme.textColor }}>{avg.toFixed(1)}</div>
        <StarRating rating={Math.round(avg)} size="lg" />
        <p className="text-xs mt-1 opacity-60" style={{ color: theme.secondaryColor }}>{reviews.length} reviews</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {dist.map(d => (
          <div key={d.stars} className="flex items-center gap-2">
            <span className="text-xs w-3 text-right" style={{ color: theme.secondaryColor }}>{d.stars}</span>
            <Star className="h-3 w-3 text-amber-400" />
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%`, backgroundColor: theme.primaryColor }} />
            </div>
            <span className="text-xs w-6" style={{ color: theme.secondaryColor }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewsBlock({
  title, subtitle, reviews, variant = 'grid', columns = 2, bgColor,
  showAverage = true, showPhotos = true, showVerified = true, showHelpful = true,
  showSource = false, cardStyle = 'bordered', theme, isEditing, onUpdate, style,
}: ReviewsBlockProps) {
  const [carouselIdx, setCarouselIdx] = useState(0);

  const cardCls = {
    bordered: 'border',
    shadow: 'shadow-md',
    minimal: '',
    filled: 'bg-muted/30',
  }[cardStyle] || 'border';

  const updateReview = (idx: number, field: keyof ReviewItem, val: any) => {
    const updated = reviews.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
    onUpdate?.({ reviews: updated });
  };
  const addReview = () => onUpdate?.({ reviews: [...reviews, { name: 'New Reviewer', rating: 5, text: 'Great experience!', date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), verified: true }] });
  const removeReview = (idx: number) => onUpdate?.({ reviews: reviews.filter((_, i) => i !== idx) });

  const renderReviewCard = (r: ReviewItem, i: number) => (
    <div key={i} className={`p-5 rounded-xl relative group/rev ${cardCls}`} style={{ borderRadius: theme.borderRadius }}>
      {isEditing && (
        <button onClick={() => removeReview(i)} className="absolute top-2 right-2 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/rev:opacity-100 transition-opacity hover:bg-destructive/20">
          <Trash2 className="h-3 w-3" />
        </button>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
          style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}>
          {r.avatar ? <img src={r.avatar} alt={r.name} className="w-full h-full rounded-full object-cover" /> : r.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isEditing ? (
              <input type="text" value={r.name} onChange={(e) => updateReview(i, 'name', e.target.value)}
                className="text-sm font-semibold bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5 min-w-0"
                style={{ color: theme.textColor }}
              />
            ) : (
              <p className="text-sm font-semibold truncate" style={{ color: theme.textColor }}>{r.name}</p>
            )}
            {showVerified && r.verified && <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2">
            <StarRating rating={r.rating} interactive={isEditing} onChange={(val) => updateReview(i, 'rating', val)} />
            {r.date && (
              isEditing ? (
                <input type="text" value={r.date} onChange={(e) => updateReview(i, 'date', e.target.value)}
                  className="text-xs opacity-50 bg-transparent outline-none w-20" style={{ color: theme.secondaryColor }}
                />
              ) : (
                <span className="text-xs opacity-50" style={{ color: theme.secondaryColor }}>{r.date}</span>
              )
            )}
          </div>
        </div>
        {showSource && r.source && !isEditing && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium" style={{ color: theme.secondaryColor }}>{r.source}</span>
        )}
      </div>
      {/* Title */}
      {(r.title || isEditing) && (
        isEditing ? (
          <input type="text" value={r.title || ''} onChange={(e) => updateReview(i, 'title', e.target.value)} placeholder="Review title (optional)..."
            className="w-full text-sm font-semibold mb-1 bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
            style={{ color: theme.textColor }}
          />
        ) : r.title ? (
          <p className="text-sm font-semibold mb-1" style={{ color: theme.textColor }}>{r.title}</p>
        ) : null
      )}
      {/* Text */}
      {isEditing ? (
        <textarea value={r.text} onChange={(e) => updateReview(i, 'text', e.target.value)} rows={2}
          className="w-full text-sm leading-relaxed bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5 resize-none"
          style={{ color: theme.secondaryColor }}
        />
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: theme.secondaryColor }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(r.text) }} />
      )}
      {/* Photos */}
      {showPhotos && r.photos && r.photos.length > 0 && (
        <div className="flex gap-2 mt-3">
          {r.photos.map((photo, pi) => (
            <div key={pi} className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
      {/* Helpful */}
      {showHelpful && !isEditing && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <button className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity" style={{ color: theme.secondaryColor }}>
            <ThumbsUp className="h-3 w-3" /> Helpful {r.helpful ? `(${r.helpful})` : ''}
          </button>
        </div>
      )}
    </div>
  );

  // ── Carousel variant ──
  if (variant === 'carousel') {
    const visibleReview = reviews[carouselIdx];
    return (
      <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
        <div className="max-w-3xl mx-auto">
          {title && <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
          {subtitle && <p className="text-center mb-8 opacity-70" style={{ color: theme.secondaryColor }}>{subtitle}</p>}
          {showAverage && reviews.length > 0 && <AverageRating reviews={reviews} theme={theme} />}
          {visibleReview && (
            <div className="relative">
              {renderReviewCard(visibleReview, carouselIdx)}
              <div className="flex justify-center items-center gap-4 mt-6">
                <button onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))} disabled={carouselIdx === 0}
                  className="p-2 rounded-full border hover:bg-muted disabled:opacity-30 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium" style={{ color: theme.secondaryColor }}>{carouselIdx + 1} / {reviews.length}</span>
                <button onClick={() => setCarouselIdx(Math.min(reviews.length - 1, carouselIdx + 1))} disabled={carouselIdx === reviews.length - 1}
                  className="p-2 rounded-full border hover:bg-muted disabled:opacity-30 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {isEditing && (
            <div className="text-center mt-4">
              <button onClick={addReview} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3 w-3" /> Add Review
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ── Featured: highlight a top review ──
  if (variant === 'featured' && reviews.length > 0) {
    const [featured, ...rest] = reviews;
    return (
      <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
        <div className="max-w-5xl mx-auto">
          {title && <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
          {subtitle && <p className="text-center mb-8 opacity-70" style={{ color: theme.secondaryColor }}>{subtitle}</p>}
          {showAverage && <AverageRating reviews={reviews} theme={theme} />}
          <div className="p-8 rounded-2xl border-2 mb-6" style={{ borderColor: theme.primaryColor + '30', borderRadius: theme.borderRadius, backgroundColor: theme.primaryColor + '05' }}>
            {renderReviewCard(featured, 0)}
          </div>
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rest.map((r, i) => renderReviewCard(r, i + 1))}
            </div>
          )}
          {isEditing && (
            <div className="text-center mt-6">
              <button onClick={addReview} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3 w-3" /> Add Review
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ── List variant ──
  if (variant === 'list') {
    return (
      <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
        <div className="max-w-3xl mx-auto">
          {title && <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
          {subtitle && <p className="text-center mb-8 opacity-70" style={{ color: theme.secondaryColor }}>{subtitle}</p>}
          {showAverage && reviews.length > 0 && <AverageRating reviews={reviews} theme={theme} />}
          <div className="space-y-4">
            {reviews.map((r, i) => renderReviewCard(r, i))}
          </div>
          {isEditing && (
            <div className="text-center mt-6">
              <button onClick={addReview} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3 w-3" /> Add Review
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ── Default grid / masonry ──
  const colCls = { 1: 'grid-cols-1', 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' }[columns] || 'grid-cols-1 md:grid-cols-2';

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-5xl mx-auto">
        {title && (
          isEditing ? (
            <input type="text" value={title} onChange={(e) => onUpdate?.({ title: e.target.value })}
              className="w-full text-2xl font-bold mb-2 text-center bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: theme.textColor, fontFamily: theme.headingFont }}
            />
          ) : (
            <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>
          )
        )}
        {(subtitle || isEditing) && (
          isEditing ? (
            <input type="text" value={subtitle || ''} onChange={(e) => onUpdate?.({ subtitle: e.target.value })} placeholder="Subtitle..."
              className="w-full text-center mb-8 opacity-70 bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: theme.secondaryColor }}
            />
          ) : subtitle ? (
            <p className="text-center mb-8 opacity-70" style={{ color: theme.secondaryColor }}>{subtitle}</p>
          ) : <div className="mb-8" />
        )}
        {showAverage && reviews.length > 0 && <AverageRating reviews={reviews} theme={theme} />}
        <div className={`grid ${colCls} gap-6`}>
          {reviews.map((r, i) => renderReviewCard(r, i))}
        </div>
        {isEditing && (
          <div className="text-center mt-6">
            <button onClick={addReview} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add Review
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
