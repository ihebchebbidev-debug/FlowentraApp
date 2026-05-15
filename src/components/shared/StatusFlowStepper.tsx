import React from "react";
import { ChevronRight, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface StatusStepDef {
  id: string;
  label: string;
  isNegative?: boolean;
  isTerminal?: boolean;
  icon?: React.ReactNode;
}

export interface StatusFlowStepperProps {
  steps: string[];
  currentStatus: string;
  getStepDef: (id: string) => StatusStepDef;
  onAdvance?: (statusId: string) => void;
  onBack?: (statusId: string) => void;
  branches?: string[];
  isUpdating?: boolean;
  disabled?: boolean;
  updatingLabel?: string;
  layoutIdPrefix?: string;
  prevStepId?: string | null;
  nextStepId?: string | null;
}

export function StatusFlowStepper({
  steps,
  currentStatus,
  getStepDef,
  onAdvance,
  onBack,
  branches = [],
  isUpdating = false,
  disabled = false,
  updatingLabel = "Updating...",
  layoutIdPrefix,
  prevStepId: overridePrevStepId,
  nextStepId: overrideNextStepId,
}: StatusFlowStepperProps) {
  const currentIndex = steps.indexOf(currentStatus);
  const validCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  
  const currentDef = getStepDef(currentStatus);
  const isTerminal = currentDef?.isTerminal;

  // Find previous step if not at the beginning
  const computedPrevStepId = validCurrentIndex > 0 ? steps[validCurrentIndex - 1] : null;
  const computedNextStepId = validCurrentIndex < steps.length - 1 && !isTerminal ? steps[validCurrentIndex + 1] : null;

  const prevStepId = overridePrevStepId !== undefined ? overridePrevStepId : computedPrevStepId;
  const nextStepId = overrideNextStepId !== undefined ? overrideNextStepId : computedNextStepId;

  // Don't show next if there are branches (unless we want to show both?)
  // Actually, specs say: visible steps are previous + current + next OR branches
  const hasBranches = branches.length > 0 && !isTerminal;
  const showNext = !!nextStepId;

  const handleNext = () => {
    if (disabled || isUpdating || !onAdvance || !nextStepId) return;
    onAdvance(nextStepId);
  };

  const handleBranch = (branchId: string) => {
    if (disabled || isUpdating || !onAdvance) return;
    onAdvance(branchId);
  };

  const handlePrev = () => {
    if (disabled || isUpdating || !onBack || !prevStepId) return;
    onBack(prevStepId);
  };

  const StepBadge = ({
    stepId,
    type,
    onClick,
    isBranch = false
  }: {
    stepId: string;
    type: "prev" | "current" | "next" | "branch";
    onClick?: () => void;
    isBranch?: boolean;
  }) => {
    const def = getStepDef(stepId);
    if (!def) return null;

    const isCurrent = type === "current";
    const isPrev = type === "prev";
    const isNext = type === "next";

    // Content container based on type
    const badgeContent = (() => {
      // 1. Current Terminal
      if (isCurrent && def.isTerminal) {
        return (
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors shadow-sm",
              def.isNegative
                ? "bg-destructive/8 border-destructive/20 text-destructive"
                : "bg-success/8 border-success/20 text-success"
            )}
          >
            {def.isNegative ? (
              <X className="h-3 w-3 shrink-0" />
            ) : (
              <Check className="h-3 w-3 shrink-0" />
            )}
            <span className="text-xs font-semibold whitespace-nowrap">
              {def.label}
            </span>
          </div>
        );
      }

      // 2. Current Active
      if (isCurrent) {
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/8 border border-primary/20 shadow-sm transition-colors text-primary">
            {isUpdating ? (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
            <span className="text-xs font-semibold whitespace-nowrap">
              {def.label}
            </span>
          </div>
        );
      }

      // 3. Previous Step
      if (isPrev) {
        return (
          <button
            onClick={onClick}
            disabled={disabled || isUpdating || !onBack}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors text-muted-foreground/50",
              onBack && !disabled && !isUpdating ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"
            )}
          >
            <Check className="h-3 w-3 shrink-0 text-muted-foreground/35" />
            <span className="text-xs font-medium whitespace-nowrap hidden sm:inline truncate max-w-[80px]">
              {def.label}
            </span>
          </button>
        );
      }

      // 4. Branch
      if (isBranch) {
        return (
          <button
            onClick={onClick}
            disabled={disabled || isUpdating}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors disabled:opacity-50 text-xs font-medium whitespace-nowrap cursor-pointer",
              def.isNegative
                ? "text-destructive/70 border-destructive/15 hover:bg-destructive/8"
                : "text-success/70 border-success/15 hover:bg-success/8"
            )}
          >
            {def.icon ? (
               <span className="shrink-0 flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3">{def.icon}</span>
            ) : def.isNegative ? (
              <X className="h-3 w-3 shrink-0" />
            ) : (
              <Check className="h-3 w-3 shrink-0" />
            )}
            <span className="hidden sm:inline">{def.label}</span>
          </button>
        );
      }

      // 5. Next Step
      return (
        <button
          onClick={onClick}
          disabled={disabled || isUpdating || !onAdvance}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors text-muted-foreground/50",
            onAdvance && !disabled && !isUpdating ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"
          )}
        >
          <div className="w-2 h-2 rounded-full border border-muted-foreground/25 shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap hidden sm:inline truncate max-w-[80px]">
             {def.label}
          </span>
        </button>
      );
    })();

    // Wrap in tooltip for mobile (or always)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="sm:hidden">
          {def.label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        
        {isUpdating && !onAdvance && !onBack ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {updatingLabel}
            </span>
          </div>
        ) : (
          <>
            {/* Previous Step */}
            {prevStepId && (
              <>
                <StepBadge 
                  stepId={prevStepId} 
                  type="prev" 
                  onClick={handlePrev} 
                />
                <ChevronRight className="h-3.5 w-3.5 text-border shrink-0" />
              </>
            )}

            {/* Current Step */}
            <StepBadge stepId={currentStatus} type="current" />

            {/* Next Step */}
            {showNext && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-border shrink-0" />
                <StepBadge 
                  stepId={nextStepId} 
                  type="next" 
                  onClick={handleNext} 
                />
              </>
            )}

            {/* Branches */}
            {hasBranches && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-border shrink-0" />
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {branches.map((branchId, idx) => (
                    <React.Fragment key={branchId}>
                      {idx > 0 && (
                        <span className="text-[10px] text-muted-foreground/30">/</span>
                      )}
                      <StepBadge 
                        stepId={branchId} 
                        type="branch" 
                        isBranch 
                        onClick={() => handleBranch(branchId)} 
                      />
                    </React.Fragment>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
