import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Clock, DollarSign, FileText } from 'lucide-react';
import { TimeExpenseEntry, User } from '../types';
import { cn } from '@/lib/utils';
import { CompanyBadge } from '@/components/CompanyBadge';
import { isViewAllMode } from '@/utils/tenant';

interface TimeExpenseTableProps {
  entries: TimeExpenseEntry[];
  users: User[];
  className?: string;
}

export function TimeExpenseTable({ entries, users, className }: TimeExpenseTableProps) {
  const { t } = useTranslation();

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}${t('time-expenses:time_format.minute_short')}`;
    if (mins === 0) return `${hours}${t('time-expenses:time_format.hour_short')}`;
    return `${hours}${t('time-expenses:time_format.hour_short')} ${mins}${t('time-expenses:time_format.minute_short')}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'time':
        return <Clock className="h-3 w-3" />;
      case 'expense':
        return <DollarSign className="h-3 w-3" />;
      case 'both':
        return <FileText className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  if (entries.length === 0) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {t('time-expenses:empty_states.no_entries')}
        </h3>
        <p className="text-muted-foreground">
          {t('time-expenses:empty_states.no_entries_description')}
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-card", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('time-expenses:table.technician')}</TableHead>
              <TableHead>{t('time-expenses:table.date')}</TableHead>
              <TableHead>{t('time-expenses:table.type')}</TableHead>
              <TableHead className="text-right">{t('time-expenses:table.time_booked')}</TableHead>
              <TableHead className="text-right">{t('time-expenses:table.expenses')}</TableHead>
              <TableHead className="text-right">{t('time-expenses:table.earnings')}</TableHead>
              <TableHead>{t('time-expenses:table.status')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('time-expenses:table.description')}</TableHead>
              {isViewAllMode() && (
                <TableHead className="w-[160px]">{t('time-expenses:table.company', 'Company')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const user = getUserById(entry.userId);
              const earnings = (entry.timeBooked / 60) * entry.hourlyRate;

              return (
                <TableRow key={entry.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="text-xs">
                          {user?.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {user?.name || entry.userName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.role}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(entry.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(entry.date), 'EEEE')}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(entry.type)}
                      <span className="text-sm font-medium">
                        {t(`time-expenses:entry_types.${entry.type}`)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {entry.timeBooked > 0 ? (
                      <span className="font-medium text-success">
                        {formatTime(entry.timeBooked)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {entry.expenses > 0 ? (
                      <span className="font-medium text-warning">
                        {formatCurrency(entry.expenses)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <span className="font-medium text-info">
                      {formatCurrency(earnings)}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getStatusColor(entry.status))}
                    >
                      {t(`time-expenses:status.${entry.status}`)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="hidden md:table-cell max-w-xs">
                    <p className="text-sm text-muted-foreground truncate" title={entry.description}>
                      {entry.description}
                    </p>
                    {(entry.serviceOrderId || entry.dispatchId) && (
                      <div className="flex gap-2 mt-1">
                        {entry.serviceOrderId && (
                          <Badge variant="secondary" className="text-xs">
                            SO: {entry.serviceOrderId}
                          </Badge>
                        )}
                        {entry.dispatchId && (
                          <Badge variant="secondary" className="text-xs">
                            Dispatch: {entry.dispatchId}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  {isViewAllMode() && (
                    <TableCell>
                      <CompanyBadge tenantId={(entry as any).tenantId} forceShow />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}