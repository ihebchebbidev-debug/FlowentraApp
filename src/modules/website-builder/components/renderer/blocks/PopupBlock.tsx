import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SiteTheme } from '../../../types';
import { X, Plus, Trash2, Gift, Mail, AlertTriangle, Bell, Megaphone, Sparkles, MousePointer } from 'lucide-react';

/* ── Types ──────────────────────────────────── */
interface PopupButton {
  text: string;
  link?: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  action?: 'link' | 'close' | 'webhook';
  webhookUrl?: string;
}

type PopupTrigger = 'click' | 'delay' | 'scroll' | 'exit-intent';
type PopupPosition = 'center' | 'top' | 'bottom' | 'bottom-right' | 'bottom-left';
type PopupTemplate = 'promo' | 'newsletter' | 'announcement' | 'alert' | 'welcome' | 'custom';
type PopupSize = 'sm' | 'md' | 'lg' | 'full';

interface PopupBlockProps {
  title: string;
  text: string;
  template?: PopupTemplate;
  imageUrl?: string;
  trigger?: PopupTrigger;
  triggerDelay?: number;
  triggerScrollPercent?: number;
  position?: PopupPosition;
  size?: PopupSize;
  buttons?: PopupButton[];
  showCloseButton?: boolean;
  overlayDismiss?: boolean;
  overlayOpacity?: number;
  borderRadius?: string;
  bgColor?: string;
  titleColor?: string;
  textColor?: string;
  accentColor?: string;
  showBadge?: boolean;
  badgeText?: string;
  formFields?: Array<{ label: string; type: string; placeholder: string }>;
  animation?: 'fade' | 'scale' | 'slide-up' | 'slide-down';
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

/* ── Template icons ─────────────────────────── */
const TEMPLATE_ICONS: Record<PopupTemplate, React.FC<{ className?: string }>> = {
  promo: Gift,
  newsletter: Mail,
  announcement: Megaphone,
  alert: AlertTriangle,
  welcome: Sparkles,
  custom: MousePointer,
};

/* ── Main Component ─────────────────────────── */
export function PopupBlock({
  title, text, template = 'custom', imageUrl,
  trigger = 'click', triggerDelay = 3, triggerScrollPercent = 50,
  position = 'center', size = 'md',
  buttons = [{ text: 'Got it', variant: 'primary', action: 'close' }],
  showCloseButton = true, overlayDismiss = true, overlayOpacity = 50,
  borderRadius, bgColor, titleColor, textColor, accentColor,
  showBadge = false, badgeText = 'NEW',
  formFields = [],
  animation = 'scale',
  theme, isEditing, onUpdate, style,
}: PopupBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const accent = accentColor || theme.primaryColor;
  const bg = bgColor || 'var(--background, #ffffff)';
  const tColor = titleColor || theme.textColor;
  const pColor = textColor || theme.secondaryColor;
  const radius = borderRadius || theme.borderRadius || '16px';

  /* ── Trigger logic (live mode only) ──────── */
  useEffect(() => {
    if (isEditing || hasTriggered) return;
    if (trigger === 'delay') {
      const t = setTimeout(() => { setIsOpen(true); setHasTriggered(true); }, triggerDelay * 1000);
      return () => clearTimeout(t);
    }
    if (trigger === 'scroll') {
      const handler = () => {
        const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (pct >= triggerScrollPercent) { setIsOpen(true); setHasTriggered(true); }
      };
      window.addEventListener('scroll', handler, { passive: true });
      return () => window.removeEventListener('scroll', handler);
    }
    if (trigger === 'exit-intent') {
      const handler = (e: MouseEvent) => {
        if (e.clientY <= 5) { setIsOpen(true); setHasTriggered(true); }
      };
      document.addEventListener('mouseout', handler);
      return () => document.removeEventListener('mouseout', handler);
    }
  }, [trigger, triggerDelay, triggerScrollPercent, isEditing, hasTriggered]);

  const close = useCallback(() => setIsOpen(false), []);

  const handleButtonAction = useCallback((btn: PopupButton) => {
    if (btn.action === 'close') { close(); return; }
    if (btn.action === 'webhook' && btn.webhookUrl) {
      fetch(btn.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ popup: title }) }).catch(() => {});
      close();
      return;
    }
    if (btn.link && btn.action === 'link') { window.open(btn.link, '_blank'); }
  }, [close, title]);

  /* ── Button helpers ──────── */
  const addButton = () => {
    onUpdate?.({ buttons: [...buttons, { text: 'Button', variant: 'outline', action: 'close' }] });
  };
  const removeButton = (idx: number) => {
    onUpdate?.({ buttons: buttons.filter((_, i) => i !== idx) });
  };
  const updateButton = (idx: number, field: string, value: string) => {
    const updated = buttons.map((b, i) => i === idx ? { ...b, [field]: value } : b);
    onUpdate?.({ buttons: updated });
  };

  /* ── Form field helpers ──────── */
  const addFormField = () => {
    onUpdate?.({ formFields: [...formFields, { label: 'Email', type: 'email', placeholder: 'you@example.com' }] });
  };
  const removeFormField = (idx: number) => {
    onUpdate?.({ formFields: formFields.filter((_, i) => i !== idx) });
  };
  const updateFormField = (idx: number, field: string, value: string) => {
    const updated = formFields.map((f, i) => i === idx ? { ...f, [field]: value } : f);
    onUpdate?.({ formFields: updated });
  };

  /* ── Size classes ──────── */
  const sizeClasses: Record<PopupSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-2xl',
  };

  /* ── Position classes ──────── */
  const positionClasses: Record<PopupPosition, string> = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-16',
    bottom: 'items-end justify-center pb-16',
    'bottom-right': 'items-end justify-end p-6',
    'bottom-left': 'items-end justify-start p-6',
  };

  /* ── Animation classes ──────── */
  const getAnimationStyle = (open: boolean): React.CSSProperties => {
    const base: React.CSSProperties = { transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' };
    if (!open) return { ...base, opacity: 0, pointerEvents: 'none', transform: 'scale(0.95) translateY(10px)' };
    switch (animation) {
      case 'fade': return { ...base, opacity: 1 };
      case 'slide-up': return { ...base, opacity: 1, transform: 'translateY(0)' };
      case 'slide-down': return { ...base, opacity: 1, transform: 'translateY(0)' };
      case 'scale': default: return { ...base, opacity: 1, transform: 'scale(1) translateY(0)' };
    }
  };

  /* ── Button styles ──────── */
  const getButtonStyle = (btn: PopupButton): React.CSSProperties => {
    switch (btn.variant) {
      case 'primary': return { backgroundColor: accent, color: '#fff', border: 'none' };
      case 'secondary': return { backgroundColor: accent + '18', color: accent, border: 'none' };
      case 'outline': return { backgroundColor: 'transparent', color: accent, border: `1.5px solid ${accent}44` };
      case 'ghost': return { backgroundColor: 'transparent', color: pColor, border: 'none' };
      default: return { backgroundColor: accent, color: '#fff' };
    }
  };

  const TemplateIcon = TEMPLATE_ICONS[template] || MousePointer;

  /* ═══════════════════════════════════════
     EDITOR PREVIEW (inline card showing popup config)
     ═══════════════════════════════════════ */
  if (isEditing) {
    return (
      <section className="py-8 px-6" style={style}>
        <div
          className="max-w-lg mx-auto overflow-hidden shadow-xl relative"
          style={{ borderRadius: radius, backgroundColor: bg, border: `2px solid ${accent}25` }}
        >
          {/* Template badge */}
          <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: accent + '15', backgroundColor: accent + '06' }}>
            <TemplateIcon className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>{template} popup</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: accent + '15', color: accent }}>
              {trigger === 'click' ? '👆 Click' : trigger === 'delay' ? `⏱ ${triggerDelay}s` : trigger === 'scroll' ? `📜 ${triggerScrollPercent}%` : '↗ Exit'}
            </span>
          </div>

          {/* Image */}
          {imageUrl && (
            <div className="aspect-[2.5/1] overflow-hidden">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content preview */}
          <div className="p-5 space-y-3">
            {showBadge && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ backgroundColor: accent + '15', color: accent }}>
                {badgeText}
              </span>
            )}
            <h3
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="text-xl font-bold outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: tColor, fontFamily: theme.headingFont }}
            >{title}</h3>
            <p
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ text: e.currentTarget.textContent || '' })}
              className="text-sm opacity-80 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 leading-relaxed"
              style={{ color: pColor, fontFamily: theme.bodyFont }}
            >{text}</p>

            {/* Form fields editor */}
            {formFields.length > 0 && (
              <div className="space-y-2 pt-1">
                {formFields.map((field, i) => (
                  <div key={i} className="flex items-center gap-2 group/field">
                    <input
                      className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-primary/30"
                      style={{ borderColor: accent + '25', borderRadius: radius }}
                      placeholder={field.placeholder}
                      readOnly
                    />
                    <button onClick={() => removeFormField(i)} className="p-1 text-destructive opacity-0 group-hover/field:opacity-100 transition-opacity">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons preview */}
            <div className="flex flex-wrap gap-2 pt-2">
              {buttons.map((btn, i) => (
                <div key={i} className="relative group/btn">
                  <span
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => updateButton(i, 'text', e.currentTarget.textContent || '')}
                    className="inline-block px-5 py-2 text-sm font-medium rounded-lg outline-none focus:ring-1 focus:ring-primary/30 cursor-text"
                    style={{ ...getButtonStyle(btn), borderRadius: radius }}
                  >{btn.text}</span>
                  <button onClick={() => removeButton(i)} className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-destructive/90 text-white opacity-0 group-hover/btn:opacity-100 transition-opacity">
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Editor actions */}
            <div className="flex gap-3 pt-2 border-t" style={{ borderColor: accent + '10' }}>
              <button onClick={addButton} className="inline-flex items-center gap-1 text-[10px] font-medium hover:underline" style={{ color: accent }}>
                <Plus className="h-3 w-3" /> Add Button
              </button>
              <button onClick={addFormField} className="inline-flex items-center gap-1 text-[10px] font-medium hover:underline" style={{ color: accent }}>
                <Plus className="h-3 w-3" /> Add Field
              </button>
            </div>
          </div>

          {/* Position indicator */}
          <div className="px-5 py-2 border-t text-[10px] opacity-50 flex items-center justify-between" style={{ borderColor: accent + '10' }}>
            <span>Position: {position} • Size: {size} • Animation: {animation}</span>
          </div>
        </div>
      </section>
    );
  }

  /* ═══════════════════════════════════════
     LIVE PREVIEW — actual modal popup
     ═══════════════════════════════════════ */
  const showTriggerButton = trigger === 'click';

  return (
    <>
      {/* Click trigger button */}
      {showTriggerButton && (
        <section className="py-6 px-6 text-center" style={style}>
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-[0.98]"
            style={{ backgroundColor: accent, borderRadius: radius, fontFamily: theme.bodyFont }}
          >
            <TemplateIcon className="h-4 w-4" />
            {title}
          </button>
        </section>
      )}

      {/* Non-click triggers: invisible mount point */}
      {!showTriggerButton && <div style={{ position: 'absolute', width: 0, height: 0 }} />}

      {/* Modal overlay */}
      <div
        className={`fixed inset-0 z-[9999] flex ${positionClasses[position]}`}
        style={{
          backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(4px)',
        }}
        onClick={overlayDismiss ? close : undefined}
      >
        {/* Popup card */}
        <div
          ref={popupRef}
          className={`relative w-full ${sizeClasses[size]} overflow-hidden shadow-2xl`}
          style={{
            ...getAnimationStyle(isOpen),
            borderRadius: radius,
            backgroundColor: bg,
            fontFamily: theme.bodyFont,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={close}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full transition-colors hover:bg-black/10"
              style={{ color: pColor }}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Image header */}
          {imageUrl && (
            <div className="aspect-[2.5/1] overflow-hidden relative">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 50%, ${bg})` }} />
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Badge */}
            {showBadge && (
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: accent + '15', color: accent }}>
                {badgeText}
              </span>
            )}

            {/* Template icon for non-image popups */}
            {!imageUrl && template !== 'custom' && (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ backgroundColor: accent + '12' }}>
                <TemplateIcon className="h-6 w-6" style={{ color: accent }} />
              </div>
            )}

            <h3 className="text-xl font-bold leading-tight" style={{ color: tColor, fontFamily: theme.headingFont }}>
              {title}
            </h3>
            <p className="text-sm opacity-80 leading-relaxed" style={{ color: pColor }}>
              {text}
            </p>

            {/* Form fields */}
            {formFields.length > 0 && (
              <div className="space-y-3 pt-1">
                {formFields.map((field, i) => (
                  <div key={i}>
                    <label className="block text-xs font-medium mb-1" style={{ color: tColor }}>{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full text-sm px-4 py-2.5 rounded-lg border outline-none transition-shadow focus:ring-2"
                      style={{ borderColor: accent + '25', borderRadius: radius, focusRingColor: accent + '30' } as React.CSSProperties}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            {buttons.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {buttons.map((btn, i) => (
                  <button
                    key={i}
                    onClick={() => handleButtonAction(btn)}
                    className="flex-1 min-w-0 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
                    style={{ ...getButtonStyle(btn), borderRadius: radius }}
                  >
                    {btn.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
