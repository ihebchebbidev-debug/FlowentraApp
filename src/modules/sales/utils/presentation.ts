import { getStatusColorClass } from '@/config/entity-statuses';

export const getStatusColor = (status: string) => {
  return getStatusColorClass('sale', status);
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-destructive text-destructive-foreground';
    case 'high':
      return 'bg-warning text-warning-foreground';
    case 'medium':
      return 'bg-warning text-warning-foreground';
    case 'low':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const formatDate = (date: string | Date) => new Date(date).toLocaleDateString();
