// Shared types for Support module
export type Attachment = {
  id: string;
  name: string;
  url?: string;
  size?: number;
  mime?: string;
};

export type Message = {
  id?: string;
  from: 'user' | 'support' | 'system';
  text: string;
  date: string; // ISO date or display date
  attachments?: Attachment[];
};

export type Ticket = {
  id: string;
  subject: string;
  shortDesc?: string;
  module?: string;
  category?: string;
  urgency?: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  status: 'Open' | 'Closed' | 'Pending' | 'Resolved' | string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  attachments?: Attachment[];
  links?: string[];
  assignee?: string;
  priority?: string;
};

export type FAQ = {
  id: number | string;
  question: string;
  answer: string;
  tags?: string[];
  updatedAt?: string;
  category?: string;
};
