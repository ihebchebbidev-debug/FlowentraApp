import * as React from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeOnlyPickerProps {
  value?: Date | string;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** The selected date for this time entry - controlled externally */
  selectedDate?: Date;
  /** Callback when date changes via navigation */
  onDateChange?: (date: Date) => void;
  /** Show date navigation (default: true) */
  showDateNavigation?: boolean;
  /** Translation for "Now" button */
  nowLabel?: string;
}

export function TimeOnlyPicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
  selectedDate,
  onDateChange,
  showDateNavigation = true,
  nowLabel = "Now",
}: TimeOnlyPickerProps) {
  // Use selectedDate prop or default to today
  const currentDate = selectedDate || new Date();
  
  // Parse value to Date
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  // Extract hours and minutes
  const hours = dateValue ? dateValue.getHours() : undefined;
  const minutes = dateValue ? dateValue.getMinutes() : undefined;

  const handleHourChange = (hourStr: string) => {
    const hour = parseInt(hourStr, 10);
    const newDate = new Date(currentDate);
    newDate.setHours(hour, minutes ?? 0, 0, 0);
    onChange(newDate);
  };

  const handleMinuteChange = (minuteStr: string) => {
    const minute = parseInt(minuteStr, 10);
    const newDate = new Date(currentDate);
    newDate.setHours(hours ?? 9, minute, 0, 0);
    onChange(newDate);
  };

  const setToNow = () => {
    const now = new Date();
    // Keep the selected date but use current time
    const newDate = new Date(currentDate);
    newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    onChange(newDate);
  };

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minute options
  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      
      <Select 
        value={hours !== undefined ? String(hours) : ""} 
        onValueChange={handleHourChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[75px]">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {hourOptions.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {String(h).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <span className="text-lg font-medium">:</span>
      
      <Select 
        value={minutes !== undefined ? String(minutes) : ""} 
        onValueChange={handleMinuteChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[75px]">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {String(m).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={setToNow}
        disabled={disabled}
        className="ml-1 text-xs text-primary"
      >
        {nowLabel}
      </Button>
    </div>
  );
}

interface DateNavigationWithTimeProps {
  startTime?: Date;
  endTime?: Date;
  onStartTimeChange: (date: Date | undefined) => void;
  onEndTimeChange: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  /** Translations */
  labels?: {
    today?: string;
    goToToday?: string;
    startTime?: string;
    endTime?: string;
    now?: string;
  };
}

export function DateNavigationWithTime({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
  className,
  labels = {},
}: DateNavigationWithTimeProps) {
  const {
    today: todayLabel = "Today",
    goToToday: goToTodayLabel = "Go to today",
    startTime: startTimeLabel = "Start Time",
    endTime: endTimeLabel = "End Time",
    now: nowLabel = "Now",
  } = labels;
  // Default to today
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
    if (startTime) return new Date(startTime);
    return new Date();
  });

  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    // Update times to new date while preserving the time portion
    if (startTime) {
      const newStart = new Date(newDate);
      newStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      onStartTimeChange(newStart);
    }
    if (endTime) {
      const newEnd = new Date(newDate);
      newEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      onEndTimeChange(newEnd);
    }
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    // Update times to new date while preserving the time portion
    if (startTime) {
      const newStart = new Date(newDate);
      newStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      onStartTimeChange(newStart);
    }
    if (endTime) {
      const newEnd = new Date(newDate);
      newEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      onEndTimeChange(newEnd);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    // Update times to today while preserving the time portion
    if (startTime) {
      const newStart = new Date(today);
      newStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      onStartTimeChange(newStart);
    }
    if (endTime) {
      const newEnd = new Date(today);
      newEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      onEndTimeChange(newEnd);
    }
  };

  // Sync selectedDate when startTime changes externally
  React.useEffect(() => {
    if (startTime) {
      const startDate = new Date(startTime);
      startDate.setHours(0, 0, 0, 0);
      const currentSelected = new Date(selectedDate);
      currentSelected.setHours(0, 0, 0, 0);
      if (startDate.getTime() !== currentSelected.getTime()) {
        setSelectedDate(new Date(startTime));
      }
    }
  }, [startTime]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handlePrevDay}
          disabled={disabled}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {isToday(selectedDate) ? todayLabel : format(selectedDate, "EEE, dd MMM yyyy")}
          </span>
          {!isToday(selectedDate) && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleToday}
              disabled={disabled}
              className="text-xs text-primary p-0 h-auto"
            >
              ({goToTodayLabel})
            </Button>
          )}
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleNextDay}
          disabled={disabled}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Time Pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">{startTimeLabel}</label>
          <TimeOnlyPicker
            value={startTime}
            onChange={onStartTimeChange}
            selectedDate={selectedDate}
            disabled={disabled}
            placeholder="Start"
            nowLabel={nowLabel}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">{endTimeLabel}</label>
          <TimeOnlyPicker
            value={endTime}
            onChange={onEndTimeChange}
            selectedDate={selectedDate}
            disabled={disabled}
            placeholder="End"
            nowLabel={nowLabel}
          />
        </div>
      </div>
    </div>
  );
}
