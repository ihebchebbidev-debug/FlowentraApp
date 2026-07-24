import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface SimplePaginationBarProps {
  startIndex: number;
  endIndex: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  className?: string;
}

/** Compact prev/next pagination bar used inside card-style lists (top & bottom). */
export function SimplePaginationBar({
  startIndex,
  endIndex,
  totalItems,
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPreviousPage,
  onNextPage,
  className = '',
}: SimplePaginationBarProps) {
  const { t } = useTranslation();
  if (totalItems <= 0) return null;
  const safeTotalPages = Math.max(totalPages, 1);
  const safeEndIndex = Math.max(endIndex, startIndex + 1);

  return (
    <div className={`p-2 sm:p-3 border-b border-border bg-muted/20 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-px-11 sm:text-sm text-muted-foreground truncate">
          {t('pagination.showing_results', {
            start: startIndex + 1,
            end: safeEndIndex,
            total: totalItems,
          })}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={!hasPreviousPage}
            className="h-7 px-2 text-px-11 sm:h-8 sm:px-3 sm:text-sm"
          >
            {t('pagination.previous')}
          </Button>
          <span className="px-2 py-0.5 text-px-11 sm:px-3 sm:py-1 sm:text-sm">
            {t('pagination.page_of', { current: currentPage, total: safeTotalPages })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage}
            className="h-7 px-2 text-px-11 sm:h-8 sm:px-3 sm:text-sm"
          >
            {t('pagination.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
