import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginationControls } from './PaginationControls';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileX2, Search } from 'lucide-react';

// ————————————————————————————————————————
// Types
// ————————————————————————————————————————

export type Column<T = any> = {
  key: string;
  title?: React.ReactNode;
  width?: string;
  /** Minimum width in px for resizable columns (default: 60) */
  minWidth?: number;
  headerClass?: string;
  cellClass?: string;
  render: (row: T) => React.ReactNode;
  /** If true, column can be resized by dragging its right border */
  resizable?: boolean;
  /** Inline edit config: provide to make cells editable on double-click */
  editable?: {
    type: 'text' | 'number' | 'select';
    options?: { label: string; value: string }[];
    /** Called when the user commits the edit */
    onSave: (row: T, value: string) => void;
    /** Extract the raw value from the row for the input */
    getValue: (row: T) => string;
  };
};

type Props<T = any> = {
  items: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string | number;
  emptyState?: React.ReactNode;
  wrapperClassName?: string;
  tableClassName?: string;
  // Pagination props
  enablePagination?: boolean;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  // Bulk selection
  enableSelection?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
  /** If provided, a bulk action bar appears when items are selected */
  bulkActions?: React.ReactNode;
  /** Custom empty state */
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
};

// ————————————————————————————————————————
// Column Resize Handle
// ————————————————————————————————————————

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startX.current = e.clientX;
    isDragging.current = true;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - startX.current;
      startX.current = ev.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize group/resize z-10 hover:bg-primary/20 active:bg-primary/30 transition-colors"
      style={{ touchAction: 'none' }}
    >
      <div className="absolute right-[2px] top-[6px] bottom-[6px] w-px bg-border/40 group-hover/resize:bg-primary/50 transition-colors" />
    </div>
  );
}

// ————————————————————————————————————————
// Inline Edit Cell
// ————————————————————————————————————————

