import React, { useState, useRef } from 'react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
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
import {
  MessageSquare,
  Calendar,
  AlertCircle,
  Eye,
  X,
  Copy,
  Check,
} from 'lucide-react';

const getUrgencyColor = (urgency?: string) => {
  switch (urgency?.toLowerCase()) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high': return 'bg-warning text-warning-foreground';
    case 'medium': return 'bg-primary/10 text-primary';
    case 'low': return 'bg-secondary text-secondary-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'open': return 'bg-success/10 text-success';
    case 'closed': return 'bg-secondary text-secondary-foreground';
    case 'pending': return 'bg-warning/10 text-warning';
    case 'resolved': return 'bg-primary/10 text-primary';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

export default function TicketList() {
  const { tickets, loading, updateTicketStatus, addReply } = useSupportViewModel();
  const [tab, setTab] = useState<'list' | 'new'>('list');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [reply, setReply] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleCopyOpenTickets = async () => {
    const open = tickets.filter((t: any) => t.status?.toLowerCase() !== 'closed');
    if (!open.length) return;

    const lines: string[] = [
      `OPEN TICKETS REPORT — ${new Date().toLocaleDateString()} (${open.length} ticket${open.length !== 1 ? 's' : ''})`,
      '='.repeat(60),
    ];

    open.forEach((ticket: any, idx: number) => {
      lines.push('');
      lines.push(`[${idx + 1}] ${ticket.subject}  (#${ticket.id})`);
      lines.push('-'.repeat(50));
      lines.push(`Status   : ${ticket.status}`);
      if (ticket.urgency)   lines.push(`Urgency  : ${ticket.urgency}`);
      if (ticket.priority)  lines.push(`Priority : ${ticket.priority}`);
      if (ticket.category)  lines.push(`Category : ${ticket.category}`);
      if (ticket.module)    lines.push(`Module   : ${ticket.module}`);
      if (ticket.assignee)  lines.push(`Assignee : ${ticket.assignee}`);
      lines.push(`Created  : ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}`);
      lines.push(`Updated  : ${ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '—'}`);

      if (ticket.shortDesc) {
        lines.push('');
        lines.push('Description:');
        lines.push(ticket.shortDesc);
      }

      if (ticket.messages?.length) {
        lines.push('');
        lines.push(`Messages (${ticket.messages.length}):`);
        ticket.messages.forEach((msg: any) => {
          const from = msg.from === 'user' ? 'You' : msg.from === 'support' ? 'Support' : 'System';
          const date = msg.date ? new Date(msg.date).toLocaleString() : '';
          lines.push(`  [${from} — ${date}]: ${msg.text}`);
          if (msg.attachments?.length) {
            lines.push(`    Attachments: ${msg.attachments.map((a: any) => a.name).join(', ')}`);
          }
        });
      }

      if (ticket.links?.length) {
        lines.push('');
        lines.push(`Links: ${ticket.links.join(', ')}`);
      }
    });

    lines.push('');
    lines.push('='.repeat(60));

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = lines.join('\n');
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      {/* Header */}
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyOpenTickets}
            disabled={tickets.filter((t: any) => t.status?.toLowerCase() !== 'closed').length === 0}
            className="shrink-0 gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Open Tickets'}</span>
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="w-full max-w-3xl mx-auto mt-8 px-3 sm:px-6">
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
              <div className="flex items-center gap-2 px-3 sm:px-6 pt-6 pb-2 border-b border-border bg-muted/40">
                <button
                  className="mr-2 text-primary hover:text-accent focus:outline-none"
                  onClick={() => setSelectedTicket(null)}
                  title="Back to tickets"
                >
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                    <div className="font-bold text-lg flex-1 truncate">{selectedTicket.subject}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">ID: {selectedTicket.id}</span>
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-muted/60">{selectedTicket.status}</span>
                      {selectedTicket.urgency && <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-accent/10 text-accent">{selectedTicket.urgency}</span>}
                    </div>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="overflow-y-auto max-h-[340px] md:max-h-[420px] px-3 sm:px-6 py-4 space-y-3 bg-background">
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
                  <form className="flex flex-col gap-2 border-t border-border px-3 sm:px-6 py-4 bg-muted/30" onSubmit={handleReply}>
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
              <div className="flex gap-2 px-3 sm:px-6 py-4 border-t border-border bg-muted/40">
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
                <div className="px-3 sm:px-6 pb-4 flex flex-wrap gap-2 border-t border-border bg-muted/20">
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
              <div className="flex flex-col gap-0">
                {/* Mobile cards */}
                <div className="md:hidden list-editorial rounded-lg border border-border overflow-hidden">
                  {tickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="list-row-editorial bg-card"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="list-row-avatar mt-0.5">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="list-row-title flex-1">
                              {ticket.subject}
                            </p>
                            {ticket.urgency && (
                              <Badge className={`text-px-10 px-2 py-0.5 shrink-0 ${getUrgencyColor(ticket.urgency)}`} variant="secondary">
                                {ticket.urgency}
                              </Badge>
                            )}
                          </div>
                          <p className="list-row-subtitle font-mono">#{ticket.id}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[52px] mt-2">
                        {ticket.createdAt && (
                          <div className="list-row-meta-item">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{typeof ticket.createdAt === 'string' ? ticket.createdAt.slice(0, 10) : new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {ticket.category && (
                          <div className="list-row-meta-item">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{ticket.category}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pl-[52px] mt-3">
                        <Badge className={`text-px-10 px-2 py-0.5 ${getStatusColor(ticket.status)}`} variant="secondary">
                          {ticket.status}
                        </Badge>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {ticket.status !== 'Closed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => { setSelectedTicket(ticket); setShowCloseModal(true); }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {tickets.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground">No tickets found.</div>
                  )}
                </div>

                {/* Desktop list */}
                <div className="hidden md:block">
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
                </div>
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
