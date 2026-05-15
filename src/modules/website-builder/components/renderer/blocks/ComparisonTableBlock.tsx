import React from 'react';
import { SiteTheme } from '../../../types';

interface ComparisonTableBlockProps {
  title?: string;
  headers: string[];
  rows: Array<{ feature: string; values: string[] }>;
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ComparisonTableBlock({ title, headers, rows, bgColor, theme, isEditing, onUpdate, style }: ComparisonTableBlockProps) {
  return (
    <section className="py-12 px-4 sm:px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-5xl mx-auto">
        {title && <h3 className="text-xl sm:text-2xl font-bold mb-8 text-center" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
        <div className="-mx-4 sm:mx-0 overflow-x-auto border sm:rounded-xl" style={{ borderRadius: theme.borderRadius }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: theme.primaryColor + '10' }}>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap" style={{ color: theme.textColor }}>Feature</th>
                {headers.map((h, i) => (
                  <th key={i} className="text-center p-3 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap" style={{ color: theme.textColor }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3 sm:p-4 text-xs sm:text-sm whitespace-nowrap" style={{ color: theme.textColor }}>{row.feature}</td>
                  {row.values.map((val, j) => (
                    <td key={j} className="text-center p-3 sm:p-4 text-xs sm:text-sm" style={{ color: theme.secondaryColor }}>
                      {val === 'true' ? <span className="text-green-500 text-base sm:text-lg">✓</span> : val === 'false' ? <span className="text-gray-300 text-base sm:text-lg">✗</span> : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
