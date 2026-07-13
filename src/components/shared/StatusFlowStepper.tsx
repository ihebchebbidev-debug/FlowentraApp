import React, { useMemo } from "react";
import { Check, X, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface StatusStepDef {
  id: string;
  label: string;
  isNegative?: boolean;
  isTerminal?: boolean;
  icon?: React.ReactNode;
}

export interface StatusFlowStepperProps {
  /** Ordered list of workflow step ids (happy path). */
  steps: string[];
  currentStatus: string;
  getStepDef: (id: string) => StatusStepDef;
  onAdvance?: (statusId: string) => void;
  onBack?: (statusId: string) => void;
  /** Branch/alternate next-statuses available from the current step. */
  branches?: string[];
  isUpdating?: boolean;
  disabled?: boolean;
  updatingLabel?: string;
  /** @deprecated kept for API compatibility. */
  layoutIdPrefix?: string;
  /** @deprecated kept for API compatibility. */
  prevStepId?: string | null;
  /** @deprecated kept for API compatibility. */
  nextStepId?: string | null;
}

/**
 * Creatio-style horizontal status pipeline.
 * Renders every workflow step as a connected chevron segment:
 *   • completed steps → success (green) filled
 *   • current step    → success (green) highlighted + dropdown arrow if there
 *                       are branch/alternate choices (multi-choice)
 *   • future steps    → muted, clickable to advance forward one step
 *   • negative terminal (declined/cancelled/rejected) → destructive
 *
 * Responsive: full-width row that horizontally scrolls on narrow screens.
 * Each segment enforces a minimum width so labels never truncate.
 */
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
}: StatusFlowStepperProps) {
  const currentDef = getStepDef(currentStatus);
  const isCurrentTerminal = !!currentDef?.isTerminal;
  const isCurrentNegative = !!currentDef?.isNegative;

  // Effective step list: guarantee the current status is visible, even if it's
  // a terminal/negative branch outside the happy path (e.g. declined, cancelled).
  const effectiveSteps = useMemo(() => {
    if (steps.includes(currentStatus)) return steps;
    return [...steps, currentStatus];
  }, [steps, currentStatus]);

  const currentIndex = effectiveSteps.indexOf(currentStatus);
  const validCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

  const canInteract = !disabled && !isUpdating;
  const hasBranches = branches.length > 0 && !isCurrentTerminal;

  const handleSegmentClick = (stepId: string, index: number) => {
    if (!canInteract) return;
    if (index === validCurrentIndex) return;
    if (index < validCurrentIndex) {
      onBack?.(stepId);
      return;
    }
    // Only allow advancing exactly one step at a time via segment click.
    if (index === validCurrentIndex + 1) {
      onAdvance?.(stepId);
    }
  };

  return (
    <div
      className="w-full flex items-stretch gap-0 py-0.5 overflow-x-auto sm:overflow-visible no-scrollbar"
      role="list"
      aria-label="Status pipeline"
    >
      {effectiveSteps.map((stepId, index) => {
        const def = getStepDef(stepId);
        if (!def) return null;

        const isCompleted = index < validCurrentIndex;
        const isCurrent = index === validCurrentIndex;
        const isFuture = index > validCurrentIndex;
        const isFirst = index === 0;
        const isLast = index === effectiveSteps.length - 1;

        // Colour tier
        const tone = (() => {
          if (isCurrent && isCurrentNegative) return "negative-current";
          if (isCurrent) return "current";
          if (isCompleted) return "done";
          if (def.isNegative) return "negative-future";
          return "future";
        })();

        const toneClasses: Record<string, string> = {
          done: "bg-success text-success-foreground hover:bg-success/90",
          current: "bg-success text-success-foreground ring-1 ring-success/40 shadow-sm",
          "negative-current":
            "bg-destructive text-destructive-foreground ring-1 ring-destructive/40 shadow-sm",
          future:
            "bg-muted-foreground/25 text-foreground/80 hover:bg-muted-foreground/35 border-y border-r border-border/60",
          "negative-future":
            "bg-muted-foreground/20 text-foreground/70 hover:bg-destructive/15 border-y border-r border-border/60",
        };
        if (isFirst) {
          toneClasses.future = toneClasses.future.replace("border-r", "border");
          toneClasses["negative-future"] = toneClasses["negative-future"].replace(
            "border-r",
            "border"
          );
        }

        // Chevron shape via clip-path. First segment gets a flat left edge,
        // last segment gets a flat right edge.
        const clipStyle: React.CSSProperties = (() => {
          const notch = 12; // px
          if (isFirst && isLast) return {};
          if (isFirst) {
            return {
              clipPath: `polygon(0 0, calc(100% - ${notch}px) 0, 100% 50%, calc(100% - ${notch}px) 100%, 0 100%)`,
            };
          }
          if (isLast) {
            return {
              clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${notch}px 50%)`,
            };
          }
          return {
            clipPath: `polygon(0 0, calc(100% - ${notch}px) 0, 100% 50%, calc(100% - ${notch}px) 100%, 0 100%, ${notch}px 50%)`,
          };
        })();

        const clickable =
          canInteract &&
          !isCurrent &&
          (index < validCurrentIndex || index === validCurrentIndex + 1);

        // The current segment is interactive only when it has branch choices
        // (dropdown menu). Otherwise it's inert but not visually disabled.
        const isCurrentBranchTrigger = isCurrent && hasBranches && canInteract;
        const buttonEnabled = clickable || isCurrentBranchTrigger;

        const paddingLeft = isFirst ? "pl-3 sm:pl-4" : "pl-5 sm:pl-6";
        const paddingRight = isLast ? "pr-3 sm:pr-4" : "pr-4 sm:pr-5";

        const segment = (
          <button
            type="button"
            role="listitem"
            aria-current={isCurrent ? "step" : undefined}
            disabled={!buttonEnabled}
            onClick={isCurrentBranchTrigger ? undefined : () => handleSegmentClick(stepId, index)}
            style={clipStyle}
            className={cn(
              "relative flex w-full items-center justify-center gap-1.5 h-9 sm:h-10",
              "text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors",
              paddingLeft,
              paddingRight,
              toneClasses[tone],
              buttonEnabled ? "cursor-pointer" : "cursor-default",
              !clickable && !isCurrent && isFuture && "opacity-95"
            )}
          >

            {isCurrent && isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : isCompleted ? (
              <Check className="h-3.5 w-3.5 shrink-0 opacity-90" />
            ) : isCurrent && isCurrentNegative ? (
              <X className="h-3.5 w-3.5 shrink-0" />
            ) : isCurrent ? (
              <span className="h-2 w-2 rounded-full bg-current shrink-0" />
            ) : def.icon ? (
              <span className="shrink-0 flex items-center [&>svg]:w-3.5 [&>svg]:h-3.5">
                {def.icon}
              </span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-current/40 shrink-0" />
            )}
            <span className="truncate">{def.label}</span>
            {isCurrent && hasBranches && (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
            )}
          </button>
        );

        // Wrap the current segment in a dropdown when there are branches.
        if (isCurrent && hasBranches) {
          return (
            <div
              key={stepId}
              className={cn(
                "relative flex flex-1 min-w-[8rem] sm:min-w-0",
                !isFirst && "-ml-3 sm:-ml-3.5"
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!canInteract}>
                  {segment}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[10rem]">
                  {branches.map((branchId) => {
                    const bDef = getStepDef(branchId);
                    if (!bDef) return null;
                    return (
                      <DropdownMenuItem
                        key={branchId}
                        onSelect={() => onAdvance?.(branchId)}
                        className={cn(
                          "gap-2 text-sm",
                          bDef.isNegative && "text-destructive focus:text-destructive"
                        )}
                      >
                        {bDef.isNegative ? (
                          <X className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-success" />
                        )}
                        <span>{bDef.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }

        return (
          <div
            key={stepId}
            className={cn(
              "relative flex flex-1 min-w-[8rem] sm:min-w-0",
              !isFirst && "-ml-3 sm:-ml-3.5"
            )}
          >
            {segment}
          </div>
        );
      })}

      {isUpdating && !onAdvance && !onBack && (
        <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{updatingLabel}</span>
        </div>
      )}
    </div>
  );
}
