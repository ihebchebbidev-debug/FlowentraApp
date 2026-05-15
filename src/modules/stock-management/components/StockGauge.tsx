import { cn } from '@/lib/utils';
import type { StockStatus } from '../types';

interface StockGaugeProps {
  percentage: number;
  status: StockStatus;
  stock: number;
  className?: string;
}

export function StockGauge({ percentage, status, stock, className }: StockGaugeProps) {
  // Color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'bg-destructive';
      case 'low':
        return 'bg-warning';
      case 'excess':
        return 'bg-accent';
      case 'good':
      default:
        return 'bg-success';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'critical':
        return 'text-destructive';
      case 'low':
        return 'text-warning';
      case 'excess':
        return 'text-accent';
      case 'good':
      default:
        return 'text-success';
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {/* Pill Gauge Container */}
      <div className="relative w-8 h-20 bg-muted rounded-full overflow-hidden">
        {/* Fill from bottom */}
        <div 
          className={cn(
            'absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500 ease-out',
            getStatusColor()
          )}
          style={{ height: `${Math.max(percentage, 5)}%` }}
        />
        {/* Percentage text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-[10px] font-bold', getTextColor())}>
            {percentage}%
          </span>
        </div>
      </div>
      {/* Stock count below */}
      <span className="text-sm font-semibold text-foreground">{stock}</span>
    </div>
  );
}
