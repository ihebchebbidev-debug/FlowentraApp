import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check, X, Loader2, ChevronDown, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

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
  /** Desktop: collapse older completed steps beyond this count into a "+N" chip. */
  maxPastVisible?: number;
  /** Desktop: collapse further future steps beyond this count into a "+N" chip. */
  maxFutureVisible?: number;
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
  maxPastVisible,
  maxFutureVisible,
}: StatusFlowStepperProps) {
  const { t } = useTranslation();
  const rawCurrentDef = getStepDef(currentStatus);
  // Fallback: if the current status is unknown (no label from config), synthesize
  // a safe display definition so the stepper never renders blank.
  const isUnknownStatus =
    !currentStatus || !rawCurrentDef || !rawCurrentDef.label;
  const currentDef: StatusStepDef = isUnknownStatus
    ? {
        id: currentStatus || "unknown",
        label: currentStatus
          ? String(currentStatus).replace(/[_-]+/g, " ")
          : t("statusFlow.unknown"),
      }
    : rawCurrentDef;
  const isCurrentTerminal = !!currentDef?.isTerminal;
  const isCurrentNegative = !!currentDef?.isNegative;

  // Effective step list: guarantee the current status is visible, even if it's
  // a terminal/negative branch outside the happy path (e.g. declined, cancelled).
  const effectiveSteps = useMemo(() => {
    if (!currentStatus) return steps;
    if (steps.includes(currentStatus)) return steps;
    return [...steps, currentStatus];
  }, [steps, currentStatus]);

  const currentIndex = effectiveSteps.indexOf(currentStatus);
  const validCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

  const canInteract = !disabled && !isUpdating;
  const hasBranches = branches.length > 0 && !isCurrentTerminal;

  const currentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentStatus]);

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

  // Safe wrapper: never return undefined — synthesize a readable label from the id.
  const safeGetStepDef = (id: string): StatusStepDef => {
    const d = getStepDef(id);
    if (d && d.label) return d;
    return {
      id,
      label: id ? String(id).replace(/[_-]+/g, " ") : t("statusFlow.unknown"),
    };
  };

  // Fallback UI: no steps configured at all → show the current status as a
  // single, unmistakable pill so users still see where the entity stands.
  if (effectiveSteps.length === 0) {
    return (
      <div
        className="w-full flex items-center gap-2 py-0.5"
        role="status"
        aria-label={t("statusFlow.currentStatusLabel")}
      >
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs sm:text-sm font-semibold",
            isCurrentNegative
              ? "bg-destructive/10 text-destructive ring-1 ring-destructive/30"
              : isUnknownStatus
                ? "bg-muted text-foreground ring-1 ring-border"
                : "bg-success/10 text-success ring-1 ring-success/30"
          )}
        >
          {isUnknownStatus ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : isCurrentNegative ? (
            <X className="h-4 w-4 shrink-0" />
          ) : (
            <Check className="h-4 w-4 shrink-0" />
          )}
          <span className="capitalize truncate">{currentDef.label}</span>
          {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </div>
      </div>
    );
  }

  // ============ MOBILE (technician) VIEW ============
  const prevStep = validCurrentIndex > 0 ? effectiveSteps[validCurrentIndex - 1] : null;
  const nextStep =
    validCurrentIndex < effectiveSteps.length - 1
      ? effectiveSteps[validCurrentIndex + 1]
      : null;
  const prevDef = prevStep ? safeGetStepDef(prevStep) : null;
  const nextDef = nextStep ? safeGetStepDef(nextStep) : null;

  const mobileCurrentTone = isCurrentNegative
    ? "bg-destructive text-destructive-foreground ring-2 ring-destructive/40"
    : isUnknownStatus
      ? "bg-warning text-warning-foreground ring-2 ring-warning/40"
      : "bg-success text-success-foreground ring-2 ring-success/50";

  return (
    <>
      {/* Mobile: hero status card + step dots + big prev/next actions */}
      <div className="sm:hidden w-full flex flex-col gap-2.5" aria-label={t("statusFlow.pipelineLabel")}>
        {/* Current status hero */}
        <div
          className={cn(
            "relative w-full rounded-xl px-4 py-3 shadow-sm flex items-center gap-3",
            mobileCurrentTone
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20 shrink-0">
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isCurrentNegative ? (
              <X className="h-5 w-5" strokeWidth={3} />
            ) : isUnknownStatus ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Check className="h-5 w-5" strokeWidth={3} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">
              {t("statusFlow.stepOf", { current: validCurrentIndex + 1, total: effectiveSteps.length })}
            </div>
            <div className="text-base font-bold capitalize truncate leading-tight">
              {currentDef.label}
            </div>
          </div>
          {hasBranches && canInteract && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("statusFlow.changeStatus")}
                  className="h-9 px-2 rounded-lg bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center gap-1 text-xs font-semibold shrink-0"
                >
                  {t("statusFlow.change")}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                {branches.map((branchId) => {
                  const bDef = safeGetStepDef(branchId);
                  return (
                    <DropdownMenuItem
                      key={branchId}
                      onSelect={() => onAdvance?.(branchId)}
                      className={cn(
                        "gap-2 text-sm capitalize py-3",
                        bDef.isNegative && "text-destructive focus:text-destructive"
                      )}
                    >
                      {bDef.isNegative ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4 text-success" />
                      )}
                      <span>{bDef.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-0.5" aria-hidden>
          {effectiveSteps.map((sid, i) => {
            const done = i < validCurrentIndex;
            const cur = i === validCurrentIndex;
            return (
              <div
                key={sid}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  done && "bg-success",
                  cur && (isCurrentNegative ? "bg-destructive" : "bg-success"),
                  !done && !cur && "bg-muted"
                )}
              />
            );
          })}
        </div>

        {/* Prev / Next action row */}
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            disabled={!prevDef || !canInteract}
            onClick={() => prevDef && onBack?.(prevDef.id)}
            className={cn(
              "flex-1 h-12 rounded-lg border border-border bg-background flex items-center justify-center gap-1.5 px-3",
              "text-xs font-semibold text-muted-foreground active:bg-muted",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[9px] uppercase tracking-wide opacity-70 leading-none">
                {t("statusFlow.back")}
              </span>
              <span className="capitalize truncate leading-tight">
                {prevDef?.label ?? "—"}
              </span>
            </div>
          </button>
          <button
            type="button"
            disabled={!nextDef || !canInteract || isCurrentTerminal}
            onClick={() => nextDef && onAdvance?.(nextDef.id)}
            className={cn(
              "flex-1 h-12 rounded-lg flex items-center justify-center gap-1.5 px-3",
              "text-xs font-bold shadow-sm active:scale-[0.98] transition",
              nextDef?.isNegative
                ? "bg-destructive text-destructive-foreground"
                : "bg-success text-success-foreground",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            <div className="flex flex-col items-end min-w-0">
              <span className="text-[9px] uppercase tracking-wide opacity-90 leading-none">
                {t("statusFlow.advance")}
              </span>
              <span className="capitalize truncate leading-tight">
                {nextDef?.label ?? (isCurrentTerminal ? t("statusFlow.done") : "—")}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* Desktop / tablet: original chevron pipeline */}
      <div
        className="hidden sm:flex w-full items-stretch gap-0 py-0.5 sm:overflow-visible no-scrollbar sm:mx-0 sm:px-0"
        role="list"
        aria-label={t("statusFlow.pipelineLabel")}
      >

      {(() => {
        const maxPast = typeof maxPastVisible === "number" ? maxPastVisible : Infinity;
        const maxFuture = typeof maxFutureVisible === "number" ? maxFutureVisible : Infinity;
        const pastStart = Math.max(0, validCurrentIndex - maxPast);
        const futureEnd = Math.min(
          effectiveSteps.length,
          validCurrentIndex + 1 + maxFuture
        );
        const hiddenPast = effectiveSteps.slice(0, pastStart);
        const hiddenFuture = effectiveSteps.slice(futureEnd);

        type RenderItem =
          | { kind: "step"; stepId: string; index: number }
          | { kind: "ellipsis"; side: "past" | "future"; hidden: string[] };
        const items: RenderItem[] = [];
        if (hiddenPast.length) items.push({ kind: "ellipsis", side: "past", hidden: hiddenPast });
        for (let i = pastStart; i < futureEnd; i++) {
          items.push({ kind: "step", stepId: effectiveSteps[i], index: i });
        }
        if (hiddenFuture.length) items.push({ kind: "ellipsis", side: "future", hidden: hiddenFuture });

        const notch = 12;
        const clipFor = (isFirstR: boolean, isLastR: boolean): React.CSSProperties => {
          if (isFirstR && isLastR) return {};
          if (isFirstR) {
            return {
              clipPath: `polygon(0 0, calc(100% - ${notch}px) 0, 100% 50%, calc(100% - ${notch}px) 100%, 0 100%)`,
            };
          }
          if (isLastR) {
            return {
              clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${notch}px 50%)`,
            };
          }
          return {
            clipPath: `polygon(0 0, calc(100% - ${notch}px) 0, 100% 50%, calc(100% - ${notch}px) 100%, 0 100%, ${notch}px 50%)`,
          };
        };

        return items.map((item, renderPos) => {
          const isFirstR = renderPos === 0;
          const isLastR = renderPos === items.length - 1;

          if (item.kind === "ellipsis") {
            const isPastSide = item.side === "past";
            const toneClass = isPastSide
              ? "bg-success/15 text-success ring-1 ring-inset ring-success/25"
              : "bg-muted-foreground/15 text-muted-foreground ring-1 ring-inset ring-muted-foreground/25";
            const wrapperClass = cn(
              "relative flex min-w-[3.5rem] snap-align-none",
              !isFirstR && "-ml-3 sm:-ml-3.5"
            );
            const paddingLeft = isFirstR ? "pl-3 sm:pl-4" : "pl-5 sm:pl-6";
            const paddingRight = isLastR ? "pr-3 sm:pr-4" : "pr-4 sm:pr-5";
            return (
              <div key={`ellipsis-${item.side}`} className={wrapperClass}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={
                        isPastSide
                          ? t("statusFlow.showEarlier", { defaultValue: "Show earlier steps" })
                          : t("statusFlow.showLater", { defaultValue: "Show later steps" })
                      }
                      style={clipFor(isFirstR, isLastR)}
                      className={cn(
                        "relative flex w-full items-center justify-center gap-1 h-9 sm:h-10",
                        "text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer",
                        paddingLeft,
                        paddingRight,
                        toneClass
                      )}
                    >
                      <span aria-hidden className="tracking-widest leading-none">…</span>
                      <span className="leading-none">+{item.hidden.length}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isPastSide ? "start" : "end"} className="min-w-[10rem]">
                    {item.hidden.map((hid) => {
                      const hDef = safeGetStepDef(hid);
                      return (
                        <DropdownMenuItem
                          key={hid}
                          className="gap-2 text-sm capitalize"
                          disabled
                        >
                          {isPastSide ? (
                            <Check className="h-3.5 w-3.5 text-success" strokeWidth={3} />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                          )}
                          <span>{hDef.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {!isPastSide && !isFirstR && (
                  <ChevronRight
                    className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 translate-x-[2px] h-4 w-4 text-muted-foreground/70 z-10"
                    strokeWidth={3}
                    aria-hidden
                  />
                )}
              </div>
            );
          }

          const stepId = item.stepId;
          const index = item.index;
          const def = safeGetStepDef(stepId);
          const isUnknownSegment = index === validCurrentIndex && isUnknownStatus;

          const isCompleted = index < validCurrentIndex;
          const isCurrent = index === validCurrentIndex;
          const isFuture = index > validCurrentIndex;

          const tone = (() => {
            if (isCurrent && isUnknownSegment) return "unknown-current";
            if (isCurrent && isCurrentNegative) return "negative-current";
            if (isCurrent) return "current";
            if (isCompleted) return "done";
            if (def.isNegative) return "negative-future";
            return "future";
          })();

          const toneClasses: Record<string, string> = {
            done: "bg-success/15 text-success hover:bg-success/25 dark:bg-success/20 dark:text-success",
            current: "bg-success text-success-foreground ring-2 ring-success/50 shadow-md",
            "negative-current":
              "bg-destructive text-destructive-foreground ring-2 ring-destructive/50 shadow-md",
            "unknown-current":
              "bg-warning text-warning-foreground ring-2 ring-warning/50 shadow-md",
            future:
              "bg-muted-foreground/15 text-muted-foreground hover:bg-muted-foreground/25 ring-1 ring-inset ring-muted-foreground/25",
            "negative-future":
              "bg-muted-foreground/10 text-muted-foreground hover:bg-destructive/15 ring-1 ring-inset ring-muted-foreground/20",
          };

          const clipStyle = clipFor(isFirstR, isLastR);

          const clickable =
            canInteract &&
            !isCurrent &&
            (index < validCurrentIndex || index === validCurrentIndex + 1);

          const isCurrentBranchTrigger = isCurrent && hasBranches && canInteract;
          const buttonEnabled = clickable || isCurrentBranchTrigger;

          const paddingLeft = isFirstR ? "pl-3 sm:pl-4" : "pl-5 sm:pl-6";
          const paddingRight = isLastR ? "pr-3 sm:pr-4" : "pr-4 sm:pr-5";

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
                "text-xs font-semibold whitespace-nowrap transition-colors",
                paddingLeft,
                paddingRight,
                toneClasses[tone],
                buttonEnabled ? "cursor-pointer" : "cursor-default",
                !clickable && !isCurrent && isFuture && "opacity-95"
              )}
            >
              {isCurrent && isUpdating ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : isCurrent && isUnknownSegment ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              ) : isCompleted ? (
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
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
              <span className="truncate capitalize">{def.label}</span>
              {isCurrent && hasBranches && (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              )}
            </button>
          );

          const wrapperClass = cn(
            "relative flex flex-1 min-w-[7rem] sm:min-w-0 snap-start sm:snap-align-none",
            isCurrent && "min-w-[8.5rem]",
            !isFirstR && "-ml-3 sm:-ml-3.5"
          );

          if (isCurrent && hasBranches) {
            return (
              <div key={stepId} className={wrapperClass} ref={currentRef}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={!canInteract}>
                    {segment}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[12rem]">
                    {branches.map((branchId) => {
                      const bDef = safeGetStepDef(branchId);
                      return (
                        <DropdownMenuItem
                          key={branchId}
                          onSelect={() => onAdvance?.(branchId)}
                          className={cn(
                            "gap-2 text-sm capitalize",
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
              className={wrapperClass}
              ref={isCurrent ? currentRef : undefined}
            >
              {segment}
              {isFuture && !isFirstR && (
                <ChevronRight
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 translate-x-[2px] h-4 w-4 text-muted-foreground/70 z-10"
                  strokeWidth={3}
                  aria-hidden
                />
              )}
            </div>
          );
        });
      })()}


      {isUpdating && !onAdvance && !onBack && (
        <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{updatingLabel}</span>
        </div>
      )}
    </div>
    </>
  );
}

