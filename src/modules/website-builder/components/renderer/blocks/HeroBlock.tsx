import React, { useCallback, useState, useEffect, useRef } from 'react';
import { SiteTheme } from '../../../types';
import { CTAButton } from '../../../types/shared';
import { Upload, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useImageDrop } from '../../../hooks/useImageDrop';
import { readFileAsDataUrl } from '../../../utils/imageUtils';
import { toast } from 'sonner';
import { ActionButton } from '../ActionButton';
import { sanitizeHtml } from '@/utils/sanitize';
import {
  getHeadingStyle,
  getBodyTextStyle,
  getButtonStyle,
  getThemeShadow,
  getFontScale,
} from '../../../utils/themeUtils';
import {
  HeroHeight,
  TransitionType,
  getHeroHeightClass,
  getAlignmentClass,
  getButtonAlignClass,
  buildHeroButtonList,
  getHeroButtonStyle,
  resolveHeadingColor,
  resolveSubheadingColor,
  getOverlayStyle,
  getSlideTransitionStyle,
  getHeroBackgroundStyle,
} from '../../../utils/heroUtils';

interface HeroSlide {
  heading: string;
  subheading: string;
  backgroundImage?: string;
  buttons?: CTAButton[];
  overlayOpacity?: number;
  headingColor?: string;
  subheadingColor?: string;
}

type HeroVariant = 'standard' | 'carousel' | 'split' | 'video-bg' | 'gradient';
type HeroAlignment = 'left' | 'center' | 'right';

