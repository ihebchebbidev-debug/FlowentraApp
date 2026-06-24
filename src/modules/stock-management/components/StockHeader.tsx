import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Boxes, Sparkles, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StockHeaderProps {
  onOpenForecast?: () => void;
  onOpenAnomalyDetection?: () => void;
}

export function StockHeader({ onOpenForecast, onOpenAnomalyDetection }: StockHeaderProps) {
  const { t } = useTranslation('stock-management');
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/inventory-services')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Boxes className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{t('title')}</h1>
          <p className="text-xs text-muted-foreground truncate">{t('subtitle')}</p>
        </div>
      </div>

    </div>
  );
}
