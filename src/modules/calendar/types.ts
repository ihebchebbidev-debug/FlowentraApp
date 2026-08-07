// Frontend Calendar Types - Converted from Backend DTOs
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: string;
  status: string;
  priority: string;
  category?: string;
  color?: string;
  location?: string;
  attendees?: string;
  relatedType?: string;
  relatedId?: string;
  contactId?: number;
  reminders?: string;
  recurring?: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy?: string;
  contactName?: string;
  typeName?: string;
  eventAttendees?: EventAttendee[];
  eventReminders?: EventReminder[];
  /** Type-specific metadata for richer display */
  metadata?: {
    amount?: number;
    currency?: string;
    contactName?: string;
    technicianName?: string;
    jobNumber?: string;
    orderNumber?: string;
    offerNumber?: string;
    saleNumber?: string;
    estimatedDuration?: number;
    serviceOrderId?: string;
    customerAddress?: string;
    assignedTo?: string;
  };
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  ownerId: string;
  visibility: 'private' | 'public' | 'shared';
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttendee {
  id: string;
  eventId: string;
  userId?: string;
  email?: string;
  name?: string;
  status: string;
  response?: string;
  respondedAt?: Date;
  createdAt: Date;
}

export interface EventReminder {
  id: string;
  eventId: string;
  type: string;
  minutesBefore: number;
  isActive: boolean;
  sentAt?: Date;
  createdAt: Date;
}
