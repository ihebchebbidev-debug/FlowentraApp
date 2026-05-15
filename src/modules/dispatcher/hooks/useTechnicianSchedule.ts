import { useState, useEffect, useCallback } from 'react';
import { schedulesApi, type UserFullSchedule, type DaySchedule } from '@/services/api/schedulesApi';

export interface TechnicianScheduleInfo {
  workingHours: { start: string; end: string } | null;
  isOnLeave: boolean;
  leaveType?: string;
  isWorkingToday: boolean;
  effectiveStatus: string; // 'available', 'on_leave', 'not_working', etc.
}

interface TechnicianScheduleMap {
  [technicianId: string]: TechnicianScheduleInfo;
}

export function useTechnicianSchedule(technicianIds: string[]) {
  const [scheduleMap, setScheduleMap] = useState<TechnicianScheduleMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (technicianIds.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayStr = today.toISOString().split('T')[0];
    
    const newScheduleMap: TechnicianScheduleMap = {};
    
    // Fetch schedules for all technicians in parallel
    const results = await Promise.allSettled(
      technicianIds.map(async (techId) => {
        try {
          // Extract numeric ID (handles "admin-1" or "1" formats)
          const numericId = techId.replace(/\D/g, '') || techId;
          const schedule = await schedulesApi.getSchedule(numericId);
          return { techId, schedule };
        } catch (err) {
          console.warn(`Failed to fetch schedule for technician ${techId}:`, err);
          return { techId, schedule: null };
        }
      })
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { techId, schedule } = result.value;
        
        if (schedule) {
          // Get today's schedule
          const todaySchedule: DaySchedule | undefined = schedule.daySchedules?.[dayOfWeek];
          
          // Check if on leave today
          const activeLeave = schedule.leaves?.find(leave => {
            const startDate = new Date(leave.startDate).toISOString().split('T')[0];
            const endDate = new Date(leave.endDate).toISOString().split('T')[0];
            return todayStr >= startDate && todayStr <= endDate && leave.status === 'approved';
          });
          
          const isOnLeave = !!activeLeave;
          const isWorkingToday = todaySchedule?.enabled === true && !todaySchedule?.fullDayOff;
          
          // Determine effective status
          let effectiveStatus = schedule.status || 'available';
          if (isOnLeave) {
            effectiveStatus = 'on_leave';
          } else if (!isWorkingToday) {
            effectiveStatus = 'not_working';
          }
          
          newScheduleMap[techId] = {
            workingHours: isWorkingToday && todaySchedule ? {
              start: todaySchedule.startTime || '08:00',
              end: todaySchedule.endTime || '17:00',
            } : null,
            isOnLeave,
            leaveType: activeLeave?.leaveType,
            isWorkingToday,
            effectiveStatus,
          };
        } else {
          // Default fallback if no schedule found
          newScheduleMap[techId] = {
            workingHours: { start: '08:00', end: '17:00' },
            isOnLeave: false,
            isWorkingToday: true,
            effectiveStatus: 'available',
          };
        }
      }
    }
    
    setScheduleMap(newScheduleMap);
    setLoading(false);
  }, [technicianIds.join(',')]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    scheduleMap,
    loading,
    error,
    refetch: fetchSchedules,
  };
}
