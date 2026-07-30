export interface EmployeeSalaryConfig {
  id: number;
  userId: number;
  grossSalary: number; // Monthly in TND
  isHeadOfFamily: boolean;
  childrenCount: number;
  customDeductions?: number;
  bankAccount?: string;
  cnssNumber?: string;
  hireDate?: string;
  department?: string;
  position?: string;
  employmentType: 'full_time' | 'part_time' | 'contract';

  // Tunisia-specific fields
  cin?: string;
  birthDate?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  // Contract tracking (Round 1)
  contractType?: 'CDI' | 'CDD' | 'Stage' | string;
  contractEndDate?: string; // ISO date
}

export interface PayrollRun {
  id: number;
  month: number;
  year: number;
  status: 'draft' | 'confirmed' | 'paid';
  entries: PayrollEntry[];
  totalGross: number;
  totalNet: number;
  totalCnss?: number;
  totalEmployerCnss?: number;
  createdBy: number;
  createdAt: string;
  confirmedAt?: string;
}

export interface PayrollEntry {
  id: number;
  payrollRunId: number;
  userId: number;
  userName: string;
  grossSalary: number;
  allowances?: number;
  bonuses?: number;
  cnss: number;
  /** Employer share of CNSS (returned by backend, used in payslip & cost reports). */
  employerCnss?: number;
  taxableGross: number;
  abattement: number;
  taxableBase: number;
  irpp: number;
  css: number;
  netSalary: number;
  workedDays: number;
  totalHours: number;
  overtimeHours: number;
  leaveDays: number;
  details: Record<string, any>;
}

export interface LeaveBalance {
  userId: number;
  leaveType: string;
  annualAllowance: number;
  used: number;
  remaining: number;
  pending: number;
}

export interface Department {
  id: number;
  name: string;
  code?: string;
  parentId?: number | null;
  managerId?: number | null;
  description?: string;
  position?: number;
}

export interface SalaryInput {
  grossSalary: number;
  isHeadOfFamily: boolean;
  childrenCount: number;
  customDeductions?: number;
}

export interface IRPPBracketDetail {
  from: number;
  to: number;
  rate: number;
  taxableInBracket: number;
  taxAmount: number;
}

export interface SalaryBreakdown {
  grossSalary: number;
  cnss: number;
  cnssRate: number;
  taxableGross: number;
  abattement: number;
  abattementDetail: { headOfFamily: number; children: number };
  taxableBase: number;
  irpp: number;
  irppBrackets: IRPPBracketDetail[];
  css: number;
  cssRate: number;
  netSalary: number;
  totalHours?: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  /** Unpaid absence proration (leave beyond the annual allowance + absences). */
  paidLeaveDays?: number;
  unpaidDays?: number;
  absenceDeduction?: number;

}

export interface AttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  breakMinutes: number;
  totalHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | string;
  notes?: string;
  source: 'manual' | 'csv_import' | string;
}

export interface AttendanceSettings {
  id: number;
  workDays: number[];
  standardHoursPerDay: number;
  overtimeThresholdHours: number;
  overtimeMultiplier: number;
  lateThresholdMinutes: number;
  roundingMethod: 'none' | '15min' | '30min' | 'hour' | string;
  calculationMethod: 'actual_hours' | 'standard_day' | 'custom' | string;
}

export interface AttendanceImportResult {
  imported: number;
  created: number;
  updated: number;
}

// ============= New entities =============

// Aligned with backend HrBonusCost: kind ∈ {bonus, allowance, reimbursement, other_cost}
// (NOTE: 'deduction' was a frontend-only value the backend silently ignored.
// Use a negative `amount` on a 'reimbursement' or 'other_cost' to record a deduction,
// or extend the backend enum if a true deduction kind is needed.)
export type BonusKind = 'bonus' | 'allowance' | 'reimbursement' | 'other_cost';
// Aligned with backend column `frequency`: 'monthly' | 'one_off'.
export type BonusFrequency = 'monthly' | 'one_off';

