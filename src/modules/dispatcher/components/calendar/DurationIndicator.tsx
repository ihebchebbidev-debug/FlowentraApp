import React from "react";
import { useTranslation } from "react-i18next";
import { Clock, AlertTriangle, CheckCircle2, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DurationIndicatorProps {
  plannedDuration: number; // in minutes
  originalDuration?: number; // in minutes
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function DurationIndicator({ 
  plannedDuration, 
  originalDuration, 
  showLabel = false,
  size = 'sm',
  className 
}: DurationIndicatorProps) {
  const { t } = useTranslation();

  // If no original duration, don't show indicator
  if (!originalDuration || originalDuration <= 0) {
    return null;
  }

  const difference = plannedDuration - originalDuration;
  const percentageOver = ((plannedDuration - originalDuration) / originalDuration) * 100;

  // Determine status
  const getStatus = () => {
    if (plannedDuration <= originalDuration) {
      return 'within'; // Green - within or under expected
    } else if (percentageOver <= 25) {
      return 'slightly_over'; // Amber - 1-25% over
    } else {
      return 'over'; // Red - >25% over
    }
  };

  const status = getStatus();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}${t('dispatcher.hours_short')} ${mins}${t('dispatcher.minutes_short')}`;
    } else if (hours > 0) {
      return `${hours}${t('dispatcher.hours_short')}`;
    }
    return `${mins}${t('dispatcher.minutes_short')}`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'within':
        return {
          bgColor: 'bg-success/20',
          borderColor: 'border-success/50',
          textColor: 'text-success',
          icon: CheckCircle2,
          label: t('dispatcher.duration_within_expected'),
        };
      case 'slightly_over':
        return {
          bgColor: 'bg-warning/20',
          borderColor: 'border-warning/50',
          textColor: 'text-warning',
          icon: Timer,
          label: t('dispatcher.duration_slightly_over'),
        };
      case 'over':
        return {
          bgColor: 'bg-destructive/20',
          borderColor: 'border-destructive/50',
          textColor: 'text-destructive',
          icon: AlertTriangle,
          label: t('dispatcher.duration_exceeds_expected'),
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-2">
        <Clock className="h-3 w-3" />
        <span>{t('dispatcher.expected_duration')}: {formatDuration(originalDuration)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Timer className="h-3 w-3" />
        <span>{t('dispatcher.planned_duration')}: {formatDuration(plannedDuration)}</span>
      </div>
      {difference > 0 && (
        <div className={cn("font-medium", config.textColor)}>
          {t('dispatcher.exceeds_by')} {formatDuration(difference)} ({Math.round(percentageOver)}%)
        </div>
      )}
      <div className="text-muted-foreground text-[10px] pt-1 border-t border-border/50">
        {t('dispatcher.original_from_article')}
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border",
              config.bgColor,
              config.borderColor,
              config.textColor,
              size === 'sm' ? 'text-[9px]' : 'text-xs',
              className
            )}
          >
            <Icon className={iconSize} />
            {showLabel && (
              <span className="font-medium">
                {difference > 0 
                  ? `+${formatDuration(difference)}` 
                  : formatDuration(originalDuration)}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for use in job blocks during resize
export function DurationIndicatorCompact({ 
  plannedDuration, 
  originalDuration,
  className 
}: Omit<DurationIndicatorProps, 'showLabel' | 'size'>) {
  const { t } = useTranslation();

  if (!originalDuration || originalDuration <= 0) {
    return null;
  }

  const difference = plannedDuration - originalDuration;
  const percentageOver = ((plannedDuration - originalDuration) / originalDuration) * 100;

  const getColor = () => {
    if (plannedDuration <= originalDuration) {
      return 'bg-emerald-500';
    } else if (percentageOver <= 25) {
      return 'bg-amber-500';
    } else {
      return 'bg-red-500';
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={cn("w-2 h-2 rounded-full", getColor())} />
      {difference > 0 && (
        <span className="text-[9px] font-medium opacity-80">
          +{Math.round(difference)}{t('dispatcher.minutes_short')}
        </span>
      )}
    </div>
  );
}
