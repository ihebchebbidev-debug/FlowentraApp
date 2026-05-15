import React from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { DynamicIcon } from '../../editor/IconPicker';
import { sanitizeHtml } from '@/utils/sanitize';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Service {
  icon: string;
  title: string;
  description: string;
  price?: string;
  imageUrl?: string;
  linkText?: string;
  linkUrl?: string;
}

type ServiceVariant = 'grid' | 'minimal' | 'bordered' | 'icon-left' | 'numbered' | 'image';

interface ServiceCardBlockProps {
  title: string;
  subtitle?: string;
  services: Service[];
  variant?: ServiceVariant;
  columns?: number;
  showPricing?: boolean;
  showLinks?: boolean;
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ServiceCardBlock({
  title,
  subtitle,
  services,
  variant = 'grid',
  columns = 3,
  showPricing = true,
  showLinks = false,
  bgColor,
  theme,
  isEditing,
  onUpdate,
  style,
}: ServiceCardBlockProps) {
  const dir = theme.direction || 'ltr';

  const updateService = (index: number, field: keyof Service, value: string) => {
    const updated = services.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    onUpdate?.({ services: updated });
  };

  const addService = () => {
    onUpdate?.({
      services: [
        ...services,
        { icon: 'Sparkles', title: 'New Service', description: 'Describe this service', price: 'From $0' },
      ],
    });
  };

  const removeService = (index: number) => {
    onUpdate?.({ services: services.filter((_, i) => i !== index) });
  };

  /* ---- Shared elements ---- */

  const colClass =
    { 1: 'grid-cols-1', 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-3', 4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' }[
      columns
    ] || 'grid-cols-1 md:grid-cols-3';

  const Title = () =>
    isEditing ? (
      <h2
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
        className="text-3xl font-bold text-center mb-2 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
        style={{ color: theme.textColor, fontFamily: theme.headingFont }}
      >
        {title}
      </h2>
    ) : (
      <h2 className="text-3xl font-bold text-center mb-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
        {title}
      </h2>
    );

  const Subtitle = () => {
    if (!subtitle && !isEditing) return null;
    return isEditing ? (
      <p
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onUpdate?.({ subtitle: e.currentTarget.textContent || '' })}
        className="text-center opacity-70 max-w-2xl mx-auto mb-12 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
        style={{ color: theme.secondaryColor }}
      >
        {subtitle || 'Add subtitle...'}
      </p>
    ) : subtitle ? (
      <p className="text-center opacity-70 max-w-2xl mx-auto mb-12" style={{ color: theme.secondaryColor }}>
        {subtitle}
      </p>
    ) : null;
  };

