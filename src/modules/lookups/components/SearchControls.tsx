import { ReactNode } from "react";

export function SearchControls({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="p-3 sm:p-4 border-b border-border bg-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
        <div className="flex gap-2 sm:gap-3 flex-1 w-full">
          {left}
        </div>
        {right && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {right}
          </div>
        )}
      </div>
    </div>
  );
}
