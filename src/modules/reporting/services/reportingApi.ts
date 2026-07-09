import axiosInstance from '@/services/api/axiosInstance';
import type { 
  SalesReport, 
  ServiceReport, 
  FinanceReport, 
  HrReport, 
  PurchaseReport 
} from '../types';

export type ReportFilters = Record<string, string> | undefined;

const cfg = (params: ReportFilters) =>
  params && Object.keys(params).length ? { params } : undefined;

export const reportingApi = {
  getSalesReport: async (filters?: ReportFilters): Promise<SalesReport> => {
    const { data } = await axiosInstance.get('/Reporting/sales', cfg(filters));
    return data;
  },
  getServiceReport: async (filters?: ReportFilters): Promise<ServiceReport> => {
    const { data } = await axiosInstance.get('/Reporting/service', cfg(filters));
    return data;
  },
  getFinanceReport: async (filters?: ReportFilters): Promise<FinanceReport> => {
    const { data } = await axiosInstance.get('/Reporting/finance', cfg(filters));
    return data;
  },
  getHrReport: async (filters?: ReportFilters): Promise<HrReport> => {
    const { data } = await axiosInstance.get('/Reporting/hr', cfg(filters));
    return data;
  },
  getPurchaseReport: async (filters?: ReportFilters): Promise<PurchaseReport> => {
    const { data } = await axiosInstance.get('/Reporting/purchase', cfg(filters));
    return data;
  }
};