interface HeroBlockProps {
  // Standard props (backward-compatible)
  heading: string;
  subheading: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  buttons?: CTAButton[];
  backgroundImage?: string;
  alignment?: HeroAlignment;
  height?: HeroHeight;
  overlayOpacity?: number;
  headingColor?: string;
  subheadingColor?: string;
  ctaColor?: string;
  ctaTextColor?: string;
  // Carousel / variant props
  variant?: HeroVariant;
  slides?: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number; // seconds
  transition?: TransitionType;
  showDots?: boolean;
  showArrows?: boolean;
  pauseOnHover?: boolean;
  // Split variant
  splitImage?: string;
  splitPosition?: 'left' | 'right';
  // Gradient variant
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  // Video variant
  videoUrl?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function HeroBlock(props: HeroBlockProps) {
  const {
    heading, subheading, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink,
    buttons, backgroundImage, alignment = 'center', height = 'medium',
    overlayOpacity = 40, headingColor, subheadingColor, ctaColor, ctaTextColor,
    variant = 'standard',
    slides = [],
    autoPlay = true,
    autoPlayInterval = 5,
    transition = 'fade',
    showDots = true,
    showArrows = true,
    pauseOnHover = true,
    splitImage, splitPosition = 'right',
    gradientFrom, gradientTo, gradientAngle = 135,
    videoUrl,
    theme, isEditing, onUpdate, style,
  } = props;

  if (variant === 'carousel' && slides.length > 0) {
    return <CarouselHero {...props} />;
  }
  if (variant === 'split') {
    return <SplitHero {...props} />;
  }
  if (variant === 'gradient') {
    return <GradientHero {...props} />;
  }
  if (variant === 'video-bg' && videoUrl) {
    return <VideoHero {...props} />;
  }

  return <StandardHero {...props} />;
}

/* ═══════════════════════════════════════
   STANDARD HERO (original)
   ═══════════════════════════════════════ */
function StandardHero({
  heading, subheading, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink,
  buttons, backgroundImage, alignment = 'center', height = 'medium',
  overlayOpacity = 40, headingColor, subheadingColor, ctaColor, ctaTextColor,
  theme, isEditing, onUpdate, style,
}: HeroBlockProps) {
  const alignClass = getAlignmentClass(alignment);
  const heightClass = getHeroHeightClass(height, theme);
  const dir = theme.direction || 'ltr';

  const handleImageDrop = useCallback((dataUri: string) => {
    onUpdate?.({ backgroundImage: dataUri });
  }, [onUpdate]);
  const { isDragOver, dropProps } = useImageDrop(handleImageDrop);

  const hColor = resolveHeadingColor(headingColor, !!backgroundImage, theme);
  const sColor = resolveSubheadingColor(subheadingColor, !!backgroundImage, theme);
  const bColor = ctaColor || theme.primaryColor;
  const bTextColor = ctaTextColor || '#ffffff';

  const buttonList = buildHeroButtonList(buttons, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink, bColor, bTextColor);

  return (
    <section
      dir={dir}
      className={`relative py-24 px-6 flex flex-col justify-center ${alignClass} ${heightClass}`}
      style={{
        ...getHeroBackgroundStyle(backgroundImage, theme.primaryColor + '10'),
        fontFamily: theme.headingFont,
        ...style,
      }}
      {...(isEditing ? dropProps : {})}
    >
      {backgroundImage && <div className="absolute inset-0" style={getOverlayStyle(overlayOpacity)} />}

      {isEditing && isDragOver && <DropOverlay />}
      {isEditing && <ImageUploadButtons onUpdate={onUpdate} backgroundImage={backgroundImage} />}

      <HeroContent
        heading={heading} subheading={subheading}
        hColor={hColor} sColor={sColor}
        alignment={alignment} theme={theme}
        isEditing={isEditing} onUpdate={onUpdate}
        buttonList={buttonList}
      />
    </section>
  );
}

/* ═══════════════════════════════════════
   CAROUSEL HERO
   ═══════════════════════════════════════ */
function CarouselHero({
  slides = [], alignment = 'center', height = 'medium',
  overlayOpacity = 40, ctaColor, ctaTextColor,
  autoPlay = true, autoPlayInterval = 5, transition = 'fade',
  showDots = true, showArrows = true, pauseOnHover = true,
  theme, isEditing, onUpdate, style,
}: HeroBlockProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const total = slides.length;

  const alignClass = getAlignmentClass(alignment);
  const heightClass = getHeroHeightClass(height, theme);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || isPaused || isEditing || total <= 1) return;
    timeoutRef.current = setTimeout(() => {
      setCurrent(prev => (prev + 1) % total);
    }, autoPlayInterval * 1000);
    return () => clearTimeout(timeoutRef.current);
  }, [current, autoPlay, autoPlayInterval, isPaused, isEditing, total]);

  const goTo = (idx: number) => setCurrent(idx);
  const prev = () => setCurrent(c => (c - 1 + total) % total);
  const next = () => setCurrent(c => (c + 1) % total);

  const bColor = ctaColor || theme.primaryColor;
  const bTextColor = ctaTextColor || '#ffffff';

  return (
    <section
      className={`relative overflow-hidden ${heightClass}`}
      style={{ fontFamily: theme.headingFont, ...style }}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, idx) => {
        const isActive = idx === current;
        const hColor = resolveHeadingColor(slide.headingColor, !!slide.backgroundImage, theme);
        const sColor = resolveSubheadingColor(slide.subheadingColor, !!slide.backgroundImage, theme);
        const slideButtons = buildHeroButtonList(slide.buttons, undefined, undefined, undefined, undefined, bColor, bTextColor);
        const transitionStyle = getSlideTransitionStyle(transition, isActive, idx, current);

        return (
          <div
            key={idx}
            className={`absolute inset-0 flex flex-col justify-center px-6 transition-all duration-700 ease-in-out ${alignClass}`}
            style={{
              ...getHeroBackgroundStyle(slide.backgroundImage, theme.primaryColor + '10'),
              ...transitionStyle,
              zIndex: isActive ? 2 : 1,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            {slide.backgroundImage && (
              <div className="absolute inset-0" style={getOverlayStyle(slide.overlayOpacity ?? overlayOpacity)} />
            )}

            <div className="relative z-10 max-w-3xl mx-auto space-y-6 w-full">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: hColor }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(slide.heading) }} />
              <p className="text-lg md:text-xl opacity-90" style={{ color: sColor, fontFamily: theme.bodyFont }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(slide.subheading) }} />
              {slideButtons.length > 0 && (
                <div className={`flex flex-wrap gap-3 ${getButtonAlignClass(alignment)}`}>
                  {slideButtons.map((btn, i) => (
                    isEditing ? (
                      <span
                        key={i}
                        contentEditable
                        suppressContentEditableWarning
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block px-8 py-3 font-semibold rounded-lg cursor-text outline-none focus:ring-2 focus:ring-primary/50"
                        style={{ ...getHeroButtonStyle(btn, theme, bColor, bTextColor), fontFamily: theme.bodyFont }}
                      >
                        {btn.text}
                      </span>
                    ) : (
                      <a
                        key={i}
                        href={btn.link}
                        className="inline-block px-8 py-3 font-semibold transition-transform hover:scale-105"
                        style={{ ...getHeroButtonStyle(btn, theme, bColor, bTextColor), fontFamily: theme.bodyFont }}
                      >
                        {btn.text}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Arrows */}
      {showArrows && total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === current ? 'w-8 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {autoPlay && total > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/20">
          <div
            className="h-full bg-white/60"
            style={{
              animation: isPaused ? 'none' : `heroProgress ${autoPlayInterval}s linear`,
              animationFillMode: 'forwards',
            }}
            key={current}
          />
        </div>
      )}

      {/* Editor info */}
      {isEditing && (
        <div className="absolute top-3 left-3 z-20 bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-lg">
          Carousel: {total} slides • {transition} • {autoPlay ? `${autoPlayInterval}s auto` : 'manual'}
        </div>
      )}

      <style>{`
        @keyframes heroProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}

/* ═══════════════════════════════════════
   SPLIT HERO
   ═══════════════════════════════════════ */
function SplitHero({
  heading, subheading, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink,
  buttons, alignment = 'left', height = 'medium',
  headingColor, subheadingColor, ctaColor, ctaTextColor,
  splitImage, splitPosition = 'right',
  theme, isEditing, onUpdate, style,
}: HeroBlockProps) {
  const heightClass = getHeroHeightClass(height, theme);
  const bColor = ctaColor || theme.primaryColor;
  const bTextColor = ctaTextColor || '#ffffff';
  const hColor = resolveHeadingColor(headingColor, false, theme);
  const sColor = resolveSubheadingColor(subheadingColor, false, theme);
  const buttonList = buildHeroButtonList(buttons, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink, bColor, bTextColor);

  const imageSection = (
    <div className="flex-1 relative overflow-hidden">
      {splitImage ? (
        <img src={splitImage} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: theme.primaryColor + '15' }}>
          <ImageIcon className="h-16 w-16 opacity-20" style={{ color: theme.textColor }} />
        </div>
      )}
    </div>
  );

  const contentSection = (
    <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12">
      <div className="max-w-lg space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: hColor, fontFamily: theme.headingFont }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(heading) }} />
        <p className="text-lg opacity-90" style={{ color: sColor, fontFamily: theme.bodyFont }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(subheading) }} />
        {buttonList.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {buttonList.map((btn, i) => (
              isEditing ? (
                <span
                  key={i}
                  contentEditable
                  suppressContentEditableWarning
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block px-8 py-3 font-semibold rounded-lg cursor-text outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ ...getHeroButtonStyle(btn, theme, bColor, bTextColor), fontFamily: theme.bodyFont }}
                >
                  {btn.text}
                </span>
              ) : (
                <a
                  key={i}
                  href={btn.link}
                  className="inline-block px-8 py-3 font-semibold transition-transform hover:scale-105"
                  style={{ ...getHeroButtonStyle(btn, theme, bColor, bTextColor), fontFamily: theme.bodyFont }}
                >
                  {btn.text}
                </a>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section
      className={`flex flex-col md:flex-row ${heightClass}`}
      style={{ backgroundColor: theme.backgroundColor, ...style }}
    >
      {splitPosition === 'left' ? (
        <>{imageSection}{contentSection}</>
      ) : (
        <>{contentSection}{imageSection}</>
      )}
      {isEditing && (
        <div className="absolute top-3 left-3 z-20 bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-lg">
          Split Hero • Image {splitPosition}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════
   GRADIENT HERO
   ═══════════════════════════════════════ */
function GradientHero({
  heading, subheading, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink,
  buttons, alignment = 'center', height = 'medium',
  headingColor, subheadingColor, ctaColor, ctaTextColor,
  gradientFrom, gradientTo, gradientAngle = 135,
  theme, isEditing, onUpdate, style,
}: HeroBlockProps) {
  const alignClass = getAlignmentClass(alignment);
  const heightClass = getHeroHeightClass(height, theme);
  const bColor = ctaColor || '#ffffff';
  const bTextColor = ctaTextColor || theme.primaryColor;
  const hColor = headingColor || '#ffffff';
  const sColor = subheadingColor || '#ffffffcc';
  const from = gradientFrom || theme.primaryColor;
  const to = gradientTo || theme.accentColor;
  const buttonList = buildHeroButtonList(buttons, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink, bColor, bTextColor);

  return (
    <section
      className={`relative py-24 px-6 flex flex-col justify-center ${alignClass} ${heightClass}`}
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${from}, ${to})`,
        fontFamily: theme.headingFont,
        ...style,
      }}
    >
      <HeroContent
        heading={heading} subheading={subheading}
        hColor={hColor} sColor={sColor}
        alignment={alignment} theme={theme}
        isEditing={isEditing} onUpdate={onUpdate}
        buttonList={buttonList}
      />
      {isEditing && (
        <div className="absolute top-3 left-3 z-20 bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-lg">
          Gradient Hero • {gradientAngle}°
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════
   VIDEO BG HERO
   ═══════════════════════════════════════ */
function VideoHero({
  heading, subheading, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink,
  buttons, alignment = 'center', height = 'large',
  overlayOpacity = 50, headingColor, subheadingColor, ctaColor, ctaTextColor,
  videoUrl,
  theme, isEditing, onUpdate, style,
}: HeroBlockProps) {
  const alignClass = getAlignmentClass(alignment);
  const heightClass = getHeroHeightClass(height, theme);
  const bColor = ctaColor || theme.primaryColor;
  const bTextColor = ctaTextColor || '#ffffff';
  const hColor = headingColor || '#ffffff';
  const sColor = subheadingColor || '#ffffffcc';
  const buttonList = buildHeroButtonList(buttons, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink, bColor, bTextColor);

  return (
    <section
      className={`relative overflow-hidden py-24 px-6 flex flex-col justify-center ${alignClass} ${heightClass}`}
      style={{ fontFamily: theme.headingFont, ...style }}
    >
      {videoUrl && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
          autoPlay muted loop playsInline
        />
      )}
      <div className="absolute inset-0" style={getOverlayStyle(overlayOpacity)} />

      <HeroContent
        heading={heading} subheading={subheading}
        hColor={hColor} sColor={sColor}
        alignment={alignment} theme={theme}
        isEditing={isEditing} onUpdate={onUpdate}
        buttonList={buttonList}
      />

      {isEditing && (
        <div className="absolute top-3 left-3 z-20 bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-lg">
          Video Hero • {videoUrl ? 'Video set' : 'No video URL'}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════
   UI HELPERS (kept local for simplicity)
   ═══════════════════════════════════════ */

function DropOverlay() {
  return (
    <div className="absolute inset-0 z-30 bg-primary/20 border-2 border-dashed border-primary rounded-lg flex items-center justify-center backdrop-blur-sm">
      <div className="bg-background/90 rounded-xl p-6 flex flex-col items-center gap-2 shadow-lg">
        <ImageIcon className="h-8 w-8 text-primary" />
        <p className="text-sm font-medium">Drop image here</p>
      </div>
    </div>
  );
}

function ImageUploadButtons({ onUpdate, backgroundImage }: { onUpdate?: (p: Record<string, any>) => void; backgroundImage?: string }) {
  const handleFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        onUpdate?.({ backgroundImage: dataUrl });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to upload image');
      }
    };
    input.click();
  };

  const handleUrlPrompt = () => {
    const url = prompt('Enter background image URL:', backgroundImage || '');
    if (url !== null) onUpdate?.({ backgroundImage: url });
  };

  return (
    <div className="absolute top-3 right-3 z-20 flex gap-1.5">
      <button onClick={handleFileInput} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/60 text-white hover:bg-black/80 transition-colors">
        <Upload className="h-3.5 w-3.5" /> Upload
      </button>
      <button onClick={handleUrlPrompt} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/60 text-white hover:bg-black/80 transition-colors">
        URL
      </button>
    </div>
  );
}

function HeroContent({
  heading, subheading, hColor, sColor, alignment, theme, isEditing, onUpdate, buttonList,
}: {
  heading: string; subheading: string; hColor: string; sColor: string;
  alignment?: string; theme: SiteTheme; isEditing?: boolean;
  onUpdate?: (p: Record<string, any>) => void; buttonList: CTAButton[];
}) {
  const bColor = theme.primaryColor;
  const bTextColor = '#ffffff';
  
  // Apply theme typography settings
  const fontScale = getFontScale(theme);
  const headingStyles = getHeadingStyle(theme, { color: hColor });
  const subheadingStyles = getBodyTextStyle(theme, Math.round(18 * fontScale), sColor, { opacity: 0.9 });

  // Scale heading sizes based on fontScale
  const h1SizeBase = 48;
  const scaledH1 = Math.round(h1SizeBase * fontScale);

  return (
    <div className="relative z-10 max-w-3xl mx-auto space-y-6 w-full">
      {isEditing ? (
        <h1
          contentEditable suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ heading: e.currentTarget.innerHTML })}
          className="font-bold leading-tight outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
          style={{ 
            ...headingStyles,
            fontSize: `clamp(${Math.round(scaledH1 * 0.67)}px, 5vw, ${scaledH1}px)`,
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(heading) }}
        />
      ) : (
        <h1 
          className="font-bold leading-tight" 
          style={{ 
            ...headingStyles,
            fontSize: `clamp(${Math.round(scaledH1 * 0.67)}px, 5vw, ${scaledH1}px)`,
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(heading) }} 
        />
      )}

      {isEditing ? (
        <p
          contentEditable suppressContentEditableWarning
          onBlur={(e) => onUpdate?.({ subheading: e.currentTarget.innerHTML })}
          className="outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
          style={subheadingStyles}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(subheading) }}
        />
      ) : (
        <p style={subheadingStyles} dangerouslySetInnerHTML={{ __html: sanitizeHtml(subheading) }} />
      )}

      {buttonList.length > 0 && (
        <div className={`flex flex-wrap gap-3 ${getButtonAlignClass(alignment as 'left' | 'center' | 'right')}`}>
          {buttonList.map((btn, i) => {
            if (isEditing) {
              // Render as contentEditable in editing mode so users can click & edit button text
              // without triggering hero selection
              const btnStyle = getButtonStyle(btn.variant || 'primary', theme, btn.color, btn.textColor);
              return (
                <span
                  key={i}
                  contentEditable
                  suppressContentEditableWarning
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    const newText = e.currentTarget.textContent || '';
                    if (newText !== btn.text) {
                      // Update the button text in the buttons array
                      const updatedButtons = [...buttonList];
                      updatedButtons[i] = { ...updatedButtons[i], text: newText };
                      onUpdate?.({ buttons: updatedButtons });
                    }
                  }}
                  className="inline-flex items-center justify-center px-8 py-3 font-semibold rounded-lg cursor-text outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ ...btnStyle, fontFamily: theme.bodyFont }}
                >
                  {btn.text}
                </span>
              );
            }
            return (
              <ActionButton
                key={i}
                action={btn.action}
                href={btn.link}
                variant={btn.variant}
                theme={theme}
                bgColor={btn.color}
                textColor={btn.textColor}
                className="px-8 py-3 font-semibold transition-all hover:scale-105 hover:shadow-lg"
                style={{ fontFamily: theme.bodyFont }}
              >
                {btn.text}
              </ActionButton>
            );
          })}
        </div>
      )}
    </div>
  );
}
