import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; dotColor: string }> = {
  open: { label: 'Open', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: AlertTriangle, dotColor: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Clock, dotColor: 'bg-amber-500' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2, dotColor: 'bg-emerald-500' },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground border-border/50', icon: XCircle, dotColor: 'bg-muted-foreground/50' },
};

export const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
};

interface TicketStatusBadgeProps {
  status: string;
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <Badge variant="outline" className={`text-px-10 px-1.5 py-0 h-5 border font-medium ${cfg.color} ${className || ''}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${cfg.dotColor}`} />
      {cfg.label}
    </Badge>
  );
}

interface TicketUrgencyBadgeProps {
  urgency?: string;
  className?: string;
}

export function TicketUrgencyBadge({ urgency, className }: TicketUrgencyBadgeProps) {
  if (!urgency) return <span className="text-xs text-muted-foreground/40">—</span>;
  const cfg = URGENCY_CONFIG[urgency.toLowerCase()] || URGENCY_CONFIG.medium;
  return (
    <Badge variant="outline" className={`text-px-10 px-1.5 py-0 h-5 capitalize font-medium ${cfg.color} ${className || ''}`}>
      {cfg.label}
    </Badge>
  );
}
