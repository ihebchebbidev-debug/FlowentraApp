import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupportViewModel } from '../viewmodel/supportViewModel';

export default function TicketDetails() {
  const { tickets, updateTicketStatus, loading } = useSupportViewModel();
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const ticket = tickets.find((t: any) => t.id === ticketId);

  if (!ticket) return <div className="py-8 text-center">Ticket not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="p-6 flex flex-col gap-4">
        <div className="font-bold text-lg">{ticket.subject}</div>
        <div className="text-xs text-muted-foreground">ID: {ticket.id} | Status: {ticket.status}</div>
        <div className="mt-2">
          <div className="font-semibold mb-1">Messages:</div>
          <div className="flex flex-col gap-2">
            {ticket.messages.map((msg: any, idx: number) => (
              <div key={idx} className={`rounded px-3 py-2 ${msg.from === 'user' ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                <span className="font-medium">{msg.from === 'user' ? 'You' : 'Support'}:</span> {msg.text}
                <div className="text-xs text-muted-foreground mt-1">{msg.date}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {ticket.status !== 'Closed' && (
            <Button
              size="sm"
              variant="secondary"
              disabled={loading}
              onClick={async () => {
                await updateTicketStatus(ticket.id, 'Closed');
                navigate('/support/tickets');
              }}
            >
              Close Ticket
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate('/support/tickets')}>
            Back to Tickets
          </Button>
        </div>
      </Card>
    </div>
  );
}
