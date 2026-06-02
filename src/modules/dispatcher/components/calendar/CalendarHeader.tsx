import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { isWeekend } from "date-fns";
import { Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PlanningProfilesModal } from "../planning-profiles/PlanningProfilesModal";
import type { ZoomDimensions } from "./types";

interface CalendarHeaderProps {
  dates: Date[];
  workingHours: number[];
  dimensions: ZoomDimensions;
  includeWeekends?: boolean;
}

export function CalendarHeader({ dates, workingHours, dimensions, includeWeekends = true }: CalendarHeaderProps) {
  const { t, i18n } = useTranslation();
  const [profilesOpen, setProfilesOpen] = useState(false);
  const { dateWidth, hourWidth, widthMode, showHourLabels, hourTextSize } = dimensions;

  // Get date-fns locale based on current language
  const dateLocale = i18n.language === 'fr' ? fr : enUS;

  return (
    <div className="flex border-b bg-gradient-to-r from-card to-card/50 sticky top-0 z-20 shadow-sm flex-shrink-0">
      {/* Technicians column header - FIXED WIDTH */}
      <div className="w-52 border-r bg-card/95 backdrop-blur-md flex-shrink-0">
        <div className="h-20 flex items-center justify-center px-2 py-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProfilesOpen(true)}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" />
            {t('dispatcher.profiles.manage_profiles', { defaultValue: 'Edit planning' })}
          </Button>
        </div>
      </div>
      
  {/* Date headers fixed (no horizontal scroll) */}
  <div className="flex-1 overflow-x-hidden">
        <div className={`flex ${widthMode === 'auto' ? 'w-full' : ''}`} style={widthMode === 'scroll' ? { width: `${dates.length * dateWidth}px` } : {}}>
          {dates.map((date) => {
            const weekend = isWeekend(date);
            const weekendDisabled = weekend && !includeWeekends;
            return (
            <div
              key={format(date, 'yyyy-MM-dd')}
              className={`border-r last:border-r-0 ${widthMode === 'auto' ? 'flex-1 min-w-0' : 'flex-shrink-0'} ${weekendDisabled ? 'bg-destructive/10 dark:bg-destructive/15 relative' : ''}`}
              style={widthMode === 'scroll' ? { width: `${dateWidth}px` } : undefined}
            >
              {weekendDisabled && (
                <div className="absolute inset-0 pointer-events-none opacity-60 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,0,0,0.10)_8px,rgba(255,0,0,0.10)_16px)]" />
              )}
              <div className="h-12 border-b bg-gradient-to-b from-primary/5 to-transparent flex items-center justify-center">
                <div className="text-center">
                  <div className="font-semibold text-xs text-foreground">{format(date, 'EEE', { locale: dateLocale })}</div>
                  <div className="text-xs text-muted-foreground font-medium">{format(date, 'MMM d', { locale: dateLocale })}</div>
                </div>
              </div>
              <div className="h-8 flex bg-muted/20">
                {workingHours.map(hour => {
                  // Only label sparse milestone hours to save space (e.g. 8, 12, 17, 20)
                  const milestoneHours = [8, 12, 17, 20];
                  const isMilestone = milestoneHours.includes(hour);
                  return (
                    <div
                      key={hour}
                      className="flex-1 min-w-0 border-r last:border-r-0 flex items-center justify-center font-medium text-muted-foreground hover:bg-primary/5 transition-colors"
                      style={{ fontSize: hourTextSize }}
                    >
                      {showHourLabels && isMilestone
                        ? (dimensions.dateWidth >= 400
                            ? format(new Date(2024, 0, 1, hour), 'HH:mm')
                            : format(new Date(2024, 0, 1, hour), 'HH'))
                        : ''}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </div>
      <PlanningProfilesModal open={profilesOpen} onOpenChange={setProfilesOpen} />
    </div>
  );
}