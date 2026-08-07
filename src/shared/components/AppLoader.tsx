import React from "react";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

export type AppLoaderProps = {
  message?: string;
  className?: string;
};

export const AppLoader: React.FC<AppLoaderProps> = ({ message, className }) => {
  return (
    <div className={cn("fixed inset-0 z-[60]", className)}>
      <DashboardSkeleton />
    </div>
  );
};

export default AppLoader;
