import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportingApi } from '../services/reportingApi';
import {
  getActiveCompanyId,
  isActiveCompanyViewAll,
  onTargetTenantChanged,
} from '@/utils/targetTenant';

/**
 * All reporting queries are scoped by the active company (X-Target-Tenant is
 * injected automatically by the axios interceptor). We include the active
 * company id + view-all flag in the queryKey so React Query maintains a
 * separate cache per company and refetches on company switch.
 */
function useCompanyScope() {
  const queryClient = useQueryClient();
  const companyId = getActiveCompanyId();
  const viewAll = isActiveCompanyViewAll();

  // Invalidate reporting caches whenever the active company changes so any
  // in-flight or cached data is dropped even without a full page reload.
  useEffect(() => {
    const unsub = onTargetTenantChanged(() => {
      queryClient.invalidateQueries({ queryKey: ['reporting'] });
    });
    return unsub;
  }, [queryClient]);

  return { companyId: companyId ?? null, viewAll };
}

const STALE = 60_000;

export const useReportingSales = () => {
  const { companyId, viewAll } = useCompanyScope();
  return useQuery({
    queryKey: ['reporting', 'sales', { companyId, viewAll }],
    queryFn: () => reportingApi.getSalesReport(),
    staleTime: STALE,
  });
};

export const useReportingService = () => {
  const { companyId, viewAll } = useCompanyScope();
  return useQuery({
    queryKey: ['reporting', 'service', { companyId, viewAll }],
    queryFn: () => reportingApi.getServiceReport(),
    staleTime: STALE,
  });
};

export const useReportingFinance = () => {
  const { companyId, viewAll } = useCompanyScope();
  return useQuery({
    queryKey: ['reporting', 'finance', { companyId, viewAll }],
    queryFn: () => reportingApi.getFinanceReport(),
    staleTime: STALE,
  });
};

export const useReportingHr = () => {
  const { companyId, viewAll } = useCompanyScope();
  return useQuery({
    queryKey: ['reporting', 'hr', { companyId, viewAll }],
    queryFn: () => reportingApi.getHrReport(),
    staleTime: STALE,
  });
};

export const useReportingPurchase = () => {
  const { companyId, viewAll } = useCompanyScope();
  return useQuery({
    queryKey: ['reporting', 'purchase', { companyId, viewAll }],
    queryFn: () => reportingApi.getPurchaseReport(),
    staleTime: STALE,
  });
};
