/**
 * HR module — single source of truth for client-side Zod schemas.
 *
 * Each schema MUST mirror the matching backend DTO 1:1 (names + optionality).
 * The static checker `scripts/hr-contract-check.mjs` enforces this at build time
 * by parsing both this file and `Backend/Modules/HR/DTOs/HrDtos.cs`.
 *
 * Conventions:
 * - C# `string?`            -> `z.string().optional().nullable()`
 * - C# `string` (default "")-> `z.string()`
 * - C# `int?`/`decimal?`    -> `z.number().optional().nullable()`
 * - C# `[Required]`         -> required (no `.optional()`)
 * - C# `DateTime`           -> `z.string()` (ISO from JSON)
 * - C# `List<T>`            -> `z.array(T)`
 */
import { z } from 'zod';

/* ============================== Salary Config ============================= */

export const upsertSalaryConfigSchema = z.object({
  grossSalary: z.number().nonnegative().optional().nullable(),
  isHeadOfFamily: z.boolean().optional().nullable(),
  childrenCount: z.number().int().min(0).max(20).optional().nullable(),
  customDeductions: z.number().optional().nullable(),
  bankAccount: z.string().max(100).optional().nullable(),
  cnssNumber: z.string().max(100).optional().nullable(),
  hireDate: z.string().optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  employmentType: z.string().max(50).optional().nullable(),
  contractType: z.string().max(20).optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
  cin: z.string().max(50).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  maritalStatus: z.string().max(20).optional().nullable(),
  addressLine1: z.string().max(200).optional().nullable(),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  emergencyContactName: z.string().max(200).optional().nullable(),
  emergencyContactPhone: z.string().max(30).optional().nullable(),
  salaryChangeReason: z.string().max(300).optional().nullable(),
});

export const employeeSalaryConfigSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  grossSalary: z.number(),
  isHeadOfFamily: z.boolean(),
  childrenCount: z.number().int(),
  customDeductions: z.number().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  cnssNumber: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  employmentType: z.string(),
  contractType: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
  cin: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
});

/* ================================= Leaves ================================= */

export const leaveBalanceSchema = z.object({
  userId: z.number().int(),
  leaveType: z.string(),
  annualAllowance: z.number(),
  used: z.number(),
  remaining: z.number(),
  pending: z.number(),
});

export const setLeaveAllowanceSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  leaveType: z.string().min(1),
  annualAllowance: z.number().nonnegative(),
});

/* ============================== Attendance ================================ */

export const ATTENDANCE_STATUSES = [
  'present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'remote',
] as const;

export const attendanceRecordSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  userName: z.string(),
  date: z.string(),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  breakMinutes: z.number().int().min(0).max(1440),
  totalHours: z.number(),
  overtimeHours: z.number(),
  status: z.string(),
  notes: z.string().optional().nullable(),
  source: z.string(),
});

export const upsertAttendanceSchema = z.object({
  userId: z.number().int().positive(),
  date: z.string().min(10),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  breakMinutes: z.number().int().min(0).max(1440),
  totalHours: z.number().optional().nullable(),
  overtimeHours: z.number().optional().nullable(),
  status: z.string().min(1),
  notes: z.string().max(1000).optional().nullable(),
  source: z.string(),
}).superRefine((dto, ctx) => {
  if (dto.checkIn && dto.checkOut && dto.checkOut <= dto.checkIn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checkOut'],
      message: 'attendance.checkout_before_checkin',
    });
  }
});

export const attendanceSettingsSchema = z.object({
  id: z.number().int(),
  workDays: z.array(z.number().int().min(0).max(6)),
  standardHoursPerDay: z.number(),
  overtimeThresholdHours: z.number(),
  overtimeMultiplier: z.number(),
  lateThresholdMinutes: z.number().int(),
  roundingMethod: z.string(),
  calculationMethod: z.string(),
});

export const upsertAttendanceSettingsSchema = z.object({
  workDays: z.array(z.number().int().min(0).max(6)),
  standardHoursPerDay: z.number().min(1).max(24),
  overtimeThresholdHours: z.number().min(0).max(24),
  overtimeMultiplier: z.number().min(1).max(5),
  lateThresholdMinutes: z.number().int().min(0).max(240),
  roundingMethod: z.string(),
  calculationMethod: z.string(),
});

export const importAttendanceRowSchema = upsertAttendanceSchema;
export const attendanceImportResultSchema = z.object({
  imported: z.number().int(),
  created: z.number().int(),
  updated: z.number().int(),
  skipped: z.number().int(),
});

/* ================================ Payroll ================================= */

