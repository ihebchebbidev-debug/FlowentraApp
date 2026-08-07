import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Paperclip, CalendarDays, Tag, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { supportTicketsApi, SupportTicketResponse } from '@/services/api/supportTicketsApi';
import CommentThread from '@/components/tickets/CommentThread';
import { TicketStatusBadge, TicketUrgencyBadge } from '../tickets/components/TicketStatusBadge';

export default function TicketDetails() {
  const { t } = useTranslation('support');
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SupportTicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const numericId = ticketId ? Number(ticketId) : NaN;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (Number.isNaN(numericId)) { setLoading(false); return; }
      setLoading(true);
      try {
        const data = await supportTicketsApi.getById(numericId);
        if (!cancelled) setTicket(data);
      } catch (err) {
        console.error('Failed to load ticket', err);
        if (!cancelled) setTicket(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [numericId]);

  const changeStatus = async (newStatus: string) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const updated = await supportTicketsApi.updateStatus(ticket.id, newStatus);
      setTicket(updated);
      toast.success(t('admin.statusUpdated', 'Status updated'));
    } catch (err) {
      console.error(err);
      toast.error(t('admin.statusError', 'Failed to update status'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
        <p className="text-sm text-muted-foreground">{t('ticketDetails.notFound', 'Ticket not found.')}</p>
        <Button variant="outline" onClick={() => navigate('/support/tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('ticketDetails.back', 'Back to tickets')}
        </Button>
      </div>
    );
  }

  const isClosed = ticket.status === 'closed';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/support/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('ticketDetails.back', 'Back')}
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">{ticket.title}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">#{ticket.id}</span>
              <TicketStatusBadge status={ticket.status} />
              <TicketUrgencyBadge urgency={ticket.urgency} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isClosed ? (
            <Button size="sm" variant="outline" disabled={updating} onClick={() => changeStatus('closed')}>
              {t('ticketDetails.close', 'Close ticket')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={updating} onClick={() => changeStatus('open')}>
              {t('ticketDetails.reopen', 'Reopen')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <Card className="lg:col-span-2 p-5 space-y-4 bg-card border-border">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                {t('ticketDetails.description', 'Description')}
              </h3>
              <p className="text-sm whitespace-pre-wrap text-foreground">{ticket.description}</p>
            </div>

            {ticket.attachments?.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  {t('common.attachments', 'Attachments')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.filePath || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-xs hover:bg-muted/70"
                    >
                      <Paperclip className="h-3 w-3" />
                      {a.fileName}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <CommentThread ticketId={ticket.id} />
            </div>
          </Card>

          <Card className="p-5 bg-card border-border h-fit space-y-3">
            <h3 className="text-sm font-semibold">{t('ticketDetails.info', 'Details')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              {ticket.category && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Tag className="h-3.5 w-3.5" />
                  <span className="capitalize">{ticket.category}</span>
                </div>
              )}
              {ticket.tenant && ticket.tenant !== 'unknown' && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{ticket.tenant}</span>
                </div>
              )}
              {ticket.userEmail && (
                <div className="text-xs text-muted-foreground truncate">{ticket.userEmail}</div>
              )}
              {(ticket.source || 'manual') === 'auto' && (
                <Badge variant="outline" className="text-px-10 bg-violet-500/10 text-violet-600 border-violet-500/20">
                  {t('admin.autoDetected', 'Auto')}
                  {(ticket.occurrenceCount ?? 1) > 1 ? ` ×${ticket.occurrenceCount}` : ''}
                </Badge>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
