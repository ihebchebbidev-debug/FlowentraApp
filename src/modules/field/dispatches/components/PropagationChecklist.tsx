import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, MinusCircle, X, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  subscribePropagation,
  type PropagationEvent,
} from "@/services/propagationBus";
import type { PropagationHop, PropagationHopStatus } from "@/services/activityLogger";

interface PropagationChecklistProps {
  /** Only show events for this dispatch. */
  dispatchId: number;
  /** Auto-dismiss after this many ms when everything succeeded. 0 = never. */
  autoDismissMs?: number;
}

const HOP_LABELS: Array<{ key: "dispatch" | "serviceOrder" | "sale" | "offer"; label: string }> = [
  { key: "dispatch", label: "Dispatch note" },
  { key: "serviceOrder", label: "Service Order" },
  { key: "sale", label: "Sale" },
  { key: "offer", label: "Offer" },
];

const iconFor = (status: PropagationHopStatus) => {
  switch (status) {
    case "ok":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "failed":
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    default:
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const labelFor = (hop: PropagationHop): string => {
  switch (hop.status) {
    case "ok":
      return "Synced";
    case "failed":
      return hop.reason ? `Failed — ${hop.reason}` : "Failed";
    default:
      return hop.reason || "Not applicable";
  }
};

export function PropagationChecklist({ dispatchId, autoDismissMs = 6000 }: PropagationChecklistProps) {
  const [event, setEvent] = useState<PropagationEvent | null>(null);

  useEffect(() => {
    return subscribePropagation((e) => {
      if (e.dispatchId !== dispatchId) return;
      setEvent(e);
    });
  }, [dispatchId]);

  useEffect(() => {
    if (!event || !autoDismissMs) return;
    const anyFailed = Object.values(event.result).some((h) => h.status === "failed");
    if (anyFailed) return; // keep failures visible until dismissed
    const t = window.setTimeout(() => setEvent(null), autoDismissMs);
    return () => window.clearTimeout(t);
  }, [event, autoDismissMs]);

  if (!event) return null;

  const hops = HOP_LABELS.map(({ key, label }) => ({ key, label, hop: event.result[key] }));
  const anyFailed = hops.some((h) => h.hop.status === "failed");
  const anyOk = hops.some((h) => h.hop.status === "ok");

  const headline = anyFailed
    ? "Activity trail: partial sync"
    : anyOk
      ? "Activity trail synced"
      : "Activity logged";

  return (
    <Card
      role="status"
      aria-live="polite"
      className={
        "mb-3 border-l-4 " +
        (anyFailed
          ? "border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20"
          : "border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20")
      }
    >
      <div className="flex items-start gap-3 p-3">
        <Radio className={"h-4 w-4 mt-0.5 " + (anyFailed ? "text-amber-600" : "text-emerald-600")} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">{headline}</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1"
              onClick={() => setEvent(null)}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {hops.map(({ key, label, hop }) => (
              <li key={key} className="flex items-center gap-2 text-xs">
                {iconFor(hop.status)}
                <span className="font-medium">{label}:</span>
                <span
                  className={
                    hop.status === "failed"
                      ? "text-amber-700 dark:text-amber-300 truncate"
                      : "text-muted-foreground truncate"
                  }
                  title={labelFor(hop)}
                >
                  {labelFor(hop)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
