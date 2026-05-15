import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeExpenseEntry, User, TimeExpenseFilters, TimeExpenseSummary } from '../types';
import { usersApi } from '@/services/usersApi';
import { dispatchesApi } from '@/services/api/dispatchesApi';

interface LoadingProgress {
  phase: 'idle' | 'dispatches' | 'entries' | 'done';
  current: number;
  total: number;
  message: string;
}

export function useTimeExpenseData(dateRange?: { from: Date; to: Date }) {
  const [streamedEntries, setStreamedEntries] = useState<TimeExpenseEntry[]>([]);
  const [progress, setProgress] = useState<LoadingProgress>({
    phase: 'idle',
    current: 0,
    total: 0,
    message: ''
  });
  const abortRef = useRef(false);

  // Fetch users dynamically from backend
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['time-expense-users'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Map backend users to the User type for this module, including MainAdminUser
  const users: User[] = useMemo(() => {
    const mappedUsers: User[] = [];
    
    // Include MainAdminUser (ID=1) from localStorage if available
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        const loginType = localStorage.getItem('login_type');
        // MainAdminUser is the business owner (ID=1), logged in via admin path
        if (loginType === 'admin' || String(parsed.id) === '1') {
          mappedUsers.push({
            id: String(parsed.id),
            name: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || parsed.email || 'Admin',
            email: parsed.email || '',
            role: 'Admin',
            hourlyRate: parsed.hourlyRate || 50,
            avatar: parsed.avatar || parsed.profilePicture || undefined,
          });
        }
      }
    } catch {}

    // Add regular users from API
    if (usersData?.users) {
      usersData.users.forEach((user: any) => {
        // Avoid duplicates (if MainAdmin is also in Users list)
        const userId = String(user.id);
        if (mappedUsers.some(u => u.id === userId)) return;
        
        mappedUsers.push({
          id: userId,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User',
          email: user.email || '',
          role: user.roles?.[0]?.name || user.role || 'User',
          hourlyRate: user.hourlyRate || 50,
          avatar: user.avatar || undefined,
        });
      });
    }
    
    return mappedUsers;
  }, [usersData]);

  const dateFromIso = dateRange?.from ? new Date(dateRange.from).toISOString() : null;
  const dateToIso = dateRange?.to ? new Date(dateRange.to).toISOString() : null;

  // Incremental data loading with streaming
  useEffect(() => {
    if (usersLoading || !dateFromIso || !dateToIso) return;

    abortRef.current = false;
    setStreamedEntries([]);
    setProgress({ phase: 'dispatches', current: 0, total: 0, message: 'Fetching dispatches...' });

    const loadData = async () => {
      try {
        // Build users map for quick lookup
        const usersMap = new Map<string, string>();
        if (usersData?.users) {
          usersData.users.forEach((user: any) => {
            const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';
            usersMap.set(String(user.id), name);
          });
        }

        // Fetch dispatches for the selected date range
        const PAGE_SIZE = 100;
        const MAX_PAGES = 20;
        const allDispatches: any[] = [];

        for (let page = 1; page <= MAX_PAGES; page += 1) {
          if (abortRef.current) return;
          
          const resp = await dispatchesApi.getAll({
            pageNumber: page,
            pageSize: PAGE_SIZE,
            dateFrom: dateFromIso!,
            dateTo: dateToIso!,
          });
          const pageItems = resp.data || [];
          allDispatches.push(...pageItems);

          setProgress({
            phase: 'dispatches',
            current: allDispatches.length,
            total: resp.totalItems || allDispatches.length,
            message: `Found ${allDispatches.length} dispatches...`
          });

          const total = resp.totalItems;
          if (typeof total === 'number' && allDispatches.length >= total) break;
          if (pageItems.length < PAGE_SIZE) break;
        }

        if (allDispatches.length === 0) {
          setProgress({ phase: 'done', current: 0, total: 0, message: 'No dispatches found' });
          return;
        }

        // Process dispatches in batches and stream results
        const BATCH_SIZE = 5;
        const totalDispatches = allDispatches.length;

        for (let i = 0; i < allDispatches.length; i += BATCH_SIZE) {
          if (abortRef.current) return;

          const batch = allDispatches.slice(i, i + BATCH_SIZE);
          setProgress({
            phase: 'entries',
            current: Math.min(i + BATCH_SIZE, totalDispatches),
            total: totalDispatches,
            message: `Loading entries (${Math.min(i + BATCH_SIZE, totalDispatches)}/${totalDispatches})...`
          });

          const batchResults = await Promise.all(
            batch.map(async (dispatch: any) => {
              const dispatchId = dispatch?.id;
              if (!dispatchId) return [];

              const serviceOrderLabel =
                dispatch?.serviceOrderId != null
                  ? `SO-${dispatch.serviceOrderId}`
                  : dispatch?.dispatchNumber
                    ? String(dispatch.dispatchNumber)
                    : undefined;

              const [timeEntries, expenses] = await Promise.all([
                Array.isArray(dispatch?.timeEntries)
                  ? Promise.resolve(dispatch.timeEntries)
                  : dispatchesApi.getTimeEntries(dispatchId).catch(() => []),
                Array.isArray(dispatch?.expenses)
                  ? Promise.resolve(dispatch.expenses)
                  : dispatchesApi.getExpenses(dispatchId).catch(() => []),
              ]);

              const entries: TimeExpenseEntry[] = [];

              for (const te of timeEntries) {
                const userId = String(te.technicianId || te.userId || te.createdBy || 'unknown');
                let userName = te.technicianName || te.userName || te.createdByName;
                if (!userName || userName === 'Unknown User' || String(userName).startsWith('User ')) {
                  userName = usersMap.get(userId) || userName || `User ${userId}`;
                }

                const rawStatus = te.status ?? (te.isApproved ? 'approved' : 'pending');
                const status = (String(rawStatus).toLowerCase() as 'pending' | 'approved' | 'rejected') || 'pending';

                entries.push({
                  id: `dispatch-time-${dispatchId}-${te.id ?? Math.random().toString(36).slice(2)}`,
                  userId,
                  userName,
                  serviceOrderId: serviceOrderLabel,
                  dispatchId: String(dispatchId),
                  date: new Date(te.startTime || te.date || te.createdAt || new Date()),
                  timeBooked: te.duration || 0,
                  expenses: 0,
                  hourlyRate: te.hourlyRate || 50,
                  description: te.description || te.workType || 'Time entry',
                  type: 'time',
                  status,
                  createdAt: new Date(te.createdAt || new Date()),
                  updatedAt: new Date(te.updatedAt || te.createdAt || new Date()),
                });
              }

              for (const exp of expenses) {
                const userId = String(exp.technicianId || exp.userId || exp.createdBy || 'unknown');
                let userName = exp.technicianName || exp.userName || exp.createdByName;
                if (!userName || userName === 'Unknown User' || String(userName).startsWith('User ')) {
                  userName = usersMap.get(userId) || userName || `User ${userId}`;
                }

                const rawStatus = exp.status ?? (exp.isApproved ? 'approved' : 'pending');
                const status = (String(rawStatus).toLowerCase() as 'pending' | 'approved' | 'rejected') || 'pending';

                entries.push({
                  id: `dispatch-expense-${dispatchId}-${exp.id ?? Math.random().toString(36).slice(2)}`,
                  userId,
                  userName,
                  serviceOrderId: serviceOrderLabel,
                  dispatchId: String(dispatchId),
                  date: new Date(exp.date || exp.createdAt || new Date()),
                  timeBooked: 0,
                  expenses: exp.amount || 0,
                  hourlyRate: 0,
                  description: exp.description || exp.type || 'Expense',
                  type: 'expense',
                  status,
                  createdAt: new Date(exp.createdAt || new Date()),
                  updatedAt: new Date(exp.updatedAt || exp.createdAt || new Date()),
                });
              }

              return entries;
            })
          );

          // Stream the batch results immediately
          const newEntries = batchResults.flat();
          if (newEntries.length > 0) {
            setStreamedEntries(prev => [...prev, ...newEntries]);
          }
        }

        setProgress({ phase: 'done', current: totalDispatches, total: totalDispatches, message: 'Complete' });
      } catch (err) {
        console.error('Error loading time expense data:', err);
        setProgress({ phase: 'done', current: 0, total: 0, message: 'Error loading data' });
      }
    };

    loadData();

    return () => {
      abortRef.current = true;
    };
  }, [usersLoading, usersData, dateFromIso, dateToIso]);

  // Sort entries by date (most recent first)
  const allEntries = useMemo(() => {
    return [...streamedEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [streamedEntries]);

  const filterEntries = (entries: TimeExpenseEntry[], filters: TimeExpenseFilters): TimeExpenseEntry[] => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);
      
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
      
      if (entryDate < fromDate || entryDate > toDate) {
        return false;
      }

      if (filters.users.length > 0 && !filters.users.includes(entry.userId)) {
        return false;
      }

      if (filters.types.length > 0 && !filters.types.includes(entry.type)) {
        return false;
      }

      if (filters.status.length > 0 && !filters.status.includes(entry.status)) {
        return false;
      }

      return true;
    });
  };

  const getFilteredEntries = useCallback((filters: TimeExpenseFilters): TimeExpenseEntry[] => {
    try {
      return filterEntries(allEntries, filters);
    } catch (err) {
      console.error('Error in getFilteredEntries:', err);
      return [];
    }
  }, [allEntries]);

  const getSummaryByUser = useCallback((entries: TimeExpenseEntry[]): TimeExpenseSummary[] => {
    const summaryMap = new Map<string, TimeExpenseSummary>();

    entries.forEach(entry => {
      const existing = summaryMap.get(entry.userId);
      const earnings = (entry.timeBooked / 60) * entry.hourlyRate;

      if (existing) {
        existing.totalTimeBooked += entry.timeBooked;
        existing.totalExpenses += entry.expenses;
        existing.totalEarnings += earnings;
        existing.entriesCount += 1;
      } else {
        summaryMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.userName,
          totalTimeBooked: entry.timeBooked,
          totalExpenses: entry.expenses,
          totalEarnings: earnings,
          entriesCount: 1
        });
      }
    });

    return Array.from(summaryMap.values()).sort((a, b) => 
      b.totalEarnings - a.totalEarnings
    );
  }, []);

  const isLoading = usersLoading || progress.phase === 'dispatches' || progress.phase === 'entries';
  const isStreaming = progress.phase === 'entries';

  return {
    users,
    allEntries,
    getFilteredEntries,
    getSummaryByUser,
    loading: usersLoading,
    isStreaming,
    progress,
    error: null,
  };
}
