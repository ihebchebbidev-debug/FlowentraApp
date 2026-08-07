import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportingApi, type ReportFilters } from '../services/reportingApi';
import {
  getActiveCompanyId,
  isActiveCompanyViewAll,
  onTargetTenantChanged,
} from '@/utils/targetTenant';

/**
 * All reporting queries are scoped by the active company (X-Target-Tenant is
 * injected automatically by the axios interceptor). We include the active
 * company id + view-all flag + applied filters in the queryKey so React Query
 * maintains a separate cache per scope and refetches on company / filter change.
 */
function useCompanyScope() {
  const queryClient = useQueryClient();
  const companyId = getActiveCompanyId();
  const viewAll = isActiveCompanyViewAll();

  useEffect(() => {
    const unsub = onTargetTenantChanged(() => {
      queryClient.invalidateQueries({ queryKey: ['reporting'] });
    });
    return unsub;
  }, [queryClient]);

  return { companyId: companyId ?? null, viewAll };
}

const STALE = 60_000;

// Normalize filters so undefined / empty maps produce the same key, and key
// ordering doesn't matter for cache hits.
const normalizeFilters = (f?: ReportFilters): Record<string, string> => {
  if (!f) return {};
  const out: Record<string, string> = {};
  Object.keys(f)
    .sort()
    .forEach((k) => {
      const v = f[k];
      if (v != null && v !== '') out[k] = v;
    });
  return out;
};

export const useReportingSales = (filters?: ReportFilters) => {
  const { companyId, viewAll } = useCompanyScope();
  const f = normalizeFilters(filters);
  return useQuery({
    queryKey: ['reporting', 'sales', { companyId, viewAll, filters: f }],
    queryFn: () => reportingApi.getSalesReport(f),
    staleTime: STALE,
  });
};

export const useReportingService = (filters?: ReportFilters) => {
  const { companyId, viewAll } = useCompanyScope();
  const f = normalizeFilters(filters);
  return useQuery({
    queryKey: ['reporting', 'service', { companyId, viewAll, filters: f }],
    queryFn: () => reportingApi.getServiceReport(f),
    staleTime: STALE,
  });
};

export const useReportingFinance = (filters?: ReportFilters) => {
  const { companyId, viewAll } = useCompanyScope();
  const f = normalizeFilters(filters);
  return useQuery({
    queryKey: ['reporting', 'finance', { companyId, viewAll, filters: f }],
    queryFn: () => reportingApi.getFinanceReport(f),
    staleTime: STALE,
  });
};

export const useReportingHr = (filters?: ReportFilters) => {
  const { companyId, viewAll } = useCompanyScope();
  const f = normalizeFilters(filters);
  return useQuery({
    queryKey: ['reporting', 'hr', { companyId, viewAll, filters: f }],
    queryFn: () => reportingApi.getHrReport(f),
    staleTime: STALE,
  });
};

export const useReportingPurchase = (filters?: ReportFilters) => {
  const { companyId, viewAll } = useCompanyScope();
  const f = normalizeFilters(filters);
  return useQuery({
    queryKey: ['reporting', 'purchase', { companyId, viewAll, filters: f }],
    queryFn: () => reportingApi.getPurchaseReport(f),
    staleTime: STALE,
  });
};
