import React from 'react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import type { SortDirection } from '@/hooks/useTableSort';

type BaseProps = {
  columnKey: string;
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
  align?: 'left' | 'right' | 'center';
};

/** Clickable label + ^v indicator. Use inside an existing TableHead (or TableLayout column title). */
export function SortableLabel({
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className,
  align = 'left',
  children,
}: BaseProps & { children: React.ReactNode }) {
  const active = sortKey === columnKey && !!sortDirection;
  const Icon = !active ? ChevronsUpDown : sortDirection === 'asc' ? ChevronUp : ChevronDown;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSort(columnKey);
      }}
      aria-label={typeof children === 'string' ? `Sort by ${children}` : 'Sort column'}
      aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(
        'group inline-flex items-center gap-1 select-none rounded-sm -mx-1 px-1 py-0.5 transition-colors',
        'hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        active ? 'text-foreground font-medium' : 'text-muted-foreground',
        align === 'right' && 'flex-row-reverse',
        align === 'center' && 'justify-center',
        className
      )}
    >
      <span className="truncate">{children}</span>
      <Icon
        className={cn(
          'h-3.5 w-3.5 shrink-0 transition-opacity',
          active ? 'opacity-100 text-primary' : 'opacity-40 group-hover:opacity-80'
        )}
      />
    </button>
  );
}

/** Drop-in replacement for <TableHead> that renders a sortable header cell. */
export function SortableHeader({
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className,
  align = 'left',
  children,
}: BaseProps & { children: React.ReactNode }) {
  return (
    <TableHead className={cn(align === 'right' && 'text-right', className)}>
      <SortableLabel
        columnKey={columnKey}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={onSort}
        align={align}
      >
        {children}
      </SortableLabel>
    </TableHead>
  );
}

export default SortableHeader;
