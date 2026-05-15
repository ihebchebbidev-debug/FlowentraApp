import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, History } from 'lucide-react';
import { StockGauge } from './StockGauge';
import { StockStatusBadge } from './StockStatusBadge';
import type { MaterialStock } from '../types';

interface StockCardProps {
  material: MaterialStock;
  onReplenish: (material: MaterialStock, type: 'add' | 'remove') => void;
  onViewHistory: (material: MaterialStock) => void;
}

export function StockCard({ material, onReplenish, onViewHistory }: StockCardProps) {
  const { t } = useTranslation('stock-management');

  return (
    <Card 
      className="p-4 hover:shadow-lg transition-shadow duration-200 border-0 shadow-card cursor-pointer"
      onClick={() => onViewHistory(material)}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {/* Name and Category */}
        <div className="w-full">
          <h3 className="font-semibold text-foreground text-sm line-clamp-2 break-words" title={material.name}>
            {material.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1" title={material.category}>
            {material.category}
          </p>
        </div>

        {/* Stock Gauge */}
        <StockGauge 
          percentage={material.percentage}
          status={material.status}
          stock={material.stock}
        />

        {/* Status Badge */}
        <StockStatusBadge status={material.status} />

        {/* Quick Actions */}
        <div className="flex flex-col gap-2 w-full mt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              onReplenish(material, 'add');
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            {t('replenish.add_stock')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              onReplenish(material, 'remove');
            }}
            disabled={material.stock <= 0}
          >
            <Minus className="h-3 w-3 mr-1" />
            {t('replenish.remove_stock')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory(material);
            }}
          >
            <History className="h-3 w-3 mr-1" />
            {t('card.view_history')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
