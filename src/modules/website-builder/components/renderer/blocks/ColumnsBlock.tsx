import React from 'react';
import { SiteTheme } from '../../../types';

type ColumnsVariant = 'default' | 'cards' | 'bordered' | 'highlighted';
type ColumnsLayout = 'equal' | '2-1' | '1-2' | '1-2-1' | '1-1-1-1';

interface ColumnsBlockProps {
  columns?: number;
  gap?: number;
  variant?: ColumnsVariant;
  layout?: ColumnsLayout;
  verticalAlign?: 'top' | 'center' | 'bottom' | 'stretch';
  bgColor?: string;
  children?: React.ReactNode;
  theme?: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ColumnsBlock({
  columns = 2,
  gap = 24,
  variant = 'default',
  layout = 'equal',
  verticalAlign = 'stretch',
  bgColor,
  children,
  theme,
  isEditing,
  style,
}: ColumnsBlockProps) {
  // Custom grid template for asymmetric layouts
  const getGridTemplate = (): string | undefined => {
    if (layout === '2-1' && columns === 2) return '2fr 1fr';
    if (layout === '1-2' && columns === 2) return '1fr 2fr';
    if (layout === '1-2-1' && columns === 3) return '1fr 2fr 1fr';
    return undefined;
  };

  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-1 sm:grid-cols-2';

  const alignClass = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
    stretch: 'items-stretch',
  }[verticalAlign];

  const gridTemplate = getGridTemplate();
  const borderRadius = theme?.borderRadius ?? 8;

  const getColumnItemStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'cards':
        return {
          backgroundColor: theme?.backgroundColor || '#fff',
          borderRadius: `${borderRadius}px`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
          padding: '24px',
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s, transform 0.2s',
        };
      case 'bordered':
        return {
          border: `1px solid ${theme?.primaryColor || '#e2e8f0'}20`,
          borderRadius: `${borderRadius}px`,
          padding: '24px',
        };
      case 'highlighted':
        return {
          backgroundColor: `${theme?.primaryColor || '#6366f1'}08`,
          borderRadius: `${borderRadius}px`,
          padding: '24px',
          borderLeft: `3px solid ${theme?.primaryColor || '#6366f1'}`,
        };
      default:
        return {};
    }
  };

  const columnStyle = getColumnItemStyle();

  return (
    <div
      className={`py-8 px-6 grid ${gridTemplate ? '' : colClass} ${alignClass}`}
      style={{
        gap,
        backgroundColor: bgColor || 'transparent',
        ...(gridTemplate ? { gridTemplateColumns: gridTemplate } : {}),
        ...style,
      }}
    >
      {children || (
        Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className={`min-h-[100px] flex items-center justify-center text-sm text-muted-foreground ${
              variant === 'default' ? 'border-2 border-dashed border-muted-foreground/20 rounded-lg' : ''
            }`}
            style={variant !== 'default' ? columnStyle : undefined}
          >
            Column {i + 1}
          </div>
        ))
      )}
    </div>
  );
}
