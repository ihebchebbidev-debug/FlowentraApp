import React from 'react';
import { SiteTheme } from '../../../types';
import { DynamicIcon } from '../../editor/IconPicker';

interface FloatingItem {
  icon?: string;
  value: string;
  label: string;
  suffix?: string;
}

type FloatingHeaderVariant = 'cards' | 'pills' | 'glass';

interface FloatingHeaderBlockProps {
  items: FloatingItem[];
  variant?: FloatingHeaderVariant;
  columns?: number;
  offsetY?: number;
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function FloatingHeaderBlock({
  items = [],
  variant = 'cards',
  columns = 4,
  offsetY = -60,
  bgColor,
  theme,
  isEditing,
  onUpdate,
  style,
}: FloatingHeaderBlockProps) {
  const dir = theme.direction || 'ltr';

  const colClass =
    { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4', 5: 'grid-cols-2 lg:grid-cols-5' }[columns] ||
    'grid-cols-2 lg:grid-cols-4';

  if (variant === 'glass') {
    return (
      <section
        dir={dir}
        className="relative z-10 px-4 sm:px-6"
        style={{ marginTop: typeof offsetY === 'number' ? Math.max(offsetY, -30) : -30, marginBottom: 16, ...style }}
      >
        <div className="max-w-5xl mx-auto">
          <div className={`grid ${colClass} gap-3 sm:gap-4`}>
            {items.map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                  borderRadius: theme.borderRadius + 4,
                }}
              >
                {/* Accent top bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
                  style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor || theme.primaryColor})` }}
                />
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl"
                  style={{ background: `radial-gradient(circle at center, ${theme.primaryColor}, transparent 70%)` }}
                />
                {item.icon && (
                  <div
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl mx-auto mb-2 sm:mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: theme.primaryColor + '14', color: theme.primaryColor }}
                  >
                    <DynamicIcon name={item.icon} className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                )}
                <div
                  className="text-xl sm:text-3xl font-black tracking-tight leading-none mb-0.5 sm:mb-1 transition-colors duration-300"
                  style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}
                >
                  {item.value}{item.suffix || ''}
                </div>
                <div
                  className="text-[9px] sm:text-xs font-medium uppercase tracking-widest opacity-60"
                  style={{ color: theme.textColor, fontFamily: theme.bodyFont }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'pills') {
    return (
      <section
        dir={dir}
        className="relative z-10 px-4 sm:px-6"
        style={{ marginTop: typeof offsetY === 'number' ? Math.max(offsetY, -30) : -30, marginBottom: 16, ...style }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {items.map((item, i) => (
              <div
                key={i}
                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg backdrop-blur-md border border-white/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: 999,
                }}
              >
                {item.icon && (
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:rotate-12"
                    style={{ backgroundColor: theme.primaryColor + '14', color: theme.primaryColor }}
                  >
                    <DynamicIcon name={item.icon} className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                )}
                <span className="text-sm sm:text-lg font-bold" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
                  {item.value}{item.suffix || ''}
                </span>
                <span className="text-[10px] sm:text-xs font-medium opacity-60 hidden sm:inline" style={{ color: theme.textColor }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: cards variant
  return (
    <section
      dir={dir}
      className="relative z-10 px-4 sm:px-6"
      style={{ marginTop: typeof offsetY === 'number' ? Math.max(offsetY, -30) : -30, marginBottom: 16, ...style }}
    >
      <div className="max-w-5xl mx-auto">
        <div className={`grid ${colClass} gap-3 sm:gap-5`}>
          {items.map((item, i) => (
            <div
              key={i}
              className="group relative bg-white p-3 sm:p-6 rounded-lg sm:rounded-xl shadow-xl text-center transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl border border-gray-100/80 overflow-hidden"
              style={{ borderRadius: theme.borderRadius + 2 }}
            >
              {/* Bottom accent */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ backgroundColor: theme.primaryColor }}
              />
              {item.icon && (
                <div
                  className="w-8 h-8 sm:w-11 sm:h-11 rounded-md sm:rounded-lg mx-auto mb-2 sm:mb-3 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: theme.primaryColor + '12', color: theme.primaryColor }}
                >
                  <DynamicIcon name={item.icon} className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              )}
              <div
                className="text-lg sm:text-2xl font-extrabold leading-none mb-0.5 sm:mb-1"
                style={{ color: theme.textColor, fontFamily: theme.headingFont }}
              >
                {item.value}{item.suffix || ''}
              </div>
              <div className="text-[9px] sm:text-xs opacity-50 uppercase tracking-wider font-medium" style={{ color: theme.textColor, fontFamily: theme.bodyFont }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
