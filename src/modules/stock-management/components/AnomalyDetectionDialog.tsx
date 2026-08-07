import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
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
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap,
  Package,
  RefreshCw,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import type { AnomalyDetectionResponse, StockAnomaly, AnomalySeverity, AnomalyType } from '../hooks/useAnomalyDetection';

interface AnomalyDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anomalyData: AnomalyDetectionResponse | null;
  isLoading: boolean;
  onDetect: () => void;
}

const getSeverityConfig = (severity: AnomalySeverity) => {
  switch (severity) {
    case 'critical':
      return {
        icon: ShieldAlert,
        color: 'bg-destructive text-destructive-foreground',
        borderColor: 'border-destructive/30',
        bgColor: 'bg-destructive/10',
      };
    case 'high':
      return {
        icon: AlertTriangle,
        color: 'bg-warning text-warning-foreground',
        borderColor: 'border-warning/30',
        bgColor: 'bg-warning/10',
      };
    case 'medium':
      return {
        icon: AlertCircle,
        color: 'bg-primary text-primary-foreground',
        borderColor: 'border-primary/30',
        bgColor: 'bg-primary/10',
      };
    default:
      return {
        icon: Info,
        color: 'bg-muted text-muted-foreground',
        borderColor: 'border-muted-foreground/30',
        bgColor: 'bg-muted/50',
      };
  }
};

const getAnomalyTypeIcon = (type: AnomalyType) => {
  switch (type) {
    case 'volume':
      return TrendingUp;
    case 'frequency':
      return Zap;
    case 'pattern':
      return Clock;
    case 'suspicious_removal':
      return ArrowDownRight;
    case 'discrepancy':
      return RefreshCw;
    case 'rapid_depletion':
      return ArrowDownRight;
    case 'unusual_return':
      return Package;
    default:
      return AlertCircle;
  }
};

function AnomalySummaryCard({ summary }: { summary: AnomalyDetectionResponse['summary'] }) {
  const { t } = useTranslation('stock-management');

  const getRiskColor = () => {
    switch (summary.overallRiskLevel) {
      case 'critical':
        return 'text-destructive';
      case 'high':
        return 'text-warning';
      case 'medium':
        return 'text-primary';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-success';
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Risk Level Banner */}
      <div className={`p-4 rounded-lg border ${
        summary.overallRiskLevel === 'critical' ? 'bg-destructive/10 border-destructive/30' :
        summary.overallRiskLevel === 'high' ? 'bg-warning/10 border-warning/30' :
        summary.overallRiskLevel === 'none' ? 'bg-success/10 border-success/30' :
        'bg-muted border-border'
      }`}>
        <div className="flex items-center gap-3">
          {summary.overallRiskLevel === 'none' ? (
            <ShieldCheck className="h-6 w-6 text-success" />
          ) : (
            <ShieldAlert className={`h-6 w-6 ${getRiskColor()}`} />
          )}
          <div className="flex-1">
            <p className={`font-semibold ${getRiskColor()}`}>
              {t(`anomaly.risk_level.${summary.overallRiskLevel}`)}
            </p>
            <p className="text-sm text-muted-foreground">{summary.summaryText}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{summary.criticalCount}</p>
            <p className="text-xs text-muted-foreground">{t('anomaly.critical')}</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/10 border-warning/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-warning">{summary.highCount}</p>
            <p className="text-xs text-muted-foreground">{t('anomaly.high')}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{summary.mediumCount}</p>
            <p className="text-xs text-muted-foreground">{t('anomaly.medium')}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted border-muted-foreground/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{summary.lowCount}</p>
            <p className="text-xs text-muted-foreground">{t('anomaly.low')}</p>
          </CardContent>
        </Card>
      </div>

      {summary.mostAffectedArticle && (
        <p className="text-sm text-center text-muted-foreground">
          {t('anomaly.most_affected')}: <span className="font-medium text-foreground">{summary.mostAffectedArticle}</span>
        </p>
      )}
    </div>
  );
}

function AnomalyItem({ anomaly }: { anomaly: StockAnomaly }) {
  const { t } = useTranslation('stock-management');
  const config = getSeverityConfig(anomaly.severity);
  const TypeIcon = getAnomalyTypeIcon(anomaly.type);
  const SeverityIcon = config.icon;

  return (
    <Card className={`mb-3 ${config.borderColor} ${config.bgColor} border`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <SeverityIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold text-sm">{anomaly.title}</h4>
              <Badge variant="outline" className="text-xs">
                <TypeIcon className="h-3 w-3 mr-1" />
                {t(`anomaly.types.${anomaly.type}`)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {anomaly.articleName} • {anomaly.articleNumber}
            </p>
          </div>
          <Badge className={config.color}>
            {t(`anomaly.severity.${anomaly.severity}`)}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground mb-3">{anomaly.description}</p>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
          <div className="bg-background/50 rounded p-2">
            <p className="text-muted-foreground">{t('anomaly.detected_value')}</p>
            <p className="font-medium">{anomaly.detectedValue}</p>
          </div>
          <div className="bg-background/50 rounded p-2">
            <p className="text-muted-foreground">{t('anomaly.expected_range')}</p>
            <p className="font-medium">{anomaly.expectedRange}</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-background/50 rounded p-3 border-l-2 border-primary">
          <p className="text-xs font-medium text-primary mb-1">{t('anomaly.recommended_action')}</p>
          <p className="text-sm">{anomaly.recommendedAction}</p>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {t('anomaly.detected_at')}: {format(new Date(anomaly.detectedAt), 'dd/MM/yyyy HH:mm')}
        </p>
      </CardContent>
    </Card>
  );
}

export function AnomalyDetectionDialog({
  open,
  onOpenChange,
  anomalyData,
  isLoading,
  onDetect,
}: AnomalyDetectionDialogProps) {
  const { t } = useTranslation('stock-management');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            {t('anomaly.title')}
          </DialogTitle>
          <DialogDescription>
            {t('anomaly.description')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-warning mb-4" />
            <p className="text-muted-foreground">{t('anomaly.analyzing')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('anomaly.analyzing_hint')}
            </p>
          </div>
        ) : !anomalyData ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-warning/10 mb-4">
              <ShieldAlert className="h-10 w-10 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('anomaly.ready_title')}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {t('anomaly.ready_description')}
            </p>
            <Button onClick={onDetect} size="lg" variant="outline" className="gap-2 border-warning text-warning hover:bg-warning/10">
              <ShieldAlert className="h-4 w-4" />
              {t('anomaly.scan_button')}
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <AnomalySummaryCard summary={anomalyData.summary} />

            {anomalyData.anomalies.length > 0 ? (
              <>
                <h4 className="text-sm font-semibold mb-3">{t('anomaly.detected_anomalies')}</h4>
                {anomalyData.anomalies
                  .sort((a, b) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 };
                    return order[a.severity] - order[b.severity];
                  })
                  .map((anomaly) => (
                    <AnomalyItem key={anomaly.id} anomaly={anomaly} />
                  ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mb-4" />
                <h4 className="font-semibold text-success">{t('anomaly.all_clear_title')}</h4>
                <p className="text-sm text-muted-foreground">{t('anomaly.all_clear_description')}</p>
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
