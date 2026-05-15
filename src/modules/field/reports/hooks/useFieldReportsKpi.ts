import { useState, useEffect, useCallback } from 'react';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';
import { dispatchesApi } from '@/services/api/dispatchesApi';
import { installationsApi } from '@/services/api/installationsApi';

interface FieldReportsKpiData {
  totalServiceOrders: number;
  completedServiceOrders: number;
  inProgressServiceOrders: number;
  totalJobs: number;
  unscheduledJobs: number;
  dispatchedJobs: number;
  totalDispatches: number;
  completedDispatches: number;
  pendingDispatches: number;
  totalInstallations: number;
  activeInstallations: number;
}

interface FieldReportsKpiState extends FieldReportsKpiData {
  isLoading: boolean;
  error: string | null;
}

const initialData: FieldReportsKpiData = {
  totalServiceOrders: 0,
  completedServiceOrders: 0,
  inProgressServiceOrders: 0,
  totalJobs: 0,
  unscheduledJobs: 0,
  dispatchedJobs: 0,
  totalDispatches: 0,
  completedDispatches: 0,
  pendingDispatches: 0,
  totalInstallations: 0,
  activeInstallations: 0,
};

export function useFieldReportsKpi(): FieldReportsKpiState {
  const [state, setState] = useState<FieldReportsKpiState>({
    ...initialData,
    isLoading: true,
    error: null,
  });

  const fetchKpiData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch all data in parallel
      const [serviceOrdersRes, dispatchesRes, installationsRes] = await Promise.all([
        serviceOrdersApi.getAll().catch((err) => {
          console.warn('Failed to fetch service orders:', err);
          return { data: { serviceOrders: [] } };
        }),
        dispatchesApi.getAll({ pageSize: 500 }).catch((err) => {
          console.warn('Failed to fetch dispatches:', err);
          return { data: [] };
        }),
        installationsApi.getAll().catch((err) => {
          console.warn('Failed to fetch installations:', err);
          return { installations: [] };
        }),
      ]);

      // Extract service orders
      let serviceOrders: any[] = [];
      if (serviceOrdersRes && typeof serviceOrdersRes === 'object') {
        const res = serviceOrdersRes as any;
        if (res.data?.serviceOrders) {
          serviceOrders = res.data.serviceOrders;
        } else if (res.serviceOrders) {
          serviceOrders = res.serviceOrders;
        } else if (Array.isArray(res.data)) {
          serviceOrders = res.data;
        } else if (Array.isArray(res)) {
          serviceOrders = res;
        }
      }

      // Extract dispatches
      let dispatches: any[] = [];
      if (dispatchesRes && typeof dispatchesRes === 'object') {
        const res = dispatchesRes as any;
        if (Array.isArray(res.data)) {
          dispatches = res.data;
        } else if (Array.isArray(res)) {
          dispatches = res;
        } else if (res.items) {
          dispatches = res.items;
        }
      }

      // Extract installations
      let installations: any[] = [];
      if (installationsRes && typeof installationsRes === 'object') {
        const res = installationsRes as any;
        if (Array.isArray(res.installations)) {
          installations = res.installations;
        } else if (Array.isArray(res.data)) {
          installations = res.data;
        } else if (Array.isArray(res)) {
          installations = res;
        } else if (res.items) {
          installations = res.items;
        }
      }

      // Calculate stats
      const completedSOs = serviceOrders.filter((so: any) => 
        so.status === 'completed' || so.status === 'closed' || so.status === 'invoiced'
      ).length;
      const inProgressSOs = serviceOrders.filter((so: any) => so.status === 'in_progress').length;

      let totalJobs = 0;
      let unscheduledJobs = 0;
      let dispatchedJobs = 0;
      
      serviceOrders.forEach((so: any) => {
        if (so.jobs && Array.isArray(so.jobs)) {
          totalJobs += so.jobs.length;
          so.jobs.forEach((job: any) => {
            if (job.status === 'unscheduled' || job.status === 'pending') unscheduledJobs++;
            if (job.status === 'dispatched' || job.status === 'scheduled') dispatchedJobs++;
          });
        }
      });

      const completedDispatches = dispatches.filter((d: any) => d.status === 'completed').length;
      const pendingDispatches = dispatches.filter((d: any) => 
        d.status === 'pending' || d.status === 'assigned'
      ).length;

      const activeInstallations = installations.filter((i: any) => 
        i.status === 'active' || i.Status === 'active' || i.isActive === true
      ).length;

      setState({
        totalServiceOrders: serviceOrders.length,
        completedServiceOrders: completedSOs,
        inProgressServiceOrders: inProgressSOs,
        totalJobs,
        unscheduledJobs,
        dispatchedJobs,
        totalDispatches: dispatches.length,
        completedDispatches,
        pendingDispatches,
        totalInstallations: installations.length,
        activeInstallations,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Failed to fetch field reports KPI data:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load KPI data',
      }));
    }
  }, []);

  useEffect(() => {
    fetchKpiData();
  }, [fetchKpiData]);

  return state;
}
