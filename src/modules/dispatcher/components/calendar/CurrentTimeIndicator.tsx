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
  
  // Calculate total left position (date columns before today + position within today)
  // For auto mode, we need percentage-based positioning
  const leftPosition = widthMode === 'scroll' 
    ? (todayIndex * dateWidth) + positionWithinDay
    : null;
  
  const leftPercentage = widthMode === 'auto'
    ? ((todayIndex + (hoursFromStart + minuteFraction) / workingHours.length) / dates.length) * 100
    : null;
  
  return (
    <div 
      className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
      style={widthMode === 'scroll' 
        ? { left: `${leftPosition}px` } 
        : { left: `${leftPercentage}%` }
      }
    >
      {/* Time label */}
      <div className="bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-b shadow-md whitespace-nowrap">
        {format(now, 'HH:mm')}
      </div>
      {/* Vertical line */}
      <div className="flex-1 w-0.5 bg-primary shadow-sm" />
      {/* Bottom dot */}
      <div className="w-2 h-2 bg-primary rounded-full shadow-md mb-1" />
    </div>
  );
}