function InlineEditCell<T>({
  row,
  editable,
  children,
}: {
  row: T;
  editable: NonNullable<Column<T>['editable']>;
  children: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const startEdit = useCallback(() => {
    setValue(editable.getValue(row));
    setIsEditing(true);
  }, [row, editable]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const commit = useCallback(() => {
    editable.onSave(row, value);
    setIsEditing(false);
  }, [row, value, editable]);

  const cancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    e.stopPropagation();
  }, [commit, cancel]);

  if (isEditing) {
    if (editable.type === 'select') {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={value}
          onChange={(e) => { setValue(e.target.value); }}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-7 px-1.5 text-[13px] bg-background border border-primary/40 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm"
        >
          {editable.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    return (
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={editable.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="h-7 px-1.5 text-[13px] border-primary/40 focus-visible:ring-primary/50 shadow-sm"
      />
    );
  }

  return (
    <div
      onDoubleClick={(e) => { e.stopPropagation(); startEdit(); }}
      className="cursor-text rounded-md px-0.5 -mx-0.5 transition-all duration-100 hover:bg-muted/50 hover:ring-1 hover:ring-border/30 min-h-[24px] flex items-center"
      title="Double-click to edit"
    >
      {children}
    </div>
  );
}

// ————————————————————————————————————————
// Professional Empty State
// ————————————————————————————————————————

function TableEmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="rounded-2xl bg-muted/40 p-4 mb-4">
        {icon || <FileX2 className="h-8 w-8 text-muted-foreground/50" />}
      </div>
      <h3 className="text-base font-semibold text-foreground/80 mb-1.5">
        {title || 'No data found'}
      </h3>
      <p className="text-sm text-muted-foreground/60 max-w-[320px] leading-relaxed">
        {description || 'Try adjusting your filters or create a new item to get started.'}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

// ————————————————————————————————————————
// Main TableLayout
// ————————————————————————————————————————

export function TableLayout<T = any>({
  items,
  columns,
  onRowClick,
  rowKey,
  emptyState,
  wrapperClassName,
  tableClassName = 'w-full table-fixed min-w-[800px]',
  enablePagination = false,
  itemsPerPage = 5,
  currentPage = 1,
  onPageChange,
  totalItems,
  enableSelection = false,
  selectedIds,
  onSelectionChange,
  bulkActions,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: Props<T>) {
  // Column widths state for resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const headerRefs = useRef<Record<string, HTMLTableCellElement>>({});

  // Initialize widths from DOM on first render
  useEffect(() => {
    const newWidths: Record<string, number> = {};
    Object.entries(headerRefs.current).forEach(([key, el]) => {
      if (el && !columnWidths[key]) {
        newWidths[key] = el.getBoundingClientRect().width;
      }
    });
    if (Object.keys(newWidths).length > 0) {
      setColumnWidths(prev => ({ ...prev, ...newWidths }));
    }
  }, [items.length]);

  const handleResize = useCallback((colKey: string, delta: number, minWidth: number = 60) => {
    setColumnWidths(prev => {
      const current = prev[colKey] || 100;
      return { ...prev, [colKey]: Math.max(minWidth, current + delta) };
    });
  }, []);

  // Selection helpers
  const getItemKey = useCallback((item: T): string | number => {
    if (rowKey) return rowKey(item);
    return (item as any).id ?? '';
  }, [rowKey]);

  const allSelected = useMemo(() => {
    if (!enableSelection || !selectedIds || items.length === 0) return false;
    return items.every(item => selectedIds.has(getItemKey(item)));
  }, [enableSelection, selectedIds, items, getItemKey]);

  const someSelected = useMemo(() => {
    if (!enableSelection || !selectedIds || items.length === 0) return false;
    const count = items.filter(item => selectedIds.has(getItemKey(item))).length;
    return count > 0 && count < items.length;
  }, [enableSelection, selectedIds, items, getItemKey]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const newSet = new Set(selectedIds);
      items.forEach(item => newSet.add(getItemKey(item)));
      onSelectionChange(newSet);
    } else {
      const newSet = new Set(selectedIds);
      items.forEach(item => newSet.delete(getItemKey(item)));
      onSelectionChange(newSet);
    }
  }, [items, selectedIds, onSelectionChange, getItemKey]);

  const handleSelectItem = useCallback((key: string | number, checked: boolean) => {
    if (!onSelectionChange || !selectedIds) return;
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(key); else newSet.delete(key);
    onSelectionChange(newSet);
  }, [selectedIds, onSelectionChange]);

  // Empty state
  if (!items || items.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <TableEmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const totalPages = enablePagination && totalItems ? Math.ceil(totalItems / itemsPerPage) : 1;
  const hasNextPage = enablePagination ? currentPage < totalPages : false;
  const hasPreviousPage = enablePagination ? currentPage > 1 : false;

  return (
    <div className={wrapperClassName}>
      {/* Bulk action bar */}
      {enableSelection && selectedIds && selectedIds.size > 0 && bulkActions && (
        <div className="sticky top-0 z-30 bg-primary/5 border-b border-primary/15 px-4 py-2.5 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            className={someSelected ? 'data-[state=checked]:bg-primary' : ''}
          />
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          {bulkActions}
        </div>
      )}

      <Table className={tableClassName}>
        <TableHeader>
          <TableRow className="border-border/40 hover:bg-transparent bg-muted/40">
            {/* Selection checkbox header */}
            {enableSelection && (
              <TableHead className="w-10 px-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map(col => {
              const isResizable = col.resizable !== false; // default resizable
              const widthStyle = columnWidths[col.key]
                ? { width: `${columnWidths[col.key]}px`, minWidth: `${col.minWidth || 60}px` }
                : undefined;

              return (
                <TableHead
                  key={col.key}
                  ref={(el) => { if (el) headerRefs.current[col.key] = el; }}
                  className={cn(
                    'relative select-none',
                    col.width ?? '',
                    col.headerClass ?? ''
                  )}
                  style={widthStyle}
                >
                  {col.title}
                  {isResizable && (
                    <ResizeHandle
                      onResize={(delta) => handleResize(col.key, delta, col.minWidth)}
                    />
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => {
            const key = getItemKey(item);
            const isSelected = enableSelection && selectedIds?.has(key);

            return (
              <TableRow
                key={String(key || Math.random())}
                className={cn(
                  'border-border/20 cursor-pointer group transition-colors duration-100',
                  isSelected
                    ? 'bg-primary/[0.04] hover:bg-primary/[0.07]'
                    : 'hover:bg-muted/30'
                )}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {/* Selection checkbox cell */}
                {enableSelection && (
                  <TableCell className="px-3 py-2 w-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={!!isSelected}
                      onCheckedChange={(checked) => handleSelectItem(key, !!checked)}
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                {columns.map(col => {
                  const content = col.render(item);
                  const widthStyle = columnWidths[col.key]
                    ? { width: `${columnWidths[col.key]}px` }
                    : undefined;

                  return (
                    <TableCell
                      key={col.key}
                      className={col.cellClass ?? 'px-3 py-2'}
                      style={widthStyle}
                    >
                      {col.editable ? (
                        <InlineEditCell row={item} editable={col.editable}>
                          {content}
                        </InlineEditCell>
                      ) : (
                        content
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {enablePagination && totalItems && totalItems > itemsPerPage && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onPageChange={(page) => onPageChange?.(page)}
          onNextPage={() => hasNextPage && onPageChange?.(currentPage + 1)}
          onPreviousPage={() => hasPreviousPage && onPageChange?.(currentPage - 1)}
          showPageNumbers={true}
        />
      )}
    </div>
  );
}

// Re-export for convenience
export { TableEmptyState };
export default TableLayout;
