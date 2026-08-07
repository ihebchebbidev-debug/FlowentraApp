import { useState, useEffect } from "react";
import { isSameDay, format } from "date-fns";

interface CurrentTimeIndicatorProps {
  dates: Date[];
  workingHours: number[];
  dateWidth: number;
  hourWidth: number;
  widthMode: string;
}

export function CurrentTimeIndicator({ dates, workingHours, dateWidth, hourWidth, widthMode }: CurrentTimeIndicatorProps) {
  const [now, setNow] = useState(new Date());
  
  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Find if today is in the visible dates
  const todayIndex = dates.findIndex(date => isSameDay(date, now));
  
  if (todayIndex === -1) {
    return null;
  }
  
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Check if current time is within working hours range
  const firstHour = workingHours[0];
  const lastHour = workingHours[workingHours.length - 1];
  
  if (currentHour < firstHour || currentHour > lastHour) {
    return null;
  }
  
  // Calculate position within the day
  const hoursFromStart = currentHour - firstHour;
  const minuteFraction = currentMinutes / 60;
  const positionWithinDay = (hoursFromStart + minuteFraction) * hourWidth;

  // Day columns are fixed-width (dateWidth) in BOTH auto and scroll modes now, so
  // pixel positioning is always correct and matches the job-block geometry.
  const leftPosition = (todayIndex * dateWidth) + positionWithinDay;

  return (
    <div
      className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
      style={{ left: `${leftPosition}px` }}
    >
      {/* Time label */}
      <div className="bg-primary text-primary-foreground text-px-10 font-semibold px-1.5 py-0.5 rounded-b shadow-md whitespace-nowrap">
        {format(now, 'HH:mm')}
      </div>
      {/* Vertical line */}
      <div className="flex-1 w-0.5 bg-primary shadow-sm" />
      {/* Bottom dot */}
      <div className="w-2 h-2 bg-primary rounded-full shadow-md mb-1" />
    </div>
  );
}
