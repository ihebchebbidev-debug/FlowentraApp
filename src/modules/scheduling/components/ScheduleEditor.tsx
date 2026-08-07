import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Technician } from '../../dispatcher/types';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

import { SchedulingService } from '../services/scheduling.service';
import { lookupHexColorForStatus } from '../utils';
import schedulingStatuses from '@/data/mock/scheduling-statuses.json';

type LeaveRange = { start: string; end: string; reason?: string };

interface Props {
  technician: Technician;
  onClose: () => void;
  onSaved?: () => void;
}

export function ScheduleEditor({ technician, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Technician['status']>(technician.status);
  const [startHour, setStartHour] = useState(technician.workingHours?.start || '08:00');
  const [endHour, setEndHour] = useState(technician.workingHours?.end || '17:00');
  const [recurrence, setRecurrence] = useState<'everyday'|'weekdays'|'custom'>('everyday');
  const [customDays, setCustomDays] = useState<Record<string, boolean>>({ Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false });
  const [leaves, setLeaves] = useState<LeaveRange[]>([]);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');

  const save = async () => {
    SchedulingService.setTechnicianMeta(technician.id, { 
      scheduleNote: note,
      status,
      workingHours: { start: startHour, end: endHour },
      recurrence,
      customDays,
      leaves
    });
  onSaved && onSaved();
  // close modal after save
  onClose();
  };

  useEffect(() => {
    const meta = SchedulingService.getTechnicianMeta(technician.id) || {};
    if (meta.scheduleNote) setNote(meta.scheduleNote);
    if (meta.status) setStatus(meta.status);
    if (meta.workingHours) { setStartHour(meta.workingHours.start || startHour); setEndHour(meta.workingHours.end || endHour); }
    if (meta.recurrence) setRecurrence(meta.recurrence);
    if (meta.customDays) setCustomDays(meta.customDays);
    if (meta.leaves) setLeaves(meta.leaves);
  }, [technician.id]);

  useEffect(() => {
    try {
      const exists = i18n.exists('scheduling.edit_schedule_for');
      const resource = i18n.getResource('en', 'translation', 'scheduling.edit_schedule_for');
      // Debug: helps determine why translation isn't resolving at runtime
      // eslint-disable-next-line no-console
      console.debug('[i18n-debug] scheduling.edit_schedule_for exists=', exists, 'resource=', resource, 't=', t('scheduling.edit_schedule_for', { name: technician.firstName }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.debug('[i18n-debug] error checking i18n resource', e);
    }
  }, []);

  const addLeave = () => {
    if (!leaveStart || !leaveEnd) return;
    setLeaves(prev => [...prev, { start: leaveStart, end: leaveEnd }]);
    setLeaveStart(''); setLeaveEnd('');
  };

  const removeLeave = (idx: number) => setLeaves(prev => prev.filter((_, i) => i !== idx));

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('scheduling.edit_schedule_for', { name: `${technician.firstName || ''} ${technician.lastName || ''}`.trim() || technician.email || technician.firstName, defaultValue: `Edit schedule for ${`${technician.firstName || ''} ${technician.lastName || ''}`.trim() || technician.email || technician.firstName}` })}
          </DialogTitle>
          {/* status dot + label */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: lookupHexColorForStatus(status) || undefined }}
            />
            <div className="text-sm text-muted-foreground">{t(`scheduling.status_${status}`, { defaultValue: status })}</div>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <Label>{t('scheduling.schedule_note', 'Schedule note')}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">{t('scheduling.schedule_note_help', 'Use this to mark special days, leaves or exceptions')}</p>
          </div>

          <div>
            <Label>{t('scheduling.status', 'Status')}</Label>
            <select className="w-full border rounded px-2 py-1 bg-background" value={status} onChange={(e) => setStatus(e.target.value as Technician['status'])}>
              {schedulingStatuses.map((s:any) => (
                <option key={s.id} value={s.id}>{String(t(`scheduling.status_${s.id}`, s.name))}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{t('scheduling.working_hours_start','Start')}</Label>
              <Input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)} />
            </div>
            <div>
                <Label>{t('scheduling.working_hours_end','End')}</Label>
              <Input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>{t('scheduling.recurrence','Recurrence')}</Label>
            <div className="flex gap-2 items-center mt-1">
              <select className="border rounded px-2 py-1 bg-background" value={recurrence} onChange={(e) => setRecurrence(e.target.value as any)}>
                <option value="everyday">{t('scheduling.everyday','Every day')}</option>
                <option value="weekdays">{t('scheduling.weekdays','Weekdays')}</option>
                <option value="custom">{t('scheduling.custom','Custom')}</option>
              </select>
            </div>
            {recurrence === 'custom' && (
              <div className="flex gap-2 mt-2">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <label key={d} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={!!customDays[d]} onChange={(e) => setCustomDays(prev => ({ ...prev, [d]: e.target.checked }))} />
                    <span className="ml-1">{d}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>{t('scheduling.leaves','Leaves')}</Label>
            <div className="flex gap-2 items-end mt-2">
              <div className="flex-1">
                <Label className="text-xs">{t('scheduling.leave_start','Start')}</Label>
                <Input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label className="text-xs">{t('scheduling.leave_end','End')}</Label>
                <Input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
              </div>
              <div>
                <Button size="sm" onClick={addLeave}>{t('scheduling.add','Add')}</Button>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {leaves.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between border rounded p-2">
                  <div className="text-sm">{l.start} → {l.end}</div>
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => removeLeave(idx)}>{t('common.remove','Remove')}</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={save}>{t('common.save', 'Save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
