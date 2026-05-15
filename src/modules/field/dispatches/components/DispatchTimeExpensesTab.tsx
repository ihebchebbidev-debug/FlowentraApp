import { useEffect, useRef, useState, useMemo } from "react";
import { getAuthHeaders } from '@/utils/apiHeaders';
import { API_URL } from '@/config/api';
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-time-picker";
import { DateNavigationWithTime } from "@/components/ui/time-only-picker";
import { Clock, DollarSign, Plus, Edit, Trash2, User, Settings2 } from "lucide-react";
import { dispatchesApi, type TimeEntry, type Expense } from "@/services/api/dispatchesApi";
import { toast } from "sonner";
import { logDispatchActivityWithPropagation, formatDurationForLog, calculateDurationMinutes } from "@/services/activityLogger";
import { useWorkTypes, useExpenseTypes } from "@/modules/lookups/hooks/useLookups";

interface DispatchTimeExpensesTabProps {
  dispatchId: number;
  dispatchStatus?: string;
  initialTimeEntries?: TimeEntry[];
  initialExpenses?: Expense[];
  onDataChange?: () => void;
}

// Default fallback options in case API returns empty
const defaultWorkTypeOptions = [
  { value: 'travel', label: 'Travel', color: undefined },
  { value: 'work', label: 'Work', color: undefined },
  { value: 'setup', label: 'Setup', color: undefined },
  { value: 'documentation', label: 'Documentation', color: undefined },
  { value: 'cleanup', label: 'Cleanup', color: undefined },
];

const defaultExpenseTypeOptions = [
  { value: 'travel', label: 'Travel', color: undefined },
  { value: 'meal', label: 'Meal', color: undefined },
  { value: 'parking', label: 'Parking', color: undefined },
  { value: 'supplies', label: 'Supplies', color: undefined },
  { value: 'other', label: 'Other', color: undefined },
];
// Backend stores TimeEntry.Duration as decimal(18,2) - supports very long durations

