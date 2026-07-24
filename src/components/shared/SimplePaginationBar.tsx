import React from 'react';
import { useTranslation } from 'react-i18next';

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
  if (totalPages <= 1) return null;
  return (
    <div className={`p-2 sm:p-3 border-b border-border bg-muted/20 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] sm:text-sm text-muted-foreground truncate">
          {t('pagination.showing_results', {
            start: startIndex + 1,
            end: endIndex,
            total: totalItems,
          })}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPreviousPage}
            disabled={!hasPreviousPage}
            className="px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
          >
            {t('pagination.previous')}
          </button>
          <span className="px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm">
            {t('pagination.page_of', { current: currentPage, total: totalPages })}
          </span>
          <button
            onClick={onNextPage}
            disabled={!hasNextPage}
            className="px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
          >
            {t('pagination.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
