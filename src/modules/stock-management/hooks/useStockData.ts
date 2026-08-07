import { useMemo } from 'react';
import { useArticles } from '@/modules/articles/hooks/useArticles';
import { useLookups } from '@/shared/contexts/LookupsContext';
import type { MaterialStock, StockStatus, StockStats, StockFilter } from '../types';

// Calculate stock status based on current stock and min stock
const getStockStatus = (stock: number, minStock: number, maxStock?: number): StockStatus => {
  if (stock <= 0) return 'critical';
  if (stock <= minStock) return 'low';
  if (maxStock && stock >= maxStock * 1.2) return 'excess';
  return 'good';
};

// Calculate percentage for visual display
const getStockPercentage = (stock: number, minStock: number, maxStock?: number): number => {
  const effectiveMax = maxStock || minStock * 3;
  if (effectiveMax === 0) return 0;
  return Math.min(Math.round((stock / effectiveMax) * 100), 100);
};

export function useStockData(filter: StockFilter) {
  const { articles, isLoading } = useArticles();
  const { articleCategories, locations } = useLookups();

  // Helper to resolve category name
  const getCategoryName = (categoryId: any): string => {
    if (!categoryId) return 'General';
    const category = articleCategories.find(c => String(c.id) === String(categoryId));
    return category?.name || 'General';
  };

  // Helper to resolve location name
  const getLocationName = (locationId: any): string => {
    if (!locationId) return '-';
    const location = locations.find(l => String(l.id) === String(locationId));
    return location?.name || '-';
  };

  // Filter and transform materials only
  const materials = useMemo<MaterialStock[]>(() => {
    const materialArticles = articles.filter((article: any) => 
      article.type === 'material' || !article.type
    );

    return materialArticles.map((article: any) => {
      const stock = article.stockQuantity ?? article.stock ?? 0;
      const minStock = article.minStockLevel ?? article.minStock ?? 0;
      const maxStock = article.maxStockLevel ?? article.maxStock;
      const status = getStockStatus(stock, minStock, maxStock);
      const percentage = getStockPercentage(stock, minStock, maxStock);

      return {
        id: String(article.id),
        name: article.name || 'Unnamed',
        sku: article.articleNumber || article.sku || '',
        category: getCategoryName(article.categoryId || article.category),
        location: getLocationName(article.locationId || article.location),
        stock,
        minStock,
        maxStock,
        costPrice: article.purchasePrice ?? article.costPrice ?? 0,
        sellPrice: article.salesPrice ?? article.sellPrice ?? 0,
        status,
        percentage,
      };
    });
  }, [articles, articleCategories, locations]);

  // Apply filters
  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      // Search filter
      const matchesSearch = filter.search === '' || 
        material.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        material.sku.toLowerCase().includes(filter.search.toLowerCase()) ||
        material.category.toLowerCase().includes(filter.search.toLowerCase());

      // Status filter
      const matchesStatus = filter.status === 'all' || material.status === filter.status;

      // Location filter
      const matchesLocation = filter.location === 'all' || 
        material.location === locations.find(l => l.id === filter.location)?.name;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [materials, filter, locations]);

  // Calculate stats
  const stats = useMemo<StockStats>(() => {
    return {
      total: materials.length,
      critical: materials.filter(m => m.status === 'critical').length,
      low: materials.filter(m => m.status === 'low').length,
      healthy: materials.filter(m => m.status === 'good' || m.status === 'excess').length,
    };
  }, [materials]);

  return {
    materials: filteredMaterials,
    allMaterials: materials,
    stats,
    isLoading,
  };
}
