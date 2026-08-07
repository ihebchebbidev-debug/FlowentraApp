import * as React from "react";
import { DayPicker } from "react-day-picker";
import { addMonths, startOfYear } from "date-fns";

interface YearGridProps {
  date: Date;
  onMonthClick?: (monthIndex: number) => void;
}

export function YearGrid({ date, onMonthClick }: YearGridProps) {
  const yearStart = startOfYear(date);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {Array.from({ length: 12 }).map((_, idx) => {
        const monthDate = addMonths(yearStart, idx);
        return (
          <div key={idx} className="rounded-xl border border-border bg-card">
            <div className="p-3">
              <DayPicker
                mode="single"
                month={monthDate}
                numberOfMonths={1}
                captionLayout="buttons"
                showOutsideDays
                onMonthChange={() => {}}
                onDayClick={() => onMonthClick?.(idx)}
                className="pointer-events-auto"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
