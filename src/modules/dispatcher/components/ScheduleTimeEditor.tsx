import { useTranslation } from "react-i18next";
import { format, parse } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { CalendarIcon, ChevronUp, ChevronDown, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Shared schedule editor used by every dispatcher modal so that the
 * "first drag/assign" flow has the same editable date + start/end pickers
 * as the "edit existing dispatch" flow.
 *
 * Times are kept as "yyyy-MM-dd" / "HH:mm" strings; the parent owns the state
 * and converts to Date on confirm via the helpers exported below.
 */

export interface ScheduleTimeEditorProps {
  date: string;            // yyyy-MM-dd
  startTime: string;       // HH:mm
  endTime?: string;        // HH:mm — omit when showEnd=false
  onDateChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange?: (v: string) => void;
  showEnd?: boolean;       // default true; batch (whole SO) sets false
  disabled?: boolean;
  /** minute step for arrow keys */
  step?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function bumpTime(value: string, deltaMin: number) {
  const [h, m] = (value || "00:00").split(":").map(Number);
  const total = (h * 60 + m + deltaMin + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function buildDateFromStrings(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  return new Date(y, (mo || 1) - 1, d || 1, h || 0, mi || 0, 0, 0);
}

export function ScheduleTimeEditor({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  showEnd = true,
  disabled = false,
  step = 15,
}: ScheduleTimeEditorProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "fr" ? fr : enUS;

  const renderTimeStepper = (
    label: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <div>
      <Label className="text-px-10 text-muted-foreground mb-1 block">{label}</Label>
      <div className="flex items-center gap-1">
        <div className="flex flex-col">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="h-5 w-5 rounded-sm"
            onClick={() => onChange(bumpTime(value, step))}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="h-5 w-5 rounded-sm"
            onClick={() => onChange(bumpTime(value, -step))}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1 bg-background border rounded-md px-3 py-1.5 text-center font-mono text-sm font-medium">
          {value || "00:00"}
        </div>
      </div>
    </div>
  );

  const durationLabel = (() => {
    if (!showEnd || !endTime) return null;
    const [sh, sm] = (startTime || "0:0").split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return null;
    const dH = Math.floor(diff / 60);
    const dM = diff % 60;
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-primary/5 rounded px-2 py-1">
        <Timer className="h-3 w-3 text-primary" />
        <span>
          {t("dispatcher.duration")}:{" "}
          <strong className="text-foreground">
            {dH}h {dM > 0 ? `${dM}m` : ""}
          </strong>
        </span>
      </div>
    );
  })();

  return (
    <div className="bg-muted/40 rounded-lg p-3 space-y-3">
      {/* Date picker */}
      <div>
        <Label className="text-px-10 text-muted-foreground mb-1 block">
          {t("dispatcher.editing_date")}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal h-8 text-xs",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {date
                ? format(parse(date, "yyyy-MM-dd", new Date()), "PPP", { locale: dateLocale })
                : t("dispatcher.pick_date", "Pick a date")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarWidget
              mode="single"
              selected={date ? parse(date, "yyyy-MM-dd", new Date()) : undefined}
              onSelect={(d) => d && onDateChange(format(d, "yyyy-MM-dd"))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              locale={dateLocale}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className={cn("grid gap-3", showEnd ? "grid-cols-2" : "grid-cols-1")}>
        {renderTimeStepper(t("dispatcher.editing_time_start"), startTime, onStartTimeChange)}
        {showEnd && endTime !== undefined && onEndTimeChange &&
          renderTimeStepper(t("dispatcher.editing_time_end"), endTime, onEndTimeChange)}
      </div>

      {durationLabel}
    </div>
  );
}
