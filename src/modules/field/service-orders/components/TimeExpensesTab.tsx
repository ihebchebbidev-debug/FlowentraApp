import { useState, useEffect, useRef, useMemo } from "react";
import { getAuthHeaders } from '@/utils/apiHeaders';
import { ContentSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Edit, AlertCircle, Settings2, Clock, Receipt, Truck, User, Loader2, Upload } from "lucide-react";
import { useWorkTypes, useExpenseTypes } from "@/modules/lookups/hooks/useLookups";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { dispatchesApi, type Dispatch } from "@/services/api/dispatchesApi";
import { type ExpenseEntry } from "@/modules/field/dispatches/types";
// Using extended ExpenseEntry with aggregation fields
interface AggregatedExpenseEntry extends Omit<ExpenseEntry, 'dispatchId'> {
  serviceOrderId?: string;
  dispatchId?: number | string;
  dispatchNumber?: string;
  source?: 'dispatch' | 'service-order';
}

// DatePicker fallback - use Input type="date" if no DatePicker component exists
const DatePicker = ({ value, onChange, className }: { value?: Date; onChange: (date: Date | undefined) => void; className?: string }) => (
  <Input
    type="date"
    className={className}
    value={value ? format(value, 'yyyy-MM-dd') : ''}
    onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : undefined)}
  />
);

interface TimeExpensesTabProps {
  serviceOrder: any;
  timeEntries?: any[];
  expenses?: any[];
  onUpdate?: () => void;
}

interface AggregatedTimeEntry {
  id: string;
  serviceOrderId?: number;
  dispatchId?: number;
  dispatchNumber?: string;
  technicianId: string;
  technicianName: string;
  workType: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description: string;
  billable: boolean;
  hourlyRate?: number;
  totalCost?: number;
  source: 'dispatch' | 'service-order';
}

import { API_URL } from '@/config/api';

