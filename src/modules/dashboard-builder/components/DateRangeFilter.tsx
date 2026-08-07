import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDashboardFilter, type DatePreset, type RefreshInterval } from '../context/DashboardFilterContext';

const PRESETS: { value: DatePreset; labelKey: string }[] = [
  { value: 'all', labelKey: 'dashboardBuilder.dateFilter.all' },
  { value: '7d', labelKey: 'dashboardBuilder.dateFilter.7d' },
  { value: '30d', labelKey: 'dashboardBuilder.dateFilter.30d' },
  { value: '90d', labelKey: 'dashboardBuilder.dateFilter.90d' },
  { value: '6m', labelKey: 'dashboardBuilder.dateFilter.6m' },
  { value: '1y', labelKey: 'dashboardBuilder.dateFilter.1y' },
  { value: 'custom', labelKey: 'dashboardBuilder.dateFilter.custom' },
];

const REFRESH_OPTIONS: { value: RefreshInterval; labelKey: string }[] = [
  { value: 'off', labelKey: 'dashboardBuilder.autoRefresh.off' },
  { value: '30s', labelKey: 'dashboardBuilder.autoRefresh.30s' },
  { value: '1m', labelKey: 'dashboardBuilder.autoRefresh.1m' },
  { value: '5m', labelKey: 'dashboardBuilder.autoRefresh.5m' },
  { value: '10m', labelKey: 'dashboardBuilder.autoRefresh.10m' },
  { value: '30m', labelKey: 'dashboardBuilder.autoRefresh.30m' },
];

interface Props {
  onManualRefresh?: () => void;
}

export function DateRangeFilter({ onManualRefresh }: Props) {
  const { t } = useTranslation('dashboard');
  const { preset, dateRange, setPreset, setDateRange, refreshInterval, setRefreshInterval, lastRefreshed } = useDashboardFilter();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      setCalendarOpen(true);
      setPreset('custom');
    } else {
      setPreset(value as DatePreset);
    }
  };

  const handleClear = () => {
    setPreset('all');
  };

  const formatRange = () => {
    if (preset === 'all') return null;
    if (preset !== 'custom') return null;
    if (!dateRange.from) return null;
    const from = format(dateRange.from, 'MMM d');
    const to = dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : '...';
    return `${from} – ${to}`;
  };

  const customLabel = formatRange();

  return (
    <div className="flex items-center gap-1.5">
      {/* Date preset */}
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs gap-1.5 border-border/50 bg-background">
          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map(p => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {t(p.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom date range popover */}
      {preset === 'custom' && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 text-xs gap-1.5 border-border/50",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-3 w-3" />
              {customLabel || t('dashboardBuilder.dateFilter.pickRange')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                setDateRange({ from: range?.from, to: range?.to });
                if (range?.from && range?.to) {
                  setCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Clear button */}
      {preset !== 'all' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title={t('dashboardBuilder.dateFilter.clear')}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Auto-refresh selector */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Select value={refreshInterval} onValueChange={(v) => setRefreshInterval(v as RefreshInterval)}>
                <SelectTrigger className={cn(
                  "h-7 w-auto min-w-[90px] text-xs gap-1.5 border-border/50 bg-background",
                  refreshInterval !== 'off' && "text-primary border-primary/30"
                )}>
                  <RefreshCw className={cn("h-3 w-3", refreshInterval !== 'off' && "animate-spin text-primary")} style={refreshInterval !== 'off' ? { animationDuration: '3s' } : undefined} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFRESH_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {t(o.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {lastRefreshed
              ? t('dashboardBuilder.autoRefresh.lastUpdated', { time: format(lastRefreshed, 'HH:mm:ss') })
              : t('dashboardBuilder.autoRefresh.tooltip')
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Manual refresh button */}
      {onManualRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onManualRefresh}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title={t('dashboardBuilder.autoRefresh.refreshNow')}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
