import axiosInstance from '@/services/api/axiosInstance';
import type { 
  SalesReport, 
  ServiceReport, 
  FinanceReport, 
  HrReport, 
  PurchaseReport 
} from '../types';

export const reportingApi = {
  getSalesReport: async (): Promise<SalesReport> => {
    const { data } = await axiosInstance.get('/Reporting/sales');
    return data;
  },
  getServiceReport: async (): Promise<ServiceReport> => {
    const { data } = await axiosInstance.get('/Reporting/service');
    return data;
  },
  getFinanceReport: async (): Promise<FinanceReport> => {
    const { data } = await axiosInstance.get('/Reporting/finance');
    return data;
  },
  getHrReport: async (): Promise<HrReport> => {
    const { data } = await axiosInstance.get('/Reporting/hr');
    return data;
  },
  getPurchaseReport: async (): Promise<PurchaseReport> => {
    const { data } = await axiosInstance.get('/Reporting/purchase');
    return data;
  }
};
