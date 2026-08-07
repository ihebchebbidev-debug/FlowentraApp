import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StockStats as StockStatsType } from '../types';

interface StockStatsProps {
  stats: StockStatsType;
  selectedFilter: string;
  onFilterSelect: (filter: 'all' | 'critical' | 'low' | 'good') => void;
}

export function StockStats({ stats, selectedFilter, onFilterSelect }: StockStatsProps) {
  const { t } = useTranslation('stock-management');

  const statItems = [
    {
      key: 'all',
      label: t('stats.total_materials'),
      value: stats.total,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      key: 'critical',
      label: t('stats.critical_stock'),
      value: stats.critical,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      key: 'low',
      label: t('stats.low_stock'),
      value: stats.low,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      key: 'good',
      label: t('stats.healthy_stock'),
      value: stats.healthy,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const formatValue = (value: number) => value === 0 ? '-' : value;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedFilter === item.key;
        
        return (
          <Card
            key={item.key}
            className={cn(
              'shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg',
              isSelected 
                ? 'border-2 border-primary bg-primary/5' 
                : 'border-0'
            )}
            onClick={() => onFilterSelect(item.key as any)}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'p-2 rounded-lg transition-all flex-shrink-0',
                    isSelected 
                      ? 'bg-primary/20' 
                      : `${item.bgColor} group-hover:opacity-80`
                  )}>
                    <Icon className={cn(
                      'h-4 w-4 transition-all',
                      isSelected ? 'text-primary' : item.color
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium truncate">{item.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatValue(item.value)}</p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
