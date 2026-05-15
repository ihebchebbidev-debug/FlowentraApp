import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Clock, DollarSign, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { dispatchesApi } from '@/services/api/dispatchesApi';
import { User, TimeExpenseEntry } from '../types';

interface AddTimeExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  onSuccess?: () => void;
  /** When provided, the dialog opens in edit mode with pre-filled values */
  editingEntry?: TimeExpenseEntry | null;
}

interface DispatchOption {
  id: number;
  label: string;
  serviceOrderId?: string;
}

export function AddTimeExpenseDialog({
  open,
  onOpenChange,
  users,
  onSuccess,
  editingEntry,
}: AddTimeExpenseDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!editingEntry;
  const [activeTab, setActiveTab] = useState<'time' | 'expense'>('time');
  const [submitting, setSubmitting] = useState(false);

  // Dispatch search
  const [dispatches, setDispatches] = useState<DispatchOption[]>([]);
  const [dispatchSearch, setDispatchSearch] = useState('');
  const [loadingDispatches, setLoadingDispatches] = useState(false);

  // Time entry form
  const [timeForm, setTimeForm] = useState({
    dispatchId: '',
    technicianId: '',
    workType: '',
    durationHours: 0,
    durationMinutes: 0,
    description: '',
    billable: true,
    hourlyRate: 50,
  });

  // Expense form
  const [expenseForm, setExpenseForm] = useState({
    dispatchId: '',
    technicianId: '',
    type: '',
    amount: 0,
    currency: 'TND',
    description: '',
    date: new Date(),
  });

  // Load dispatches on open
  useEffect(() => {
    if (!open) return;
    loadDispatches();
  }, [open]);

  // Pre-fill form when editing
  useEffect(() => {
    if (!open || !editingEntry) return;

    if (editingEntry.type === 'expense') {
      setActiveTab('expense');
      setExpenseForm({
        dispatchId: editingEntry.dispatchId || '',
        technicianId: editingEntry.userId || '',
        type: editingEntry.description || '',
        amount: editingEntry.expenses || 0,
        currency: 'TND',
        description: editingEntry.description || '',
        date: new Date(editingEntry.date),
      });
    } else {
      setActiveTab('time');
      const totalMinutes = editingEntry.timeBooked || 0;
      setTimeForm({
        dispatchId: editingEntry.dispatchId || '',
        technicianId: editingEntry.userId || '',
        workType: editingEntry.description || '',
        durationHours: Math.floor(totalMinutes / 60),
        durationMinutes: totalMinutes % 60,
        description: editingEntry.description || '',
        billable: true,
        hourlyRate: editingEntry.hourlyRate || 50,
      });
    }
  }, [open, editingEntry]);

  const loadDispatches = async () => {
    setLoadingDispatches(true);
    try {
      const resp = await dispatchesApi.getAll({ pageNumber: 1, pageSize: 50 });
      const items = (resp.data || []).map((d: any) => ({
        id: d.id,
        label: `#${d.dispatchNumber || d.id}${d.serviceOrderId ? ` - SO-${d.serviceOrderId}` : ''}`,
        serviceOrderId: d.serviceOrderId ? String(d.serviceOrderId) : undefined,
      }));
      setDispatches(items);
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoadingDispatches(false);
    }
  };

  const filteredDispatches = useMemo(() => {
    if (!dispatchSearch) return dispatches;
    const q = dispatchSearch.toLowerCase();
    return dispatches.filter(d => d.label.toLowerCase().includes(q));
  }, [dispatches, dispatchSearch]);

  const resetForms = () => {
    setTimeForm({
      dispatchId: '',
      technicianId: '',
      workType: '',
      durationHours: 0,
      durationMinutes: 0,
      description: '',
      billable: true,
      hourlyRate: 50,
    });
    setExpenseForm({
      dispatchId: '',
      technicianId: '',
      type: '',
      amount: 0,
      currency: 'TND',
      description: '',
      date: new Date(),
    });
    setDispatchSearch('');
  };

  const handleClose = () => {
    resetForms();
    onOpenChange(false);
  };

  const handleSubmitTime = async () => {
    if (!timeForm.dispatchId) {
      toast.error(t('time-expenses:add_entry.validation.dispatch_required'));
      return;
    }
    if (!timeForm.technicianId) {
      toast.error(t('time-expenses:add_entry.validation.technician_required'));
      return;
    }
    if (!timeForm.workType) {
      toast.error(t('time-expenses:add_entry.validation.work_type_required'));
      return;
    }
    const totalMinutes = (timeForm.durationHours * 60) + timeForm.durationMinutes;
    if (totalMinutes <= 0) {
      toast.error(t('time-expenses:add_entry.validation.duration_required'));
      return;
    }

    setSubmitting(true);
    try {
      const selectedUser = users.find(u => u.id === timeForm.technicianId);
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - totalMinutes * 60 * 1000);

      if (isEditing && editingEntry?.dispatchId) {
        await dispatchesApi.updateTimeEntry(Number(editingEntry.dispatchId), Number(editingEntry.id), {
          workType: timeForm.workType,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description: timeForm.description || undefined,
        });
        toast.success(t('time-expenses:add_entry.updated_time', 'Time entry updated successfully'));
      } else {
        await dispatchesApi.addTimeEntry(Number(timeForm.dispatchId), {
          technicianId: timeForm.technicianId,
          technicianName: selectedUser?.name,
          workType: timeForm.workType,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description: timeForm.description || undefined,
          billable: timeForm.billable,
          hourlyRate: timeForm.hourlyRate,
        });
        toast.success(t('time-expenses:add_entry.success_time'));
      }
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(t('time-expenses:add_entry.error_time') + (err.message ? `: ${err.message}` : ''));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExpense = async () => {
    if (!expenseForm.dispatchId) {
      toast.error(t('time-expenses:add_entry.validation.dispatch_required'));
      return;
    }
    if (!expenseForm.technicianId) {
      toast.error(t('time-expenses:add_entry.validation.technician_required'));
      return;
    }
    if (!expenseForm.type) {
      toast.error(t('time-expenses:add_entry.validation.expense_type_required'));
      return;
    }
    if (!expenseForm.amount || expenseForm.amount <= 0) {
      toast.error(t('time-expenses:add_entry.validation.amount_required'));
      return;
    }

    setSubmitting(true);
    try {
      const selectedUser = users.find(u => u.id === expenseForm.technicianId);

      if (isEditing && editingEntry?.dispatchId) {
        await dispatchesApi.updateExpense(Number(editingEntry.dispatchId), Number(editingEntry.id), {
          type: expenseForm.type,
          amount: expenseForm.amount,
          currency: expenseForm.currency,
          description: expenseForm.description || undefined,
          date: format(expenseForm.date, "yyyy-MM-dd'T'HH:mm:ss"),
        });
        toast.success(t('time-expenses:add_entry.updated_expense', 'Expense updated successfully'));
      } else {
        await dispatchesApi.addExpense(Number(expenseForm.dispatchId), {
          technicianId: expenseForm.technicianId,
          technicianName: selectedUser?.name,
          type: expenseForm.type,
          amount: expenseForm.amount,
          currency: expenseForm.currency,
          description: expenseForm.description || undefined,
          date: format(expenseForm.date, "yyyy-MM-dd'T'HH:mm:ss"),
        });
        toast.success(t('time-expenses:add_entry.success_expense'));
      }
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(t('time-expenses:add_entry.error_expense') + (err.message ? `: ${err.message}` : ''));
    } finally {
      setSubmitting(false);
    }
  };

  const dialogTitle = isEditing
    ? (activeTab === 'time'
      ? t('time-expenses:add_entry.edit_time_title', 'Edit Time Entry')
      : t('time-expenses:add_entry.edit_expense_title', 'Edit Expense'))
    : t('time-expenses:add_entry.title');

  const submitLabel = isEditing
    ? t('common.update', 'Update')
    : (activeTab === 'time'
      ? t('time-expenses:add_entry.submit_time')
      : t('time-expenses:add_entry.submit_expense'));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-lg">{dialogTitle}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'time' | 'expense')} className="flex flex-col flex-1 min-h-0">
          {!isEditing && (
            <div className="px-6 shrink-0">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="time" className="gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  {t('time-expenses:add_entry.tab_time')}
                </TabsTrigger>
                <TabsTrigger value="expense" className="gap-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  {t('time-expenses:add_entry.tab_expense')}
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* ─── TIME ENTRY TAB ─── */}
            <TabsContent value="time" className="px-6 pb-4 pt-4 space-y-4 mt-0">
              {/* Dispatch */}
              <div className="space-y-1.5">
                <Label className="text-sm">{t('time-expenses:add_entry.dispatch')}</Label>
                <Select value={timeForm.dispatchId} onValueChange={(v) => setTimeForm(f => ({ ...f, dispatchId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('time-expenses:add_entry.dispatch_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-2">
                      <div className="flex items-center border rounded-md px-2">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          className="flex-1 h-8 px-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                          placeholder={t('time-expenses:add_entry.dispatch_search')}
                          value={dispatchSearch}
                          onChange={(e) => setDispatchSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    {filteredDispatches.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        {t('time-expenses:add_entry.no_dispatches')}
                      </div>
                    ) : (
                      filteredDispatches.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Technician with Assign Myself */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('time-expenses:add_entry.technician')}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-primary hover:text-primary/80 px-2"
                    onClick={() => {
                      try {
                        const userData = localStorage.getItem('user_data');
                        if (userData) {
                          const parsed = JSON.parse(userData);
                          const currentUserId = String(parsed.id);
                          const match = users.find(u => u.id === currentUserId);
                          if (match) {
                            setTimeForm(f => ({ ...f, technicianId: match.id }));
                          }
                        }
                      } catch {}
                    }}
                  >
                    {t('time-expenses:add_entry.assign_myself')}
                  </Button>
                </div>
                <Select value={timeForm.technicianId} onValueChange={(v) => setTimeForm(f => ({ ...f, technicianId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('time-expenses:add_entry.technician_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Work Type */}
              <div className="space-y-1.5">
                <Label className="text-sm">{t('time-expenses:add_entry.work_type')}</Label>
                <Input
                  value={timeForm.workType}
                  onChange={(e) => setTimeForm(f => ({ ...f, workType: e.target.value }))}
                  placeholder={t('time-expenses:add_entry.work_type_placeholder')}
                />
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label className="text-sm">{t('time-expenses:add_entry.duration')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      value={timeForm.durationHours || ''}
                      onChange={(e) => setTimeForm(f => ({ ...f, durationHours: Number(e.target.value) || 0 }))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {t('time-expenses:add_entry.hours')}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={timeForm.durationMinutes || ''}
                      onChange={(e) => setTimeForm(f => ({ ...f, durationMinutes: Math.min(59, Number(e.target.value) || 0) }))}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {t('time-expenses:add_entry.minutes')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billable + Hourly Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 pt-5">
                  <Switch
                    checked={timeForm.billable}
                    onCheckedChange={(v) => setTimeForm(f => ({ ...f, billable: v }))}
                  />
                  <Label className="text-sm">{t('time-expenses:add_entry.billable')}</Label>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('time-expenses:add_entry.hourly_rate')}</Label>
                  <Input
                    type="number"
                    value={timeForm.hourlyRate}
                    onChange={(e) => setTimeForm(f => ({ ...f, hourlyRate: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-sm">{t('time-expenses:add_entry.description')}</Label>
                <Textarea
                  value={timeForm.description}
                  onChange={(e) => setTimeForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t('time-expenses:add_entry.description_placeholder')}
                  rows={2}
                />
              </div>
            </TabsContent>

            {/* ─── EXPENSE TAB ─── */}
            <TabsContent value="expense" className="px-6 pb-4 pt-4 space-y-4 mt-0">
              {/* Dispatch */}
              <div className="space-y-1.5">
                <Label className="text-sm">{t('time-expenses:add_entry.dispatch')}</Label>
                <Select value={expenseForm.dispatchId} onValueChange={(v) => setExpenseForm(f => ({ ...f, dispatchId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('time-expenses:add_entry.dispatch_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-2">
                      <div className="flex items-center border rounded-md px-2">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          className="flex-1 h-8 px-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                          placeholder={t('time-expenses:add_entry.dispatch_search')}
                          value={dispatchSearch}
                          onChange={(e) => setDispatchSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    {filteredDispatches.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        {t('time-expenses:add_entry.no_dispatches')}
                      </div>
                    ) : (
                      filteredDispatches.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Technician with Assign Myself */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('time-expenses:add_entry.technician')}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-primary hover:text-primary/80 px-2"
                    onClick={() => {
                      try {
                        const userData = localStorage.getItem('user_data');
                        if (userData) {
                          const parsed = JSON.parse(userData);
                          const currentUserId = String(parsed.id);
                          const match = users.find(u => u.id === currentUserId);
                          if (match) {
                            setExpenseForm(f => ({ ...f, technicianId: match.id }));
                          }
                        }
                      } catch {}
                    }}
                  >
                    {t('time-expenses:add_entry.assign_myself')}
                  </Button>
                </div>
                <Select value={expenseForm.technicianId} onValueChange={(v) => setExpenseForm(f => ({ ...f, technicianId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('time-expenses:add_entry.technician_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expense Type */}
              <div className="space-y-1.5">
                <Label className="text-sm">{t('time-expenses:add_entry.expense_type')}</Label>
                <Input
                  value={expenseForm.type}
                  onChange={(e) => setExpenseForm(f => ({ ...f, type: e.target.value }))}
                  placeholder={t('time-expenses:add_entry.expense_type_placeholder')}
                />
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('time-expenses:add_entry.amount')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('time-expenses:add_entry.currency')}</Label>
                  <Select value={expenseForm.currency} onValueChange={(v) => setExpenseForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TND">TND</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-sm">{t('time-expenses:add_entry.date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expenseForm.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expenseForm.date ? format(expenseForm.date, 'PPP') : t('time-expenses:add_entry.date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expenseForm.date}
                      onSelect={(d) => d && setExpenseForm(f => ({ ...f, date: d }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-sm">{t('time-expenses:add_entry.description')}</Label>
                <Textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t('time-expenses:add_entry.description_placeholder')}
                  rows={2}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Pinned footer with save button - always visible */}
        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={activeTab === 'time' ? handleSubmitTime : handleSubmitExpense}
            disabled={submitting}
          >
            {submitting ? t('time-expenses:add_entry.submitting') : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