export const createPayrollRunSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export const payrollEntrySchema = z.object({
  id: z.number().int(),
  payrollRunId: z.number().int(),
  userId: z.number().int(),
  userName: z.string(),
  grossSalary: z.number(),
  allowances: z.number(),
  bonuses: z.number(),
  cnss: z.number(),
  employerCnss: z.number(),
  taxableGross: z.number(),
  abattement: z.number(),
  taxableBase: z.number(),
  irpp: z.number(),
  css: z.number(),
  netSalary: z.number(),
  workedDays: z.number(),
  totalHours: z.number(),
  overtimeHours: z.number(),
  leaveDays: z.number(),
  details: z.unknown().optional().nullable(),
});

export const payrollRunSchema = z.object({
  id: z.number().int(),
  month: z.number().int(),
  year: z.number().int(),
  status: z.string(),
  entries: z.array(payrollEntrySchema),
  totalGross: z.number(),
  totalNet: z.number(),
  totalCnss: z.number(),
  totalEmployerCnss: z.number(),
  createdBy: z.number().int(),
  createdAt: z.string(),
  confirmedAt: z.string().optional().nullable(),
});

/* =============================== Departments ============================== */

export const departmentSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  code: z.string().optional().nullable(),
  parentId: z.number().int().optional().nullable(),
  managerId: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  position: z.number().int().optional().nullable(),
});

export const upsertDepartmentSchema = z.object({
  name: z.string().min(1).max(150).optional().nullable(),
  code: z.string().max(50).optional().nullable(),
  parentId: z.number().int().optional().nullable(),
  managerId: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  position: z.number().int().optional().nullable(),
});

/* ============================ Bonuses & Costs ============================= */

export const bonusCostSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  userName: z.string().optional().nullable(),
  kind: z.string(),
  category: z.string().optional().nullable(),
  label: z.string(),
  amount: z.number(),
  frequency: z.string(),
  year: z.number().int(),
  month: z.number().int(),
  affectsPayroll: z.boolean(),
  subjectToCnss: z.boolean(),
  notes: z.string().optional().nullable(),
  createdAt: z.string(),
});

export const upsertBonusCostSchema = z.object({
  userId: z.number().int().positive(),
  kind: z.string(),
  category: z.string().optional().nullable(),
  label: z.string().min(1).max(200),
  amount: z.number(),
  frequency: z.string(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  affectsPayroll: z.boolean(),
  subjectToCnss: z.boolean(),
  notes: z.string().optional().nullable(),
});

/* ================================= CNSS =================================== */

export const irppBracketSchema = z.object({
  from: z.number(),
  to: z.number().optional().nullable(),
  rate: z.number().min(0).max(1),
});

export const cnssRateSchema = z.object({
  id: z.number().int(),
  effectiveFrom: z.string(),
  employeeRate: z.number().min(0).max(1),
  employerRate: z.number().min(0).max(1),
  cssRate: z.number().min(0).max(1),
  salaryCeiling: z.number(),
  abattementHeadOfFamily: z.number(),
  abattementPerChild: z.number(),
  irppBrackets: z.array(irppBracketSchema),
  isActive: z.boolean(),
  notes: z.string().optional().nullable(),
});

export const upsertCnssRateSchema = z.object({
  effectiveFrom: z.string(),
  employeeRate: z.number().min(0).max(1),
  employerRate: z.number().min(0).max(1),
  cssRate: z.number().min(0).max(1),
  salaryCeiling: z.number(),
  abattementHeadOfFamily: z.number(),
  abattementPerChild: z.number(),
  irppBrackets: z.array(irppBracketSchema),
  isActive: z.boolean(),
  notes: z.string().optional().nullable(),
});

/* ============================ Public Holidays ============================= */

export const publicHolidaySchema = z.object({
  id: z.number().int(),
  date: z.string(),
  name: z.string(),
  category: z.string(),
  isRecurring: z.boolean(),
});

export const upsertPublicHolidaySchema = z.object({
  date: z.string().min(10),
  name: z.string().min(1).max(150),
  category: z.string(),
  isRecurring: z.boolean(),
});

/* =========================== Employee Documents =========================== */

export const employeeDocumentSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  docType: z.string(),
  title: z.string(),
  fileUrl: z.string(),
  fileName: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  issuedDate: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  createdAt: z.string(),
});

export const upsertEmployeeDocumentSchema = z.object({
  userId: z.number().int().positive(),
  docType: z.string(),
  title: z.string().min(1).max(255),
  fileUrl: z.string().min(1).max(1000),
  fileName: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  issuedDate: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

/* ================================ Audit =================================== */

export const auditLogSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  eventType: z.string(),
  description: z.string().optional().nullable(),
  payload: z.unknown().optional().nullable(),
  actorUserId: z.number().int().optional().nullable(),
  actorName: z.string().optional().nullable(),
  createdAt: z.string(),
});

