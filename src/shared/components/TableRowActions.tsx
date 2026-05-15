import React from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Edit, Trash2, Send, GitBranch, Download } from "lucide-react";
import { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

export interface TableAction {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "destructive";
  show?: boolean;
}

interface TableRowActionsProps {
  actions: TableAction[];
  className?: string;
}

export function TableRowActions({ actions, className }: TableRowActionsProps) {
  const visibleActions = actions.filter((a) => a.show !== false);
  if (visibleActions.length === 0) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn("flex items-center gap-0.5", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {visibleActions.map((action, index) => {
          const Icon = action.icon as any;
          const isDestructive = action.variant === "destructive";
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 transition-colors",
                    isDestructive
                      ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  onClick={(e) => { e.stopPropagation(); action.onClick(e); }}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">{action.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
