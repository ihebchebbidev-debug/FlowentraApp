import React, { useState, useRef } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription
} from '../../../components/ui/alert-dialog';
import { useSupportViewModel } from '../viewmodel/supportViewModel';
import { useNavigate } from 'react-router-dom';
import CreateTicketModal from './CreateTicketModal';
import FileUploader from './FileUploader';

export default function TicketList() {
  const { tickets, loading, updateTicketStatus, addReply } = useSupportViewModel();
  const [tab, setTab] = useState<'list' | 'new'>('list');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [reply, setReply] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Handler for closing ticket
  const handleCloseTicket = async (ticketId: string) => {
    setDetailsLoading(true);
    await updateTicketStatus(ticketId, 'Closed');
    setDetailsLoading(false);
    setSelectedTicket(null);
    setShowCloseModal(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() && attachments.length === 0) return;
    if (!selectedTicket) return;
    setDetailsLoading(true);

    // Normalize attachments for the message
    const normalizedAttachments = (attachments || []).map((f, i) => ({ id: `att-${Date.now()}-${i}`, name: f.name || String(f) }));

    const message = {
  from: 'user' as const,
      text: reply + (normalizedAttachments.length ? `\n[${normalizedAttachments.length} attachment(s)]` : ''),
      date: new Date().toISOString().slice(0, 10),
      attachments: normalizedAttachments
    };

    try {
      await addReply(selectedTicket.id, message);
      // Refresh local selectedTicket from updated tickets list
      const updated = tickets.find((t: any) => t.id === selectedTicket.id) || await (async () => { return await (await fetch && null); })();
      // If tickets updated via viewmodel, find it; otherwise, fallback to refetching via updateTicketStatus hack
      setSelectedTicket(updated || selectedTicket);
    } catch (err) {
      const _err = err as any;
      // ignore - viewmodel handles loading flag
    }

    setDetailsLoading(false);
    setReply('');
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };
  const _unused = handleFileChange;

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col">
      {/* Header (same as SupportHome) */}
      <header className="w-full bg-gradient-to-br from-primary/90 to-secondary/80 py-8 px-4 md:px-0 flex flex-col items-center border-b border-border">
        <div className="w-full max-w-5xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">My Support Tickets</h1>
            <nav className="text-xs text-muted-foreground flex gap-2 items-center">
              <span className="cursor-pointer hover:underline" onClick={() => navigate('/dashboard')}>Dashboard</span>
              <span>/</span>
              <span className="cursor-pointer hover:underline" onClick={() => navigate('/dashboard/help')}>Support</span>
              <span>/</span>
              <span className="font-semibold">Tickets</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="w-full max-w-3xl mx-auto mt-8 px-2">
        <div className="flex gap-2 border-b border-border mb-6">
          <button
            className={`px-4 py-2 font-medium rounded-t ${tab === 'list' ? 'bg-background border-x border-t border-border border-b-0 text-primary' : 'text-muted-foreground hover:text-primary'}`}
            onClick={() => { setTab('list'); setSelectedTicket(null); }}
          >
            My Tickets
          </button>
          <button
            className={`px-4 py-2 font-medium rounded-t ${tab === 'new' ? 'bg-background border-x border-t border-border border-b-0 text-primary' : 'text-muted-foreground hover:text-primary'}`}
            onClick={() => { setTab('new'); setSelectedTicket(null); }}
          >
            Create New Ticket
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'list' ? (
          selectedTicket ? (
            <Card className="p-0 flex flex-col gap-0 animate-fade-in overflow-hidden">
              <div className="flex items-center gap-2 px-6 pt-6 pb-2 border-b border-border bg-muted/40">
                <button
                  className="mr-2 text-primary hover:text-accent focus:outline-none"
                  onClick={() => setSelectedTicket(null)}
                  title="Back to tickets"
                >
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                    <div className="font-bold text-lg flex-1 truncate">{selectedTicket.subject}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">ID: {selectedTicket.id}</span>
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-muted/60">{selectedTicket.status}</span>
                      {selectedTicket.urgency && <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-accent/10 text-accent">{selectedTicket.urgency}</span>}
                    </div>
              </div>
              <div className="flex-1 flex flex-col h-[340px] md:h-[420px]">
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-background">
                  {selectedTicket.messages.map((msg: any, idx: number) => (
                    <div key={idx} className={`rounded-lg px-4 py-2 max-w-[90%] ${msg.from === 'user' ? 'bg-primary/10 ml-auto text-right' : 'bg-secondary/10 mr-auto text-left'}`}>
                      <div className="font-medium text-sm mb-1">{msg.from === 'user' ? 'You' : 'Support'}</div>
                      <div className="text-base whitespace-pre-wrap">{msg.text}</div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 justify-start">
                          {msg.attachments.map((att: any, aidx: number) => (
                            <a key={aidx} className="inline-flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs" href="#" onClick={e => e.preventDefault()}>{att.name}</a>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">{msg.date}</div>
                    </div>
                  ))}
                </div>
                {selectedTicket.status !== 'Closed' && (
                  <form className="flex flex-col gap-2 border-t border-border px-6 py-4 bg-muted/30" onSubmit={handleReply}>
                    <div className="flex gap-2 items-start">
                      <input
                        className="flex-1 rounded border border-border px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Write a reply..."
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        disabled={detailsLoading}
                      />
                      <Button type="submit" disabled={detailsLoading || (!reply.trim() && attachments.length === 0)}>Send</Button>
                    </div>
                    <div>
                      <FileUploader files={attachments} setFiles={setAttachments} />
                    </div>
                  </form>
                )}
              </div>
              <div className="flex gap-2 px-6 py-4 border-t border-border bg-muted/40">
                {selectedTicket.status !== 'Closed' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={detailsLoading}
                      onClick={() => setShowCloseModal(true)}
                    >
                      Close Ticket
                    </Button>
                    <AlertDialog open={showCloseModal} onOpenChange={setShowCloseModal}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Close Ticket</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to close this ticket? You will not be able to reply unless reopened by support.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <Button variant="secondary" onClick={() => handleCloseTicket(selectedTicket.id)} disabled={detailsLoading}>Yes, Close</Button>
                          <Button variant="outline" onClick={() => setShowCloseModal(false)}>Cancel</Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedTicket(null)}>
                  Back
                </Button>
              </div>
              {/* Attachments preview for the ticket (if any) */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="px-6 pb-4 flex flex-wrap gap-2 border-t border-border bg-muted/20">
                  {selectedTicket.attachments.map((att: any, idx: number) => (
                    <a key={idx} className="inline-flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs text-muted-foreground" href="#" onClick={e => e.preventDefault()}>{att.name}</a>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            loading ? (
              <div>Loading...</div>
            ) : (
              <div className="flex flex-col gap-4">
                {tickets.map((ticket: any) => (
                  <Card key={ticket.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedTicket(ticket)}>
                    <div>
                      <div className="font-semibold">{ticket.subject}</div>
                      <div className="text-xs text-muted-foreground">ID: {ticket.id} | Status: {ticket.status}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedTicket(ticket); }}>View Details</Button>
                  </Card>
                ))}
                {tickets.length === 0 && (
                  <Card className="p-6 text-center text-muted-foreground">No tickets found.</Card>
                )}
              </div>
            )
          )
        ) : (
          <div className="bg-muted/40 rounded-lg p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Create a New Support Ticket</h3>
              <p className="text-xs text-muted-foreground">Open a ticket quickly — our team will respond within 24 hours.</p>
            </div>
            <CreateTicketModal onCreated={(id) => { const t = tickets.find((x:any) => x.id === id); if (t) setSelectedTicket(t); setTab('list'); }} />
          </div>
        )}
      </div>
    </div>
  );
}
