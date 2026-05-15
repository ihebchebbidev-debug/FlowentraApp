import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { StockStatus } from '../types';

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const { t } = useTranslation('stock-management');

  const getStatusStyles = () => {
    switch (status) {
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'low':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'excess':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'good':
      default:
        return 'bg-success/10 text-success border-success/20';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        getStatusStyles(),
        className
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
