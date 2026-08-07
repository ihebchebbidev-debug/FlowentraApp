import { CalendarApi, CalendarEventDto, CreateCalendarEventDto, UpdateCalendarEventDto } from "./calendarApi";
import type { CalendarEvent } from "../types";

// Helper functions to convert between frontend and backend formats
function convertDtoToEvent(dto: CalendarEventDto): CalendarEvent {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    start: new Date(dto.start),
    end: new Date(dto.end),
    allDay: dto.allDay,
    type: dto.type,
    status: dto.status,
    priority: dto.priority,
    category: dto.category,
    color: dto.color,
    location: dto.location,
    attendees: dto.attendees,
    relatedType: dto.relatedType,
    relatedId: dto.relatedId,
    contactId: dto.contactId,
    reminders: dto.reminders,
    recurring: dto.recurring,
    isPrivate: dto.isPrivate,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    createdBy: dto.createdBy,
    modifiedBy: dto.modifiedBy,
    contactName: dto.contactName,
    typeName: dto.typeName,
    eventAttendees: dto.eventAttendees?.map(att => ({
      ...att,
      respondedAt: att.respondedAt ? new Date(att.respondedAt) : undefined,
      createdAt: new Date(att.createdAt)
    })),
    eventReminders: dto.eventReminders?.map(rem => ({
      ...rem,
      sentAt: rem.sentAt ? new Date(rem.sentAt) : undefined,
      createdAt: new Date(rem.createdAt)
    }))
  };
}

function convertEventToCreateDto(event: Partial<CalendarEvent> & { title: string; start: Date; end: Date; type: string }): CreateCalendarEventDto {
  return {
    title: event.title,
    description: event.description,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    allDay: event.allDay || false,
    type: event.type,
    status: event.status || 'scheduled',
    priority: event.priority || 'medium',
    category: event.category,
    color: event.color,
    location: event.location,
    attendees: event.attendees,
    relatedType: event.relatedType,
    relatedId: event.relatedId,
    contactId: event.contactId,
    reminders: event.reminders,
    recurring: event.recurring,
    isPrivate: event.isPrivate || false,
    createdBy: event.createdBy || '00000000-0000-0000-0000-000000000000' // Default GUID
  };
}

function convertEventToUpdateDto(event: Partial<CalendarEvent>): UpdateCalendarEventDto {
  return {
    title: event.title,
    description: event.description,
    start: event.start?.toISOString(),
    end: event.end?.toISOString(),
    allDay: event.allDay,
    type: event.type,
    status: event.status,
    priority: event.priority,
    category: event.category,
    color: event.color,
    location: event.location,
    attendees: event.attendees,
    relatedType: event.relatedType,
    relatedId: event.relatedId,
    contactId: event.contactId,
    reminders: event.reminders,
    recurring: event.recurring,
    isPrivate: event.isPrivate,
    modifiedBy: event.modifiedBy
  };
}

export const CalendarService = {
  async list(): Promise<CalendarEvent[]> {
    try {
      const dtos = await CalendarApi.getAllEvents();
      return dtos.map(convertDtoToEvent);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      return [];
    }
  },

  async getByDateRange(start: Date, end: Date): Promise<CalendarEvent[]> {
    try {
      const dtos = await CalendarApi.getEventsByDateRange(start, end);
      return dtos.map(convertDtoToEvent);
    } catch (error) {
      console.error('Failed to fetch events by date range:', error);
      return [];
    }
  },

  async create(event: Partial<CalendarEvent> & { title: string; start: Date; end: Date; type: string }): Promise<CalendarEvent> {
    try {
      const createDto = convertEventToCreateDto(event);
      const resultDto = await CalendarApi.createEvent(createDto);
      return convertDtoToEvent(resultDto);
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  },

  async update(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const updateDto = convertEventToUpdateDto(patch);
      const resultDto = await CalendarApi.updateEvent(id, updateDto);
      return convertDtoToEvent(resultDto);
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await CalendarApi.deleteEvent(id);
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }
};
