import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock, MapPin, Users, User, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import type { SyncedCalendarEventDto } from '@/services/api/emailAccountsApi';

interface CalendarEventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: SyncedCalendarEventDto | null;
}

export function CalendarEventDetailDialog({
  open,
  onOpenChange,
  event,
}: CalendarEventDetailDialogProps) {
  const { t } = useTranslation('email-calendar');

  if (!event) return null;

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const attendees: string[] = event.attendees ? JSON.parse(event.attendees) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {t('eventDetail.title')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-5 py-4 space-y-4">
            {/* Event title */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {event.title || t('eventDetail.noTitle')}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {event.isAllDay && (
                  <Badge variant="secondary" className="text-xs">{t('calendar.events.allDay')}</Badge>
                )}
                {event.status === 'cancelled' && (
                  <Badge variant="destructive" className="text-xs">{t('eventDetail.cancelled')}</Badge>
                )}
                {event.status === 'tentative' && (
                  <Badge variant="outline" className="text-xs">{t('eventDetail.tentative')}</Badge>
                )}
              </div>
            </div>

            <Separator className="bg-border/40" />

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                </p>
                {!event.isAllDay && (
                  <p className="text-sm text-muted-foreground">
                    {format(startDate, 'HH:mm')} – {format(endDate, 'HH:mm')}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{event.location}</p>
              </div>
            )}

            {/* Organizer */}
            {event.organizerEmail && (
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('eventDetail.organizer')}</p>
                  <p className="text-sm text-foreground">{event.organizerEmail}</p>
                </div>
              </div>
            )}

            {/* Attendees */}
            {attendees.length > 0 && (
              <>
                <Separator className="bg-border/40" />
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t('eventDetail.attendees')} ({attendees.length})
                    </p>
                    <div className="space-y-1.5">
                      {attendees.map((attendee) => (
                        <div key={attendee} className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
                            {attendee.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-foreground truncate">{attendee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Description */}
            {event.description && (
              <>
                <Separator className="bg-border/40" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('eventDetail.description')}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
