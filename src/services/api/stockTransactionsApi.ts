import { apiFetch } from './apiClient';
import type { StockTransaction } from '@/modules/stock-management/types/stockTransaction';

export interface AddRemoveStockRequest {
  articleId: number;
  quantity: number;
  reason: string;
  notes?: string;
}

export const stockTransactionsApi = {
  addStock: async (data: AddRemoveStockRequest): Promise<StockTransaction> => {
    const response = await apiFetch<StockTransaction>('/api/stock-transactions/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data as StockTransaction;
  },

  removeStock: async (data: AddRemoveStockRequest): Promise<StockTransaction> => {
    const response = await apiFetch<StockTransaction>('/api/stock-transactions/remove', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data as StockTransaction;
  },
};
