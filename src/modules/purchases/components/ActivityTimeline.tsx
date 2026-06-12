import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, User as UserIcon, Plus, CheckCircle2, Send, Package, FileText,
  DollarSign, X as XIcon, Pencil, Trash2, FileDown, Shield, ChevronDown,
} from "lucide-react";

/**
 * Generic activity item consumed by the inline timeline. Compatible with the
 * existing PurchaseActivity returned by the backend AND with synthetic events
 * derived client-side (e.g. for supplier invoices where there is no dedicated
 * activity endpoint yet — payment, FEL, TEJ status are mapped here).
 */
export interface TimelineEvent {
  id: string;
  /** Free-form action key — used to pick a coloured icon. */
  action: string;
  description: string;
  /** ISO timestamp. */
  at: string;
  by?: string;
  oldValue?: string;
  newValue?: string;
}

const ICON_BY_ACTION: Record<string, { Icon: typeof Clock; cls: string }> = {
  created:           { Icon: Plus,         cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  validated:         { Icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  sent:              { Icon: Send,         cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ordered:           { Icon: Send,         cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  received:          { Icon: Package,      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  invoiced:          { Icon: FileText,     cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  payment:           { Icon: DollarSign,   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  paid:              { Icon: DollarSign,   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled:         { Icon: XIcon,        cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  closed:            { Icon: CheckCircle2, cls: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  edited:            { Icon: Pencil,       cls: "bg-muted text-muted-foreground" },
  updated:           { Icon: Pencil,       cls: "bg-muted text-muted-foreground" },
  deleted:           { Icon: Trash2,       cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  tej_sync:          { Icon: FileDown,     cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  fel_sent:          { Icon: Shield,       cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
};

function iconFor(action: string) {
  const key = (action || "").toLowerCase();
  for (const k of Object.keys(ICON_BY_ACTION)) {
    if (key.includes(k)) return ICON_BY_ACTION[k];
  }
  return { Icon: Clock, cls: "bg-muted text-muted-foreground" };
}

function formatRelative(iso: string, t: any): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("timeline.justNow", "just now");
  if (mins < 60) return t("timeline.minutesAgo", "{{n}}m ago", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("timeline.hoursAgo", "{{n}}h ago", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("timeline.daysAgo", "{{n}}d ago", { n: days });
  return date.toLocaleDateString();
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  /** Inline (compact, in a card) vs Tab (full height, no card chrome). */
  variant?: "inline" | "tab";
  /** Max events to show when collapsed. */
  initialLimit?: number;
  title?: string;
  className?: string;
}

export function ActivityTimeline({
  events,
  variant = "inline",
  initialLimit = 5,
  title,
  className = "",
}: ActivityTimelineProps) {
  const { t } = useTranslation("purchases");
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => [...events].sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    [events],
  );
  const visible = expanded ? sorted : sorted.slice(0, initialLimit);
  const hasMore = sorted.length > initialLimit;

  const body = (
    <div className="space-y-3">
      {visible.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-6">
          {t("activity.empty", "No activity yet")}
        </div>
      )}
      {visible.map((ev, idx) => {
        const { Icon, cls } = iconFor(ev.action);
        const isLast = idx === visible.length - 1;
        return (
          <div key={ev.id} className="flex gap-3 group">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center ${cls}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <p className="text-xs font-medium leading-snug">{ev.description}</p>
              {(ev.oldValue || ev.newValue) && (
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                  {ev.oldValue && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                      {ev.oldValue}
                    </Badge>
                  )}
                  {ev.oldValue && ev.newValue && <span>→</span>}
                  {ev.newValue && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 font-mono">
                      {ev.newValue}
                    </Badge>
                  )}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Clock className="h-2.5 w-2.5" />
                <span title={new Date(ev.at).toLocaleString()}>
                  {formatRelative(ev.at, t)}
                </span>
                {ev.by && (
                  <>
                    <span>·</span>
                    <UserIcon className="h-2.5 w-2.5" />
                    <span>{ev.by}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        );
      })}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs text-muted-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 mr-1 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded
            ? t("timeline.showLess", "Show less")
            : t("timeline.showMore", "Show {{n}} more", { n: sorted.length - initialLimit })}
        </Button>
      )}
    </div>
  );

  if (variant === "tab") {
    return <div className={className}>{body}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {title || t("timeline.title", "Activity")}
        </CardTitle>
        {sorted.length > 0 && (
          <Badge variant="outline" className="text-[10px]">
            {sorted.length}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0">{body}</CardContent>
    </Card>
  );
}
