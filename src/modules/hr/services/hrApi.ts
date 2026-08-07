import axiosInstance from '@/services/api/axiosInstance';
import { usersApi } from '@/services/api/usersApi';
import type { User } from '@/types/users';
import type {
  AuditLog,
  AttendanceImportResult,
  AttendanceRecord,
  AttendanceSettings,
  BonusCost,
  CnssDeclaration,
  CnssRate,
  Department,
  EmployeeCostRow,

  EmployeeDocument,
  EmployeeSalaryConfig,
  LeaveBalance,
  PayrollRun,
  PublicHoliday,
  SalaryHistory,
} from '../types/hr.types';
import type {
  HrGoal,
  HrPerformanceReview,
  HrReviewCycle,
} from '../types/performance.types';
import type {
  HrApplicant,
  HrApplicantNote,
  HrInterview,
  HrJobOpening,
  RecruitmentDashboard,
  ApplicantStage,
} from '../types/recruitment.types';
import { TUNISIAN_2025_DEFAULT_RATES } from '../utils/tunisianTaxEngine';

/**
 * Only swallow errors that mean "this HR endpoint is unavailable to me"
 * (missing route or not authorised). Real server/network failures are
 * re-thrown so React Query surfaces an error state instead of the UI
 * silently rendering empty lists / zeroed KPIs as if everything is fine.
 */
function softFallback<T>(err: any, fallback: T): T {
  const status = Number(err?.response?.status);
  if (status === 401 || status === 403 || status === 404) return fallback;
  throw err;
}

function unwrapData<T>(response: { data: any }): T {
  const json = response.data;
  return (json?.data ?? json) as T;
}

