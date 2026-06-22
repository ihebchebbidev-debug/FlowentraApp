import { apiFetch } from './apiClient';

// Types
export interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  lunchStart?: string;
  lunchEnd?: string;
  fullDayOff: boolean;
}

export interface UserLeave {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
}

export interface UserFullSchedule {
  userId: number;
  userName: string;
  status?: string;
  scheduleNote?: string;
  daySchedules: Record<number, DaySchedule>;
  leaves: UserLeave[];
}

export interface UpdateScheduleDto {
  userId: number;
  daySchedules?: Record<number, DaySchedule>;
  status?: string;
  scheduleNote?: string;
}

export interface CreateLeaveDto {
  userId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateLeaveDto {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  status?: string;
}

interface ApiResponse<T> {
  data: T | null;
  status: number;
  error?: string;
}

// API functions
export const schedulesApi = {
  // Default Mon-Fri 08:00-17:00 schedule
  _buildDefaultSchedule(userId: number | string): UserFullSchedule {
    const daySchedules: Record<number, DaySchedule> = {};
    for (let d = 0; d <= 6; d++) {
      daySchedules[d] = {
        enabled: d >= 1 && d <= 5, // Mon-Fri enabled
        startTime: '08:00',
        endTime: '17:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
        fullDayOff: d === 0 || d === 6, // Sat/Sun off
      };
    }
    return {
      userId: typeof userId === 'string' ? parseInt(String(userId).replace('admin-', '')) : userId,
      userName: '',
      daySchedules,
      leaves: [],
    };
  },

  // Get full schedule for a user — PURE READ. When no schedule exists yet (or it
  // came back empty) this returns in-memory defaults WITHOUT writing to the server.
  // To persist defaults, call ensureDefaultSchedule() explicitly from an edit/save flow.
  async getSchedule(userId: number | string): Promise<UserFullSchedule> {
    const id = typeof userId === 'string' ? userId.replace('admin-', '') : userId;
    const response = await apiFetch<{ success: boolean; data: UserFullSchedule }>(
      `/api/planning/schedule/${id}`
    ) as ApiResponse<{ success: boolean; data: UserFullSchedule }>;

    const data = response.data?.data;
    if (response.error || !data || !data.daySchedules || Object.keys(data.daySchedules).length === 0) {
      // Unconfigured — return local defaults for display only (no side effect).
      return this._buildDefaultSchedule(id);
    }
    return data;
  },

  // Explicitly persist a default schedule when the user has none. Use this from
  // edit/save flows only — never from read paths. Returns the existing schedule
  // unchanged when one is already configured; falls back to local defaults if the
  // write fails (e.g. blocked in cross-company view-all mode).
  async ensureDefaultSchedule(userId: number | string): Promise<UserFullSchedule> {
    const id = typeof userId === 'string' ? userId.replace('admin-', '') : userId;
    const response = await apiFetch<{ success: boolean; data: UserFullSchedule }>(
      `/api/planning/schedule/${id}`
    ) as ApiResponse<{ success: boolean; data: UserFullSchedule }>;

    const existing = response.data?.data;
    if (!response.error && existing && existing.daySchedules && Object.keys(existing.daySchedules).length > 0) {
      return existing;
    }

    const defaults = this._buildDefaultSchedule(id);
    try {
      return await this.updateSchedule({ userId: Number(id), daySchedules: defaults.daySchedules });
    } catch (e) {
      console.warn('[schedulesApi] ensureDefaultSchedule failed, returning local defaults', e);
      return defaults;
    }
  },

  // Update user schedule
  async updateSchedule(dto: UpdateScheduleDto): Promise<UserFullSchedule> {
    const response = await apiFetch<{ success: boolean; data: UserFullSchedule }>(
      '/api/planning/schedule',
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    ) as ApiResponse<{ success: boolean; data: UserFullSchedule }>;
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to update schedule');
    }
    return response.data.data;
  },

  // Get leaves for a user
  async getLeaves(userId: number | string): Promise<UserLeave[]> {
    const id = typeof userId === 'string' ? userId.replace('admin-', '') : userId;
    const response = await apiFetch<{ success: boolean; data: UserLeave[] }>(
      `/api/planning/leaves/${id}`
    ) as ApiResponse<{ success: boolean; data: UserLeave[] }>;
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch leaves');
    }
    return response.data.data;
  },

  // Create a new leave
  async createLeave(dto: CreateLeaveDto): Promise<UserLeave> {
    const response = await apiFetch<{ success: boolean; data: UserLeave }>(
      '/api/planning/leaves',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    ) as ApiResponse<{ success: boolean; data: UserLeave }>;
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create leave');
    }
    return response.data.data;
  },

  // Update a leave
  async updateLeave(leaveId: number, dto: UpdateLeaveDto): Promise<UserLeave> {
    const response = await apiFetch<{ success: boolean; data: UserLeave }>(
      `/api/planning/leaves/${leaveId}`,
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    ) as ApiResponse<{ success: boolean; data: UserLeave }>;
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to update leave');
    }
    return response.data.data;
  },

  // Delete a leave
  async deleteLeave(leaveId: number): Promise<void> {
    const response = await apiFetch<{ success: boolean }>(
      `/api/planning/leaves/${leaveId}`,
      {
        method: 'DELETE',
      }
    ) as ApiResponse<{ success: boolean }>;
    
    if (response.error) {
      throw new Error(response.error);
    }
  },
};

export default schedulesApi;
