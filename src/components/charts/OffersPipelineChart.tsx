import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileEdit, Send, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

interface PipelineStage {
  key: string;
  label: string;
  count: number;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

interface OffersPipelineChartProps {
  data: {
    draft: number;
    sent: number;
    negotiation: number;
    accepted: number;
    rejected: number;
  };
}

export function OffersPipelineChart({ data }: OffersPipelineChartProps) {
  const { t } = useTranslation('dashboard');
  
  const total = data.draft + data.sent + data.negotiation + data.accepted + data.rejected;
  
  const stages: PipelineStage[] = [
    { 
      key: 'draft', 
      label: t('overview.draft'), 
      count: data.draft, 
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      icon: FileEdit 
    },
    { 
      key: 'sent', 
      label: t('overview.sent'), 
      count: data.sent, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      icon: Send 
    },
    { 
      key: 'negotiation', 
      label: t('overview.negotiation'), 
      count: data.negotiation, 
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      icon: MessageSquare 
    },
    { 
      key: 'accepted', 
      label: t('overview.accepted'), 
      count: data.accepted, 
      color: 'text-success',
      bgColor: 'bg-success/10',
      icon: CheckCircle 
    },
    { 
      key: 'rejected', 
      label: t('overview.rejected'), 
      count: data.rejected, 
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      icon: XCircle
    },
  ];

  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const activeStages = stages.filter(s => s.key !== 'rejected');
  const rejectedStage = stages.find(s => s.key === 'rejected');

  return (
    <div className="h-full flex flex-col">
      {/* Pipeline Flow */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        {activeStages.map((stage, index) => {
          const Icon = stage.icon;
          const percentage = getPercentage(stage.count);
          const widthPercentage = total === 0 ? 100 : Math.max(20, percentage * 1.5 + 40);
          
          return (
            <div 
              key={stage.key}
              className="relative group"
            >
              <div 
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 hover:scale-[1.02] ${stage.bgColor}`}
                style={{ 
                  width: `${widthPercentage}%`,
                  marginLeft: index === 0 ? '0' : `${index * 2}%`
                }}
              >
                <div className={`p-1.5 rounded-md bg-background/60 ${stage.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium ${stage.color}`}>
                      {stage.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${stage.color}`}>
                        {stage.count}
                      </span>
                      {percentage > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({percentage}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Connector Arrow */}
                {index < activeStages.length - 1 && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-inherit rotate-45 rounded-sm z-10" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejected Section - Separate */}
      {rejectedStage && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${rejectedStage.bgColor}`}
          >
            <div className={`p-1.5 rounded-md bg-background/60 ${rejectedStage.color}`}>
              <XCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className={`text-sm font-medium ${rejectedStage.color}`}>
                {rejectedStage.label}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${rejectedStage.color}`}>
                  {rejectedStage.count}
                </span>
                {getPercentage(rejectedStage.count) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({getPercentage(rejectedStage.count)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('overview.totalOffers', 'Total Offers')}: <span className="font-semibold text-foreground">{total}</span></span>
        <span>
          {t('overview.conversionRate', 'Conversion Rate')}: 
          <span className="font-semibold text-success ml-1">
            {total > 0 ? Math.round((data.accepted / total) * 100) : 0}%
          </span>
        </span>
      </div>
    </div>
  );
}