export interface BonusCost {
  id: number;
  userId: number;
  userName?: string;
  kind: BonusKind;
  /** Free-text category (e.g. transport, panier, performance). */
  category?: string;
  label: string;
  amount: number;
  frequency: BonusFrequency;
  /** Always required by backend (year/month the row is applied to). */
  month: number;
  year: number;
  /** When false the row is informational only and excluded from payroll. */
  affectsPayroll: boolean;
  /** When true the amount is added to the CNSS-subject base. */
  subjectToCnss: boolean;
  notes?: string;
  createdAt?: string;
  createdBy?: number;
}

export interface IrppBracket {
  from: number;
  /** `null` means open-ended (top bracket). */
  to: number | null;
  /** 0..1, e.g. 0.25 for 25%. */
  rate: number;
}

export interface CnssRate {
  id: number;
  effectiveFrom: string; // YYYY-MM-DD
  /** 0..1 (e.g. 0.0918) */
  employeeRate: number;
  /** 0..1 (e.g. 0.1657) */
  employerRate: number;
  /** 0..1 (e.g. 0.01) — backend `CssRate`, required for IRPP. */
  cssRate: number;
  /** 0 means "no ceiling". Backend `SalaryCeiling`. */
  salaryCeiling: number;
  /** Monthly abattement for head of family (TND). */
  abattementHeadOfFamily: number;
  /** Monthly abattement per dependent child (TND). */
  abattementPerChild: number;
  /** Progressive IRPP brackets sorted by `from`. */
  irppBrackets: IrppBracket[];
  isActive: boolean;
  notes?: string;
  /** @deprecated Use `salaryCeiling`. Kept for legacy reads only. */
  ceiling?: number | null;
}

export interface PublicHoliday {
  id: number;
  date: string; // YYYY-MM-DD
  name: string;
  isRecurring: boolean;
  /** civil | religious | custom — backend defaults to 'civil'. */
  category?: string;
}

export interface EmployeeDocument {
  id: number;
  userId: number;
  docType: 'contract' | 'payslip' | 'id_card' | 'cnss' | 'medical' | 'other';
  title: string;
  fileUrl: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  issuedDate?: string;
  expiresAt?: string;
  createdAt: string;
  uploadedBy?: number;
}

/** Mirrors backend HrSalaryHistoryDto exactly. */
export interface SalaryHistory {
  id: number;
  userId: number;
  /** Null for the first recorded salary. */
  previousGross?: number | null;
  newGross: number;
  currency: string;
  effectiveDate: string;
  reason?: string | null;
  changedBy?: number | null;
}

export type AuditEventType =
  | 'salary_change'
  | 'bonus_added'
  | 'bonus_removed'
  | 'leave_request'
  | 'leave_approved'
  | 'leave_rejected'
  | 'employee_updated'
  | 'cnss_rate_updated'
  | 'payroll_run'
  | 'payroll_confirmed';

export interface AuditLog {
  id: number;
  userId?: number;
  actorId: number;
  eventType: AuditEventType;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// ============= Server-computed reports =============

/** Line of GET /api/hr/cnss/declaration — authoritative CNSS figures. */
export interface CnssDeclarationLine {
  userId: number;
  userName: string;
  cnssNumber?: string | null;
  salarySubject: number;
  employeeCnss: number;
  employerCnss: number;
  css: number;
}

export interface CnssDeclaration {
  year: number;
  month: number;
  totalSalarySubject: number;
  totalEmployeeCnss: number;
  totalEmployerCnss: number;
  totalCss: number;
  lines: CnssDeclarationLine[];
}

/** Row of GET /api/hr/reports/employee-cost — authoritative employer cost. */
export interface EmployeeCostRow {
  userId: number;
  userName: string;
  department?: string | null;
  gross: number;
  bonuses: number;
  allowances: number;
  employerCnss: number;
  totalCost: number;
  ytdGross: number;
  ytdBonuses: number;
  ytdEmployerCnss: number;
  ytdTotalCost: number;
}
