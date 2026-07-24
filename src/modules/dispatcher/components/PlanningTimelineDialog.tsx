import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Users, MapPin, CheckCircle2 } from "lucide-react";
import type { PlacementRecord } from "../utils/planningAssist";

interface Props {
  open: boolean;
  onClose: () => void;
  placements: PlacementRecord[];
  assigned: number;
  skipped: number;
  daysUsed?: number;
}

// Timeline canvas config
const HOUR_START = 6;   // earliest hour visible
const HOUR_END = 22;    // latest hour visible
const PX_PER_HOUR = 60; // horizontal density
const ROW_H = 40;

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-500/85 border-red-600",
  high:   "bg-orange-500/85 border-orange-600",
  medium: "bg-primary/80 border-primary",
  normal: "bg-primary/80 border-primary",
  low:    "bg-slate-500/80 border-slate-600",
};

function dayKey(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function fmtDayHeader(d: Date, locale?: string) {
  return d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(d: Date, locale?: string) {
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function hoursSince6(d: Date): number {
  return d.getHours() + d.getMinutes() / 60 - HOUR_START;
}

export function PlanningTimelineDialog({ open, onClose, placements, assigned, skipped, daysUsed }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  // Group placements by day → then by technician.
  const byDay = useMemo(() => {
    const map = new Map<number, { day: Date; techs: Map<string, { name: string; items: PlacementRecord[] }> }>();
    for (const p of placements) {
      const k = dayKey(p.day);
      if (!map.has(k)) map.set(k, { day: new Date(k), techs: new Map() });
      const bucket = map.get(k)!;
      if (!bucket.techs.has(p.technicianId)) bucket.techs.set(p.technicianId, { name: p.technicianName, items: [] });
      bucket.techs.get(p.technicianId)!.items.push(p);
    }
    return Array.from(map.values()).sort((a, b) => a.day.getTime() - b.day.getTime());
  }, [placements]);

  const totalHours = HOUR_END - HOUR_START;
  const width = totalHours * PX_PER_HOUR;

  const totalTravelKm = useMemo(
    () => placements.reduce((s, p) => s + (p.travelKm ?? 0), 0),
    [placements],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {t("dispatcher.timeline.title", { defaultValue: "Auto-plan timeline" })}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-3 pt-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {t("dispatcher.timeline.daysUsed", { defaultValue: "{{n}} day(s)", n: daysUsed ?? byDay.length })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {t("dispatcher.timeline.assigned", { defaultValue: "{{n}} scheduled", n: assigned })}
            </span>
            {skipped > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {t("dispatcher.timeline.skipped", { defaultValue: "{{n}} unplaced", n: skipped })}
              </span>
            )}
            {totalTravelKm > 0 && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                ~{totalTravelKm.toFixed(0)} km {t("dispatcher.timeline.travel", { defaultValue: "total travel" })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 space-y-6">
            {byDay.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                {t("dispatcher.timeline.empty", { defaultValue: "No placements were made." })}
              </div>
            )}

            {byDay.map(({ day, techs }) => {
              const techList = Array.from(techs.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
              return (
                <section key={day.getTime()} className="rounded-lg border border-border bg-card">
                  <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-lg">
                    <div className="font-medium text-sm">{fmtDayHeader(day, locale)}</div>
                    <div className="text-xs text-muted-foreground">
                      {techList.length} {t("dispatcher.timeline.techs", { defaultValue: "tech(s)" })}
                      {" · "}
                      {techList.reduce((s, [, v]) => s + v.items.length, 0)} {t("dispatcher.timeline.jobs", { defaultValue: "job(s)" })}
                    </div>
                  </header>

                  {/* Scrollable horizontal timeline */}
                  <div className="overflow-x-auto">
                    <div className="min-w-max">
                      {/* Hour ruler */}
                      <div className="flex" style={{ paddingLeft: 160 }}>
                        <div className="relative" style={{ width }}>
                          <div className="flex text-px-10 text-muted-foreground border-b border-border">
                            {Array.from({ length: totalHours + 1 }).map((_, i) => (
                              <div key={i} className="flex-shrink-0 text-center border-l border-border/50 first:border-l-0" style={{ width: PX_PER_HOUR }}>
                                {String(HOUR_START + i).padStart(2, "0")}:00
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Rows */}
                      {techList.map(([tid, { name, items }]) => (
                        <div key={tid} className="flex items-center border-b border-border/40 last:border-b-0">
                          <div className="w-40 flex-shrink-0 px-3 py-2 text-xs font-medium truncate" title={name}>
                            {name}
                            <span className="ml-1 text-muted-foreground font-normal">({items.length})</span>
                          </div>
                          <div className="relative" style={{ width, height: ROW_H }}>
                            {/* Grid lines */}
                            {Array.from({ length: totalHours }).map((_, i) => (
                              <div key={i} className="absolute top-0 bottom-0 border-l border-border/30" style={{ left: i * PX_PER_HOUR }} />
                            ))}
                            {/* Blocks */}
                            {items.map((p) => {
                              const startH = hoursSince6(p.scheduledStart);
                              const endH = hoursSince6(p.scheduledEnd);
                              const left = Math.max(0, startH * PX_PER_HOUR);
                              const w = Math.max(24, (endH - startH) * PX_PER_HOUR);
                              const color = PRIORITY_COLOR[p.priority] || PRIORITY_COLOR.medium;
                              return (
                                <div
                                  key={p.jobId}
                                  className={`absolute top-1 bottom-1 rounded-md border text-px-10 text-white px-1.5 py-0.5 overflow-hidden shadow-sm ${color}`}
                                  style={{ left, width: w }}
                                  title={`${p.jobTitle}${p.customerName ? " — " + p.customerName : ""}\n${fmtTime(p.scheduledStart, locale)} – ${fmtTime(p.scheduledEnd, locale)}${p.travelKm != null ? `\n~${p.travelKm.toFixed(1)} km` : ""}`}
                                >
                                  <div className="truncate font-medium leading-tight">{p.jobTitle}</div>
                                  <div className="truncate opacity-90 leading-tight">{fmtTime(p.scheduledStart, locale)}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}

            {/* Legend */}
            {byDay.length > 0 && (
              <div className="flex items-center gap-3 text-px-11 text-muted-foreground pt-1">
                <span>{t("dispatcher.timeline.legend", { defaultValue: "Priority:" })}</span>
                {(["urgent", "high", "medium", "low"] as const).map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5">
                    <span className={`inline-block h-2.5 w-4 rounded ${PRIORITY_COLOR[p]}`} />
                    {p}
                  </span>
                ))}
                <span className="ml-auto">
                  <Badge variant="outline" className="font-normal">
                    {t("dispatcher.timeline.hint", { defaultValue: "Hover a block for details" })}
                  </Badge>
                </span>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
