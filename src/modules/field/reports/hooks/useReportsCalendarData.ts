import { useState, useEffect, useCallback, useMemo } from 'react';
import { dispatchesApi, type Dispatch } from '@/services/api/dispatchesApi';
import { usersApi } from '@/services/api/usersApi';
import { startOfMonth, endOfMonth, format, addDays, isWithinInterval } from 'date-fns';

export interface CalendarDispatch {
  id: number;
  dispatchNumber: string;
  title: string;
  contactName: string;
  technicianName: string;
  status: 'pending' | 'planned' | 'assigned' | 'confirmed' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  siteAddress?: string;
}

export interface MonthSummary {
  total: number;
  completed: number;
  inProgress: number;
  scheduled: number;
  pending: number;
  cancelled: number;
}

export interface DispatchesByDate {
  [dateKey: string]: CalendarDispatch[];
}

interface CalendarDataState {
  allDispatches: CalendarDispatch[];
  userMap: Map<string, string>;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

export function useReportsCalendarData(displayedMonth: Date) {
  const [state, setState] = useState<CalendarDataState>({
    allDispatches: [],
    userMap: new Map(),
    isLoading: true,
    error: null,
    hasLoaded: false,
  });

  const fetchDispatches = useCallback(async () => {
    // Skip if already loaded
    if (state.hasLoaded) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch users and dispatches in parallel
      const [usersResponse, dispatchesResponse] = await Promise.all([
        usersApi.getAll().catch(err => {
          console.warn('Failed to fetch users:', err);
          return { users: [] };
        }),
        dispatchesApi.getAll({ pageSize: 500 }).catch(err => {
          console.warn('Failed to fetch dispatches:', err);
          return { data: [] };
        }),
      ]);

      // Build user map
      const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse as any).users || [];
      const userMap = new Map<string, string>();
      users.forEach((user: any) => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
        userMap.set(user.id?.toString(), name);
      });

      const apiDispatches = dispatchesResponse.data || [];

      // Transform to CalendarDispatch format
      const calendarDispatches: CalendarDispatch[] = apiDispatches.map((d: Dispatch) => {
        // Get technician name from assignedTechnicians array or IDs
        let technicianName = 'Unassigned';
        if (d.assignedTechnicians && d.assignedTechnicians.length > 0) {
          technicianName = d.assignedTechnicians.map((t: any) => t.name || 'Tech').join(', ');
        } else if (d.technicianName) {
          technicianName = d.technicianName;
        } else if (d.assignedTechnicianIds && d.assignedTechnicianIds.length > 0) {
          const names = d.assignedTechnicianIds
            .map(id => userMap.get(id?.toString()) || 'Tech')
            .filter(Boolean);
          technicianName = names.length > 0 ? names.join(', ') : 'Assigned';
        }

        // Get scheduled date
        let scheduledDate = new Date();
        if (d.scheduledDate) {
          scheduledDate = new Date(d.scheduledDate);
        } else if (d.scheduling?.scheduledDate) {
          scheduledDate = new Date(d.scheduling.scheduledDate);
        }

        return {
          id: d.id,
          dispatchNumber: d.dispatchNumber || `D-${d.id}`,
          title: d.notes?.substring(0, 50) || `Dispatch #${d.dispatchNumber || d.id}`,
          contactName: d.contactName || 'Unknown Customer',
          technicianName,
          status: d.status,
          priority: d.priority,
          scheduledDate,
          scheduledStartTime: d.scheduledStartTime || d.scheduling?.scheduledStartTime,
          scheduledEndTime: d.scheduledEndTime || d.scheduling?.scheduledEndTime,
          siteAddress: d.siteAddress,
        };
      });

      setState({
        allDispatches: calendarDispatches,
        userMap,
        isLoading: false,
        error: null,
        hasLoaded: true,
      });
    } catch (err: any) {
      console.error('Failed to fetch dispatches:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to load dispatches',
      }));
    }
  }, [state.hasLoaded]);

  // Fetch on mount
  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  // Filter dispatches for displayed month (client-side)
  const dispatches = useMemo(() => {
    const monthStart = startOfMonth(displayedMonth);
    const monthEnd = endOfMonth(displayedMonth);
    
    return state.allDispatches.filter(d => {
      return isWithinInterval(d.scheduledDate, { start: monthStart, end: monthEnd });
    });
  }, [state.allDispatches, displayedMonth]);

  // Group dispatches by date
  const dispatchesByDate = useMemo<DispatchesByDate>(() => {
    const grouped: DispatchesByDate = {};
    dispatches.forEach(dispatch => {
      const dateKey = format(dispatch.scheduledDate, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(dispatch);
    });
    return grouped;
  }, [dispatches]);

  // Get dispatches for a specific date
  const getDispatchesForDate = useCallback((date: Date): CalendarDispatch[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return dispatchesByDate[dateKey] || [];
  }, [dispatchesByDate]);

  // Calculate month summary
  const monthSummary = useMemo<MonthSummary>(() => {
    return {
      total: dispatches.length,
      completed: dispatches.filter(d => d.status === 'completed').length,
      inProgress: dispatches.filter(d => d.status === 'in_progress').length,
      scheduled: dispatches.filter(d => d.status === 'assigned').length,
      pending: dispatches.filter(d => d.status === 'pending').length,
      cancelled: dispatches.filter(d => d.status === 'cancelled').length,
    };
  }, [dispatches]);

  // Get tomorrow's dispatches (from all dispatches)
  const tomorrowDispatches = useMemo(() => {
    const tomorrow = addDays(new Date(), 1);
    const tomorrowKey = format(tomorrow, 'yyyy-MM-dd');
    return state.allDispatches.filter(d => format(d.scheduledDate, 'yyyy-MM-dd') === tomorrowKey);
  }, [state.allDispatches]);

  const refetch = useCallback(() => {
    setState(prev => ({ ...prev, hasLoaded: false }));
  }, []);

  return {
    dispatches,
    dispatchesByDate,
    getDispatchesForDate,
    monthSummary,
    tomorrowDispatches,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}
