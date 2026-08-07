import React from 'react';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { SupportTicketResponse } from '@/services/api/supportTicketsApi';
import { TicketStatusBadge, TicketUrgencyBadge } from './TicketStatusBadge';

interface Props {
  tickets: SupportTicketResponse[];
  scope: 'user' | 'admin';
}

export default function RecentTicketsTable({ tickets, scope }: Props) {
  const { t } = useTranslation('support');
  const navigate = useNavigate();

  const detailPath = (id: number) =>
    scope === 'admin' ? `/dashboard/ticketsadmin` : `/support/tickets/${id}`;

  if (tickets.length === 0) {
    return (
      <Card className="p-6 bg-card border-border text-center text-sm text-muted-foreground">
        {t('dashboard.recent.empty', 'No tickets yet.')}
      </Card>
    );
  }

  return (
    <Card className="p-0 bg-card border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{t('dashboard.recent.title', 'Recent tickets')}</h3>
      </div>
      <div className="divide-y divide-border">
        {tickets.map((tk) => (
          <button
            key={tk.id}
            onClick={() => navigate(detailPath(tk.id))}
            className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-center gap-3"
          >
            <div className="text-xs font-mono text-muted-foreground w-14 shrink-0">#{tk.id}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{tk.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {new Date(tk.createdAt).toLocaleDateString()} {tk.userEmail ? `· ${tk.userEmail}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <TicketUrgencyBadge urgency={tk.urgency} />
              <TicketStatusBadge status={tk.status} />
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
