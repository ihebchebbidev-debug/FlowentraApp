import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type TransitionState = "idle" | "transitioning" | "success" | "error";

interface StatusTransitionProps {
  isTransitioning: boolean;
  onTransitionComplete?: () => void;
  successDuration?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps status badges with smooth transition animations
 */
export function StatusTransition({
  isTransitioning,
  onTransitionComplete,
  successDuration = 1500,
  children,
  className
}: StatusTransitionProps) {
  const [state, setState] = useState<TransitionState>("idle");

  useEffect(() => {
    if (isTransitioning && state === "idle") {
      setState("transitioning");
    } else if (!isTransitioning && state === "transitioning") {
      setState("success");
      const timer = setTimeout(() => {
        setState("idle");
        onTransitionComplete?.();
      }, successDuration);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, state, successDuration, onTransitionComplete]);

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {state === "transitioning" ? (
          <motion.div
            key="transitioning"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2"
          >
            <StatusTransitionLoader />
          </motion.div>
        ) : state === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {children}
            <StatusSuccessOverlay />
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Professional loading indicator for status transitions
 */
export function StatusTransitionLoader({ label }: { label?: string }) {
  const { t } = useTranslation();
  
  return (
    <motion.div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20"
      animate={{ 
        boxShadow: [
          "0 0 0 0 rgba(var(--primary), 0)",
          "0 0 0 4px rgba(var(--primary), 0.1)",
          "0 0 0 0 rgba(var(--primary), 0)"
        ]
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-3.5 w-3.5 text-primary" />
      </motion.div>
      <span className="text-xs font-medium text-primary">
        {label || t("statusTransition.updating")}
      </span>
      <motion.div 
        className="flex gap-0.5"
        initial="start"
        animate="end"
        variants={{
          start: {},
          end: { transition: { staggerChildren: 0.15 } }
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-primary"
            variants={{
              start: { opacity: 0.3 },
              end: { opacity: 1 }
            }}
            transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

/**
 * Success checkmark overlay that appears briefly after status change
 */
function StatusSuccessOverlay() {
  return (
    <motion.div
      className="absolute -right-1 -top-1 flex items-center justify-center w-4 h-4 rounded-full bg-success"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
    >
      <motion.div
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Check className="h-2.5 w-2.5 text-success-foreground" strokeWidth={3} />
      </motion.div>
    </motion.div>
  );
}

/**
 * Hook for managing status transition state
 */
export function useStatusTransition(onStatusChange: (status: string) => Promise<void>) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const initiateTransition = useCallback(async (newStatus: string) => {
    setIsTransitioning(true);
    setPendingStatus(newStatus);
    
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error("Status transition failed:", error);
    } finally {
      setIsTransitioning(false);
      setPendingStatus(null);
    }
  }, [onStatusChange]);

  return {
    isTransitioning,
    pendingStatus,
    initiateTransition
  };
}

/**
 * Animated badge that morphs between states
 */
interface AnimatedBadgeProps {
  children: React.ReactNode;
  isActive?: boolean;
  variant?: "primary" | "success" | "destructive" | "muted";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function AnimatedBadge({
  children,
  isActive = false,
  variant = "primary",
  className,
  onClick,
  disabled
}: AnimatedBadgeProps) {
  const variantStyles = {
    primary: "bg-primary/15 border-primary/30 text-primary",
    success: "bg-success/15 border-success/30 text-success",
    destructive: "bg-destructive/15 border-destructive/30 text-destructive",
    muted: "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:border-border"
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors",
        variantStyles[variant],
        onClick && !disabled && "cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      whileHover={onClick && !disabled ? { scale: 1.02 } : undefined}
      whileTap={onClick && !disabled ? { scale: 0.98 } : undefined}
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {isActive && (
        <motion.div
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "primary" && "bg-primary",
            variant === "success" && "bg-success",
            variant === "destructive" && "bg-destructive",
            variant === "muted" && "bg-muted-foreground/30"
          )}
          layoutId="status-indicator"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {children}
    </Component>
  );
}

/**
 * Animated chevron separator
 */
export function AnimatedChevron({ className }: { className?: string }) {
  return (
    <motion.svg
      className={cn("h-3 w-3 text-muted-foreground/40", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </motion.svg>
  );
}