  const EditableTitle = ({ s, i }: { s: Service; i: number }) =>
    isEditing ? (
      <h3
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => updateService(i, 'title', e.currentTarget.textContent || '')}
        className="text-lg font-semibold mb-2 outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
        style={{ color: theme.textColor }}
      >
        {s.title}
      </h3>
    ) : (
      <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textColor }}>
        {s.title}
      </h3>
    );

  const EditableDesc = ({ s, i }: { s: Service; i: number }) =>
    isEditing ? (
      <p
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => updateService(i, 'description', e.currentTarget.innerHTML)}
        className="text-sm opacity-70 outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
        style={{ color: theme.secondaryColor }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.description) }}
      />
    ) : (
      <p className="text-sm opacity-70" style={{ color: theme.secondaryColor }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.description) }} />
    );

  const PriceTag = ({ s, i }: { s: Service; i: number }) => {
    if (!showPricing) return null;
    if (!s.price && !isEditing) return null;
    return isEditing ? (
      <p
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => updateService(i, 'price', e.currentTarget.textContent || '')}
        className="text-base font-bold mt-3 outline-none focus:ring-1 focus:ring-primary/30 rounded px-0.5"
        style={{ color: theme.primaryColor }}
      >
        {s.price || 'Add price...'}
      </p>
    ) : s.price ? (
      <p className="text-base font-bold mt-3" style={{ color: theme.primaryColor }}>
        {s.price}
      </p>
    ) : null;
  };

  const LearnMore = ({ s }: { s: Service }) => {
    if (!showLinks || !s.linkText) return null;
    return (
      <a
        href={s.linkUrl || '#'}
        className="inline-flex items-center gap-1 text-xs font-medium mt-3 hover:underline transition-colors"
        style={{ color: theme.primaryColor }}
      >
        {s.linkText} <ArrowRight className="h-3 w-3" />
      </a>
    );
  };

  const DeleteBtn = ({ i }: { i: number }) =>
    isEditing ? (
      <button
        onClick={() => removeService(i)}
        className="absolute top-2 right-2 p-1 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover/svc:opacity-100 transition-opacity hover:bg-destructive/20 z-10"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    ) : null;

  const AddButton = () =>
    isEditing ? (
      <div className="text-center mt-8">
        <button onClick={addService} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
          <Plus className="h-3 w-3" /> Add Service
        </button>
      </div>
    ) : null;

  /* ================================================================ */
  /*  GRID — classic card grid (default)                               */
  /* ================================================================ */
  if (variant === 'grid') {
    return (
      <section dir={dir} className="py-16 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
        <div className="max-w-6xl mx-auto">
          <Title />
          <Subtitle />
          {!subtitle && !isEditing && <div className="mb-12" />}
          <div className={`grid ${colClass} gap-6`}>
            {services.map((s, i) => (
              <div
                key={i}
                className="group/svc p-6 rounded-xl border bg-card relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]"
                style={{ borderRadius: theme.borderRadius }}
              >
                {/* Accent gradient top bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover/svc:scale-x-100 transition-transform duration-500"
                  style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor || theme.primaryColor})` }}
                />
                {/* Subtle glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover/svc:opacity-[0.04] transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${theme.primaryColor}, transparent 70%)` }}
                />
                <DeleteBtn i={i} />
                <div
                  className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center transition-all duration-300 group-hover/svc:scale-110 group-hover/svc:rotate-3"
                  style={{ backgroundColor: theme.primaryColor + '12', color: theme.primaryColor }}
                >
                  <DynamicIcon name={s.icon} className="h-7 w-7" />
                </div>
                <EditableTitle s={s} i={i} />
                <EditableDesc s={s} i={i} />
                <PriceTag s={s} i={i} />
                <LearnMore s={s} />
              </div>
            ))}
          </div>
          <AddButton />
        </div>
      </section>
    );
  }

  /* ================================================================ */
  /*  MINIMAL — clean, no borders, centered text                       */
  /* ================================================================ */
  if (variant === 'minimal') {
    return (
      <section dir={dir} className="py-20 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
        <div className="max-w-6xl mx-auto">
          <Title />
          <Subtitle />
          {!subtitle && !isEditing && <div className="mb-14" />}
          <div className={`grid ${colClass} gap-12`}>
            {services.map((s, i) => (
              <div key={i} className="text-center relative group/svc">
                <DeleteBtn i={i} />
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryColor + '10', color: theme.primaryColor }}
                >
                  <DynamicIcon name={s.icon} className="h-8 w-8" />
                </div>
                <EditableTitle s={s} i={i} />
                <EditableDesc s={s} i={i} />
                <PriceTag s={s} i={i} />
                <LearnMore s={s} />
              </div>
            ))}
          </div>
          <AddButton />
        </div>
      </section>
    );
  }

  /* ================================================================ */
  /*  BORDERED — accent left border with hover lift                    */
  /* ================================================================ */
  if (variant === 'bordered') {
    return (
      <section dir={dir} className="py-16 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
        <div className="max-w-6xl mx-auto">
          <Title />
          <Subtitle />
          {!subtitle && !isEditing && <div className="mb-12" />}
          <div className={`grid ${colClass} gap-6`}>
            {services.map((s, i) => (
              <div
                key={i}
                className="group/svc p-6 rounded-xl border-l-4 bg-card shadow-sm relative overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lg"
                style={{ borderColor: theme.primaryColor, borderRadius: theme.borderRadius }}
              >
                {/* Subtle gradient overlay on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover/svc:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, transparent)` }}
                />
                <DeleteBtn i={i} />
                <div className="flex items-center gap-3 mb-3 transition-transform duration-300 group-hover/svc:translate-x-1" style={{ color: theme.primaryColor }}>
                  <DynamicIcon name={s.icon} className="h-6 w-6 transition-transform duration-300 group-hover/svc:scale-110" />
                  <EditableTitle s={s} i={i} />
                </div>
                <EditableDesc s={s} i={i} />
                <PriceTag s={s} i={i} />
                <LearnMore s={s} />
              </div>
            ))}
          </div>
          <AddButton />
        </div>
      </section>
    );
  }

  /* ================================================================ */
  /*  ICON-LEFT — horizontal icon + text rows                          */
  /* ================================================================ */
  if (variant === 'icon-left') {
    return (
      <section dir={dir} className="py-16 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
        <div className="max-w-5xl mx-auto">
          <Title />
          <Subtitle />
          {!subtitle && !isEditing && <div className="mb-12" />}
          <div className="space-y-6">
            {services.map((s, i) => (
              <div
                key={i}
                className="flex gap-5 p-5 rounded-xl border bg-card hover:shadow-md transition-all relative group/svc"
                style={{ borderRadius: theme.borderRadius }}
              >
                <DeleteBtn i={i} />
                <div
                  className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryColor + '12', color: theme.primaryColor }}
                >
                  <DynamicIcon name={s.icon} className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <EditableTitle s={s} i={i} />
                  <EditableDesc s={s} i={i} />
                  <div className="flex items-center gap-4 mt-2">
                    <PriceTag s={s} i={i} />
                    <LearnMore s={s} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AddButton />
        </div>
      </section>
    );
  }

  /* ================================================================ */
  /*  NUMBERED — large step numbers                                    */
  /* ================================================================ */
  if (variant === 'numbered') {
    return (
      <section dir={dir} className="py-16 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
        <div className="max-w-6xl mx-auto">
          <Title />
          <Subtitle />
          {!subtitle && !isEditing && <div className="mb-12" />}
          <div className={`grid ${colClass} gap-8`}>
            {services.map((s, i) => (
              <div key={i} className="relative group/svc">
                <DeleteBtn i={i} />
                {/* Large number */}
                <div
                  className="text-6xl font-black mb-3 leading-none"
                  style={{ color: theme.primaryColor + '15', fontFamily: theme.headingFont }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex items-center gap-2 mb-2" style={{ color: theme.primaryColor }}>
                  <DynamicIcon name={s.icon} className="h-5 w-5" />
                  <EditableTitle s={s} i={i} />
                </div>
                <EditableDesc s={s} i={i} />
                <PriceTag s={s} i={i} />
                <LearnMore s={s} />
                {/* Connector line */}
                {i < services.length - 1 && columns > 1 && (
                  <div
                    className="hidden lg:block absolute top-8 -right-4 w-8 h-px"
                    style={{ backgroundColor: theme.primaryColor + '20' }}
                  />
                )}
              </div>
            ))}
          </div>
          <AddButton />
        </div>
      </section>
    );
  }

  /* ================================================================ */
  /*  IMAGE — cards with image on top                                  */
  /* ================================================================ */
  if (variant === 'image') {
    return (
      <section dir={dir} className="py-16 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
        <div className="max-w-6xl mx-auto">
          <Title />
          <Subtitle />
          {!subtitle && !isEditing && <div className="mb-12" />}
          <div className={`grid ${colClass} gap-6`}>
            {services.map((s, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-all relative group/svc"
                style={{ borderRadius: theme.borderRadius }}
              >
                <DeleteBtn i={i} />
                {/* Image area */}
                <div className="aspect-[16/10] bg-muted/30 overflow-hidden relative">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover group-hover/svc:scale-105 transition-transform duration-500" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: theme.primaryColor + '08', color: theme.primaryColor }}
                    >
                      <DynamicIcon name={s.icon} className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  {/* Floating icon badge */}
                  <div
                    className="absolute -bottom-5 left-5 w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <DynamicIcon name={s.icon} className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="p-5 pt-8">
                  <EditableTitle s={s} i={i} />
                  <EditableDesc s={s} i={i} />
                  <PriceTag s={s} i={i} />
                  <LearnMore s={s} />
                </div>
              </div>
            ))}
          </div>
          <AddButton />
        </div>
      </section>
    );
  }

  return null;
}
