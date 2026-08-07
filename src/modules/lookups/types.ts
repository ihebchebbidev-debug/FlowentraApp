import { Calendar, CheckSquare, DollarSign, Briefcase, Tag } from "lucide-react";

export type Category = 'todos' | 'events' | 'services' | 'currencies' | 'technicians' | 'leavetypes' | 'priorities';
export type Group = 'crm' | 'field';

export const colorOptions = [
  '#64748b', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6'
];

export const getCategoryIcon = (key: Category) => {
  switch (key) {
    case 'todos':
      return CheckSquare;
    case 'events':
      return Calendar;
    case 'currencies':
      return DollarSign;
    case 'services':
      return Briefcase;
    case 'technicians':
      return Briefcase;
      case 'leavetypes':
        return Calendar;
    default:
      return Tag;
  }
};

export const getCategoryTitle = (key: Category) => {
  switch (key) {
    case 'todos':
      return 'Task Status Types';
    case 'events':
      return 'Event Types';
    case 'currencies':
      return 'Currencies';
    case 'services':
      return 'Service Categories';
    case 'technicians':
      return 'Technician Statuses';
      case 'leavetypes':
        return 'Leave Types';
    case 'priorities':
      return 'Priority Levels';
    default:
      return 'Items';
  }
};

export const GROUP_CATEGORIES: Record<Group, Category[]> = {
  crm: ['todos', 'events', 'services', 'currencies', 'priorities'],
  field: ['technicians', 'leavetypes'],
};
