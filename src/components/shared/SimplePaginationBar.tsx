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
    <div className={`p-3 border-b border-border bg-muted/20 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('pagination.showing_results', {
            start: startIndex + 1,
            end: endIndex,
            total: totalItems,
          })}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={onPreviousPage}
            disabled={!hasPreviousPage}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
          >
            {t('pagination.previous')}
          </button>
          <span className="px-3 py-1 text-sm">
            {t('pagination.page_of', { current: currentPage, total: totalPages })}
          </span>
          <button
            onClick={onNextPage}
            disabled={!hasNextPage}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
          >
            {t('pagination.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