export function TimeExpensesTab({ serviceOrder, timeEntries: externalTimeEntries, expenses: externalExpenses, onUpdate }: TimeExpensesTabProps) {
  const { t } = useTranslation('service_orders');
  const location = useLocation();
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  
  // Dynamic lookups for work types and expense types
  const { items: workTypeLookups } = useWorkTypes();
  const { items: expenseTypeLookups } = useExpenseTypes();

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
    return [
      { value: 'work', label: 'Work', color: undefined },
      { value: 'travel', label: 'Travel', color: undefined },
      { value: 'setup', label: 'Setup', color: undefined },
      { value: 'cleanup', label: 'Cleanup', color: undefined },
      { value: 'documentation', label: 'Documentation', color: undefined },
    ];
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
    return [
      { value: 'travel', label: 'Travel', color: undefined },
      { value: 'meal', label: 'Meal', color: undefined },
      { value: 'accommodation', label: 'Accommodation', color: undefined },
      { value: 'materials', label: 'Materials', color: undefined },
      { value: 'other', label: 'Other', color: undefined },
    ];
  }, [expenseTypeLookups]);

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

  // Time entry mode: 'duration' = manual minutes, 'range' = from/to with auto-calc
  const [timeEntryMode, setTimeEntryMode] = useState<'duration' | 'range'>('duration');
  const [timeFrom, setTimeFrom] = useState('08:00');
  const [timeTo, setTimeTo] = useState('09:00');

  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dispatches for this service order
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoadingDispatches, setIsLoadingDispatches] = useState(false);
  const [selectedDispatchId, setSelectedDispatchId] = useState<number | null>(null);
  
  // Aggregated data from all dispatches + service order
  const [aggregatedTimeEntries, setAggregatedTimeEntries] = useState<AggregatedTimeEntry[]>([]);
  const [aggregatedExpenses, setAggregatedExpenses] = useState<AggregatedExpenseEntry[]>([]);
  const [isLoadingAggregatedData, setIsLoadingAggregatedData] = useState(false);


  // Technician name resolution
  const [technicianNamesById, setTechnicianNamesById] = useState<Record<string, string>>({});
  const inFlightTechnicianFetches = useRef<Set<string>>(new Set());

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

  // Check if an ID looks like a numeric user ID
  const isLikelyNumericId = (id: string) => /^\d+$/.test(id);

  // Fetch technician name by ID from backend
  const fetchTechnicianNameById = async (technicianId: string): Promise<string | null> => {
    if (!technicianId || !isLikelyNumericId(technicianId)) return null;

    const extractName = (data: any): string | null => {
      const user = data?.data || data;
      const firstName = user?.firstName || user?.FirstName || '';
      const lastName = user?.lastName || user?.LastName || '';
      const name = `${firstName} ${lastName}`.trim();
      if (name) return name;
      if (typeof user?.name === 'string' && user.name.trim()) return user.name.trim();
      return null;
    };

    // Try main admin endpoint first
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
    } catch { /* ignore */ }

    // Fallback: regular users endpoint
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
    } catch { /* ignore */ }

    return null;
  };

  // Resolve technician names
  useEffect(() => {
    const ids = new Set<string>([
      ...aggregatedTimeEntries.map(e => e.technicianId).filter(Boolean),
      ...aggregatedExpenses.map(e => e.technicianId).filter(Boolean),
    ]);

    ids.forEach(async (id) => {
      if (!id) return;
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
  }, [aggregatedExpenses, aggregatedTimeEntries, technicianNamesById]);

  // Get display name for a technician
  const getTechnicianDisplayName = (technicianName: string | undefined, technicianId: string) => {
    if (technicianName && technicianName.trim()) return technicianName;
    
    const resolved = technicianNamesById[technicianId];
    if (resolved) return resolved;
    
    const currentUser = getCurrentUserData();
    if (technicianId && technicianId === currentUser.id) return currentUser.name;
    
    if (technicianId && !isLikelyNumericId(technicianId)) {
      const genericPlaceholders = ['user name', 'unknown', 'technician'];
      if (genericPlaceholders.includes(technicianId.toLowerCase().trim())) {
        if (currentUser.name && currentUser.name !== 'Unknown') {
          return currentUser.name;
        }
      }
      return technicianId;
    }

    return technicianId ? `Technician #${technicianId}` : 'Technician';
  };

  // Fetch dispatches and all their time entries + expenses
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoadingDispatches(true);
      setIsLoadingAggregatedData(true);
      try {
        // Get dispatches for this service order
        const dispatchResult = await serviceOrdersApi.getDispatches(Number(serviceOrder.id));
        const dispatchList = dispatchResult || [];
        setDispatches(dispatchList);
        
        if (dispatchList.length > 0) {
          setSelectedDispatchId(dispatchList[0].id);
        }

        // Fetch time entries and expenses from all dispatches in parallel
        const dispatchDataPromises = dispatchList.map(async (dispatch: Dispatch) => {
          try {
            const [timeData, expenseData] = await Promise.all([
              dispatchesApi.getTimeEntries(dispatch.id),
              dispatchesApi.getExpenses(dispatch.id),
            ]);
            return {
              dispatch,
              timeEntries: timeData || [],
              expenses: expenseData || [],
            };
          } catch (error) {
            console.error(`Failed to fetch data for dispatch ${dispatch.id}:`, error);
            return { dispatch, timeEntries: [], expenses: [] };
          }
        });

        const dispatchDataResults = await Promise.all(dispatchDataPromises);

        // Aggregate time entries from all dispatches
        // Use Maps keyed by entry ID to deduplicate across service order and dispatch sources
        const timeEntryMap = new Map<string, AggregatedTimeEntry>();
        const expenseMap = new Map<string, AggregatedExpenseEntry>();

        // First add dispatch entries (they have richer metadata like dispatchNumber)
        dispatchDataResults.forEach(({ dispatch, timeEntries, expenses }) => {
          timeEntries.forEach((entry: any) => {
            const entryId = String(entry.id);
            if (!timeEntryMap.has(entryId)) {
              timeEntryMap.set(entryId, {
                id: entryId,
                serviceOrderId: dispatch.serviceOrderId,
                dispatchId: dispatch.id,
                dispatchNumber: dispatch.dispatchNumber || `#${dispatch.id}`,
                technicianId: String(entry.technicianId || ''),
                technicianName: entry.technicianName || '',
                workType: entry.workType || 'work',
                startTime: entry.startTime ? new Date(entry.startTime) : new Date(),
                endTime: entry.endTime ? new Date(entry.endTime) : undefined,
                duration: entry.duration || 0,
                description: entry.description || '',
                billable: entry.billable ?? true,
                hourlyRate: entry.hourlyRate,
                totalCost: entry.totalCost,
                source: 'dispatch',
              });
            }
          });

          expenses.forEach((exp: any) => {
            const expId = String(exp.id);
            if (!expenseMap.has(expId)) {
              expenseMap.set(expId, {
                id: expId,
                serviceOrderId: String(dispatch.serviceOrderId || serviceOrder.id),
                technicianId: String(exp.technicianId || ''),
                technicianName: exp.technicianName || '',
                type: (exp.type || 'other') as ExpenseEntry['type'],
                amount: exp.amount || 0,
                currency: exp.currency || 'TND',
                description: exp.description || '',
                date: exp.date ? new Date(exp.date) : new Date(),
                status: (exp.status || 'pending') as ExpenseEntry['status'],
                createdAt: new Date(),
                dispatchId: dispatch.id,
                dispatchNumber: dispatch.dispatchNumber || `#${dispatch.id}`,
                source: 'dispatch',
              });
            }
          });
        });

        // Then add service order's own entries only if not already present (avoids duplicates)
        (externalTimeEntries || []).forEach((entry: any) => {
          const entryId = String(entry.id);
          if (!timeEntryMap.has(entryId)) {
            timeEntryMap.set(entryId, {
              id: entryId,
              serviceOrderId: entry.serviceOrderId,
              dispatchId: entry.dispatchId,
              technicianId: String(entry.technicianId || ''),
              technicianName: entry.technicianName || '',
              workType: entry.workType || 'work',
              startTime: entry.startTime ? new Date(entry.startTime) : new Date(),
              endTime: entry.endTime ? new Date(entry.endTime) : undefined,
              duration: entry.duration || 0,
              description: entry.description || '',
              billable: entry.billable ?? true,
              hourlyRate: entry.hourlyRate,
              totalCost: entry.totalCost,
              source: 'service-order',
            });
          }
        });

        (externalExpenses || []).forEach((exp: any) => {
          const expId = String(exp.id);
          if (!expenseMap.has(expId)) {
            expenseMap.set(expId, {
              id: expId,
              serviceOrderId: String(exp.serviceOrderId || serviceOrder.id),
              technicianId: String(exp.technicianId || ''),
              technicianName: exp.technicianName || '',
              type: (exp.type || 'other') as ExpenseEntry['type'],
              amount: exp.amount || 0,
              currency: exp.currency || 'TND',
              description: exp.description || '',
              date: exp.date ? new Date(exp.date) : new Date(),
              status: (exp.status || 'pending') as ExpenseEntry['status'],
              createdAt: new Date(),
              dispatchId: exp.dispatchId,
              source: 'service-order',
            });
          }
        });

        const allTimeEntries = Array.from(timeEntryMap.values());
        const allExpenses = Array.from(expenseMap.values());

        setAggregatedTimeEntries(allTimeEntries);
        setAggregatedExpenses(allExpenses);
      } catch (error) {
        console.error('Failed to fetch dispatches:', error);
      } finally {
        setIsLoadingDispatches(false);
        setIsLoadingAggregatedData(false);
      }
    };
    
    fetchAllData();
  }, [serviceOrder.id, externalTimeEntries, externalExpenses]);

  // Time entry form state - use string type for dynamic values
  const [timeFormData, setTimeFormData] = useState({
    workType: "work",
    startTime: undefined as Date | undefined,
    endTime: undefined as Date | undefined,
    duration: 0,
    description: "",
    billable: true,
    hourlyRate: 85,
  });

  // Expense form state - use string type for dynamic values
  const [expenseFormData, setExpenseFormData] = useState({
    type: "travel",
    amount: 0,
    currency: "TND",
    description: "",
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

  const handleTimeSubmit = async () => {
    if (!timeFormData.duration || timeFormData.duration <= 0) {
      toast.error(t('time_booking.validation.duration_required'));
      return;
    }
    
    if (!selectedDispatchId && dispatches.length > 0) {
      toast.error(t('time_booking.validation.select_dispatch'));
      return;
    }

    if (!selectedDispatchId && dispatches.length === 0) {
      toast.error(t('time_booking.validation.no_dispatches'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      const currentUser = getCurrentUserData();
      
      let startTime: Date;
      let endTime: Date;

      if (timeEntryMode === 'range') {
        // Use today's date with the from/to times
        const today = new Date();
        const [fh, fm] = timeFrom.split(':').map(Number);
        const [th, tm] = timeTo.split(':').map(Number);
        startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), fh, fm);
        endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), th, tm);
      } else {
        // Calculate from duration
        const now = new Date();
        startTime = now;
        endTime = new Date(now.getTime() + timeFormData.duration * 60000);
      }
      
      const entryData = {
        technicianId: currentUser.id,
        technicianName: currentUser.name,
        workType: timeFormData.workType,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        description: timeFormData.description || undefined,
      };

      await dispatchesApi.addTimeEntry(selectedDispatchId!, entryData);
      toast.success(t('time_booking.add_entry'));
      
      setIsTimeDialogOpen(false);
      setEditingTimeId(null);
      resetTimeForm();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to save time entry:', error);
      toast.error(t('time_booking.validation.duration_required'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpenseSubmit = async () => {
    if (!expenseFormData.amount || expenseFormData.amount <= 0) {
      toast.error(t('expense_booking.invalid_amount', 'Amount is required'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      const currentUser = getCurrentUserData();
      
      const expenseData = {
        technicianId: currentUser.id,
        technicianName: currentUser.name,
        type: expenseFormData.type,
        amount: expenseFormData.amount,
        currency: expenseFormData.currency,
        description: expenseFormData.description || undefined,
        date: expenseFormData.date,
      };

      await serviceOrdersApi.addExpense(Number(serviceOrder.id), expenseData);
      toast.success(t('expense_booking.added_success', 'Expense added'));
      
      setIsExpenseDialogOpen(false);
      setEditingExpenseId(null);
      resetExpenseForm();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast.error(t('expense_booking.save_failed', 'Failed to save expense'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTimeEntry = async (entryId: string, dispatchId?: number) => {
    try {
      if (dispatchId) {
        await dispatchesApi.deleteTimeEntry(dispatchId, Number(entryId));
      } else {
        await serviceOrdersApi.deleteTimeEntry(Number(serviceOrder.id), Number(entryId));
      }
      toast.success(t('time_booking.deleted_success', 'Time entry deleted'));
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      toast.error(t('time_booking.delete_failed', 'Failed to delete time entry'));
    }
  };

  const handleDeleteExpense = async (expenseId: string, dispatchId?: number) => {
    try {
      if (dispatchId) {
        await dispatchesApi.deleteExpense(dispatchId, Number(expenseId));
      } else {
        await serviceOrdersApi.deleteExpense(Number(serviceOrder.id), Number(expenseId));
      }
      toast.success(t('expense_booking.deleted_success', 'Expense deleted'));
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast.error(t('expense_booking.delete_failed', 'Failed to delete expense'));
    }
  };

  const handleEditTime = (entry: AggregatedTimeEntry) => {
    setEditingTimeId(entry.id);
    setTimeFormData({
      workType: entry.workType,
      startTime: entry.startTime ? new Date(entry.startTime) : undefined,
      endTime: entry.endTime ? new Date(entry.endTime) : undefined,
      duration: entry.duration,
      description: entry.description,
      billable: entry.billable,
      hourlyRate: entry.hourlyRate || 85,
    });
    if (entry.dispatchId) {
      setSelectedDispatchId(entry.dispatchId);
    }
    setIsTimeDialogOpen(true);
  };

  const handleEditExpense = (expense: AggregatedExpenseEntry) => {
    setEditingExpenseId(expense.id);
    setExpenseFormData({
      type: expense.type as any,
      amount: expense.amount,
      currency: expense.currency,
      description: expense.description,
      date: format(expense.date, 'yyyy-MM-dd'),
    });
    setIsExpenseDialogOpen(true);
  };

  const resetTimeForm = () => {
    setTimeFormData({
      workType: defaultWorkType,
      startTime: undefined,
      endTime: undefined,
      duration: 0,
      description: "",
      billable: true,
      hourlyRate: 85,
    });
    setTimeFrom('08:00');
    setTimeTo('09:00');
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      type: defaultExpenseType,
      amount: 0,
      currency: "TND", 
      description: "",
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success border-success/20";
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  // Get badge color - use lookup color if available, otherwise use semantic defaults
  const getWorkTypeBadgeColor = (workType: string) => {
    const option = workTypeOptions.find(opt => opt.value === workType);
    if (option?.color) {
      // Use custom hex color from lookup
      return `border-transparent`;
    }
    // Semantic defaults
    switch (workType) {
      case "work":
        return "bg-primary/10 text-primary border-primary/20";
      case "travel":
        return "bg-secondary/10 text-secondary-foreground border-secondary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Get badge style for custom color
  const getWorkTypeBadgeStyle = (workType: string): React.CSSProperties => {
    const option = workTypeOptions.find(opt => opt.value === workType);
    if (option?.color) {
      return {
        backgroundColor: `${option.color}20`,
        color: option.color,
        borderColor: `${option.color}40`,
      };
    }
    return {};
  };

  // Get work type label from options
  const getWorkTypeLabel = (workType: string) => {
    const option = workTypeOptions.find(opt => opt.value === workType);
    return option?.label || workType;
  };

  // Get expense type badge color and style
  const getExpenseTypeBadgeColor = (expenseType: string) => {
    const option = expenseTypeOptions.find(opt => opt.value === expenseType);
    if (option?.color) {
      return `border-transparent`;
    }
    return "bg-muted text-muted-foreground";
  };

  const getExpenseTypeBadgeStyle = (expenseType: string): React.CSSProperties => {
    const option = expenseTypeOptions.find(opt => opt.value === expenseType);
    if (option?.color) {
      return {
        backgroundColor: `${option.color}20`,
        color: option.color,
        borderColor: `${option.color}40`,
      };
    }
    return {};
  };

  const getExpenseTypeLabel = (expenseType: string) => {
    const option = expenseTypeOptions.find(opt => opt.value === expenseType);
    return option?.label || expenseType;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}

      {isLoadingAggregatedData ? (
        <ContentSkeleton rows={8} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Tracking Section */}
          <div>
            <div className="flex flex-row items-center justify-between space-y-0 pb-4">
              <h3 className="text-sm font-medium">
                {t('time_booking.title')} ({aggregatedTimeEntries.length})
              </h3>
              <Dialog open={isTimeDialogOpen} onOpenChange={setIsTimeDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-border bg-background hover:bg-muted"
                    onClick={() => {
                      resetTimeForm();
                      setEditingTimeId(null);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('time_booking.add_time')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
                  <DialogHeader className="shrink-0">
                    <DialogTitle>
                      {editingTimeId ? t('time_booking.edit_time') : t('time_booking.add_time')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 overflow-y-auto flex-1 pr-1">
                    {/* Dispatch Selector */}
                    {dispatches.length > 0 && (
                      <div>
                        <Label>{t('time_booking.dispatch')}</Label>
                        <Select 
                          value={selectedDispatchId?.toString() || ''} 
                          onValueChange={(value) => setSelectedDispatchId(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('time_booking.select_dispatch')} />
                          </SelectTrigger>
                          <SelectContent>
                            {dispatches.map((dispatch) => (
                              <SelectItem key={dispatch.id} value={dispatch.id.toString()}>
                                {dispatch.dispatchNumber || `Dispatch #${dispatch.id}`} - {dispatch.status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {dispatches.length === 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {t('time_booking.no_dispatches')}
                        </AlertDescription>
                      </Alert>
                    )}
                    {/* Work Type Selector - Dynamic from lookups */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>{t('time_booking.work_type')}</Label>
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {workTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                {option.color && (
                                  <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: option.color }}
                                  />
                                )}
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Mode Switch */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t('time_booking.entry_mode', 'Entry Mode')}</Label>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs", timeEntryMode === 'duration' ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                          {t('time_booking.mode_duration', 'Duration')}
                        </span>
                        <Switch
                          checked={timeEntryMode === 'range'}
                          onCheckedChange={(checked) => setTimeEntryMode(checked ? 'range' : 'duration')}
                        />
                        <span className={cn("text-xs", timeEntryMode === 'range' ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                          {t('time_booking.mode_range', 'From / To')}
                        </span>
                      </div>
                    </div>

                    {timeEntryMode === 'duration' ? (
                      /* Duration Input - Hours */
                      <div>
                        <Label>{t('time_booking.duration_hours', 'Duration (hours)')}</Label>
                        <Input 
                          type="number"
                          min="0.25"
                          step="0.25"
                          value={timeFormData.duration > 0 ? parseFloat((timeFormData.duration / 60).toFixed(2)) : ''}
                          onChange={(e) => {
                            const hours = parseFloat(e.target.value) || 0;
                            setTimeFormData(prev => ({ ...prev, duration: Math.round(hours * 60) }));
                          }}
                          placeholder="1.5"
                        />
                      </div>
                    ) : (
                      /* From / To time pickers with auto-calculated duration */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>{t('time_booking.time_from', 'From')}</Label>
                            <Input 
                              type="time"
                              value={timeFrom}
                              onChange={(e) => {
                                setTimeFrom(e.target.value);
                                // Auto-calculate duration
                                if (e.target.value && timeTo) {
                                  const [fh, fm] = e.target.value.split(':').map(Number);
                                  const [th, tm] = timeTo.split(':').map(Number);
                                  const diff = (th * 60 + tm) - (fh * 60 + fm);
                                  setTimeFormData(prev => ({ ...prev, duration: diff > 0 ? diff : 0 }));
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>{t('time_booking.time_to', 'To')}</Label>
                            <Input 
                              type="time"
                              value={timeTo}
                              onChange={(e) => {
                                setTimeTo(e.target.value);
                                // Auto-calculate duration
                                if (timeFrom && e.target.value) {
                                  const [fh, fm] = timeFrom.split(':').map(Number);
                                  const [th, tm] = e.target.value.split(':').map(Number);
                                  const diff = (th * 60 + tm) - (fh * 60 + fm);
                                  setTimeFormData(prev => ({ ...prev, duration: diff > 0 ? diff : 0 }));
                                }
                              }}
                            />
                          </div>
                        </div>
                        {timeFormData.duration > 0 && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {t('time_booking.calculated_duration', 'Calculated duration')}: <span className="font-medium text-foreground">{Math.floor(timeFormData.duration / 60)}h {timeFormData.duration % 60}m</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <Label>{t('time_booking.description')}</Label>
                      <Textarea 
                        value={timeFormData.description}
                        onChange={(e) => setTimeFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={t('time_booking.description_placeholder')}
                      />
                    </div>
                  </div>
                  <DialogFooter className="shrink-0 pt-4 border-t">
                    <Button variant="outline" onClick={() => {
                      setIsTimeDialogOpen(false);
                      setEditingTimeId(null);
                      resetTimeForm();
                    }}>
                      {t('time_booking.cancel')}
                    </Button>
                    <Button onClick={handleTimeSubmit} disabled={isSubmitting || dispatches.length === 0}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('time_booking.saving')}
                        </>
                      ) : (
                        editingTimeId ? t('time_booking.update_entry') : t('time_booking.add_entry')
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="max-h-[500px] overflow-y-auto pr-2">
              {aggregatedTimeEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    {t('time_booking.no_entries', 'No Time Entries Yet')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('time_booking.no_entries_hint', 'Start tracking your work time by adding your first time entry')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aggregatedTimeEntries.map((entry) => (
                    <div key={`${entry.source}-${entry.id}`} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="secondary" 
                            className={getWorkTypeBadgeColor(entry.workType)}
                            style={getWorkTypeBadgeStyle(entry.workType)}
                          >
                            {getWorkTypeLabel(entry.workType)}
                          </Badge>
                          {entry.source === 'dispatch' && entry.dispatchNumber && (
                            <Badge variant="outline" className="text-xs">
                              <Truck className="h-3 w-3 mr-1" />
                              {entry.dispatchNumber}
                            </Badge>
                          )}
                          {entry.source === 'service-order' && (
                            <Badge variant="outline" className="text-xs bg-accent/50 text-accent-foreground border-accent">
                              {t('time_booking.service_order_source', 'Service Order')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditTime(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDeleteTimeEntry(entry.id, entry.dispatchId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">{t('time_booking.start_time', 'Start Time')}</span>
                          <div className="font-medium">{format(entry.startTime, 'dd/MM/yyyy HH:mm')}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('time_booking.end_time', 'End Time')}</span>
                          <div className="font-medium">
                            {entry.endTime ? format(entry.endTime, 'dd/MM/yyyy HH:mm') : '-'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('time_booking.technician', 'Technician')}</span>
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getTechnicianDisplayName(entry.technicianName, entry.technicianId)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('time_booking.duration_label', 'Duration')}</span>
                          <div className="font-medium">{formatDuration(entry.duration)}</div>
                        </div>
                      </div>
                      {entry.description && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{entry.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expense Tracking Section */}
          <div>
            <div className="flex flex-row items-center justify-between space-y-0 pb-4">
              <h3 className="text-sm font-medium">
                {t('expense_booking.title')} ({aggregatedExpenses.length})
              </h3>
              <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-border bg-background hover:bg-muted"
                    onClick={() => {
                      resetExpenseForm();
                      setEditingExpenseId(null);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('expense_booking.add_expense', 'Add Expense')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
                  <DialogHeader className="shrink-0">
                    <DialogTitle>
                      {editingExpenseId ? t('expense_booking.edit_expense', 'Edit Expense') : t('expense_booking.add_expense', 'Add Expense')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 overflow-y-auto flex-1 pr-1">
                    {/* Expense Type Selector - Dynamic from lookups */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>{t('expense_booking.expense_type')}</Label>
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                {option.color && (
                                  <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: option.color }}
                                  />
                                )}
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('expense_booking.amount')} (TND)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={expenseFormData.amount}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>{t('expense_booking.date')}</Label>
                      <DatePicker
                        value={expenseFormData.date ? new Date(expenseFormData.date) : undefined}
                        onChange={(date) => setExpenseFormData(prev => ({ 
                          ...prev, 
                          date: date ? format(date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0] 
                        }))}
                      />
                    </div>
                    <div>
                      <Label>{t('expense_booking.description', 'Description')}</Label>
                      <Textarea 
                        value={expenseFormData.description}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={t('expense_booking.description_placeholder', 'Describe the expense...')}
                      />
                    </div>
                    <div>
                      <Label>{t('expense_booking.receipt')}</Label>
                      <div className="mt-2">
                        <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors">
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground/60" />
                            <div className="text-sm">
                              <span className="font-medium text-primary cursor-pointer hover:underline">
                                {t('expense_booking.click_to_upload', 'Click to upload')}
                              </span>
                              <span className="text-muted-foreground"> {t('expense_booking.or_drag_drop', 'or drag and drop')}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('expense_booking.file_types', 'PDF, JPG, PNG up to 10MB')}
                            </p>
                          </div>
                          <input 
                            type="file" 
                            accept=".pdf,.jpg,.jpeg,.png" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="shrink-0 pt-4 border-t">
                    <Button variant="outline" onClick={() => {
                      setIsExpenseDialogOpen(false);
                      setEditingExpenseId(null);
                      resetExpenseForm();
                    }}>
                      {t('expense_booking.cancel', 'Cancel')}
                    </Button>
                    <Button onClick={handleExpenseSubmit} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('expense_booking.saving', 'Saving...')}
                        </>
                      ) : (
                        editingExpenseId ? t('expense_booking.update_expense', 'Update Expense') : t('expense_booking.add_expense', 'Add Expense')
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="max-h-[500px] overflow-y-auto pr-2">
              {aggregatedExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    {t('expense_booking.no_expenses', 'No Expenses Yet')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('expense_booking.no_expenses_hint', 'Track your project costs by adding your first expense')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aggregatedExpenses.map((expense) => (
                    <div key={`${expense.source}-${expense.id}`} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="secondary" 
                            className={getExpenseTypeBadgeColor(expense.type)}
                            style={getExpenseTypeBadgeStyle(expense.type)}
                          >
                            {getExpenseTypeLabel(expense.type)}
                          </Badge>
                          {expense.source === 'dispatch' && expense.dispatchNumber && (
                            <Badge variant="outline" className="text-xs">
                              <Truck className="h-3 w-3 mr-1" />
                              {expense.dispatchNumber}
                            </Badge>
                          )}
                          {expense.source === 'service-order' && (
                            <Badge variant="outline" className="text-xs bg-accent/50 text-accent-foreground border-accent">
                              {t('expense_booking.service_order_source', 'Service Order')}
                            </Badge>
                          )}
                        </div>
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
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDeleteExpense(expense.id, typeof expense.dispatchId === 'number' ? expense.dispatchId : undefined)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">{t('expense_booking.amount', 'Amount')}</span>
                          <div className="font-medium text-primary">{expense.amount.toFixed(2)} {expense.currency}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('expense_booking.date', 'Date')}</span>
                          <div className="font-medium">{format(expense.date, 'dd/MM/yyyy')}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('expense_booking.technician', 'Technician')}</span>
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getTechnicianDisplayName(expense.technicianName, expense.technicianId)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('expense_booking.status', 'Status')}</span>
                          <Badge variant="outline" className={`text-xs ${getStatusBadgeColor(expense.status)}`}>
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                      {expense.description && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
