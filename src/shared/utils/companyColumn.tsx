/**
 * Shared helper to create a "Company" column for TableLayout when in view-all mode.
 * Import and conditionally add to your columns array.
 */
import React from 'react';
import { CompanyBadge } from '@/components/CompanyBadge';
import { isViewAllMode } from '@/utils/tenant';
import type { Column } from '@/components/shared/TableLayout';

/**
 * Returns a Company column definition for TableLayout, or null if not in view-all mode.
 * Usage: const cols = [myCol1, getCompanyColumn<MyType>(), myCol2].filter(Boolean)
 */
export function getCompanyColumn<T extends { tenantId?: number }>(): Column<T> | null {
  if (!isViewAllMode()) return null;

  return {
    key: 'company',
    title: 'Company', // Will be overridden by translated title in each list
    width: 'w-[140px]',
    render: (row: T) => <CompanyBadge tenantId={row.tenantId} forceShow showUnknown />,
  };
}

/**
 * Returns a TableHead + TableCell JSX pair helper for raw Table usage (non-TableLayout).
 * The calling component should use isViewAllMode() to conditionally render.
 */
export { isViewAllMode } from '@/utils/tenant';
