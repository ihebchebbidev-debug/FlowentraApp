import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { startOfMonth, endOfMonth } from 'date-fns';
import { CustomCalendar } from '../components/CustomCalendar';
import { UserFilter } from '../components/UserFilter';
import { AddTimeExpenseDialog } from '../components/AddTimeExpenseDialog';

import { useTimeExpenseData } from '../hooks/useTimeExpenseData';
import { TimeExpenseFilters, DateRange, TimeExpenseEntry } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, FileText, Plus, Users, Receipt, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/usePermissions';
import { isViewAllMode } from '@/utils/tenant';

export default function TimeExpensesPage() {
  const { t } = useTranslation();
  const { hasPermission, canCreate, canUpdate, canDelete, isLoading: permissionsLoading, isMainAdmin } = usePermissions();
  
  // Permission checks (disabled in view-all mode)
  const viewAll = isViewAllMode();
  const hasReadAccess = isMainAdmin || hasPermission('time_tracking', 'read');
  const hasCreateAccess = isMainAdmin || canCreate('time_tracking');
  const hasUpdateAccess = isMainAdmin || canUpdate('time_tracking');
  const hasDeleteAccess = isMainAdmin || canDelete('time_tracking');

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeExpenseEntry | null>(null);
  const now = new Date();
  
  const [filters, setFilters] = useState<TimeExpenseFilters>({
    dateRange: {
      from: startOfMonth(now),
      to: endOfMonth(now)
    },
    users: [],
    types: [],
    status: []
  });

  const { users, getFilteredEntries, loading, error } = useTimeExpenseData(filters.dateRange);

  const handleMonthChange = useCallback((range: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  }, []);

  const filteredEntries = useMemo(() => {
    return getFilteredEntries(filters);
  }, [filters, getFilteredEntries]);

  const summaryStats = useMemo(() => {
    const totalTime = filteredEntries.reduce((sum, entry) => sum + entry.timeBooked, 0);
    const totalExpenses = filteredEntries.reduce((sum, entry) => sum + entry.expenses, 0);
    const uniqueUsers = new Set(filteredEntries.map(e => e.userId)).size;
    const uniqueServiceOrders = new Set(filteredEntries.filter(e => e.serviceOrderId).map(e => e.serviceOrderId)).size;
    
    return {
      totalTime,
      totalExpenses,
      uniqueUsers,
      uniqueServiceOrders,
      entriesCount: filteredEntries.length
    };
  }, [filteredEntries]);

  const formatTime = (minutes: number): string => {
    if (minutes === 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return '-';
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const formatCount = (count: number): string => {
    return count === 0 ? '-' : String(count);
  };

  const isInitialLoading = loading && filteredEntries.length === 0;

  // Access denied state - after all hooks
  if (!permissionsLoading && !hasReadAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{t('common.access_denied', 'Access Denied')}</h2>
          <p className="text-muted-foreground max-w-md">
            {t('common.no_permission_view', 'You do not have permission to view this module. Please contact your administrator.')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-destructive font-medium mb-2">{t('common:error')}</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header - Match Articles/Contacts top-bar style */}
      <header>
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{t('time-expenses:title')}</h1>
              <p className="text-[11px] text-muted-foreground">{t('time-expenses:subtitle')}</p>
            </div>
          </div>
          {hasCreateAccess && (
            <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('time-expenses:add_entry.button')}
            </Button>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden p-4 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-base font-semibold text-foreground truncate">{t('time-expenses:title')}</h1>
            </div>
            {hasCreateAccess && (
              <Button onClick={() => setShowAddDialog(true)} size="icon" variant="default" className="shrink-0 h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Filter Bar - Below header for consistency */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-end">
          <div className="w-80">
            <UserFilter
              users={users}
              selectedUsers={filters.users}
              onUsersChange={(userIds) => setFilters((prev) => ({ ...prev, users: userIds }))}
            />
          </div>
        </div>
      </div>

      <main className="p-6 space-y-6">
        {/* Summary Stats Cards - Dashboard CRM style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Time */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('time-expenses:stats.total_time')}</span>
              </div>
              {isInitialLoading ? (
                <Skeleton className="h-6 w-16 bg-primary/10" />
              ) : (
                <p className="text-lg font-bold text-foreground">{formatTime(summaryStats.totalTime)}</p>
              )}
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('time-expenses:stats.total_expenses')}</span>
              </div>
              {isInitialLoading ? (
                <Skeleton className="h-6 w-20 bg-primary/10" />
              ) : (
                <p className="text-lg font-bold text-foreground">{formatCurrency(summaryStats.totalExpenses)}</p>
              )}
            </CardContent>
          </Card>

          {/* Users */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('time-expenses:stats.users')}</span>
              </div>
              {isInitialLoading ? (
                <Skeleton className="h-6 w-8 bg-primary/10" />
              ) : (
                <p className="text-lg font-bold text-foreground">{formatCount(summaryStats.uniqueUsers)}</p>
              )}
            </CardContent>
          </Card>

          {/* Service Orders */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('time-expenses:stats.service_orders')}</span>
              </div>
              {isInitialLoading ? (
                <Skeleton className="h-6 w-8 bg-primary/10" />
              ) : (
                <p className="text-lg font-bold text-foreground">{formatCount(summaryStats.uniqueServiceOrders)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar - Always rendered immediately */}
        <div className="w-full">
          <CustomCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            entries={filteredEntries}
            onMonthChange={handleMonthChange}
            onEditEntry={(entry) => {
              setEditingEntry(entry);
              setShowAddDialog(true);
            }}
            className="w-full"
          />
        </div>
      </main>

      {/* Add Time/Expense Dialog */}
      <AddTimeExpenseDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingEntry(null);
        }}
        users={users}
        editingEntry={editingEntry}
      />
    </div>
  );
}