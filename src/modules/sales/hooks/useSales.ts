import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Sale, SaleFilters, SaleStats } from '../types';
import { SalesService } from '../services/sales.service';
import { salesApi } from '@/services/api/salesApi';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SaleStats>({
    totalSales: 0,
    activeSales: 0,
    wonSales: 0,
    lostSales: 0,
    totalValue: 0,
    averageValue: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SaleFilters>({});

  const fetchSales = async () => {
    try {
      setLoading(true);
      const [salesData, statsData] = await Promise.all([
        SalesService.getSales(filters),
        SalesService.getSaleStats()
      ]);
      setSales(salesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const updateSaleStatus = async (saleId: string, newStatus: string) => {
    try {
      // Get current sale to log the old status
      const currentSale = sales.find(s => s.id === saleId);
      const oldStatus = currentSale?.status || 'unknown';
      
      await SalesService.updateSale(saleId, { status: newStatus as any });
      
      // Log the status change activity
      try {
        const numericId = parseInt(saleId, 10);
        if (!isNaN(numericId)) {
          await salesApi.addActivity(numericId, {
            type: 'status_changed',
            description: `Status changed from '${oldStatus}' to '${newStatus}'`,
            details: `Sale status updated on ${new Date().toLocaleDateString()}`,
          });
        }
      } catch (activityError) {
        console.warn('Failed to log status change activity:', activityError);
      }
      
      toast.success('Sale status updated');
      fetchSales();
    } catch (error) {
      toast.error('Failed to update sale status');
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      await SalesService.deleteSale(saleId);
      toast.success('Sale deleted successfully');
      fetchSales();
    } catch (error) {
      toast.error('Failed to delete sale');
    }
  };

  useEffect(() => {
    fetchSales();
  }, [filters]);

  return {
    sales,
    stats,
    loading,
    filters,
    setFilters,
    updateSaleStatus,
    deleteSale,
    refetch: fetchSales
  };
}