export const hrApi = {
  // ---- Employees ----
  async getEmployees(): Promise<Array<{ user: any; salaryConfig?: EmployeeSalaryConfig | null }>> {
    try {
      const res = await axiosInstance.get('/api/hr/employees');
      return unwrapData(res);
    } catch (err: any) {
      // Only fall back to the user list when the HR endpoint is genuinely
      // missing (404) or this user is not allowed to read HR data (401/403).
      // For real server errors we re-throw so the UI shows the error state
      // instead of silently rendering "all good" KPIs over empty salary
      // configs (which previously hid payroll-readiness problems).
      const status = Number(err?.response?.status);
      const recoverable = status === 401 || status === 403 || status === 404 || !status;
      if (!recoverable) throw err;
      try {
        const list = await usersApi.getAll();
        const users = (list?.users ?? []) as User[];
        return users
          .filter(u => u && u.isActive !== false)
          .map(u => ({ user: u, salaryConfig: null }));
      } catch {
        // Even the user-list fallback failed — propagate so the page can
        // surface a proper empty / error state instead of pretending success.
        throw err;
      }
    }
  },

  async getEmployeeDetail(id: number): Promise<any> {
    const res = await axiosInstance.get(`/api/hr/employees/${id}`);
    return unwrapData(res);
  },

  async upsertSalaryConfig(userId: number, payload: Partial<EmployeeSalaryConfig>): Promise<EmployeeSalaryConfig> {
    const res = await axiosInstance.put(`/api/hr/employees/${userId}/salary-config`, payload);
    return unwrapData(res);
  },

  async getSalaryHistory(userId: number): Promise<SalaryHistory[]> {
    try {
      const res = await axiosInstance.get(`/api/hr/employees/${userId}/salary-history`);
      return unwrapData(res);
    } catch (err) {
      return softFallback(err, [] as any);
    }
  },

  // ---- Leaves ----
  async getLeaveBalances(year: number): Promise<LeaveBalance[]> {
    const res = await axiosInstance.get(`/api/hr/leaves/balances?year=${year}`);
    return unwrapData(res);
  },

  async setLeaveAllowance(userId: number, payload: { year: number; leaveType: string; annualAllowance: number }): Promise<LeaveBalance[]> {
    const res = await axiosInstance.put(`/api/hr/leaves/balances/${userId}`, payload);
    return unwrapData(res);
  },

  // ---- Attendance ----
  async getAttendance(params: { year: number; month: number; userId?: number }): Promise<AttendanceRecord[]> {
    try {
      const qs = new URLSearchParams({ year: String(params.year), month: String(params.month) });
      if (params.userId) qs.set('userId', String(params.userId));
      const res = await axiosInstance.get(`/api/hr/attendance?${qs}`);
      return unwrapData(res);
    } catch (err) {
      return softFallback(err, [] as any);
    }
  },

  async upsertAttendance(payload: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const res = await axiosInstance.post('/api/hr/attendance', payload);
    return unwrapData(res);
  },

  async deleteAttendance(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/attendance/${id}`);
  },

  async getAttendanceSettings(): Promise<AttendanceSettings | null> {
    try {
      const res = await axiosInstance.get('/api/hr/attendance/settings');
      return unwrapData(res);
    } catch (err) {
      return softFallback(err, null as any);
    }
  },

  async upsertAttendanceSettings(payload: Partial<AttendanceSettings>): Promise<AttendanceSettings> {
    const res = await axiosInstance.put('/api/hr/attendance/settings', payload);
    return unwrapData(res);
  },

  async importAttendance(rows: Array<Partial<AttendanceRecord>>): Promise<AttendanceImportResult> {
    const res = await axiosInstance.post('/api/hr/attendance/import', rows);
    return unwrapData(res);
  },

  // ---- Payroll ----
  async generatePayrollRun(payload: { month: number; year: number }): Promise<PayrollRun> {
    const res = await axiosInstance.post('/api/hr/payroll/run', payload);
    return unwrapData(res);
  },

  async listPayrollRuns(year: number): Promise<PayrollRun[]> {
    const res = await axiosInstance.get(`/api/hr/payroll/runs?year=${year}`);
    return unwrapData(res);
  },

  async getPayrollRun(id: number): Promise<PayrollRun> {
    const res = await axiosInstance.get(`/api/hr/payroll/runs/${id}`);
    return unwrapData(res);
  },

  async confirmPayrollRun(id: number): Promise<PayrollRun> {
    const res = await axiosInstance.put(`/api/hr/payroll/runs/${id}/confirm`);
    return unwrapData(res);
  },

  async markPayrollRunPaid(id: number): Promise<PayrollRun> {
    const res = await axiosInstance.put(`/api/hr/payroll/runs/${id}/pay`);
    return unwrapData(res);
  },

  // ---- Departments ----
  async getDepartments(): Promise<Department[]> {
    const res = await axiosInstance.get('/api/hr/departments');
    return unwrapData(res);
  },

  async createDepartment(payload: Partial<Department>): Promise<Department> {
    const res = await axiosInstance.post('/api/hr/departments', payload);
    return unwrapData(res);
  },

  async updateDepartment(id: number, payload: Partial<Department>): Promise<Department> {
    const res = await axiosInstance.put(`/api/hr/departments/${id}`, payload);
    return unwrapData(res);
  },

  async deleteDepartment(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/departments/${id}`);
  },

  // ---- Bonuses & Costs ----
  async getBonuses(params?: { userId?: number; year?: number; month?: number; kind?: string }): Promise<BonusCost[]> {
    const qs = new URLSearchParams();
    if (params?.userId) qs.set('userId', String(params.userId));
    if (params?.year) qs.set('year', String(params.year));
    if (params?.month) qs.set('month', String(params.month));
    if (params?.kind) qs.set('kind', params.kind);
    const res = await axiosInstance.get(`/api/hr/bonuses${qs.toString() ? `?${qs}` : ''}`);
    return unwrapData(res);
  },

  async createBonus(payload: Partial<BonusCost>): Promise<BonusCost> {
    const res = await axiosInstance.post('/api/hr/bonuses', payload);
    return unwrapData(res);
  },

  async updateBonus(id: number, payload: Partial<BonusCost>): Promise<BonusCost> {
    const res = await axiosInstance.put(`/api/hr/bonuses/${id}`, payload);
    return unwrapData(res);
  },

  async deleteBonus(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/bonuses/${id}`);
  },

  // ---- CNSS ----
  async getCnssRates(): Promise<CnssRate[]> {
    const res = await axiosInstance.get('/api/hr/cnss/rates');
    return unwrapData(res);
  },

  async getActiveCnssRate(): Promise<CnssRate | null> {
    const res = await axiosInstance.get('/api/hr/cnss/rates/active');
    return unwrapData(res);
  },

  async upsertCnssRate(payload: Partial<CnssRate>): Promise<CnssRate> {
    // Backend `UpsertCnssRateDto` requires CssRate, AbattementHeadOfFamily,
    // AbattementPerChild and a non-empty IrppBrackets list. We merge the
    // caller's partial with sane Tunisia defaults so we never POST a payload
    // that fails validation (which historically wiped CSS+abattement on save).
    const defaults = TUNISIAN_2025_DEFAULT_RATES;
    const fullBody = {
      id: payload.id,
      effectiveFrom: payload.effectiveFrom ?? new Date().toISOString().slice(0, 10),
      employeeRate: Number(payload.employeeRate ?? defaults.cnssRate),
      employerRate: Number(payload.employerRate ?? 0.1657),
      cssRate: Number(payload.cssRate ?? defaults.cssRate),
      salaryCeiling: Number(payload.salaryCeiling ?? payload.ceiling ?? 0),
      abattementHeadOfFamily: Number(payload.abattementHeadOfFamily ?? defaults.abattement.headOfFamily),
      abattementPerChild: Number(payload.abattementPerChild ?? defaults.abattement.perChild),
      irppBrackets: (payload.irppBrackets && payload.irppBrackets.length > 0)
        ? payload.irppBrackets
        : defaults.brackets.map(b => ({ from: b.from, to: b.to, rate: b.rate })),
      isActive: payload.isActive ?? true,
      notes: payload.notes,
    };
    const res = await axiosInstance.put('/api/hr/cnss/rates', fullBody);
    return unwrapData(res);
  },

  async getCnssDeclaration(year: number, month: number): Promise<CnssDeclaration> {
    const res = await axiosInstance.get(`/api/hr/cnss/declaration?year=${year}&month=${month}`);
    return unwrapData(res);
  },

  // ---- Public Holidays ----
  async getPublicHolidays(year?: number): Promise<PublicHoliday[]> {
    const qs = year ? `?year=${year}` : '';
    const res = await axiosInstance.get(`/api/hr/holidays${qs}`);
    return unwrapData(res);
  },

  async createPublicHoliday(payload: Partial<PublicHoliday>): Promise<PublicHoliday> {
    const res = await axiosInstance.post('/api/hr/holidays', payload);
    return unwrapData(res);
  },

  async updatePublicHoliday(id: number, payload: Partial<PublicHoliday>): Promise<PublicHoliday> {
    const res = await axiosInstance.put(`/api/hr/holidays/${id}`, payload);
    return unwrapData(res);
  },

  async deletePublicHoliday(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/holidays/${id}`);
  },

  // ---- Documents ----
  async getEmployeeDocuments(userId: number): Promise<EmployeeDocument[]> {
    const res = await axiosInstance.get(`/api/hr/documents/${userId}`);
    return unwrapData(res);
  },

  async createEmployeeDocument(payload: Partial<EmployeeDocument>): Promise<EmployeeDocument> {
    const res = await axiosInstance.post('/api/hr/documents', payload);
    return unwrapData(res);
  },

  async deleteEmployeeDocument(id: number, _userId?: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/documents/${id}`);
  },

  // ---- Audit log ----
  async getAuditLog(params?: { userId?: number; take?: number }): Promise<AuditLog[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.userId) qs.set('userId', String(params.userId));
      if (params?.take) qs.set('take', String(params.take));
      const res = await axiosInstance.get(`/api/hr/audit${qs.toString() ? `?${qs}` : ''}`);
      return unwrapData(res);
    } catch (err) {
      return softFallback(err, [] as any);
    }
  },

  // ---- Reports ----
  async getEmployeeCostReport(year: number, month?: number): Promise<EmployeeCostRow[]> {
    const qs = new URLSearchParams({ year: String(year) });
    if (month) qs.set('month', String(month));
    const res = await axiosInstance.get(`/api/hr/reports/employee-cost?${qs}`);
    const data = unwrapData<EmployeeCostRow[]>(res);
    return Array.isArray(data) ? data : [];
  },

  // ---- Active leaves (Planning calendar integration) ----
  async getActiveLeaves(date?: string): Promise<Array<{
    userId: number; userName: string; leaveType: string;
    startDate: string; endDate: string; status: string;
  }>> {
    try {
      const qs = date ? `?date=${encodeURIComponent(date)}` : '';
      const res = await axiosInstance.get(`/api/hr/leaves/active${qs}`);
      return unwrapData(res);
    } catch (err) {
      return softFallback(err, [] as any);
    }
  },

  // ---- Contract expiry alerts ----
  async getExpiringContracts(withinDays = 60): Promise<Array<{
    userId: number; userName: string; contractType?: string;
    contractEndDate: string; daysUntilExpiry: number;
  }>> {
    try {
      const res = await axiosInstance.get(`/api/hr/contracts/expiring?withinDays=${withinDays}`);
      return unwrapData(res);
    } catch (err) {
      return softFallback(err, [] as any);
    }
  },

  // ====================================================================
  // Performance Management
  // ====================================================================
  async getGoals(params?: { userId?: number; cycleId?: number; status?: string }): Promise<HrGoal[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.userId) qs.set('userId', String(params.userId));
      if (params?.cycleId) qs.set('cycleId', String(params.cycleId));
      if (params?.status) qs.set('status', params.status);
      const res = await axiosInstance.get(`/api/hr/performance/goals${qs.toString() ? `?${qs}` : ''}`);
      return unwrapData(res);
    } catch (err) { return softFallback(err, [] as any); }
  },
  async createGoal(payload: Partial<HrGoal>): Promise<HrGoal> {
    const res = await axiosInstance.post('/api/hr/performance/goals', payload);
    return unwrapData(res);
  },
  async updateGoal(id: number, payload: Partial<HrGoal>): Promise<HrGoal> {
    const res = await axiosInstance.put(`/api/hr/performance/goals/${id}`, payload);
    return unwrapData(res);
  },
  async deleteGoal(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/performance/goals/${id}`);
  },

  async getReviewCycles(): Promise<HrReviewCycle[]> {
    try {
      const res = await axiosInstance.get('/api/hr/performance/cycles');
      return unwrapData(res);
    } catch (err) { return softFallback(err, [] as any); }
  },
  async createReviewCycle(payload: Partial<HrReviewCycle>): Promise<HrReviewCycle> {
    const res = await axiosInstance.post('/api/hr/performance/cycles', payload);
    return unwrapData(res);
  },
  async updateReviewCycle(id: number, payload: Partial<HrReviewCycle>): Promise<HrReviewCycle> {
    const res = await axiosInstance.put(`/api/hr/performance/cycles/${id}`, payload);
    return unwrapData(res);
  },
  async deleteReviewCycle(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/performance/cycles/${id}`);
  },

  async getReviews(params?: { cycleId?: number; userId?: number; status?: string }): Promise<HrPerformanceReview[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.cycleId) qs.set('cycleId', String(params.cycleId));
      if (params?.userId) qs.set('userId', String(params.userId));
      if (params?.status) qs.set('status', params.status);
      const res = await axiosInstance.get(`/api/hr/performance/reviews${qs.toString() ? `?${qs}` : ''}`);
      return unwrapData(res);
    } catch (err) { return softFallback(err, [] as any); }
  },  async createReview(payload: Partial<HrPerformanceReview>): Promise<HrPerformanceReview> {
    const res = await axiosInstance.post('/api/hr/performance/reviews', payload);
    return unwrapData(res);
  },
  async updateReview(id: number, payload: Partial<HrPerformanceReview>): Promise<HrPerformanceReview> {
    const res = await axiosInstance.put(`/api/hr/performance/reviews/${id}`, payload);
    return unwrapData(res);
  },
  async deleteReview(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/performance/reviews/${id}`);
  },

  // ====================================================================
  // Recruitment / ATS
  // ====================================================================
  async getRecruitmentDashboard(): Promise<RecruitmentDashboard> {
    try {
      const res = await axiosInstance.get('/api/hr/recruitment/dashboard');
      return unwrapData(res);
    } catch (err) {
      return softFallback(err, { openPositions: 0, activeApplicants: 0, interviewsThisWeek: 0, offersOut: 0, byStage: {} });
    }
  },

  async getJobOpenings(status?: string): Promise<HrJobOpening[]> {
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await axiosInstance.get(`/api/hr/recruitment/openings${qs}`);
      return unwrapData(res);
    } catch (err) { return softFallback(err, [] as any); }
  },  async createJobOpening(payload: Partial<HrJobOpening>): Promise<HrJobOpening> {
    const res = await axiosInstance.post('/api/hr/recruitment/openings', payload);
    return unwrapData(res);
  },
  async updateJobOpening(id: number, payload: Partial<HrJobOpening>): Promise<HrJobOpening> {
    const res = await axiosInstance.put(`/api/hr/recruitment/openings/${id}`, payload);
    return unwrapData(res);
  },
  async deleteJobOpening(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/recruitment/openings/${id}`);
  },

  async getApplicants(params?: { openingId?: number; stage?: string }): Promise<HrApplicant[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.openingId) qs.set('openingId', String(params.openingId));
      if (params?.stage) qs.set('stage', params.stage);
      const res = await axiosInstance.get(`/api/hr/recruitment/applicants${qs.toString() ? `?${qs}` : ''}`);
      return unwrapData(res);
    } catch (err) { return softFallback(err, [] as any); }
  },  async createApplicant(payload: Partial<HrApplicant>): Promise<HrApplicant> {
    const res = await axiosInstance.post('/api/hr/recruitment/applicants', payload);
    return unwrapData(res);
  },
  async updateApplicant(id: number, payload: Partial<HrApplicant>): Promise<HrApplicant> {
    const res = await axiosInstance.put(`/api/hr/recruitment/applicants/${id}`, payload);
    return unwrapData(res);
  },
  async moveApplicantStage(id: number, stage: ApplicantStage, rejectionReason?: string): Promise<HrApplicant> {
    const res = await axiosInstance.post(`/api/hr/recruitment/applicants/${id}/move`, { stage, rejectionReason });
    return unwrapData(res);
  },
  async deleteApplicant(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/recruitment/applicants/${id}`);
  },

  async getInterviews(params?: { applicantId?: number; from?: string; to?: string }): Promise<HrInterview[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.applicantId) qs.set('applicantId', String(params.applicantId));
      if (params?.from) qs.set('from', params.from);
      if (params?.to) qs.set('to', params.to);
      const res = await axiosInstance.get(`/api/hr/recruitment/interviews${qs.toString() ? `?${qs}` : ''}`);
      return unwrapData(res);
    } catch (err) { return softFallback(err, [] as any); }
  },
  async createInterview(payload: Partial<HrInterview>): Promise<HrInterview> {
    const res = await axiosInstance.post('/api/hr/recruitment/interviews', payload);
    return unwrapData(res);
  },
  async updateInterview(id: number, payload: Partial<HrInterview>): Promise<HrInterview> {
    const res = await axiosInstance.put(`/api/hr/recruitment/interviews/${id}`, payload);
    return unwrapData(res);
  },
  async deleteInterview(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/recruitment/interviews/${id}`);
  },

  async getApplicantNotes(applicantId: number): Promise<HrApplicantNote[]> {
    try {
      const res = await axiosInstance.get(`/api/hr/recruitment/applicants/${applicantId}/notes`);
      return unwrapData(res);
    } catch (err) { return softFallback(err, [] as any); }
  },
  async addApplicantNote(applicantId: number, body: string): Promise<HrApplicantNote> {
    const res = await axiosInstance.post(`/api/hr/recruitment/applicants/${applicantId}/notes`, { applicantId, body });
    return unwrapData(res);
  },
  async deleteApplicantNote(id: number): Promise<void> {
    await axiosInstance.delete(`/api/hr/recruitment/notes/${id}`);
  },
};
