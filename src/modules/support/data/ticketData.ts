import type { Ticket } from '../types';

// Mock ticket data for Customer Support module
export const ticketData: Ticket[] = [
  {
    id: 'TCK-001',
    subject: 'App not loading',
    shortDesc: 'App freezes on startup',
    status: 'Open',
    urgency: 'High',
    createdAt: '2025-08-10',
    updatedAt: '2025-08-11',
    messages: [
      { id: 'm-1', from: 'user', text: 'The app is stuck on the loading screen.', date: '2025-08-10' },
      { id: 'm-2', from: 'support', text: 'We are looking into this issue.', date: '2025-08-11' }
    ],
    attachments: [],
    links: []
  },
  {
    id: 'TCK-002',
    subject: 'Feature request: Dark mode',
    shortDesc: 'Requesting system-wide dark theme',
    status: 'Closed',
    urgency: 'Low',
    createdAt: '2025-07-20',
    updatedAt: '2025-07-21',
    messages: [
      { id: 'm-3', from: 'user', text: 'Please add dark mode support.', date: '2025-07-20' },
      { id: 'm-4', from: 'support', text: 'Dark mode is now available!', date: '2025-07-21' }
    ],
    attachments: [],
    links: []
  }
];
