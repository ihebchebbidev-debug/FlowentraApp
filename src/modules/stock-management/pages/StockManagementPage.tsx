import { useState } from 'react';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import { Loader2, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StockHeader } from '../components/StockHeader';
import { StockStats } from '../components/StockStats';

import { StockCard } from '../components/StockCard';
import { StockSearchFilters } from '../components/StockSearchFilters';
import { ReplenishDialog } from '../components/ReplenishDialog';
import { StockHistoryDialog } from '../components/StockHistoryDialog';
import { DemandForecastDialog } from '../components/DemandForecastDialog';
import { AnomalyDetectionDialog } from '../components/AnomalyDetectionDialog';
import { useStockData } from '../hooks/useStockData';
import { useDemandForecast } from '../hooks/useDemandForecast';
import { useAnomalyDetection } from '../hooks/useAnomalyDetection';
import { useAllStockTransactions } from '../hooks/useStockTransactions';
import type { MaterialStock, StockFilter, StockStatus } from '../types';

export default function StockManagementPage() {
  const { t } = useTranslation('stock-management');
  
  const [filter, setFilter] = useState<StockFilter>({
    search: '',
    status: 'all',
    location: 'all',
  });

  const [replenishMaterial, setReplenishMaterial] = useState<MaterialStock | null>(null);
  const [replenishType, setReplenishType] = useState<'add' | 'remove'>('add');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // History dialog state
  const [historyMaterial, setHistoryMaterial] = useState<MaterialStock | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  // Forecast dialog state
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  
  // Anomaly detection dialog state
  const [anomalyDialogOpen, setAnomalyDialogOpen] = useState(false);

  const { materials, allMaterials, stats, isLoading } = useStockData(filter);
  const { forecastData, isLoading: isForecastLoading, generateForecast } = useDemandForecast();
  const { anomalyData, isLoading: isAnomalyLoading, detectAnomalies } = useAnomalyDetection();
  
  // Fetch all transactions for AI analysis
  const { data: allTransactionsData } = useAllStockTransactions({
    limit: 500,
  });

  const handleFilterChange = (updates: Partial<StockFilter>) => {
    setFilter(prev => ({ ...prev, ...updates }));
  };

  const handleStatFilter = (statKey: 'all' | 'critical' | 'low' | 'good') => {
    setFilter(prev => ({ ...prev, status: statKey as StockStatus | 'all' }));
  };

  const handleReplenish = (material: MaterialStock, type: 'add' | 'remove') => {
    setReplenishMaterial(material);
    setReplenishType(type);
    setDialogOpen(true);
  };

  const handleViewHistory = (material: MaterialStock) => {
    setHistoryMaterial(material);
    setHistoryDialogOpen(true);
  };

  const handleOpenForecast = () => {
    setForecastDialogOpen(true);
  };

  const handleOpenAnomalyDetection = () => {
    setAnomalyDialogOpen(true);
  };

  // Helper to prepare transaction data for AI
  const prepareTransactionData = () => {
    const transactionsData = allTransactionsData?.data || [];
    
    // Group transactions by article
    const articleTransactions = new Map<number, any[]>();
    transactionsData.forEach(tx => {
      const existing = articleTransactions.get(tx.articleId) || [];
      existing.push({
        id: tx.id,
        transactionType: tx.transactionType,
        quantity: tx.quantity,
        createdAt: tx.createdAt,
        referenceType: tx.referenceType,
        performedByName: tx.performedByName,
      });
      articleTransactions.set(tx.articleId, existing);
    });

    return { transactionsData, articleTransactions };
  };

  const handleGenerateForecast = () => {
    const { articleTransactions } = prepareTransactionData();

    const articlesToForecast = allMaterials.map(material => ({
      articleId: parseInt(material.id),
      articleName: material.name,
      articleNumber: material.sku,
      currentStock: material.stock,
      minStock: material.minStock,
      transactions: articleTransactions.get(parseInt(material.id)) || [],
    }));

    generateForecast(articlesToForecast);
  };

  const handleDetectAnomalies = () => {
    const { articleTransactions, transactionsData } = prepareTransactionData();

    // Calculate average daily usage per article
    const calculateAvgDailyUsage = (articleId: number): number => {
      const txs = transactionsData.filter(
        tx => tx.articleId === articleId && 
        ['remove', 'sale_deduction', 'transfer_out'].includes(tx.transactionType)
      );
      if (txs.length === 0) return 0;
      
      const totalUsage = txs.reduce((sum, tx) => sum + tx.quantity, 0);
      const daySpan = txs.length > 1 
        ? Math.max(1, Math.ceil((new Date(txs[0].createdAt).getTime() - new Date(txs[txs.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 30;
      return totalUsage / daySpan;
    };

    const articlesToAnalyze = allMaterials.map(material => ({
      articleId: parseInt(material.id),
      articleName: material.name,
      articleNumber: material.sku,
      currentStock: material.stock,
      minStock: material.minStock,
      avgDailyUsage: calculateAvgDailyUsage(parseInt(material.id)),
      transactions: articleTransactions.get(parseInt(material.id)) || [],
    }));

    detectAnomalies(articlesToAnalyze);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <StockHeader 
          onOpenForecast={handleOpenForecast} 
          onOpenAnomalyDetection={handleOpenAnomalyDetection}
        />
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <StockHeader 
        onOpenForecast={handleOpenForecast} 
        onOpenAnomalyDetection={handleOpenAnomalyDetection}
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Stats Row */}
        <StockStats 
          stats={stats} 
          selectedFilter={filter.status} 
          onFilterSelect={handleStatFilter} 
        />

        {/* Search & Filters */}
        <div className="bg-card rounded-lg border-0 shadow-card p-3 sm:p-4">
          <StockSearchFilters filter={filter} onFilterChange={handleFilterChange} />
        </div>

        {/* Materials Grid */}
        {materials.length === 0 ? (
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('no_materials')}</h3>
                <p className="text-sm text-muted-foreground max-w-md">{t('no_materials_description')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {materials.map((material) => (
              <StockCard
                key={material.id}
                material={material}
                onReplenish={handleReplenish}
                onViewHistory={handleViewHistory}
              />
            ))}
          </div>
        )}
      </div>

      {/* Replenish Dialog */}
      <ReplenishDialog
        material={replenishMaterial}
        type={replenishType}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* History Dialog */}
      <StockHistoryDialog
        material={historyMaterial}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />

      {/* Demand Forecast Dialog */}
      <DemandForecastDialog
        open={forecastDialogOpen}
        onOpenChange={setForecastDialogOpen}
        forecastData={forecastData}
        isLoading={isForecastLoading}
        onGenerate={handleGenerateForecast}
      />

      {/* Anomaly Detection Dialog */}
      <AnomalyDetectionDialog
        open={anomalyDialogOpen}
        onOpenChange={setAnomalyDialogOpen}
        anomalyData={anomalyData}
        isLoading={isAnomalyLoading}
        onDetect={handleDetectAnomalies}
      />
    </div>
  );
}