export function DispatchTimeExpensesTab({ 
  dispatchId,
  dispatchStatus,
  initialTimeEntries = [], 
  initialExpenses = [],
  onDataChange 
}: DispatchTimeExpensesTabProps) {
  // Only allow adding time/expenses when dispatch is in_progress (block closed, completed, cancelled, etc.)
  const canAddEntries = dispatchStatus === 'in_progress';
  const isClosedStatus = ['closed', 'completed', 'cancelled'].includes(dispatchStatus || '');
  const { t } = useTranslation('job-detail');
  const location = useLocation();
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;

  // Dynamic lookups for work types and expense types
  const { items: workTypeLookups, isLoading: workTypesLoading } = useWorkTypes();
  const { items: expenseTypeLookups, isLoading: expenseTypesLoading } = useExpenseTypes();

  // Memoize options with fallback to defaults if API returns empty
  const workTypeOptions = useMemo(() => {
    if (workTypeLookups.length > 0) {
      return workTypeLookups
        .filter(item => item.isActive)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(item => ({
          value: item.value || item.name.toLowerCase().replace(/\s+/g, '_'),
          label: item.name,
          color: item.color,
        }));
    }
    return defaultWorkTypeOptions;
  }, [workTypeLookups]);

  const expenseTypeOptions = useMemo(() => {
    if (expenseTypeLookups.length > 0) {
      return expenseTypeLookups
        .filter(item => item.isActive)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(item => ({
          value: item.value || item.name.toLowerCase().replace(/\s+/g, '_'),
          label: item.name,
          color: item.color,
        }));
    }
    return defaultExpenseTypeOptions;
  }, [expenseTypeLookups]);

  // API_URL imported from @/config/api at top of file
  
  // Get current user data from storage
  const getCurrentUserData = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        return {
          id: String(parsed.id || ''),
          name: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'Unknown'
        };
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return { id: '', name: 'Unknown' };
  };

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialTimeEntries);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const [technicianNamesById, setTechnicianNamesById] = useState<Record<string, string>>({});
  const inFlightTechnicianFetches = useRef<Set<string>>(new Set());

  const isLikelyNumericId = (value: string) => /^\d+$/.test(value);

  const fetchTechnicianNameById = async (technicianId: string): Promise<string | null> => {
    if (!technicianId || !isLikelyNumericId(technicianId)) return null;

    // Helper to extract name from response data
    const extractName = (data: any): string | null => {
      // Handle wrapped response { data: { firstName, lastName } }
      const user = data?.data || data;
      const firstName = user?.firstName || user?.FirstName || '';
      const lastName = user?.lastName || user?.LastName || '';
      const name = `${firstName} ${lastName}`.trim();
      if (name) return name;
      // Fallback to name field if present
      if (typeof user?.name === 'string' && user.name.trim()) return user.name.trim();
      return null;
    };

    // Try main admin endpoint first (MainAdminUsers table)
    try {
      const adminRes = await fetch(`${API_URL}/api/Auth/user/${technicianId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (adminRes.ok) {
        const data = await adminRes.json();
        const name = extractName(data);
        if (name) return name;
      }
    } catch {
      // ignore
    }

    // Fallback: regular users endpoint (Users table)
    try {
      const userRes = await fetch(`${API_URL}/api/Users/${technicianId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (userRes.ok) {
        const data = await userRes.json();
        const name = extractName(data);
        if (name) return name;
      }
    } catch {
      // ignore
    }

    return null;
  };

  // Resolve names for any technicianIds we see in timeEntries/expenses
  useEffect(() => {
    const ids = new Set<string>([
      ...timeEntries.map(e => e.technicianId).filter(Boolean),
      ...expenses.map(e => e.technicianId).filter(Boolean),
    ]);

    ids.forEach(async (id) => {
      if (!id) return;

      // If backend mistakenly sends the name in the ID field (e.g. "User Name"), don't fetch.
      if (!isLikelyNumericId(id)) return;
      if (technicianNamesById[id]) return;
      if (inFlightTechnicianFetches.current.has(id)) return;

      inFlightTechnicianFetches.current.add(id);
      try {
        const resolved = await fetchTechnicianNameById(id);
        if (resolved) {
          setTechnicianNamesById(prev => (prev[id] ? prev : { ...prev, [id]: resolved }));
        }
      } finally {
        inFlightTechnicianFetches.current.delete(id);
      }
    });
  }, [expenses, timeEntries, technicianNamesById]);

  // Get display name for a technician
  const getTechnicianDisplayName = (technicianName: string | undefined, technicianId: string) => {
    // 1) If backend returned a proper name, prefer it.
    if (technicianName && technicianName.trim()) return technicianName;

    // 2) If we resolved a name from Users/Admin endpoint, use it.
    const resolved = technicianNamesById[technicianId];
    if (resolved) return resolved;

    // 3) Get current user info for comparison
    const currentUser = getCurrentUserData();

    // 4) If technicianId matches current user's ID, return their name
    if (technicianId && technicianId === currentUser.id) return currentUser.name;

    // 5) If backend accidentally stored a generic name like "User Name" in technicianId,
    //    try to match it to the current user's session if applicable
    if (technicianId && !isLikelyNumericId(technicianId)) {
      // Common placeholder values that shouldn't be displayed
      const genericPlaceholders = ['user name', 'unknown', 'technician'];
      if (genericPlaceholders.includes(technicianId.toLowerCase().trim())) {
        // This is a placeholder, show current user's name if we have it
        if (currentUser.name && currentUser.name !== 'Unknown') {
          return currentUser.name;
        }
      }
      // Otherwise show the stored name as-is (it might be a real name)
      return technicianId;
    }

    return technicianId ? `Technician #${technicianId}` : 'Technician';
  };
  
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<number | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation modal state
  const [deleteTimeEntryId, setDeleteTimeEntryId] = useState<number | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<number | null>(null);

  // Get default work type from lookups
  const defaultWorkType = useMemo(() => {
    const defaultItem = workTypeLookups.find(item => item.isDefault && item.isActive);
    if (defaultItem) {
      return defaultItem.value || defaultItem.name.toLowerCase().replace(/\s+/g, '_');
    }
    return 'work';
  }, [workTypeLookups]);

  // Get default expense type from lookups
  const defaultExpenseType = useMemo(() => {
    const defaultItem = expenseTypeLookups.find(item => item.isDefault && item.isActive);
    if (defaultItem) {
      return defaultItem.value || defaultItem.name.toLowerCase().replace(/\s+/g, '_');
    }
    return 'travel';
  }, [expenseTypeLookups]);

  // Time entry form state
  const [timeEntryMode, setTimeEntryMode] = useState<'times' | 'duration'>('times');
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [timeFormData, setTimeFormData] = useState({
    workType: 'work',
    startTime: null as Date | null,
    endTime: null as Date | null,
    duration: 0,
    description: '',
  });

  // Expense form state
  const [expenseFormData, setExpenseFormData] = useState({
    type: 'travel',
    amount: 0,
    currency: 'TND',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Sync form state when defaults are loaded
  useEffect(() => {
    if (defaultWorkType && timeFormData.workType === 'work') {
      setTimeFormData(prev => ({ ...prev, workType: defaultWorkType }));
    }
  }, [defaultWorkType]);

  useEffect(() => {
    if (defaultExpenseType && expenseFormData.type === 'travel') {
      setExpenseFormData(prev => ({ ...prev, type: defaultExpenseType }));
    }
  }, [defaultExpenseType]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [timeData, expenseData] = await Promise.all([
          dispatchesApi.getTimeEntries(dispatchId),
          dispatchesApi.getExpenses(dispatchId),
        ]);
        setTimeEntries(timeData);
        setExpenses(expenseData);
      } catch (error) {
        console.error('Failed to fetch time/expenses:', error);
      }
    };
    fetchData();
  }, [dispatchId]);

  const resetTimeForm = () => {
    setTimeFormData({
      workType: defaultWorkType,
      startTime: null,
      endTime: null,
      duration: 0,
      description: '',
    });
    setDurationHours(0);
    setDurationMinutes(0);
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      type: defaultExpenseType,
      amount: 0,
      currency: 'TND',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Resolve start/end times from duration mode if needed
  const resolveTimesFromMode = (): { startTime: Date; endTime: Date } | null => {
    if (timeEntryMode === 'duration') {
      const totalMins = durationHours * 60 + durationMinutes;
      if (totalMins <= 0) {
        toast.error(t('dispatches.time_booking.invalid_duration', 'Please enter a valid duration'));
        return null;
      }
      const now = new Date();
      const start = new Date(now.getTime() - totalMins * 60000);
      return { startTime: start, endTime: now };
    }
    if (!timeFormData.startTime || !timeFormData.endTime) {
      toast.error(t('dispatches.time_booking.select_times', 'Please select start and end times'));
      return null;
    }
    if (timeFormData.endTime <= timeFormData.startTime) {
      toast.error(t('dispatches.time_booking.end_after_start', 'End time must be after start time'));
      return null;
    }
    return { startTime: timeFormData.startTime, endTime: timeFormData.endTime };
  };

  const handleAddTimeEntry = async () => {
    const times = resolveTimesFromMode();
    if (!times) return;

    setIsSubmitting(true);
    try {
      const currentUser = getCurrentUserData();
      const durationMins = calculateDurationMinutes(times.startTime, times.endTime);
      
      console.log('Submitting time entry for dispatch:', dispatchId, 'user:', currentUser);
      
      await dispatchesApi.addTimeEntry(dispatchId, {
        technicianId: currentUser.id,
        technicianName: currentUser.name,
        workType: timeFormData.workType,
        startTime: times.startTime.toISOString(),
        endTime: times.endTime.toISOString(),
        description: timeFormData.description || undefined,
        billable: true,
      });

      // Log activity with propagation to service order, sale, and offer
      await logDispatchActivityWithPropagation(dispatchId, {
        type: 'time_entry_added',
        userName: currentUser.name,
        workType: timeFormData.workType,
        duration: formatDurationForLog(durationMins),
        entityName: timeFormData.description || undefined,
      });

      toast.success(t('dispatches.time_booking.added_success', 'Time entry added successfully'));
      setIsTimeDialogOpen(false);
      resetTimeForm();
      
      // Refresh data
      const timeData = await dispatchesApi.getTimeEntries(dispatchId);
      setTimeEntries(timeData);
      onDataChange?.();
    } catch (error: any) {
      console.error('Failed to add time entry:', error);
      toast.error(error.message || 'Failed to add time entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExpense = async () => {
    if (expenseFormData.amount <= 0) {
      toast.error(t('dispatches.expense_booking.invalid_amount', 'Please enter a valid amount'));
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = getCurrentUserData();
      
      console.log('Submitting expense for dispatch:', dispatchId, 'user:', currentUser);
      
      await dispatchesApi.addExpense(dispatchId, {
        technicianId: currentUser.id,
        technicianName: currentUser.name,
        type: expenseFormData.type,
        amount: expenseFormData.amount,
        currency: expenseFormData.currency,
        description: expenseFormData.description || undefined,
        date: new Date(expenseFormData.date).toISOString(),
      });

      // Log activity with propagation
      await logDispatchActivityWithPropagation(dispatchId, {
        type: 'expense_added',
        userName: currentUser.name,
        expenseType: expenseFormData.type,
        amount: expenseFormData.amount,
        currency: expenseFormData.currency,
        entityName: expenseFormData.description || undefined,
      });

      toast.success(t('dispatches.expense_booking.added_success', 'Expense added successfully'));
      setIsExpenseDialogOpen(false);
      resetExpenseForm();
      
      // Refresh data
      const expenseData = await dispatchesApi.getExpenses(dispatchId);
      setExpenses(expenseData);
      onDataChange?.();
    } catch (error: any) {
      console.error('Failed to add expense:', error);
      toast.error(error.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete time entry handler - performs actual delete
  const handleConfirmDeleteTimeEntry = async () => {
    if (!deleteTimeEntryId) return;
    
    // Find the entry to log its details
    const entryToDelete = timeEntries.find(e => e.id === deleteTimeEntryId);
    const currentUser = getCurrentUserData();
    
    try {
      await dispatchesApi.deleteTimeEntry(dispatchId, deleteTimeEntryId);
      
      // Log activity with propagation
      if (entryToDelete) {
        const start = new Date(entryToDelete.startTime);
        const end = new Date(entryToDelete.endTime);
        const durationMinutes = calculateDurationMinutes(start, end);
        await logDispatchActivityWithPropagation(dispatchId, {
          type: 'time_entry_deleted',
          userName: currentUser.name,
          workType: entryToDelete.workType,
          duration: formatDurationForLog(durationMinutes),
        });
      }

      toast.success(t('dispatches.time_booking.deleted_success', 'Time entry deleted successfully'));
      
      // Refresh data
      const timeData = await dispatchesApi.getTimeEntries(dispatchId);
      setTimeEntries(timeData);
      onDataChange?.();
    } catch (error: any) {
      console.error('Failed to delete time entry:', error);
      toast.error(error.message || t('dispatches.time_booking.delete_failed', 'Failed to delete time entry'));
    } finally {
      setDeleteTimeEntryId(null);
    }
  };

  // Edit time entry handler - opens dialog with existing data
  const handleEditTimeEntry = (entry: TimeEntry) => {
    const start = new Date(entry.startTime);
    const end = new Date(entry.endTime);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    setTimeFormData({
      workType: entry.workType,
      startTime: start,
      endTime: end,
      duration: durationMinutes,
      description: entry.description || '',
    });
    setDurationHours(hours);
    setDurationMinutes(mins);
    setTimeEntryMode('times');
    setEditingTimeId(entry.id);
    setIsTimeDialogOpen(true);
  };

  // Update time entry handler
  const handleUpdateTimeEntry = async () => {
    const times = resolveTimesFromMode();
    if (!times || !editingTimeId) return;

    setIsSubmitting(true);
    try {
      const currentUser = getCurrentUserData();
      const durationMins = calculateDurationMinutes(times.startTime, times.endTime);

      await dispatchesApi.updateTimeEntry(dispatchId, editingTimeId, {
        workType: timeFormData.workType,
        startTime: times.startTime.toISOString(),
        endTime: times.endTime.toISOString(),
        description: timeFormData.description || undefined,
      });

      // Log activity with propagation
      await logDispatchActivityWithPropagation(dispatchId, {
        type: 'time_entry_updated',
        userName: currentUser.name,
        workType: timeFormData.workType,
        duration: formatDurationForLog(durationMins),
      });

      toast.success(t('dispatches.time_booking.updated_success', 'Time entry updated successfully'));
      setIsTimeDialogOpen(false);
      resetTimeForm();
      setEditingTimeId(null);
      
      // Refresh data
      const timeData = await dispatchesApi.getTimeEntries(dispatchId);
      setTimeEntries(timeData);
      onDataChange?.();
    } catch (error: any) {
      console.error('Failed to update time entry:', error);
      toast.error(error.message || t('dispatches.time_booking.update_failed', 'Failed to update time entry'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete expense handler - performs actual delete
  const handleConfirmDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    
    // Find the expense to log its details
    const expenseToDelete = expenses.find(e => e.id === deleteExpenseId);
    const currentUser = getCurrentUserData();
    
    try {
      await dispatchesApi.deleteExpense(dispatchId, deleteExpenseId);

      // Log activity with propagation
      if (expenseToDelete) {
        await logDispatchActivityWithPropagation(dispatchId, {
          type: 'expense_deleted',
          userName: currentUser.name,
          expenseType: expenseToDelete.type,
          amount: expenseToDelete.amount,
          currency: expenseToDelete.currency,
        });
      }

      toast.success(t('dispatches.expense_booking.deleted_success', 'Expense deleted successfully'));
      
      // Refresh data
      const expenseData = await dispatchesApi.getExpenses(dispatchId);
      setExpenses(expenseData);
      onDataChange?.();
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      toast.error(error.message || t('dispatches.expense_booking.delete_failed', 'Failed to delete expense'));
    } finally {
      setDeleteExpenseId(null);
    }
  };

  // Edit expense handler - opens dialog with existing data
  const handleEditExpense = (expense: Expense) => {
    setExpenseFormData({
      type: expense.type,
      amount: expense.amount,
      currency: expense.currency,
      description: expense.description || '',
      date: expense.date.split('T')[0],
    });
    setEditingExpenseId(expense.id);
    setIsExpenseDialogOpen(true);
  };

  // Update expense handler
  const handleUpdateExpense = async () => {
    if (expenseFormData.amount <= 0 || !editingExpenseId) {
      toast.error(t('dispatches.expense_booking.invalid_amount', 'Please enter a valid amount'));
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = getCurrentUserData();

      await dispatchesApi.updateExpense(dispatchId, editingExpenseId, {
        type: expenseFormData.type,
        amount: expenseFormData.amount,
        currency: expenseFormData.currency,
        description: expenseFormData.description || undefined,
        date: expenseFormData.date,
      });

      // Log activity with propagation
      await logDispatchActivityWithPropagation(dispatchId, {
        type: 'expense_updated',
        userName: currentUser.name,
        expenseType: expenseFormData.type,
        amount: expenseFormData.amount,
        currency: expenseFormData.currency,
      });

      toast.success(t('dispatches.expense_booking.updated_success', 'Expense updated successfully'));
      setIsExpenseDialogOpen(false);
      resetExpenseForm();
      setEditingExpenseId(null);
      
      // Refresh data
      const expenseData = await dispatchesApi.getExpenses(dispatchId);
      setExpenses(expenseData);
      onDataChange?.();
    } catch (error: any) {
      console.error('Failed to update expense:', error);
      toast.error(error.message || t('dispatches.expense_booking.update_failed', 'Failed to update expense'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get badge color from lookup color or use default palette
  const getWorkTypeBadgeColor = (type: string) => {
    // Check if type has a custom color from lookups
    const lookupItem = workTypeOptions.find(opt => opt.value === type);
    if (lookupItem?.color) {
      return `border-[${lookupItem.color}]/20`;
    }
    // Fallback to default colors
    const colors: Record<string, string> = {
      travel: 'bg-primary/10 text-primary border-primary/20',
      work: 'bg-success/10 text-success border-success/20',
      setup: 'bg-secondary text-secondary-foreground border-border',
      documentation: 'bg-warning/10 text-warning border-warning/20',
      cleanup: 'bg-muted text-muted-foreground border-border',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  // Get display label for work type from lookup
  const getWorkTypeLabel = (type: string) => {
    const option = workTypeOptions.find(opt => opt.value === type);
    return option?.label || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getExpenseTypeBadgeColor = (type: string) => {
    // Check if type has a custom color from lookups
    const lookupItem = expenseTypeOptions.find(opt => opt.value === type);
    if (lookupItem?.color) {
      return `border-[${lookupItem.color}]/20`;
    }
    // Fallback to default colors
    const colors: Record<string, string> = {
      travel: 'bg-primary/10 text-primary border-primary/20',
      meal: 'bg-warning/10 text-warning border-warning/20',
      parking: 'bg-secondary text-secondary-foreground border-border',
      supplies: 'bg-success/10 text-success border-success/20',
      other: 'bg-muted text-muted-foreground border-border',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  // Get display label for expense type from lookup
  const getExpenseTypeLabel = (type: string) => {
    const option = expenseTypeOptions.find(opt => opt.value === type);
    return option?.label || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const totalHours = timeEntries.reduce((sum, entry) => {
    const start = new Date(entry.startTime);
    const end = new Date(entry.endTime);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Tracking Section */}
        <div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-4">
            <h3 className="text-sm font-medium">
              {t('dispatches.time_booking.title', 'Time Tracking')} ({timeEntries.length})
            </h3>
            <Button 
              size="sm"
              variant="outline"
              className="border-border bg-background hover:bg-muted"
              onClick={() => {
                resetTimeForm();
                setEditingTimeId(null);
                setIsTimeDialogOpen(true);
              }}
              disabled={!canAddEntries}
              title={!canAddEntries ? (isClosedStatus ? 'Cannot add time entries to a closed dispatch' : 'Dispatch must be In Progress to add time entries') : undefined}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('dispatches.time_booking.add_time', 'Add Time')}
            </Button>
          </div>
          
          {timeEntries.length > 0 ? (
            <div className="space-y-3">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className={getWorkTypeBadgeColor(entry.workType)}>
                      {getWorkTypeLabel(entry.workType)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditTimeEntry(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTimeEntryId(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start:</span>
                      <span className="ml-2 font-medium">{format(new Date(entry.startTime), 'MMM dd, HH:mm')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End:</span>
                      <span className="ml-2 font-medium">{format(new Date(entry.endTime), 'MMM dd, HH:mm')}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {getTechnicianDisplayName(entry.technicianName, entry.technicianId)}
                    </span>
                    <span className="font-medium text-primary">{formatDuration(entry.startTime, entry.endTime)}</span>
                  </div>
                  {entry.description && (
                    <p className="text-sm text-muted-foreground mt-2 border-t pt-2">{entry.description}</p>
                  )}
                </div>
              ))}
              
              {/* Summary */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('dispatches.time_booking.total_hours', 'Total Hours')}</span>
                <span className="text-sm font-medium text-foreground">{totalHours.toFixed(1)}h</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-foreground mb-2">{t('dispatches.time_booking.no_entries', 'No Time Entries Yet')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('dispatches.time_booking.no_entries_hint', 'Start tracking your work time by adding your first time entry')}</p>
            </div>
          )}
        </div>

        {/* Expense Tracking Section */}
        <div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-4">
            <h3 className="text-sm font-medium">
              {t('dispatches.expense_booking.title', 'Expense Tracking')} ({expenses.length})
            </h3>
            <Button 
              size="sm"
              variant="outline"
              className="border-border bg-background hover:bg-muted"
              onClick={() => {
                resetExpenseForm();
                setEditingExpenseId(null);
                setIsExpenseDialogOpen(true);
              }}
              disabled={!canAddEntries}
              title={!canAddEntries ? (isClosedStatus ? 'Cannot add expenses to a closed dispatch' : 'Dispatch must be In Progress to add expenses') : undefined}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('dispatches.expense_booking.add_expense', 'Add Expense')}
            </Button>
          </div>
          
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className={getExpenseTypeBadgeColor(expense.type)}>
                      {getExpenseTypeLabel(expense.type)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteExpenseId(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {expense.date ? format(new Date(expense.date), 'MMM dd, yyyy') : 'No date'}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {getTechnicianDisplayName(expense.technicianName, expense.technicianId)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{expense.amount.toFixed(2)} {expense.currency}</span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground mt-2 border-t pt-2">{expense.description}</p>
                  )}
                </div>
              ))}
              
              {/* Summary */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('dispatches.expense_booking.total_expenses', 'Total Expenses')}</span>
                <span className="text-sm font-medium text-foreground">{totalExpenses.toFixed(2)} TND</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-foreground mb-2">{t('dispatches.expense_booking.no_expenses', 'No Expenses Yet')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('dispatches.expense_booking.no_expenses_hint', 'Track your project costs by adding your first expense')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Time Entry Dialog */}
      <Dialog open={isTimeDialogOpen} onOpenChange={setIsTimeDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editingTimeId ? t('dispatches.time_booking.edit_entry') : t('dispatches.time_booking.new_entry')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-1">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t('dispatches.time_booking.work_type')}</Label>
                <Link 
                  to={`/dashboard/lookups?tab=workTypes&returnUrl=${encodeURIComponent(currentPath)}`}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Settings2 className="h-3 w-3" />
                  {t('common.manage', 'Manage')}
                </Link>
              </div>
              <Select 
                value={timeFormData.workType} 
                onValueChange={(value) => setTimeFormData(prev => ({ ...prev, workType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('dispatches.time_booking.work_type')} />
                </SelectTrigger>
                <SelectContent>
                  {workTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={timeEntryMode === 'times' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setTimeEntryMode('times')}
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {t('dispatches.time_booking.start_end_time', 'Start / End Time')}
              </Button>
              <Button
                type="button"
                variant={timeEntryMode === 'duration' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setTimeEntryMode('duration')}
              >
                {t('dispatches.time_booking.duration', 'Duration')}
              </Button>
            </div>

            {timeEntryMode === 'times' ? (
              <>
                <DateNavigationWithTime
                  startTime={timeFormData.startTime}
                  endTime={timeFormData.endTime}
                  onStartTimeChange={(date) => {
                    setTimeFormData(prev => ({ ...prev, startTime: date }));
                    if (date && timeFormData.endTime) {
                      const durationMs = timeFormData.endTime.getTime() - date.getTime();
                      const dm = Math.round(durationMs / 60000);
                      if (dm > 0) {
                        setTimeFormData(prev => ({ ...prev, duration: dm }));
                      }
                    }
                  }}
                  onEndTimeChange={(date) => {
                    setTimeFormData(prev => ({ ...prev, endTime: date }));
                    if (date && timeFormData.startTime) {
                      const durationMs = date.getTime() - timeFormData.startTime.getTime();
                      const dm = Math.round(durationMs / 60000);
                      if (dm > 0) {
                        setTimeFormData(prev => ({ ...prev, duration: dm }));
                      }
                    }
                  }}
                  labels={{
                    today: t('dispatches.time_booking.today'),
                    goToToday: t('dispatches.time_booking.go_to_today'),
                    startTime: t('dispatches.time_booking.start_time'),
                    endTime: t('dispatches.time_booking.end_time'),
                    now: t('dispatches.time_booking.now'),
                  }}
                />
                {timeFormData.duration > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {t('dispatches.time_booking.duration')}: <span className="font-medium text-foreground">{Math.floor(timeFormData.duration / 60)}h {timeFormData.duration % 60}m</span>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <Label>{t('dispatches.time_booking.duration', 'Duration')}</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">{t('dispatches.time_booking.hours', 'Hours')}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={durationHours}
                      onChange={(e) => setDurationHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="text-center"
                    />
                  </div>
                  <span className="text-lg font-medium text-muted-foreground pt-5">:</span>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">{t('dispatches.time_booking.minutes', 'Minutes')}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      step={5}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="text-center"
                    />
                  </div>
                </div>
                {(durationHours > 0 || durationMinutes > 0) && (
                  <p className="text-sm text-muted-foreground">
                    {t('dispatches.time_booking.total', 'Total')}: <span className="font-medium text-foreground">{durationHours}h {durationMinutes}m</span>
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>{t('dispatches.time_booking.description_optional')}</Label>
              <Textarea
                value={timeFormData.description}
                onChange={(e) => setTimeFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('dispatches.time_booking.description_placeholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => { setIsTimeDialogOpen(false); setEditingTimeId(null); resetTimeForm(); }}>{t('dispatches.time_booking.cancel')}</Button>
            <Button onClick={editingTimeId ? handleUpdateTimeEntry : handleAddTimeEntry} disabled={isSubmitting}>
              {isSubmitting ? t('dispatches.time_booking.saving') : (editingTimeId ? t('dispatches.time_booking.update_entry') : t('dispatches.time_booking.add_entry'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editingExpenseId ? t('dispatches.expense_booking.edit_expense', 'Edit Expense') : t('dispatches.expense_booking.add_expense', 'Add Expense')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-1">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t('dispatches.expense_booking.expense_type', 'Expense Type')}</Label>
                <Link 
                  to={`/dashboard/lookups?tab=expenseTypes&returnUrl=${encodeURIComponent(currentPath)}`}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Settings2 className="h-3 w-3" />
                  {t('common.manage', 'Manage')}
                </Link>
              </div>
              <Select 
                value={expenseFormData.type} 
                onValueChange={(value) => setExpenseFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('dispatches.expense_booking.amount', 'Amount')} (TND)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseFormData.amount || ''}
                  onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>{t('dispatches.expense_booking.date', 'Date')}</Label>
                <DatePicker
                  value={expenseFormData.date ? new Date(expenseFormData.date) : undefined}
                  onChange={(date) => setExpenseFormData(prev => ({ ...prev, date: date?.toISOString().split('T')[0] || '' }))}
                />
              </div>
            </div>
            <div>
              <Label>{t('dispatches.expense_booking.description_optional', 'Description (Optional)')}</Label>
              <Textarea
                value={expenseFormData.description}
                onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('dispatches.expense_booking.description_placeholder', 'Describe the expense...')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => { setIsExpenseDialogOpen(false); setEditingExpenseId(null); resetExpenseForm(); }}>{t('dispatches.expense_booking.cancel', 'Cancel')}</Button>
            <Button onClick={editingExpenseId ? handleUpdateExpense : handleAddExpense} disabled={isSubmitting}>
              {isSubmitting ? t('dispatches.expense_booking.saving', 'Saving...') : (editingExpenseId ? t('dispatches.expense_booking.update_expense', 'Update Expense') : t('dispatches.expense_booking.add_expense', 'Add Expense'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Time Entry Confirmation Modal */}
      <AlertDialog open={deleteTimeEntryId !== null} onOpenChange={(open) => !open && setDeleteTimeEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>{t('delete_confirmation.time_entry_title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              {t('delete_confirmation.time_entry_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTimeEntryId(null)}>
              {t('delete_confirmation.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteTimeEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete_confirmation.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Expense Confirmation Modal */}
      <AlertDialog open={deleteExpenseId !== null} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>{t('delete_confirmation.expense_title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              {t('delete_confirmation.expense_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteExpenseId(null)}>
              {t('delete_confirmation.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete_confirmation.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </CardContent>
    </Card>
  );
}
