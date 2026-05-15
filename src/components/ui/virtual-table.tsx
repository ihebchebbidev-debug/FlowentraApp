import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';

interface VirtualTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    width?: number;
    /** Optional mobile width override */
    mobileWidth?: number;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  rowHeight?: number;
  height?: number;
  onRowClick?: (row: any, index: number) => void;
  className?: string;
  /** Striped rows */
  striped?: boolean;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

export function VirtualTable({
  data,
  columns,
  rowHeight = 36,
  height = 400,
  onRowClick,
  className = '',
  striped = false,
}: VirtualTableProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Responsive: observe container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(w);
      setIsMobile(w < 640);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate column widths — mobile-aware
  const columnWidths = useMemo(() => {
    const totalFixedWidth = columns.reduce((sum, col) => {
      const w = isMobile ? (col.mobileWidth ?? col.width) : col.width;
      return sum + (w || 0);
    }, 0);

    const flexColumns = columns.filter((col) => {
      const w = isMobile ? (col.mobileWidth ?? col.width) : col.width;
      return !w;
    });
    const availableWidth = Math.max(containerWidth - totalFixedWidth, 0);
    const flexWidth = flexColumns.length > 0 ? availableWidth / flexColumns.length : 0;

    return columns.map((col) => {
      const w = isMobile ? (col.mobileWidth ?? col.width) : col.width;
      return w || flexWidth;
    });
  }, [columns, containerWidth, isMobile]);

  // Header
  const Header = useMemo(
    () => (
      <div
        className="flex border-b border-border/30 bg-muted/30 sticky top-0 z-10"
        style={{ height: 28 }}
      >
        {columns.map((column, index) => (
          <div
            key={column.key}
            className="flex items-center px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50"
            style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
          >
            <span className="truncate">{column.label}</span>
          </div>
        ))}
      </div>
    ),
    [columns, columnWidths],
  );

  // Row
  const Row = useCallback(
    ({ index, style }: RowProps) => {
      const row = data[index];
      const isError = row._status === 'error' || row._status === 'invalid';

      return (
        <div
          style={style}
          className={cn(
            'flex border-b border-border/20 transition-colors duration-100',
            (onRowClick) && 'cursor-pointer',
            striped && index % 2 !== 0 && 'bg-muted/10',
            isError && 'bg-destructive/5 hover:bg-destructive/10',
            !isError && 'hover:bg-muted/30',
          )}
          onClick={() => onRowClick?.(row, index)}
        >
          {columns.map((column, colIndex) => (
            <div
              key={column.key}
              className="flex items-center px-3 text-[13px]"
              style={{ width: columnWidths[colIndex], minWidth: columnWidths[colIndex] }}
            >
              {column.render ? (
                column.render(row[column.key], row)
              ) : (
                <div className="truncate w-full" title={row[column.key]?.toString() || ''}>
                  {row[column.key]?.toString() || '–'}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    },
    [data, columns, columnWidths, onRowClick, striped],
  );

  if (data.length === 0) {
    return (
      <div className={cn('border border-border/30 rounded-lg overflow-hidden', className)}>
        {Header}
        <div className="flex items-center justify-center py-10 text-[13px] text-muted-foreground/60">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('border border-border/20 rounded-lg overflow-hidden bg-card', className)}
      ref={containerRef}
    >
      {Header}
      <List height={height} itemCount={data.length} itemSize={rowHeight} width="100%">
        {Row}
      </List>
    </div>
  );
}
