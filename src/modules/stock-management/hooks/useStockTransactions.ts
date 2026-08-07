import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/services/api/apiClient';
import type { StockTransaction, StockTransactionListResponse } from '../types/stockTransaction';

export function useStockTransactions(articleId: number | null, enabled: boolean = true) {
  return useQuery<StockTransaction[]>({
    queryKey: ['stock-transactions', articleId],
    queryFn: async () => {
      if (!articleId) return [];
      const response = await apiFetch<StockTransaction[]>(`/api/stock-transactions/article/${articleId}`);
      return response.data ?? [];
    },
    enabled: enabled && !!articleId,
    staleTime: 30000, // 30 seconds
  });
}

export function useAllStockTransactions(params?: {
  articleId?: number;
  transactionType?: string;
  referenceType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<StockTransactionListResponse>({
    queryKey: ['stock-transactions', 'all', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.articleId) searchParams.append('articleId', params.articleId.toString());
      if (params?.transactionType) searchParams.append('transactionType', params.transactionType);
      if (params?.referenceType) searchParams.append('referenceType', params.referenceType);
      if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await apiFetch<StockTransactionListResponse>(
        `/api/stock-transactions?${searchParams.toString()}`
      );
      return response.data ?? { data: [], pagination: { total: 0, page: 1, limit: 50, pages: 0 } };
    },
    staleTime: 30000,
  });
}
