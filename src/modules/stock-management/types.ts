// Stock Management Module Types

export type StockStatus = 'critical' | 'low' | 'good' | 'excess';

export interface MaterialStock {
  id: string;
  name: string;
  sku: string;
  category: string;
  location: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  costPrice: number;
  sellPrice: number;
  status: StockStatus;
  percentage: number;
}

export interface StockFilter {
  search: string;
  status: StockStatus | 'all';
  location: string;
}

export interface StockStats {
  total: number;
  critical: number;
  low: number;
  healthy: number;
}

export interface ReplenishData {
  articleId: string;
  type: 'add' | 'remove';
  quantity: number;
  reason: string;
  notes?: string;
}
