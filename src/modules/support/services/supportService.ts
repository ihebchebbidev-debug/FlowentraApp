import { supportTicketsApi, SupportTicketResponse, SupportTicketCommentDto } from '@/services/api/supportTicketsApi';
import { faqData } from '../data/faqData';
import type { Ticket, Message, FAQ } from '../types';

function getUserEmail(): string | undefined {
  try {
    const raw = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    if (!raw) return undefined;
    const user = JSON.parse(raw) as { email?: string };
    return user.email;
  } catch {
    return undefined;
  }
}

function mapStatus(status: string): Ticket['status'] {
  switch (status.toLowerCase()) {
    case 'open':
      return 'Open';
    case 'in_progress':
      return 'Pending';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
}

function mapUrgency(urgency?: string): Ticket['urgency'] {
  if (!urgency) return 'Medium';
  return urgency.charAt(0).toUpperCase() + urgency.slice(1);
}

function mapCommentToMessage(comment: SupportTicketCommentDto): Message {
  const from: Message['from'] =
    comment.author === 'Auto-Incident' || comment.isInternal ? 'system' : 'support';
  return {
    id: String(comment.id),
    from,
    text: comment.text,
    date: comment.createdAt.slice(0, 10),
    attachments: comment.attachments?.map((a) => ({
      id: String(a.id),
      name: a.fileName,
      url: a.filePath,
      size: a.fileSize,
      mime: a.contentType,
    })),
  };
}

function mapApiTicket(t: SupportTicketResponse): Ticket {
  return {
    id: String(t.id),
    subject: t.title,
    shortDesc: t.description.length > 200 ? `${t.description.slice(0, 200)}…` : t.description,
    module: t.module,
    category: t.category,
    urgency: mapUrgency(t.urgency),
    status: mapStatus(t.status),
    createdAt: t.createdAt.slice(0, 10),
    updatedAt: (t.lastOccurredAt || t.createdAt).slice(0, 10),
    messages: [],
    attachments: t.attachments?.map((a) => ({
      id: String(a.id),
      name: a.fileName,
      url: a.filePath,
      size: a.fileSize,
      mime: a.contentType,
    })) || [],
    links: [],
  };
}

export const supportService = {
  getFaqList: async (): Promise<FAQ[]> => faqData,

  getTickets: async (): Promise<Ticket[]> => {
    const all = await supportTicketsApi.getAll();
    const email = getUserEmail();
    // Show the user's own tickets AND any auto-tagged/system-generated tickets
    // (auto-incident tickets typically have no userEmail attached).
    const filtered = email
      ? all.filter((t) => {
          const isMine = (t.userEmail || '').toLowerCase() === email.toLowerCase();
          const isAuto = (t.source || '').toLowerCase() === 'auto';
          return isMine || isAuto;
        })
      : all;
    return filtered.map(mapApiTicket);
  },

  getTicketById: async (id: string): Promise<Ticket | null> => {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return null;
    try {
      const ticket = await supportTicketsApi.getById(numericId);
      const comments = await supportTicketsApi.getComments(numericId);
      const mapped = mapApiTicket(ticket);
      mapped.messages = comments.map(mapCommentToMessage);
      return mapped;
    } catch {
      return null;
    }
  },

  createTicket: async (ticket: Partial<Ticket> & { attachments?: File[] }) => {
    const created = await supportTicketsApi.create({
      title: ticket.subject || 'No subject',
      description: ticket.shortDesc || ticket.subject || '',
      urgency: ticket.urgency?.toLowerCase(),
      category: ticket.category,
      currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
      relatedUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      userEmail: getUserEmail(),
      attachments: ticket.attachments,
    });
    return mapApiTicket(created);
  },

  addReply: async (ticketId: string, message: Message) => {
    const numericId = Number(ticketId);
    if (Number.isNaN(numericId)) return null;
    const created = await supportTicketsApi.addComment(numericId, {
      text: message.text,
    });
    return mapCommentToMessage(created);
  },

  reopenTicket: async (id: string) => {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return null;
    const updated = await supportTicketsApi.updateStatus(numericId, 'open');
    return mapApiTicket(updated);
  },

  updateTicketStatus: async (id: string, status: string) => {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return null;
    const apiStatus = status.toLowerCase() === 'open'
      ? 'open'
      : status.toLowerCase() === 'closed'
        ? 'closed'
        : status.toLowerCase() === 'resolved'
          ? 'resolved'
          : 'in_progress';
    const updated = await supportTicketsApi.updateStatus(numericId, apiStatus);
    return mapApiTicket(updated);
  },
};
