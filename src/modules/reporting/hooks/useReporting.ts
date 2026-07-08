import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '../services/reportingApi';

export const useReportingSales = () => {
  return useQuery({
    queryKey: ['reporting', 'sales'],
    queryFn: () => reportingApi.getSalesReport(),
  });
};

export const useReportingService = () => {
  return useQuery({
    queryKey: ['reporting', 'service'],
    queryFn: () => reportingApi.getServiceReport(),
  });
};

export const useReportingFinance = () => {
  return useQuery({
    queryKey: ['reporting', 'finance'],
    queryFn: () => reportingApi.getFinanceReport(),
  });
};

export const useReportingHr = () => {
  return useQuery({
    queryKey: ['reporting', 'hr'],
    queryFn: () => reportingApi.getHrReport(),
  });
};

export const useReportingPurchase = () => {
  return useQuery({
    queryKey: ['reporting', 'purchase'],
    queryFn: () => reportingApi.getPurchaseReport(),
  });
};