/* ============================ Salary History ============================== */

export const salaryHistorySchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  previousGross: z.number().optional().nullable(),
  newGross: z.number(),
  currency: z.string(),
  effectiveDate: z.string(),
  reason: z.string().optional().nullable(),
  changedBy: z.number().int().optional().nullable(),
});

/* ================================ Reports ================================= */

export const employeeCostSchema = z.object({
  userId: z.number().int(),
  userName: z.string(),
  department: z.string().optional().nullable(),
  gross: z.number(),
  bonuses: z.number(),
  allowances: z.number(),
  employerCnss: z.number(),
  totalCost: z.number(),
  ytdGross: z.number(),
  ytdBonuses: z.number(),
  ytdEmployerCnss: z.number(),
  ytdTotalCost: z.number(),
});

export const cnssEmployeeLineSchema = z.object({
  userId: z.number().int(),
  userName: z.string(),
  cnssNumber: z.string().optional().nullable(),
  salarySubject: z.number(),
  employeeCnss: z.number(),
  employerCnss: z.number(),
  css: z.number(),
});

export const cnssMonthlyDeclarationSchema = z.object({
  year: z.number().int(),
  month: z.number().int(),
  totalSalarySubject: z.number(),
  totalEmployeeCnss: z.number(),
  totalEmployerCnss: z.number(),
  totalCss: z.number(),
  lines: z.array(cnssEmployeeLineSchema),
});

/* ============================ Planning / Alerts =========================== */

export const activeLeaveSchema = z.object({
  userId: z.number().int(),
  userName: z.string(),
  leaveType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
});

export const contractExpirySchema = z.object({
  userId: z.number().int(),
  userName: z.string(),
  contractType: z.string().optional().nullable(),
  contractEndDate: z.string(),
  daysUntilExpiry: z.number().int(),
});

/* ===================== Registry consumed by the contract checker ========== */
/**
 * The checker reads this map and matches each Zod object to a backend DTO
 * with the same name (case-sensitive, suffix `Schema` -> `Dto`).
 *
 * Add an entry here whenever you introduce a new schema. The build will fail
 * if the schema and the DTO drift.
 */
export const HR_DTO_SCHEMA_MAP = {
  UpsertSalaryConfigDto: upsertSalaryConfigSchema,
  HrEmployeeSalaryConfigDto: employeeSalaryConfigSchema,
  HrLeaveBalanceDto: leaveBalanceSchema,
  SetLeaveAllowanceDto: setLeaveAllowanceSchema,
  HrAttendanceDto: attendanceRecordSchema,
  UpsertHrAttendanceDto: upsertAttendanceSchema,
  HrAttendanceSettingsDto: attendanceSettingsSchema,
  UpsertHrAttendanceSettingsDto: upsertAttendanceSettingsSchema,
  ImportHrAttendanceRowDto: importAttendanceRowSchema,
  HrAttendanceImportResultDto: attendanceImportResultSchema,
  CreatePayrollRunDto: createPayrollRunSchema,
  HrPayrollEntryDto: payrollEntrySchema,
  HrPayrollRunDto: payrollRunSchema,
  HrDepartmentDto: departmentSchema,
  UpsertDepartmentDto: upsertDepartmentSchema,
  HrBonusCostDto: bonusCostSchema,
  UpsertBonusCostDto: upsertBonusCostSchema,
  HrCnssRateDto: cnssRateSchema,
  IrppBracketDto: irppBracketSchema,
  UpsertCnssRateDto: upsertCnssRateSchema,
  HrPublicHolidayDto: publicHolidaySchema,
  UpsertPublicHolidayDto: upsertPublicHolidaySchema,
  HrEmployeeDocumentDto: employeeDocumentSchema,
  UpsertEmployeeDocumentDto: upsertEmployeeDocumentSchema,
  HrAuditLogDto: auditLogSchema,
  HrSalaryHistoryDto: salaryHistorySchema,
  HrEmployeeCostDto: employeeCostSchema,
  HrCnssEmployeeLineDto: cnssEmployeeLineSchema,
  HrCnssMonthlyDeclarationDto: cnssMonthlyDeclarationSchema,
  HrActiveLeaveDto: activeLeaveSchema,
  HrContractExpiryDto: contractExpirySchema,
} as const;

export type HrSchemaName = keyof typeof HR_DTO_SCHEMA_MAP;