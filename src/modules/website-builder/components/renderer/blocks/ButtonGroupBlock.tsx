import React from 'react';
import { SiteTheme } from '../../../types';

interface ButtonGroupBlockProps {
  buttons: Array<{ text: string; link: string; variant: 'primary' | 'secondary' | 'outline' }>;
  alignment?: 'left' | 'center' | 'right';
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function ButtonGroupBlock({ buttons, alignment = 'center', theme, style }: ButtonGroupBlockProps) {
  const align = { left: 'justify-start', center: 'justify-center', right: 'justify-end' }[alignment];

  return (
    <section className="py-4 px-6" style={style}>
      <div className={`max-w-4xl mx-auto flex flex-wrap gap-3 ${align}`}>
        {buttons.map((btn, i) => {
          const isPrimary = btn.variant === 'primary';
          const isOutline = btn.variant === 'outline';
          return (
            <a
              key={i}
              href={btn.link}
              className={`inline-block px-6 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90 ${isOutline ? 'border-2' : ''}`}
              style={{
                backgroundColor: isPrimary ? theme.primaryColor : isOutline ? 'transparent' : theme.secondaryColor + '20',
                color: isPrimary ? '#fff' : isOutline ? theme.primaryColor : theme.textColor,
                borderColor: isOutline ? theme.primaryColor : undefined,
                borderRadius: theme.borderRadius,
                fontFamily: theme.bodyFont,
              }}
            >{btn.text}</a>
          );
        })}
      </div>
    </section>
  );
}
