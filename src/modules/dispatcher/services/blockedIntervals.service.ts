// Blocked intervals derived from a technician's schedule and approved leaves.
// Used by drop validation and auto-fill so no dispatch lands on a leave day,
// a day off, or inside a lunch/break window.
//
// Design notes:
// - Pure functions. Inputs come from CustomCalendar (already loaded) or from
//   schedulesApi in the auto-fill flow.
// - "Blocked" here means genuinely unbookable — approved leaves and the
//   configured lunch break. Outside-of-working-hours is enforced separately
//   by the working-hours cursor in auto-fill and by the past-time / day-off
//   checks in the UI.
import type { DayScheduleInfo, TechnicianAvailability } from '../components/calendar/types';
import type { TechnicianLeave } from '../components/calendar/CustomCalendar';

export type BlockReason = 'leave' | 'day_off' | 'break';

export interface BlockedInterval {
  start: Date;
  end: Date;
  reason: BlockReason;
  /** Optional detail — leave type name, "lunch break", etc. */
  detail?: string;
}

/** Return start-of-day Date for the supplied day, preserving local timezone. */
function startOfLocalDay(day: Date): Date {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfLocalDay(day: Date): Date {
  const d = new Date(day);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Convert an "HH:mm" string on a specific day to a Date. */
function timeOnDay(day: Date, hhmm: string | undefined): Date | null {
  if (!hhmm) return null;
  const parts = hhmm.split(':').map(Number);
  const h = parts[0];
  const m = parts[1] ?? 0;
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

/** True when leave spans (partially or fully) the given local day. */
function leaveCoversDay(leave: TechnicianLeave, day: Date): boolean {
  const dayStart = startOfLocalDay(day).getTime();
  const dayEnd = endOfLocalDay(day).getTime();
  const ls = leave.startDate instanceof Date ? leave.startDate.getTime() : new Date(leave.startDate).getTime();
  const le = leave.endDate instanceof Date ? leave.endDate.getTime() : new Date(leave.endDate).getTime();
  return ls <= dayEnd && le >= dayStart;
}

/**
 * Compute all blocked intervals for one technician on one local day.
 *
 * Sources:
 *   - approved leaves that cover this day → full-day block
 *   - availability with fullDayOff or disabled=false for this weekday → full-day block
 *   - availability lunchStart/lunchEnd → break block
 */
export function getBlockedIntervalsForDay(
  day: Date,
  availability?: TechnicianAvailability | null,
  leaves?: TechnicianLeave[] | null,
): BlockedInterval[] {
  const out: BlockedInterval[] = [];

  // 1. Approved leaves covering this day → whole day is blocked.
  if (leaves && leaves.length > 0) {
    for (const lv of leaves) {
      if (lv.status && lv.status !== 'approved') continue;
      if (!leaveCoversDay(lv, day)) continue;
      out.push({
        start: startOfLocalDay(day),
        end: endOfLocalDay(day),
        reason: 'leave',
        detail: lv.leaveType,
      });
    }
  }

  // 2. Availability-based blocks (day off + lunch break).
  if (availability) {
    const dow = day.getDay(); // 0=Sun … 6=Sat
    const daySched: DayScheduleInfo | undefined = availability.daySchedules?.[dow];

    // 2a. Full-day off — either explicit flag or the day isn't enabled at all.
    if (daySched && (daySched.fullDayOff === true || daySched.enabled === false)) {
      out.push({
        start: startOfLocalDay(day),
        end: endOfLocalDay(day),
        reason: 'day_off',
      });
    }

    // 2b. Lunch / break window inside the working day.
    if (daySched && daySched.enabled && !daySched.fullDayOff) {
      const lunchStart = timeOnDay(day, daySched.lunchStart);
      const lunchEnd = timeOnDay(day, daySched.lunchEnd);
      if (lunchStart && lunchEnd && lunchEnd.getTime() > lunchStart.getTime()) {
        out.push({
          start: lunchStart,
          end: lunchEnd,
          reason: 'break',
          detail: 'lunch',
        });
      }
    }
  }

  return out;
}

/** Does [proposedStart, proposedEnd) overlap any blocked interval? */
export function findBlockingInterval(
  proposedStart: Date,
  proposedEnd: Date,
  intervals: BlockedInterval[],
): BlockedInterval | null {
  const ps = proposedStart.getTime();
  const pe = proposedEnd.getTime();
  for (const iv of intervals) {
    if (ps < iv.end.getTime() && iv.start.getTime() < pe) return iv;
  }
  return null;
}

/** Convenience: is this technician completely unavailable on this day? */
export function isTechnicianFullyBlocked(
  day: Date,
  availability?: TechnicianAvailability | null,
  leaves?: TechnicianLeave[] | null,
): boolean {
  const intervals = getBlockedIntervalsForDay(day, availability, leaves);
  return intervals.some(iv => iv.reason === 'leave' || iv.reason === 'day_off');
}