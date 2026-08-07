import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
  Package,
  ShoppingCart,
  Lightbulb,
  BarChart3,
} from 'lucide-react';
import type { DemandForecastResponse, ArticleForecast } from '../hooks/useDemandForecast';

interface DemandForecastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forecastData: DemandForecastResponse | null;
  isLoading: boolean;
  onGenerate: () => void;
}

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    case 'high':
      return 'bg-warning text-warning-foreground';
    case 'medium':
      return 'bg-primary text-primary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing':
      return <TrendingUp className="h-4 w-4 text-success" />;
    case 'decreasing':
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

function ForecastSummaryCard({ summary }: { summary: DemandForecastResponse['summary'] }) {
  const { t } = useTranslation('stock-management');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-destructive" />
          <p className="text-2xl font-bold text-destructive">{summary.criticalItems}</p>
          <p className="text-xs text-muted-foreground">{t('forecast.critical_items')}</p>
        </CardContent>
      </Card>

      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-4 text-center">
          <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-primary">{summary.totalPredictedDemand}</p>
          <p className="text-xs text-muted-foreground">{t('forecast.predicted_demand')}</p>
        </CardContent>
      </Card>

      <Card className="bg-success/10 border-success/20">
        <CardContent className="p-4 text-center">
          <Package className="h-6 w-6 mx-auto mb-2 text-success" />
          <p className="text-sm font-semibold text-success truncate">{summary.highestDemandItem}</p>
          <p className="text-xs text-muted-foreground">{t('forecast.highest_demand')}</p>
        </CardContent>
      </Card>

      <Card className="bg-muted border-muted-foreground/20">
        <CardContent className="p-4 text-center">
          <BarChart3 className="h-6 w-6 mx-auto mb-2 text-foreground" />
          <p className="text-xs font-medium text-foreground line-clamp-2">{summary.overallTrend}</p>
          <p className="text-xs text-muted-foreground">{t('forecast.trend')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ForecastItem({ forecast }: { forecast: ArticleForecast }) {
  const { t } = useTranslation('stock-management');
  const confidencePercent = Math.round(forecast.predictions.confidence * 100);

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold truncate">
              {forecast.articleName}
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono">
              {forecast.articleNumber}
            </p>
          </div>
          <Badge className={getUrgencyColor(forecast.recommendations.urgency)}>
            {t(`forecast.urgency.${forecast.recommendations.urgency}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stock Status */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-muted-foreground text-xs">{t('forecast.current_stock')}</p>
            <p className="font-semibold">{forecast.currentStock}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('forecast.min_stock')}</p>
            <p className="font-semibold">{forecast.minStock}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('forecast.predicted')}</p>
            <p className="font-semibold text-primary">{forecast.predictions.predictedDemand}</p>
          </div>
        </div>

        {/* Trend & Confidence */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getTrendIcon(forecast.predictions.trend)}
            <span className="text-sm capitalize">
              {t(`forecast.trends.${forecast.predictions.trend}`)}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{t('forecast.confidence')}</span>
              <span className="font-medium">{confidencePercent}%</span>
            </div>
            <Progress value={confidencePercent} className="h-1.5" />
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="font-medium">{t('forecast.suggested_order')}:</span>
            <span className="text-primary font-bold">
              {forecast.recommendations.suggestedOrderQuantity} {t('forecast.units')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="font-medium">{t('forecast.reorder_point')}:</span>
            <span>{forecast.recommendations.reorderPoint}</span>
          </div>
          <p className="text-xs text-muted-foreground italic">
            {forecast.recommendations.reasoning}
          </p>
        </div>

        {/* Insights */}
        {forecast.insights && forecast.insights.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-warning" />
              {t('forecast.insights')}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {forecast.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-primary">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DemandForecastDialog({
  open,
  onOpenChange,
  forecastData,
  isLoading,
  onGenerate,
}: DemandForecastDialogProps) {
  const { t } = useTranslation('stock-management');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('forecast.title')}
          </DialogTitle>
          <DialogDescription>
            {t('forecast.description')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('forecast.analyzing')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('forecast.analyzing_hint')}
            </p>
          </div>
        ) : !forecastData ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('forecast.ready_title')}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {t('forecast.ready_description')}
            </p>
            <Button onClick={onGenerate} size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t('forecast.generate_button')}
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            {forecastData.summary && (
              <ForecastSummaryCard summary={forecastData.summary} />
            )}

            <h4 className="text-sm font-semibold mb-3">{t('forecast.detailed_forecasts')}</h4>

            {forecastData.forecasts.map((forecast) => (
              <ForecastItem key={forecast.articleId} forecast={forecast} />
            ))}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
