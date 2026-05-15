import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInCalendarDays } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { LookupsService } from '@/modules/lookups/services/lookups.service';
import { schedulesApi, type DaySchedule, type UserLeave } from '@/services/api/schedulesApi';
import { Loader2, CalendarDays, Clock, Settings2, Trash2, Plus, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Day name to number mapping (backend uses 0=Sunday, 6=Saturday)
const dayNameToNumber: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
};

const numberToDayName: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
};

export default function ScheduleEditorPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { technicianId } = useParams<{ technicianId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [technicianName, setTechnicianName] = useState('');
  const [status, setStatus] = useState<string>('available');
  const [note, setNote] = useState('');
  
  // Per-day schedule: Mon..Sun (using day names for UI, numbers for API)
  const defaultDay: DaySchedule = { enabled: true, startTime: '08:00', endTime: '17:00', lunchStart: '12:00', lunchEnd: '13:00', fullDayOff: false };
  const [days, setDays] = useState<Record<string, DaySchedule>>({
    Mon: { ...defaultDay },
    Tue: { ...defaultDay },
    Wed: { ...defaultDay },
    Thu: { ...defaultDay },
    Fri: { ...defaultDay },
    Sat: { ...defaultDay, enabled: false, fullDayOff: true },
    Sun: { ...defaultDay, enabled: false, fullDayOff: true }
  });
  
  const [leaves, setLeaves] = useState<UserLeave[]>([]);
  const [leaveRange, setLeaveRange] = useState<DateRange | undefined>(undefined);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveType, setLeaveType] = useState('vacation');
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [addingLeave, setAddingLeave] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string; isPaid?: boolean }[]>([]);
  const [leaveToDelete, setLeaveToDelete] = useState<UserLeave | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Partial day leave state
  const [leaveMode, setLeaveMode] = useState<'full' | 'partial'>('full');
  const [partialDate, setPartialDate] = useState<Date | undefined>(undefined);
  const [partialStartTime, setPartialStartTime] = useState('09:00');
  const [partialEndTime, setPartialEndTime] = useState('13:00');

  // Extract numeric ID from technicianId (handles 'admin-22' format)
  const getNumericId = (id: string): number => {
    const match = id.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Load schedule data from API
  useEffect(() => {
    if (!technicianId) return;
    
    const loadSchedule = async () => {
      setLoading(true);
      try {
        const numericId = getNumericId(technicianId);
        
        // Load leave types and schedule in parallel
        const [schedule, fetchedLeaveTypes] = await Promise.all([
          schedulesApi.getSchedule(numericId),
          LookupsService.getLeaveTypesAsync()
        ]);
        
        // Set leave types with fallback to default if empty
        if (fetchedLeaveTypes && fetchedLeaveTypes.length > 0) {
          setLeaveTypes(fetchedLeaveTypes.map(lt => ({
            id: lt.id,
            name: lt.name,
            isPaid: lt.isPaid
          })));
        } else {
          // Fallback default leave types
          setLeaveTypes([
            { id: 'vacation', name: 'Vacation', isPaid: true },
            { id: 'sick', name: 'Sick Leave', isPaid: true },
            { id: 'personal', name: 'Personal', isPaid: false },
            { id: 'bereavement', name: 'Bereavement', isPaid: true },
            { id: 'unpaid', name: 'Unpaid Leave', isPaid: false },
          ]);
        }
        
        setTechnicianName(schedule.userName);
        setStatus(schedule.status || 'available');
        setNote(schedule.scheduleNote || '');
        
        // Convert backend daySchedules (numeric keys) to UI format (day names)
        if (schedule.daySchedules) {
          const newDays: Record<string, DaySchedule> = {};
          for (const [dayNum, daySchedule] of Object.entries(schedule.daySchedules)) {
            const dayName = numberToDayName[parseInt(dayNum, 10)];
            if (dayName) {
              newDays[dayName] = daySchedule;
            }
          }
          // Merge with defaults for any missing days
          setDays(prev => ({ ...prev, ...newDays }));
        }
        
        setLeaves(schedule.leaves || []);
      } catch (error) {
        console.error('Failed to load schedule:', error);
        toast({
          title: t('common.error', 'Error'),
          description: t('scheduling.load_error', 'Failed to load schedule. Using defaults.'),
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSchedule();
  }, [technicianId, t, toast]);

  // Check if two date ranges overlap
  const rangesOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
    return start1 <= end2 && end1 >= start2;
  };

  // Find overlapping leaves for a given date range
  const findOverlappingLeave = (startDate: Date, endDate: Date): UserLeave | undefined => {
    return leaves.find(l => {
      const existingStart = new Date(l.startDate);
      const existingEnd = new Date(l.endDate);
      return rangesOverlap(startDate, endDate, existingStart, existingEnd);
    });
  };

  const addLeave = async () => {
    if (!technicianId || addingLeave) return;
    
    setAddingLeave(true);
    setLeaveError(null);
    
    let startIso: string;
    let endIso: string;
    
    if (leaveMode === 'full') {
      // Full day mode - use date range
      if (!leaveRange || !leaveRange.from || !leaveRange.to) {
        setLeaveError(t('scheduling.leave_error_missing', 'Please select a start and end date'));
        return;
      }
      if (leaveRange.to < leaveRange.from) {
        setLeaveError(t('scheduling.leave_error_invalid', 'End date must be after start date'));
        return;
      }
      
      // Check for overlapping leaves
      const overlapping = findOverlappingLeave(leaveRange.from, leaveRange.to);
      if (overlapping) {
        const existingStart = format(new Date(overlapping.startDate), 'MMM d, yyyy');
        const existingEnd = format(new Date(overlapping.endDate), 'MMM d, yyyy');
        const leaveTypeName = leaveTypes.find(lt => lt.id === overlapping.leaveType)?.name || overlapping.leaveType;
        setLeaveError(
          t('scheduling.leave_overlap_error', {
            defaultValue: `This overlaps with existing leave: "${leaveTypeName}" (${existingStart} → ${existingEnd}). Please choose different dates or delete the existing leave first.`
          })
        );
        return;
      }
      
      // Backend stores these as "timestamp with time zone"; send UTC (Z) to avoid EF/Npgsql kind errors
      const toUtcMidnightIso = (d: Date) =>
        new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)).toISOString();

      startIso = toUtcMidnightIso(leaveRange.from);
      endIso = toUtcMidnightIso(leaveRange.to);
    } else {
      // Partial day mode - single date with times
      if (!partialDate) {
        setLeaveError(t('scheduling.leave_error_missing_date', 'Please select a date'));
        return;
      }
      
      const [startHour, startMin] = partialStartTime.split(':').map(Number);
      const [endHour, endMin] = partialEndTime.split(':').map(Number);
      
      if (startHour > endHour || (startHour === endHour && startMin >= endMin)) {
        setLeaveError(t('scheduling.leave_error_invalid_time', 'End time must be after start time'));
        return;
      }
      
      // Create datetime with time components
      const startDate = new Date(Date.UTC(
        partialDate.getFullYear(), 
        partialDate.getMonth(), 
        partialDate.getDate(), 
        startHour, 
        startMin, 
        0
      ));
      const endDate = new Date(Date.UTC(
        partialDate.getFullYear(), 
        partialDate.getMonth(), 
        partialDate.getDate(), 
        endHour, 
        endMin, 
        0
      ));
      
      startIso = startDate.toISOString();
      endIso = endDate.toISOString();
    }
    
    // Get the leave type NAME (not ID) - backend expects string
    const selectedLeaveType = leaveTypes.find(lt => lt.id === leaveType);
    const leaveTypeName = (selectedLeaveType?.name || String(leaveType)).trim();
    
    try {
      const numericId = getNumericId(technicianId);
      const newLeave = await schedulesApi.createLeave({
        userId: numericId,
        leaveType: leaveTypeName, // Send name, not ID
        startDate: startIso,
        endDate: endIso,
        reason: leaveReason || undefined
      });
      
      setLeaves(prev => [newLeave, ...prev]);
      
      // Reset form
      setLeaveRange(undefined);
      setPartialDate(undefined);
      setPartialStartTime('09:00');
      setPartialEndTime('13:00');
      setLeaveReason('');
      setLeaveType(leaveTypes[0]?.id || 'vacation');
      
      if (leaveMode === 'full') {
        const from = format(new Date(startIso), 'MMM d, yyyy');
        const to = format(new Date(endIso), 'MMM d, yyyy');
        const daysCount = differenceInCalendarDays(new Date(endIso), new Date(startIso)) + 1;
        
        toast({
          title: t('scheduling.leave_added', { defaultValue: 'Leave added' }),
          description: `${leaveTypeName}: ${from} → ${to} (${daysCount} ${t('scheduling.days', { defaultValue: 'days' })})`,
        });
      } else {
        const dateStr = format(new Date(startIso), 'MMM d, yyyy');
        toast({
          title: t('scheduling.leave_added', { defaultValue: 'Leave added' }),
          description: `${leaveTypeName}: ${dateStr} (${partialStartTime} - ${partialEndTime})`,
        });
      }
    } catch (error) {
      console.error('Failed to create leave:', error);
      setLeaveError(t('scheduling.leave_create_error', 'Failed to create leave. Please try again.'));
      toast({
        title: t('common.error', 'Error'),
        description: t('scheduling.leave_create_error', 'Failed to create leave'),
        variant: 'destructive'
      });
    } finally {
      setAddingLeave(false);
    }
  };

  const confirmDeleteLeave = async () => {
    if (!leaveToDelete) return;
    
    setIsDeleting(true);
    try {
      await schedulesApi.deleteLeave(leaveToDelete.id);
      setLeaves(prev => prev.filter(l => l.id !== leaveToDelete.id));
      toast({
        title: t('common.deleted', 'Deleted'),
        description: t('scheduling.leave_deleted', 'Leave cancelled successfully'),
      });
    } catch (error) {
      console.error('Failed to delete leave:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('scheduling.leave_delete_error', 'Failed to cancel leave'),
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setLeaveToDelete(null);
    }
  };

  const save = async () => {
    console.log('=== SAVE FUNCTION CALLED ===');
    console.log('technicianId:', technicianId);
    console.log('Current days state:', JSON.stringify(days, null, 2));
    console.log('Current status:', status);
    console.log('Current note:', note);
    
    if (!technicianId) {
      console.error('No technicianId, aborting save');
      return;
    }
    
    setSaving(true);
    console.log('Setting saving to true');
    
    try {
      const numericId = getNumericId(technicianId);
      console.log('Numeric ID:', numericId);
      
      // Convert UI format (day names) to API format (numeric keys)
      const daySchedules: Record<number, DaySchedule> = {};
      for (const [dayName, schedule] of Object.entries(days)) {
        const dayNum = dayNameToNumber[dayName];
        console.log(`Converting ${dayName} to day number ${dayNum}:`, schedule);
        if (dayNum !== undefined) {
          daySchedules[dayNum] = schedule;
        }
      }
      
      const updatePayload = {
        userId: numericId,
        daySchedules,
        status,
        scheduleNote: note
      };
      
      console.log('=== UPDATE PAYLOAD ===');
      console.log(JSON.stringify(updatePayload, null, 2));
      
      console.log('Calling schedulesApi.updateSchedule...');
      const result = await schedulesApi.updateSchedule(updatePayload);
      
      console.log('=== API RESPONSE ===');
      console.log(JSON.stringify(result, null, 2));
      
      toast({
        title: t('common.saved', 'Saved'),
        description: t('scheduling.schedule_saved', 'Schedule saved successfully'),
      });
      
      console.log('Save successful, navigating back');
      navigate(-1);
    } catch (error: any) {
      console.error('=== SAVE ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response);
      console.error('Error stack:', error?.stack);
      
      toast({
        title: t('common.error', 'Error'),
        description: error?.message || t('scheduling.save_error', 'Failed to save schedule'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
      console.log('Save function completed, saving set to false');
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t('common.loading', 'Loading...')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">
            {t('scheduling.edit_schedule_for', { 
              name: technicianName, 
              defaultValue: `Edit schedule for ${technicianName}` 
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('scheduling.edit_schedule_description', { defaultValue: 'Edit technician working hours, leaves and status' })}
          </p>
        </div>
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)}>{t('common.back', 'Back')}</Button>
        </div>
      </div>

      {/* Status Selection */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('scheduling.status', 'Status')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">{t('scheduling.status_available', 'Available')}</SelectItem>
              <SelectItem value="busy">{t('scheduling.status_busy', 'Busy')}</SelectItem>
              <SelectItem value="offline">{t('scheduling.status_offline', 'Offline')}</SelectItem>
              <SelectItem value="on_leave">{t('scheduling.status_on_leave', 'On Leave')}</SelectItem>
              <SelectItem value="not_working">{t('scheduling.status_not_working', 'Not Working')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle>{t('scheduling.working_time', 'Working time')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map(d => (
              <div key={d} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={days[d].enabled && !days[d].fullDayOff} 
                      onChange={(e) => setDays(prev => ({ 
                        ...prev, 
                        [d]: { ...prev[d], enabled: e.target.checked, fullDayOff: !e.target.checked ? prev[d].fullDayOff : false } 
                      }))} 
                    />
                    <div className="font-medium">{t(`scheduling.day_${d.toLowerCase()}` as any, d)}</div>
                  </div>
                  <div>
                    <label className="text-xs mr-2">{t('scheduling.full_day_off', 'Full day off')}</label>
                    <input 
                      type="checkbox" 
                      checked={!!days[d].fullDayOff} 
                      onChange={(e) => setDays(prev => ({ 
                        ...prev, 
                        [d]: { ...prev[d], fullDayOff: e.target.checked, enabled: !e.target.checked ? false : prev[d].enabled } 
                      }))} 
                    />
                  </div>
                </div>

                {!days[d].fullDayOff && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                    <div>
                      <Label className="text-xs">{t('scheduling.working_hours_start', 'Start')}</Label>
                      <Input 
                        type="time" 
                        value={days[d].startTime} 
                        onChange={(e) => setDays(prev => ({ ...prev, [d]: { ...prev[d], startTime: e.target.value } }))} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t('scheduling.working_hours_end', 'End')}</Label>
                      <Input 
                        type="time" 
                        value={days[d].endTime} 
                        onChange={(e) => setDays(prev => ({ ...prev, [d]: { ...prev[d], endTime: e.target.value } }))} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t('scheduling.lunch_break', 'Lunch break')}</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="time" 
                          value={days[d].lunchStart || '12:00'} 
                          onChange={(e) => setDays(prev => ({ ...prev, [d]: { ...prev[d], lunchStart: e.target.value } }))} 
                        />
                        <Input 
                          type="time" 
                          value={days[d].lunchEnd || '13:00'} 
                          onChange={(e) => setDays(prev => ({ ...prev, [d]: { ...prev[d], lunchEnd: e.target.value } }))} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="h-3" />

      {/* Leaves Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{t('scheduling.leaves', 'Leaves')}</CardTitle>
                <CardDescription className="text-xs">
                  {t('scheduling.leaves_description', 'Manage vacation, sick leave, and time off')}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/dashboard/lookups?tab=leave-types&returnUrl=${encodeURIComponent(location.pathname)}`)}
              className="text-xs gap-1"
            >
              <Settings2 className="h-3 w-3" />
              {t('scheduling.manage_types', 'Manage Types')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Leave Form */}
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Plus className="h-4 w-4" />
                {t('scheduling.add_new_leave', 'Add New Leave')}
              </div>
              
              {/* Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-background rounded-md border">
                <Button
                  variant={leaveMode === 'full' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setLeaveMode('full')}
                >
                  <CalendarDays className="h-3 w-3 mr-1.5" />
                  {t('scheduling.full_day', 'Full Day')}
                </Button>
                <Button
                  variant={leaveMode === 'partial' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setLeaveMode('partial')}
                >
                  <Clock className="h-3 w-3 mr-1.5" />
                  {t('scheduling.partial_day', 'Partial Day')}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {leaveMode === 'full' ? (
                /* Full Day Mode - Date Range Picker */
                <div className="lg:col-span-2">
                  <Label className="text-xs mb-1.5 block">{t('scheduling.leave_select_range', 'Date Range')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-9">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {leaveRange && leaveRange.from ? (
                          <span>
                            {format(leaveRange.from, 'MMM d, yyyy')}
                            {leaveRange.to && ` → ${format(leaveRange.to, 'MMM d, yyyy')}`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{t('scheduling.select_dates', 'Select dates')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={leaveRange}
                        onSelect={(r) => setLeaveRange(r as DateRange | undefined)}
                        numberOfMonths={2}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {leaveRange && leaveRange.from && leaveRange.to && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {differenceInCalendarDays(leaveRange.to, leaveRange.from) + 1} {t('scheduling.days', 'days')}
                    </div>
                  )}
                  {leaveError && <div className="text-xs text-destructive mt-1">{leaveError}</div>}
                </div>
              ) : (
                /* Partial Day Mode - Single Date + Time Range */
                <>
                  <div>
                    <Label className="text-xs mb-1.5 block">{t('scheduling.select_date', 'Date')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left h-9">
                          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          {partialDate ? (
                            <span>{format(partialDate, 'MMM d, yyyy')}</span>
                          ) : (
                            <span className="text-muted-foreground">{t('scheduling.select_date', 'Select date')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={partialDate}
                          onSelect={(d) => setPartialDate(d)}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    {leaveError && <div className="text-xs text-destructive mt-1">{leaveError}</div>}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs mb-1.5 block">{t('scheduling.start_time', 'Start Time')}</Label>
                      <Input
                        type="time"
                        value={partialStartTime}
                        onChange={(e) => setPartialStartTime(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs mb-1.5 block">{t('scheduling.end_time', 'End Time')}</Label>
                      <Input
                        type="time"
                        value={partialEndTime}
                        onChange={(e) => setPartialEndTime(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Leave Type */}
              <div>
                <Label className="text-xs mb-1.5 block">{t('scheduling.leave_type', 'Leave Type')}</Label>
                <Select value={leaveType} onValueChange={(v) => setLeaveType(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t('scheduling.select_type', 'Select type')} />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.length > 0 ? (
                      leaveTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          <div className="flex items-center gap-2">
                            <span>{lt.name}</span>
                            {lt.isPaid !== undefined && (
                              <Badge variant={lt.isPaid ? "default" : "outline"} className="text-[10px] px-1 py-0 h-4">
                                {lt.isPaid ? t('scheduling.paid', 'Paid') : t('scheduling.unpaid', 'Unpaid')}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="vacation">Vacation</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div>
                <Label className="text-xs mb-1.5 block">{t('scheduling.leave_reason', 'Reason (Optional)')}</Label>
                <Input 
                  value={leaveReason} 
                  onChange={(e) => setLeaveReason(e.target.value)} 
                  placeholder={t('scheduling.enter_reason', 'Enter reason...')}
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={addLeave} disabled={addingLeave} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                {t('scheduling.add_leave', 'Add Leave')}
              </Button>
            </div>
          </div>

          {/* Existing Leaves List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{t('scheduling.scheduled_leaves', 'Scheduled Leaves')}</h4>
              {leaves.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {leaves.length} {t('scheduling.leaves_count', leaves.length === 1 ? 'leave' : 'leaves')}
                </Badge>
              )}
            </div>

            {leaves.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {t('scheduling.no_leaves', 'No leaves scheduled')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('scheduling.no_leaves_hint', 'Use the form above to add time off')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaves.map((l) => {
                  const leaveTypeInfo = leaveTypes.find(lt => lt.id === l.leaveType);
                  const startDate = new Date(l.startDate);
                  const endDate = new Date(l.endDate);
                  const dayCount = differenceInCalendarDays(endDate, startDate) + 1;
                  
                  // Check if this is a partial day leave (same date but different times)
                  const isSameDay = startDate.toDateString() === endDate.toDateString();
                  const hasTimeComponent = startDate.getHours() !== 0 || startDate.getMinutes() !== 0 || 
                                           endDate.getHours() !== 0 || endDate.getMinutes() !== 0;
                  const isPartialDay = isSameDay && hasTimeComponent;
                  
                  return (
                    <div 
                      key={l.id} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {isPartialDay ? (
                            <Clock className="h-4 w-4 text-primary" />
                          ) : (
                            <CalendarDays className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {leaveTypeInfo?.name || l.leaveType}
                            </span>
                            {isPartialDay && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {t('scheduling.partial', 'Partial')}
                              </Badge>
                            )}
                            {leaveTypeInfo?.isPaid !== undefined && (
                              <Badge variant={leaveTypeInfo.isPaid ? "default" : "outline"} className="text-[10px] px-1.5 py-0 h-4">
                                {leaveTypeInfo.isPaid ? t('scheduling.paid', 'Paid') : t('scheduling.unpaid', 'Unpaid')}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {l.status || 'pending'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {isPartialDay ? (
                              <>
                                {format(startDate, 'MMM d, yyyy')}
                                <span className="ml-2 text-primary">
                                  ({format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')})
                                </span>
                              </>
                            ) : (
                              <>
                                {format(startDate, 'MMM d, yyyy')} → {format(endDate, 'MMM d, yyyy')}
                                <span className="ml-2 text-primary">({dayCount} {dayCount === 1 ? 'day' : 'days'})</span>
                              </>
                            )}
                          </div>
                          {l.reason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{l.reason}"</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setLeaveToDelete(l)}
                        className="text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10 gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('scheduling.cancel_leave', 'Cancel Leave')}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="h-3" />

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={() => navigate(-1)}>{t('common.cancel', 'Cancel')}</Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t('common.save', 'Save')}
        </Button>
      </div>

      {/* Delete Leave Confirmation Dialog */}
      <AlertDialog open={!!leaveToDelete} onOpenChange={(open) => !open && setLeaveToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('scheduling.cancel_leave_title', 'Cancel Leave?')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('scheduling.cancel_leave_description', 'Are you sure you want to cancel this leave? This action cannot be undone.')}
              </p>
              {leaveToDelete && (
                <div className="p-3 mt-2 bg-muted rounded-lg text-sm">
                  <div className="font-medium">{leaveTypes.find(lt => lt.id === leaveToDelete.leaveType)?.name || leaveToDelete.leaveType}</div>
                  <div className="text-muted-foreground">
                    {format(new Date(leaveToDelete.startDate), 'MMM d, yyyy')} → {format(new Date(leaveToDelete.endDate), 'MMM d, yyyy')}
                  </div>
                  {leaveToDelete.reason && (
                    <div className="text-muted-foreground italic mt-1">"{leaveToDelete.reason}"</div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.keep_it', 'Keep It')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteLeave}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('scheduling.yes_cancel_leave', 'Yes, Cancel Leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
