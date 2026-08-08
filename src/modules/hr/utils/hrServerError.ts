import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

type TFunc = (key: string, options?: any) => string;

/**
 * Backend HR endpoints return stable dotted error codes (e.g. `hr.employee_not_found`,
 * `attendance.invalid_break`) instead of English prose, so the UI can localise them.
 * This maps a code to its `hr` namespace translation; anything unknown falls back to
 * the raw extracted message or the provided fallback text.
 */
const CODE_TO_KEY: Record<string, string> = {
  'hr.employee_not_found': 'serverErrors.employeeNotFound',
  'hr.attendance_not_found': 'serverErrors.attendanceNotFound',
  'hr.invalid_month': 'serverErrors.invalidMonth',
  'hr.invalid_year': 'serverErrors.invalidYear',
  'hr.payroll_run_exists': 'serverErrors.payrollRunExists',
  'hr.payroll_run_not_found': 'serverErrors.payrollRunNotFound',
  'hr.payroll_run_already_paid': 'serverErrors.payrollRunAlreadyPaid',
  'hr.payroll_run_not_confirmed': 'serverErrors.payrollRunNotConfirmed',
  'hr.payroll_entry_not_found': 'serverErrors.payrollEntryNotFound',
  'hr.department_name_required': 'serverErrors.departmentNameRequired',
  'hr.department_not_found': 'serverErrors.departmentNotFound',
  'hr.bonus_not_found': 'serverErrors.bonusNotFound',
  'hr.holiday_not_found': 'serverErrors.holidayNotFound',
  'hr.document_not_found': 'serverErrors.documentNotFound',
  'hr.goal_not_found': 'serverErrors.goalNotFound',
  'hr.cycle_not_found': 'serverErrors.cycleNotFound',
  'hr.review_not_found': 'serverErrors.reviewNotFound',
  'hr.opening_not_found': 'serverErrors.openingNotFound',
  'hr.applicant_not_found': 'serverErrors.applicantNotFound',
  'hr.interview_not_found': 'serverErrors.interviewNotFound',
  'bonus.negative_amount': 'serverErrors.bonusNegativeAmount',
  'attendance.invalid_user': 'attendanceErrors.userRequired',
  'attendance.invalid_date': 'attendanceErrors.dateInvalid',
  'attendance.future_date': 'attendanceErrors.dateFuture',
  'attendance.invalid_break': 'attendanceErrors.breakInvalid',
  'attendance.checkout_before_checkin': 'attendanceErrors.checkoutBeforeCheckin',
  'attendance.break_exceeds_worked': 'attendanceErrors.breakExceedsWorked',
  'attendance.range_too_long': 'attendanceErrors.rangeTooLong',
  'attendance.checkout_without_checkin': 'attendanceErrors.checkoutWithoutCheckin',
  'attendance.invalid_status': 'attendanceErrors.statusInvalid',
  'attendance.save_failed': 'serverErrors.attendanceSaveFailed',
  'attendance.delete_failed': 'serverErrors.attendanceDeleteFailed',
};

export function extractHrErrorCode(error: unknown): string | undefined {
  const err = error as any;
  const candidates = [
    err?.response?.data?.errorCode,
    err?.errorCode,
    err?.response?.data?.error,
    err?.response?.data?.message,
    err?.error,
    err?.message,
    typeof error === 'string' ? error : undefined,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && CODE_TO_KEY[c.trim()]) return c.trim();
  }
  return undefined;
}

export function translateHrServerError(t: TFunc, error: unknown, fallback?: string): string {
  const code = extractHrErrorCode(error);
  if (code) return t(CODE_TO_KEY[code]);
  return extractApiErrorMessage(error, fallback) || fallback || '';
}
