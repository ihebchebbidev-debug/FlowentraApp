import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarEvent } from "../types";
import { UnifiedCalendarService } from "../services/unifiedCalendar.service";
import { 
  Calendar, Clock, MapPin, FileText, Edit, Trash2, User, Target, Briefcase,
  Wrench, DollarSign, ClipboardList, CheckSquare, ExternalLink, Hash, Timer
} from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

interface EventViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit: () => void;
  onDelete: (eventId: string) => void;
}

const SOURCE_ICONS: Record<string, React.ElementType> = {
  task: CheckSquare,
  dispatch: Wrench,
  offer: ClipboardList,
  sale: DollarSign,
  service_order: Briefcase,
  manual: Calendar,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
};

function InfoRow({ icon: Icon, label, value, className }: { icon: React.ElementType; label: string; value: React.ReactNode; className?: string }) {
  if (!value) return null;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function EventViewDialog({ open, onOpenChange, event, onEdit, onDelete }: EventViewDialogProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('calendar');
  if (!event) return null;

  const isEditable = UnifiedCalendarService.isEditable(event.id);
  const sourceUrl = UnifiedCalendarService.getSourceUrl(event.id);
  const IconComponent = SOURCE_ICONS[event.type] || Calendar;
  const duration = dayjs(event.end).diff(dayjs(event.start), 'minute');
  const isAllDay = event.allDay || (dayjs(event.end).diff(dayjs(event.start), 'day') >= 1 && dayjs(event.start).hour() === 0 && dayjs(event.end).hour() === 0);
  const sourceLabel = String(t(`source_label.${event.type}`, event.type));
  const statusLabel = String(t(`status_label.${(event.status || 'scheduled').replace(/ /g, '_')}`, event.status || 'scheduled'));
  const priorityLabel = String(t(`priority_label.${event.priority || 'medium'}`, event.priority || 'medium'));
  const meta = event.metadata;

  const getSourceBadgeClass = (type: string) => {
    switch (type) {
      case 'task': return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
      case 'dispatch': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'offer': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'sale': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'service_order': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl p-0 overflow-hidden">
        {/* Colored header bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: event.color || 'hsl(var(--primary))' }} />

        <div className="p-5 space-y-5">
          {/* Title section */}
          <DialogHeader className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${event.color || 'hsl(var(--primary))'}15` }}>
                <IconComponent className="h-5 w-5" style={{ color: event.color || 'hsl(var(--primary))' }} />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold text-left leading-tight">{event.title}</DialogTitle>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Badge className={`text-[11px] ${getSourceBadgeClass(event.type)}`}>{sourceLabel}</Badge>
                  <Badge variant="secondary" className="text-[11px] capitalize">{statusLabel}</Badge>
                  <Badge className={`text-[11px] capitalize ${PRIORITY_COLORS[event.priority] || PRIORITY_COLORS.medium}`}>{priorityLabel}</Badge>
                  {!isEditable && <Badge variant="outline" className="text-[10px]">{String(t('auto_generated'))}</Badge>}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date & Time */}
            <InfoRow
              icon={Calendar}
              label={String(t('date_time'))}
              value={
                <div>
                  <p className="font-medium">{dayjs(event.start).format("ddd, MMM D, YYYY")}</p>
                  {isAllDay ? (
                    <p className="text-xs text-muted-foreground">{String(t('all_day'))}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {dayjs(event.start).format("h:mm A")} — {dayjs(event.end).format("h:mm A")} ({duration} min)
                    </p>
                  )}
                </div>
              }
            />

            {/* Location */}
            {event.location && (
              <InfoRow icon={MapPin} label={String(t('location'))} value={event.location} />
            )}

            {/* Contact */}
            {(meta?.contactName || event.contactName) && (
              <InfoRow icon={User} label={String(t('detail.contact'))} value={meta?.contactName || event.contactName} />
            )}

            {/* Amount (offers & sales) */}
            {meta?.amount != null && (
              <InfoRow
                icon={DollarSign}
                label={String(t('detail.amount'))}
                value={
                  <span className="font-semibold text-foreground">
                    {meta.amount.toLocaleString()} {meta.currency || ''}
                  </span>
                }
              />
            )}

            {/* Technician (dispatches) */}
            {meta?.technicianName && (
              <InfoRow icon={Wrench} label={String(t('detail.technician'))} value={meta.technicianName} />
            )}

            {/* Assigned to (service orders) */}
            {meta?.assignedTo && !meta?.technicianName && (
              <InfoRow icon={User} label={String(t('detail.assigned_to'))} value={meta.assignedTo} />
            )}

            {/* Reference numbers */}
            {meta?.jobNumber && (
              <InfoRow icon={Hash} label={String(t('detail.job_number'))} value={meta.jobNumber} />
            )}
            {meta?.orderNumber && (
              <InfoRow icon={Hash} label={String(t('detail.order_number'))} value={meta.orderNumber} />
            )}
            {meta?.offerNumber && (
              <InfoRow icon={Hash} label={String(t('detail.offer_number'))} value={meta.offerNumber} />
            )}
            {meta?.saleNumber && (
              <InfoRow icon={Hash} label={String(t('detail.sale_number'))} value={meta.saleNumber} />
            )}

            {/* Duration */}
            {meta?.estimatedDuration && (
              <InfoRow icon={Timer} label={String(t('detail.duration'))} value={t('detail.duration_min', { count: meta.estimatedDuration })} />
            )}

            {/* Address (when different from location) */}
            {meta?.customerAddress && meta.customerAddress !== event.location && (
              <InfoRow icon={MapPin} label={String(t('detail.address'))} value={meta.customerAddress} />
            )}
          </div>

          {/* Description */}
          {event.description ? (
            <div className="rounded-lg bg-muted/40 p-3 border border-border/40">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{String(t('event_description'))}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">{event.description}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">{String(t('detail.no_description'))}</p>
          )}

          <Separator />

          {/* Footer meta */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{String(t('tooltip.source'))}: {sourceLabel}</span>
            <span>{String(t('detail.updated'))}: {dayjs(event.updatedAt).format("MMM D, YYYY")}</span>
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="px-5 pb-5 pt-0 gap-2">
          {isEditable && (
            <>
              <Button variant="outline" size="sm" onClick={() => onDelete(event.id)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> {String(t('delete'))}
              </Button>
              <Button size="sm" onClick={onEdit} className="gap-1.5">
                <Edit className="h-3.5 w-3.5" /> {String(t('edit_event'))}
              </Button>
            </>
          )}
          {!isEditable && sourceUrl && (
            <Button
              size="sm"
              onClick={() => { onOpenChange(false); navigate(sourceUrl); }}
              className="gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {String(t('go_to', { source: sourceLabel }))}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{String(t('close'))}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
