// Handles API calls for tickets and FAQ (placeholder for backend integration)
import { ticketData } from '../data/ticketData';
import { faqData } from '../data/faqData';
import type { Ticket, Message, Attachment } from '../types';

export const supportService = {
  // FAQ
  getFaqList: async () => {
    // TODO: Replace with real API call
    return faqData;
  },

  // Tickets
  getTickets: async () => {
    // TODO: Replace with real API call
    return ticketData;
  },
  getTicketById: async (id: string) => {
    // TODO: Replace with real API call
    return ticketData.find(t => t.id === id) || null;
  },
  createTicket: async (ticket: Partial<Ticket> & { attachments?: any[] }) => {
    // TODO: Integrate with backend
    // Normalize attachments: store only meta in mock
    const attachments: Attachment[] = (ticket.attachments || []).map((f: any, i: number) => ({ id: `att-${Date.now()}-${i}`, name: f.name || f, mime: f.type, size: f.size }));
    const created: Ticket = {
      id: ticket.id || `TCK-${Math.floor(Math.random() * 100000)}`,
      subject: ticket.subject || 'No subject',
      shortDesc: ticket.shortDesc || '',
      module: ticket.module,
      category: ticket.category,
      urgency: ticket.urgency as any || 'Medium',
      status: ticket.status || 'Open',
      createdAt: ticket.createdAt || new Date().toISOString().slice(0,10),
      updatedAt: ticket.updatedAt || new Date().toISOString().slice(0,10),
      messages: ticket.messages || [],
      attachments,
      links: ticket.links || []
    };
    ticketData.push(created);
    return created;
  },
  addReply: async (ticketId: string, message: any) => {
    // message: Message
    const ticket = ticketData.find(t => t.id === ticketId);
    if (!ticket) return null;
    ticket.messages = ticket.messages || [];
    const msg: Message = {
      id: `m-${Date.now()}`,
      from: message.from,
      text: message.text,
      date: message.date || new Date().toISOString().slice(0,10),
      attachments: (message.attachments || []).map((a: any, i: number) => ({ id: a.id || `att-${Date.now()}-${i}`, name: a.name, mime: a.mime, size: a.size }))
    };
    ticket.messages.push(msg);
    ticket.updatedAt = new Date().toISOString().slice(0,10);
    return msg;
  },
  reopenTicket: async (id: string) => {
    const ticket = ticketData.find(t => t.id === id);
    if (ticket) ticket.status = 'Open';
    return ticket;
  },
  updateTicketStatus: async (id: string, status: string) => {
    // TODO: Integrate with backend
    const ticket = ticketData.find(t => t.id === id);
    if (ticket) ticket.status = status;
    return ticket;
  }
};
