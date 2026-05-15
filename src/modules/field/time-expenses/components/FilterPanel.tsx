import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UserFilter } from './UserFilter';
import { TimeExpenseFilters, User, DateRange } from '../types';

interface FilterPanelProps {
  filters: TimeExpenseFilters;
  onFiltersChange: (filters: TimeExpenseFilters) => void;
  users: User[];
  className?: string;
}

export function FilterPanel({ filters, onFiltersChange, users, className }: FilterPanelProps) {
  const { t } = useTranslation();
  const [dateFromOpen, setDateFromOpen] = React.useState(false);
  const [dateToOpen, setDateToOpen] = React.useState(false);

  const updateFilters = (updates: Partial<TimeExpenseFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const updateDateRange = (updates: Partial<DateRange>) => {
    updateFilters({
      dateRange: { ...filters.dateRange, ...updates }
    });
  };

  const toggleEntryType = (type: 'time' | 'expense' | 'both') => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    updateFilters({ types: newTypes });
  };

  const toggleStatus = (status: 'pending' | 'approved' | 'rejected') => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilters({ status: newStatus });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
      },
      users: [],
      types: [],
      status: []
    });
  };

  const hasActiveFilters = filters.users.length > 0 || 
                          filters.types.length > 0 || 
                          filters.status.length > 0;

  const entryTypes = [
    { value: 'time', label: t('time-expenses:entry_types.time') },
    { value: 'expense', label: t('time-expenses:entry_types.expense') },
    { value: 'both', label: t('time-expenses:entry_types.both') }
  ] as const;

  const statusOptions = [
    { value: 'pending', label: t('time-expenses:status.pending') },
    { value: 'approved', label: t('time-expenses:status.approved') },
    { value: 'rejected', label: t('time-expenses:status.rejected') }
  ] as const;

  return (
    <Card className={cn("p-6 space-y-6 shadow-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {t('time-expenses:filters.title')}
          </h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            {t('common:clear')}
          </Button>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          {t('time-expenses:filters.date_range')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* From Date */}
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? (
                  format(filters.dateRange.from, "PPP")
                ) : (
                  <span>From date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.dateRange.from}
                onSelect={(date) => {
                  if (date) {
                    updateDateRange({ from: date });
                    setDateFromOpen(false);
                  }
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* To Date */}
          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.to ? (
                  format(filters.dateRange.to, "PPP")
                ) : (
                  <span>To date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.dateRange.to}
                onSelect={(date) => {
                  if (date) {
                    updateDateRange({ to: date });
                    setDateToOpen(false);
                  }
                }}
                disabled={(date) =>
                  filters.dateRange.from ? date < filters.dateRange.from : false
                }
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      {/* User Filter */}
      <UserFilter
        users={users}
        selectedUsers={filters.users}
        onUsersChange={(userIds) => updateFilters({ users: userIds })}
      />

      <Separator />

      {/* Entry Types Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          {t('time-expenses:filters.entry_types')}
        </label>
        <div className="flex flex-wrap gap-2">
          {entryTypes.map((type) => (
            <Button
              key={type.value}
              variant={filters.types.includes(type.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleEntryType(type.value)}
              className="text-xs"
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Status Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          {t('time-expenses:filters.status')}
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <Button
              key={status.value}
              variant={filters.status.includes(status.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatus(status.value)}
              className="text-xs"
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <>
          <Separator />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Filters
            </label>
            <div className="flex flex-wrap gap-1">
              {filters.users.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.users.length} user{filters.users.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {filters.types.map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {t(`time-expenses:entry_types.${type}`)}
                </Badge>
              ))}
              {filters.status.map(status => (
                <Badge key={status} variant="secondary" className="text-xs">
                  {t(`time-expenses:status.${status}`)}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}