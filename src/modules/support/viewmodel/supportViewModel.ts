// State management and business logic for Customer Support
import { useState, useEffect } from 'react';
import { supportService } from '../services/supportService';
import type { Ticket, Message, FAQ } from '../types';

export function useSupportViewModel() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFaqs();
    fetchTickets();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    const data = await supportService.getFaqList();
    setFaqs(data);
    setLoading(false);
  };

  const fetchTickets = async () => {
    setLoading(true);
    const data = await supportService.getTickets();
    setTickets(data);
    setLoading(false);
  };

  const selectTicket = async (id: string) => {
    let ticket = tickets.find((t) => t.id === id);
    if (!ticket) {
      ticket = await supportService.getTicketById(id);
    }
    setSelectedTicket(ticket || null);
  };

  const createTicket = async (ticket: Partial<Ticket> & { attachments?: any[] }) : Promise<Ticket> => {
    setLoading(true);
    const created = await supportService.createTicket(ticket);
    await fetchTickets();
    setSelectedTicket(created);
    setLoading(false);
    return created;
  };

  const addReply = async (ticketId: string, message: Partial<Message>) : Promise<Message | null> => {
    setLoading(true);
    const created = await supportService.addReply(ticketId, message as Message);
    await fetchTickets();
    // refresh selected if it's the same
    if (selectedTicket && selectedTicket.id === ticketId) {
      const refreshed = (await supportService.getTicketById(ticketId)) as Ticket | null;
      setSelectedTicket(refreshed);
    }
    setLoading(false);
    return created;
  };

  const reopenTicket = async (id: string) => {
    setLoading(true);
    await supportService.reopenTicket(id);
    await fetchTickets();
    setLoading(false);
  };

  const updateTicketStatus = async (id: string, status: string) => {
    setLoading(true);
    await supportService.updateTicketStatus(id, status);
    await fetchTickets();
    setLoading(false);
  };

  return {
    faqs,
    tickets,
    selectedTicket,
    loading,
    fetchFaqs,
    fetchTickets,
    selectTicket,
    createTicket,
  addReply,
  reopenTicket,
    updateTicketStatus
  };
}
