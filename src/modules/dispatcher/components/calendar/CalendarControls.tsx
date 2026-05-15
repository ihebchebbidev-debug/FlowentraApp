import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Settings2, ChevronLeft, ChevronRight, Filter, CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { ZoomLevel } from "./types";
import { dispatchStatusConfig, getStatusDotColor } from "@/config/entity-statuses";
import type { DateRange } from "react-day-picker";

type StatusFilter = 'all' | string;

interface CalendarControlsProps {
  zoomLevel: ZoomLevel;
  setZoomLevel: (level: ZoomLevel) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onNavigateDays: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  statusFilter?: StatusFilter;
  onStatusFilterChange?: (filter: StatusFilter) => void;
}

export function CalendarControls({
  zoomLevel,
  setZoomLevel,
  showSettings,
  setShowSettings,
  dateRange,
  onDateRangeChange,
  onNavigateDays,
  onGoToToday,
  statusFilter = 'all',
  onStatusFilterChange
}: CalendarControlsProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;

  // Derive status filter options from centralized dispatch config (workflow steps only)
  const STATUS_OPTIONS: { value: StatusFilter; label: string; color: string }[] = [
    { value: 'all', label: t('dispatcher.all_statuses'), color: 'bg-muted-foreground' },
    ...dispatchStatusConfig.workflow.steps.map(stepId => ({
      value: stepId as StatusFilter,
      label: t(`dispatcher.status_${stepId}`, { defaultValue: stepId }),
      color: getStatusDotColor('dispatch', stepId),
    })),
  ];

  const activeStatusOption = STATUS_OPTIONS.find(opt => opt.value === statusFilter) || STATUS_OPTIONS[0];

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
    } else if (range?.from) {
      onDateRangeChange({ from: range.from, to: range.from });
    }
  };

  const setDayCount = (count: number) => {
    onDateRangeChange({ from: dateRange.from, to: new Date(dateRange.from.getTime() + (count - 1) * 24 * 60 * 60 * 1000) });
  };

  const currentDayCount = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateDays('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onGoToToday}
          >
            {t('dispatcher.today')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateDays('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal gap-2 min-w-[200px]",
              )}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-[12px]">
                {format(dateRange.from, 'dd MMM', { locale: dateLocale })} — {format(dateRange.to, 'dd MMM yyyy', { locale: dateLocale })}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                defaultMonth={dateRange.from}
              />
              <div className="px-3 pb-2 text-xs text-muted-foreground text-center">
                {t('dispatcher.overview_calendar_hint')}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Day Count Presets */}
        <div className="flex items-center gap-1">
          {[1, 3, 5, 7, 14, 30].map((count) => (
            <Button
              key={count}
              variant={currentDayCount === count ? "default" : "outline"}
              size="sm"
              onClick={() => setDayCount(count)}
              className="text-xs px-2"
            >
              {count}{t('dispatcher.day_short')}
            </Button>
          ))}
        </div>
        {currentDayCount > 7 && (
          <Badge variant="secondary" className="text-xs">
            {t('dispatcher.overview_mode')}
          </Badge>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const levels: ZoomLevel[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
              const currentIndex = levels.indexOf(zoomLevel);
              if (currentIndex < levels.length - 1) {
                setZoomLevel(levels[currentIndex + 1]);
              }
            }}
            disabled={zoomLevel === 'xxl'}
            title={t('dispatcher.zoom_in')}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const levels: ZoomLevel[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
              const currentIndex = levels.indexOf(zoomLevel);
              if (currentIndex > 0) {
                setZoomLevel(levels[currentIndex - 1]);
              }
            }}
            disabled={zoomLevel === 'xs'}
            title={t('dispatcher.zoom_out')}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Filter */}
        {onStatusFilterChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dispatcher.status')}:</span>
                <Badge 
                  variant="secondary" 
                  className={`${activeStatusOption.color} text-white text-xs px-1.5`}
                >
                  {activeStatusOption.label}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-popover">
              <DropdownMenuLabel>{t('dispatcher.filter_by_status')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilter === option.value}
                  onCheckedChange={() => onStatusFilterChange(option.value)}
                  className="gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${option.color}`} />
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          {t('dispatcher.settings')}
        </Button>
      </div>
    </div>
  );
}
