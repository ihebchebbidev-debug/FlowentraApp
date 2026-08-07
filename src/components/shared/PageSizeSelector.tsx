import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PageSizeSelectorProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  pageSizeOptions?: number[];
  showAllOption?: boolean;
}

export function PageSizeSelector({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  hasPreviousPage,
  hasNextPage,
  pageSizeOptions = [20, 50, 100],
  showAllOption = true,
}: PageSizeSelectorProps) {
  const { t } = useTranslation();
  const isShowAll = pageSize >= 10000;

  // Generate visible page numbers with ellipsis
  const getVisiblePages = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis-start');
    }

    // Pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-1 flex-wrap">
      {/* Left: Items info + page size */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
          {isShowAll
            ? <><span className="font-medium text-foreground">{totalItems}</span> item{totalItems !== 1 ? 's' : ''}</>
            : <>
                <span className="font-medium text-foreground">{startIndex + 1}–{endIndex}</span>
                {' '}of{' '}
                <span className="font-medium text-foreground">{totalItems.toLocaleString()}</span>
              </>
          }
        </span>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">{t('common.rows', 'Rows')}</span>
          <Select
            value={isShowAll ? 'all' : String(pageSize)}
            onValueChange={(val) => {
              if (val === 'all') {
                onPageSizeChange(99999);
              } else {
                onPageSizeChange(Number(val));
              }
            }}
          >
            <SelectTrigger className="h-8 w-[72px] text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
              {showAllOption && (
                <SelectItem value="all">All</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: Page navigation */}
      {!isShowAll && totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:inline-flex"
            onClick={() => onPageChange(1)}
            disabled={!hasPreviousPage}
            title="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Previous */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center gap-0.5 mx-1">
            {getVisiblePages().map((page, idx) => {
              if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                return (
                  <span key={page} className="w-8 h-8 flex items-center justify-center text-muted-foreground text-xs">
                    ···
                  </span>
                );
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-xs font-medium",
                    currentPage === page && "pointer-events-none"
                  )}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          {/* Mobile: simple page indicator */}
          <span className="sm:hidden text-xs text-muted-foreground px-2 whitespace-nowrap tabular-nums font-medium">
            {currentPage} / {totalPages}
          </span>

          {/* Next */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:inline-flex"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage}
            title="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
