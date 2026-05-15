import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import type { AttendanceRecord, AttendanceSettings } from '../types/hr.types';

export function useAttendance(params: { year: number; month: number; userId?: number }) {
  const qc = useQueryClient();

  const attendanceQuery = useQuery({
    queryKey: ['hr', 'attendance', params],
    queryFn: () => hrApi.getAttendance(params),
  });

  const settingsQuery = useQuery({
    queryKey: ['hr', 'attendance-settings'],
    queryFn: () => hrApi.getAttendanceSettings(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['hr', 'attendance'] });
    qc.invalidateQueries({ queryKey: ['hr', 'attendance-settings'] });
  };

  const upsertAttendance = useMutation({
    mutationFn: (payload: Partial<AttendanceRecord>) => hrApi.upsertAttendance(payload),
    onSuccess: invalidate,
  });

  const deleteAttendance = useMutation({
    mutationFn: (id: number) => hrApi.deleteAttendance(id),
    onSuccess: invalidate,
  });

  const importAttendance = useMutation({
    mutationFn: (rows: Array<Partial<AttendanceRecord>>) => hrApi.importAttendance(rows),
    onSuccess: invalidate,
  });

  const upsertAttendanceSettings = useMutation({
    mutationFn: (payload: Partial<AttendanceSettings>) => hrApi.upsertAttendanceSettings(payload),
    onSuccess: invalidate,
  });

  return {
    attendanceQuery,
    settingsQuery,
    upsertAttendance,
    deleteAttendance,
    importAttendance,
    upsertAttendanceSettings,
  };
}