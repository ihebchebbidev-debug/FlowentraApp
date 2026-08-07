// Planning assistance utilities — smart technician suggestions + auto-fill day.
// Pure functions, no React, no side-effects (except DispatcherService.assignJob for auto-fill).
import type { Job, ServiceOrder, Technician } from '../types';
import { DispatcherService } from '../services/dispatcher.service';
import { CollisionService } from '../services/collision.service';
import { schedulesApi, type UserLeave } from '@/services/api/schedulesApi';
import { normalizeTechId } from './technicianId';
import {
  getBlockedIntervalsForDay,
  isTechnicianFullyBlocked,
  type BlockedInterval,
} from '../services/blockedIntervals.service';
import type { TechnicianAvailability } from '../components/calendar/types';
import type { TechnicianLeave } from '../components/calendar/CustomCalendar';

/** Haversine distance in km between two lat/lng points. */
function distanceKm(a?: { lat?: number; lng?: number }, b?: { lat?: number; lng?: number }): number | null {
  // Returns null when either side has no coordinates — caller decides scoring policy.
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export interface TechnicianScore {
  technician: Technician;
  score: number;          // 0..100, higher is better
  skillMatch: number;     // 0..1
  available: boolean;
  distanceKm: number | null;
  reasons: string[];
}

/**
 * Score every technician for a given job: skills, availability, distance.
 * Returns sorted descending by score.
 *
 * Optional `loadByTech` lets the ranker apply a small load-balancing penalty
 * (so the same technician isn't ranked first for every job during auto-fill).
 */
export function rankTechniciansForJob(
  job: Job | { requiredSkills?: string[]; location?: { lat?: number; lng?: number } },
  technicians: Technician[],
  loadByTech?: Map<string, number>,
): TechnicianScore[] {
  const required = (job.requiredSkills ?? []).map(s => s.trim().toLowerCase()).filter(Boolean);
  return technicians
    .map<TechnicianScore>(tech => {
      const techSkills = (tech.skills ?? []).map(s => s.trim().toLowerCase()).filter(Boolean);
      const matched = required.length === 0
        ? 1
        : required.filter(s => techSkills.includes(s)).length / required.length;

      // §3.7: only true "available" counts as available — "busy" must not give
      // free points; auto-fill will still try to find a free slot via collision check.
      const available = tech.status === 'available';
      const dist = distanceKm(tech.location, job.location);

      // weights
      const skillPoints = matched * 50;
      const availPoints = available ? 30 : 0;
      // §3.6: missing coordinates score 0 (not 10) — don't reward unknown distance.
      const distPoints = dist === null ? 0 : Math.max(0, 20 - dist);
      // §3.9: gentle load-balancing penalty (−4 per already-assigned job, capped).
      const load = loadByTech?.get(tech.id) ?? 0;
      const loadPenalty = Math.min(20, load * 4);
      const score = Math.round(skillPoints + availPoints + distPoints - loadPenalty);

      const reasons: string[] = [];
      if (matched === 1 && required.length > 0) reasons.push('all skills match');
      else if (matched > 0) reasons.push(`${Math.round(matched * 100)}% skill match`);
      if (available) reasons.push('available');
      else reasons.push(tech.status);
      if (dist !== null) reasons.push(`${dist.toFixed(1)} km away`);
      if (load > 0) reasons.push(`${load} job(s) already today`);

      return { technician: tech, score, skillMatch: matched, available, distanceKm: dist, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

/** Parse "HH:mm" to a Date on the given day. */
function timeOnDay(day: Date, hhmm: string): Date {
  const [h, m] = (hhmm || '09:00').split(':').map(Number);
  const d = new Date(day);
  d.setHours(h || 9, m || 0, 0, 0);
  return d;
}

/** §3.4: priority weight (higher = scheduled first). */
function priorityWeight(p?: string): number {
  switch ((p || '').toLowerCase()) {
    case 'urgent': return 4;
    case 'high':   return 3;
    case 'medium': return 2;
    case 'normal': return 2;
    case 'low':    return 1;
    default:       return 2;
  }
}

export interface PlacementRecord {
  /** Local calendar day the placement lives on (00:00 of that day). */
  day: Date;
  technicianId: string;
  technicianName: string;
  jobId: string;
  jobTitle: string;
  customerName?: string;
  serviceOrderId?: string;
  serviceOrderTitle?: string;
  priority: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  /** True when part of a multi-job service-order dispatch. */
  grouped?: boolean;
  /** Estimated travel distance in km from the tech's previous stop (or start location). */
  travelKm?: number | null;
}

export interface AutoFillResult {
  assigned: number;
  skipped: number;
  errors: string[];
  /** Human-readable reasons why units could not be placed (first few, deduped). */
  skipReasons: string[];
  /** Top-level reason when nothing could be placed at all (e.g. day already over). */
  summary?: string;
  /**
   * Jobs that could not be placed on this day. Populated when `returnUnplaced`
   * is true — the multi-day orchestrator uses this to retry on the next day.
   * When populated, they are NOT counted in `skipped` for the same run.
   */
  unplaced?: Job[];
  /** Number of distinct days that received at least one placement (multi-day runs). */
  daysUsed?: number;
  /** Detailed per-placement log for timeline visualisation. */
  placements?: PlacementRecord[];
}


/** Highest priority among a set of jobs (drives a grouped unit's priority). */
function highestPriority(jobs: Job[]): string {
  let best = 'medium';
  let bestWeight = -1;
  for (const j of jobs) {
    const w = priorityWeight(j.priority);
    if (w > bestWeight) { bestWeight = w; best = j.priority || 'medium'; }
  }
  return best;
}

/** A unit the auto-planner places as a whole — a single job, or a whole service order. */
interface PlaceUnit {
  rep: Job;            // representative job (skills/location/labels)
  jobs: Job[];         // all jobs in the unit
  priority: string;
  durationMin: number; // total duration of the unit
  serviceOrderId?: string;
}

/**
 * Auto-fill day:
 *   1. Fetches each technician's already-assigned jobs for the day (§3.1).
 *   2. Initializes per-tech cursor to max(workingHours.start, last existing jobEnd,
 *      and — if today + !allowSchedulingInPast — `now + buffer`) (§3.3).
 *   3. Sorts jobs by priority then estimated duration (§3.4).
 *   4. For each job, picks the best-ranked tech whose first free slot
 *      (via CollisionService.findNextAvailableSlot) still fits before end of
 *      working hours — guaranteeing no overlap with existing assignments.
 */
export async function autoFillDay(
  day: Date,
  unassignedJobs: Job[] | ServiceOrder[],
  technicians: Technician[],
  opts: {
    allowSchedulingInPast: boolean;
    maxJobsPerTech?: number;
    bufferMinutes?: number;
    /** When true, create one dispatch per service order (all its jobs) instead of per job. */
    groupByServiceOrder?: boolean;
    /**
     * When true, don't count jobs that couldn't fit today as `skipped` —
     * return them in `unplaced` so the multi-day orchestrator can retry
     * them on the next day. (Skip reasons are still collected.)
     */
    returnUnplaced?: boolean;
    /**
     * When true (default), a grouped service-order unit that is inherently too
     * long for any single technician's shift is automatically un-grouped and
     * its jobs are placed individually instead of being rejected with
     * "needs multiple days". Only applies when `groupByServiceOrder` is on.
     */
    autoDegroupOversized?: boolean;
  } = { allowSchedulingInPast: false },
): Promise<AutoFillResult> {
  const result: AutoFillResult = { assigned: 0, skipped: 0, errors: [], skipReasons: [], placements: [] };
  if (opts.returnUnplaced) result.unplaced = [];

  if (technicians.length === 0) {
    result.errors.push('No visible technicians');
    return result;
  }

  // Flatten ServiceOrder -> jobs[]
  const allJobs: Job[] = [];
  for (const item of unassignedJobs) {
    if ('jobs' in item && Array.isArray((item as ServiceOrder).jobs)) {
      allJobs.push(...(item as ServiceOrder).jobs);
    } else {
      allJobs.push(item as Job);
    }
  }

  // Skip past day unless allowed
  const startOfDay = new Date(day); startOfDay.setHours(0, 0, 0, 0);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  if (!opts.allowSchedulingInPast && startOfDay.getTime() < todayStart.getTime()) {
    result.errors.push('Cannot auto-fill a past day with current profile settings');
    return result;
  }

  // Build the units to place. "Single dispatch per service order" groups a whole
  // order (all its jobs) into one unit; otherwise every job is its own unit.
  // Jobs without a service order always fall back to per-job placement.
  let units: PlaceUnit[];
  if (opts.groupByServiceOrder) {
    const groups = new Map<string, Job[]>();
    for (const j of allJobs) {
      const key = j.serviceOrderId ? `so:${j.serviceOrderId}` : `job:${j.id}`;
      const arr = groups.get(key);
      if (arr) arr.push(j); else groups.set(key, [j]);
    }
    units = Array.from(groups.values()).map(gjobs => ({
      rep: gjobs[0],
      jobs: gjobs,
      priority: highestPriority(gjobs),
      durationMin: gjobs.reduce((s, j) => s + (j.estimatedDuration || 60), 0),
      serviceOrderId: gjobs[0].serviceOrderId,
    }));
  } else {
    units = allJobs.map(j => ({
      rep: j,
      jobs: [j],
      priority: j.priority || 'medium',
      durationMin: j.estimatedDuration || 60,
      serviceOrderId: j.serviceOrderId,
    }));
  }

  // §3.4: place important/long units first so they fit before the day fills up.
  // Improved: units with a hard due-date are considered first (earliest deadline first),
  // then priority, then longest duration (longer jobs are hardest to fit later).
  const dueTs = (u: PlaceUnit): number => {
    const d = (u.rep as Job & { dueDate?: Date | string }).dueDate;
    if (!d) return Number.POSITIVE_INFINITY;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
  };
  units.sort((a, b) => {
    const da = dueTs(a), db = dueTs(b);
    if (da !== db) return da - db;
    const pw = priorityWeight(b.priority) - priorityWeight(a.priority);
    if (pw !== 0) return pw;
    return b.durationMin - a.durationMin;
  });


  // §3.1 + §3.3: per-tech cursor and per-tech existing assignments cache
  const cursors = new Map<string, Date>();
  const endTimes = new Map<string, Date>();
  const existingByTech = new Map<string, Job[]>();
  const skipTech = new Set<string>();
  // Location of each tech's most recent placed stop (drives travel-aware ranking
  // for subsequent placements). Falls back to tech.location on first placement.
  const lastLocByTech = new Map<string, { lat?: number; lng?: number } | undefined>();
  const now = new Date();
  const isToday = startOfDay.getTime() === todayStart.getTime();
  const buffer = (opts.bufferMinutes ?? 0) * 60_000;


  // Dedup collector for user-visible skip reasons — hoisted so both the tech
  // init loop and the placement loop below can add to it.
  const seenReasons = new Set<string>();
  const addReason = (r: string) => {
    if (seenReasons.has(r) || result.skipReasons.length >= 5) return;
    seenReasons.add(r);
    result.skipReasons.push(r);
  };

  for (const t of technicians) {
    const whStart = timeOnDay(day, t.workingHours?.start || '09:00');
    const whEnd   = timeOnDay(day, t.workingHours?.end   || '17:00');

    // §3.1: fetch what's already on this tech's calendar today, so we never
    // overwrite or double-book existing assignments. In parallel, pull the
    // technician's full schedule (working hours, day off, lunch break, and
    // approved leaves) so blocked intervals become part of the "existing" set.
    let existing: Job[] = [];
    let schedule: Awaited<ReturnType<typeof schedulesApi.getSchedule>> | null = null;
    let leaves: UserLeave[] = [];
    const numericId = normalizeTechId(t.id) || t.id;
    const [existingRes, schedRes, leavesRes] = await Promise.allSettled([
      DispatcherService.getAssignedJobsForTechnician(t.id, day),
      schedulesApi.getSchedule(numericId),
      schedulesApi.getLeaves(numericId),
    ]);
    if (existingRes.status === 'fulfilled') {
      existing = existingRes.value;
    } else {
      // §3.1 safety: if we can't see existing assignments, skip this tech entirely
      // rather than risk double-booking.
      console.error(`[autoFillDay] failed to load existing jobs for ${t.id}`, existingRes.reason);
      skipTech.add(t.id);
      result.errors.push(`Skipped ${t.firstName} ${t.lastName}: could not load existing schedule`);
      continue;
    }
    if (schedRes.status === 'fulfilled') schedule = schedRes.value;
    if (leavesRes.status === 'fulfilled') leaves = leavesRes.value;

    // Blocked intervals (leaves, day off, lunch break) are treated as existing
    // work so findNextAvailableSlot cannot place a job on top of them.
    const availability: TechnicianAvailability | null = schedule ? {
      technicianId: t.id,
      status: schedule.status || 'available',
      scheduleNote: schedule.scheduleNote,
      daySchedules: schedule.daySchedules || {},
    } : null;
    const mappedLeaves: TechnicianLeave[] = (leaves || []).map(l => ({
      id: l.id,
      technicianId: t.id,
      leaveType: l.leaveType,
      startDate: new Date(l.startDate),
      endDate: new Date(l.endDate),
      status: l.status,
      reason: l.reason,
    }));

    if (isTechnicianFullyBlocked(day, availability, mappedLeaves)) {
      // Fully off (approved leave or non-working day) → don't schedule anything.
      skipTech.add(t.id);
      addReason(`${t.firstName} ${t.lastName} is on leave or off on this day.`);
      continue;
    }

    const blockedIntervals: BlockedInterval[] = getBlockedIntervalsForDay(day, availability, mappedLeaves);
    if (blockedIntervals.length > 0) {
      // Inject as pseudo-jobs so the collision scanner naturally routes around them.
      const synthetic: Job[] = blockedIntervals.map((iv, i) => ({
        id: `__blocked_${t.id}_${i}`,
        title: iv.reason === 'leave' ? 'On leave' : iv.reason === 'break' ? 'Break' : 'Day off',
        scheduledStart: iv.start,
        scheduledEnd: iv.end,
        status: 'blocked',
      } as unknown as Job));
      existing = [...existing, ...synthetic];
    }

    existingByTech.set(t.id, existing);

    // Cursor = max(working-hours start, last existing jobEnd, [now+buffer if today])
    let cursorMs = whStart.getTime();
    for (const j of existing) {
      const end = j.scheduledEnd instanceof Date ? j.scheduledEnd : j.scheduledEnd ? new Date(j.scheduledEnd) : null;
      if (end && end.getTime() > cursorMs) cursorMs = end.getTime();
    }
    if (isToday && !opts.allowSchedulingInPast) {
      cursorMs = Math.max(cursorMs, now.getTime() + buffer);
    }
    cursors.set(t.id, new Date(cursorMs));
    endTimes.set(t.id, whEnd);
  }

  // Diagnose: if every eligible tech's cursor is already past their working-hours
  // end, nothing can ever be placed. Surface a single, clear reason instead of
  // silently reporting "N jobs could not be placed" with no explanation.
  const eligibleTechs = technicians.filter(t => !skipTech.has(t.id));
  const allDayOver = eligibleTechs.length > 0 && eligibleTechs.every(t => {
    const c = cursors.get(t.id);
    const e = endTimes.get(t.id);
    return c && e && c.getTime() >= e.getTime();
  });
  if (allDayOver && units.length > 0) {
    const reason = isToday
      ? 'The workday is already over for every visible technician (current time is past their working-hours end, or their day is fully booked). Try tomorrow, extend working hours, or enable "Allow scheduling in the past".'
      : 'Every visible technician has no remaining time on this day (fully booked or working hours ended).';
    result.summary = reason;
    result.skipReasons.push(reason);
    const totalJobs = units.reduce((s, u) => s + u.jobs.length, 0);
    if (opts.returnUnplaced) {
      // Defer everything to the next day of the multi-day pass.
      for (const u of units) result.unplaced!.push(...u.jobs);
    } else {
      result.skipped = totalJobs;
    }
    return result;
  }

  const counts = new Map<string, number>();
  const maxPer = opts.maxJobsPerTech ?? 8;
  let errorLogged = 0;

  const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
  type ValidPriority = typeof PRIORITIES[number];
  const isPriority = (v: unknown): v is ValidPriority =>
    typeof v === 'string' && (PRIORITIES as readonly string[]).includes(v);

  // Use a mutable queue so an oversized grouped unit can be un-grouped and its
  // individual jobs re-queued in place (instead of being rejected wholesale).
  const queue: PlaceUnit[] = [...units];
  const autoDegroup = opts.autoDegroupOversized !== false; // default true

  while (queue.length > 0) {
    const unit = queue.shift()!;
    // §3.9: pass current per-tech counts so ranker applies load-balancing penalty.
    const eligible = technicians.filter(t => !skipTech.has(t.id));
    const ranked = rankTechniciansForJob(unit.rep, eligible, counts);
    const durationMin = Math.max(1, Math.ceil(unit.durationMin));
    const durationMs = durationMin * 60_000;
    const unitPriority: ValidPriority = isPriority(unit.priority) ? unit.priority : 'medium';
    let placed = false;
    // Track per-unit reasons so we can report an accurate cause when nothing fits.
    let sawCapReached = false;
    let sawNoSlot = false;
    let sawOverEnd = false;

    if (ranked.length === 0) {
      addReason('No eligible technicians (schedules could not be loaded).');
    }

    // Does this unit fit inside any eligible tech's raw shift window on this day?
    const fitsAnyWindow = eligible.some(t => {
      const s = timeOnDay(day, t.workingHours?.start || '09:00').getTime();
      const e = timeOnDay(day, t.workingHours?.end   || '17:00').getTime();
      return (e - s) >= durationMs;
    });
    if (!fitsAnyWindow) {
      // Grouped SO too long for any single shift? Auto-degroup into per-job
      // units — they'll place across the day (and, in multi-day mode, spill
      // to subsequent days) instead of being rejected wholesale.
      if (autoDegroup && unit.jobs.length > 1) {
        for (const j of unit.jobs) {
          queue.push({
            rep: j,
            jobs: [j],
            priority: j.priority || unit.priority || 'medium',
            durationMin: j.estimatedDuration || 60,
            serviceOrderId: j.serviceOrderId,
          });
        }
        continue;
      }
      // Single job that's inherently too long for one shift. In multi-day
      // mode the orchestrator would still not be able to split it, so surface
      // the reason and either defer (unplaced) or skip.
      addReason('Job needs multiple days — schedule manually.');
      if (opts.returnUnplaced) {
        result.unplaced!.push(...unit.jobs);
      } else {
        result.skipped += unit.jobs.length;
      }
      continue;
    }

    // Best-fit across all ranked technicians: evaluate every eligible candidate
    // and pick the one whose slot ends earliest — packs the day tighter and
    // leaves more room for later units.
    interface Candidate { r: typeof ranked[number]; slotStart: Date; jobEnd: Date; existing: Job[]; tid: string; travelKm: number | null; }
    const candidates: Candidate[] = [];
    for (const r of ranked) {
      const tid = r.technician.id;
      if ((counts.get(tid) ?? 0) >= maxPer) { sawCapReached = true; continue; }
      const cursor = cursors.get(tid)!;
      const end = endTimes.get(tid)!;
      const existing = existingByTech.get(tid) ?? [];
      const slotStart = CollisionService.findNextAvailableSlot(
        cursor,
        durationMin,
        existing,
        end.getHours() + end.getMinutes() / 60,
      );
      if (!slotStart) { sawNoSlot = true; continue; }
      const jobEnd = new Date(slotStart.getTime() + durationMs);
      if (jobEnd.getTime() > end.getTime()) { sawOverEnd = true; continue; }
      // Travel-aware: distance from tech's previous stop (or home base) to this job.
      const from = lastLocByTech.get(tid) ?? r.technician.location;
      const travelKm = distanceKm(from, unit.rep.location);
      candidates.push({ r, slotStart, jobEnd, existing, tid, travelKm });
    }

    // Best-fit sort: earliest jobEnd first (tightest pack); tie-break by shorter
    // travel distance (route continuity), then higher technician score.
    candidates.sort((a, b) => {
      const t = a.jobEnd.getTime() - b.jobEnd.getTime();
      if (t !== 0) return t;
      const at = a.travelKm ?? 9999;
      const bt = b.travelKm ?? 9999;
      if (at !== bt) return at - bt;
      return b.r.score - a.r.score;
    });


    for (const c of candidates) {
      try {
        const techName = `${c.r.technician.firstName} ${c.r.technician.lastName}`.trim();
        if (opts.groupByServiceOrder && unit.serviceOrderId && unit.jobs.length > 1) {
          const so: ServiceOrder = {
            id: unit.serviceOrderId,
            title: unit.rep.serviceOrderTitle || unit.rep.title || '',
            customerName: unit.rep.customerName || '',
            status: 'ready_for_planning',
            priority: unitPriority,
            jobs: unit.jobs,
            totalEstimatedDuration: unit.durationMin,
            location: unit.rep.location,
            createdAt: new Date(),
          };
          await DispatcherService.assignServiceOrderAsSingleDispatch(so, c.tid, c.slotStart, techName, unitPriority);
        } else {
          await DispatcherService.assignJob(unit.jobs[0].id, c.tid, c.slotStart, c.jobEnd, techName, unitPriority);
        }
        c.existing.push({ ...(unit.rep as Job), scheduledStart: c.slotStart, scheduledEnd: c.jobEnd });
        existingByTech.set(c.tid, c.existing);
        cursors.set(c.tid, c.jobEnd);
        counts.set(c.tid, (counts.get(c.tid) ?? 0) + 1);
        lastLocByTech.set(c.tid, unit.rep.location);
        result.assigned += unit.jobs.length;
        // Record every job in the unit as its own placement row (for the timeline).
        const techName2 = `${c.r.technician.firstName} ${c.r.technician.lastName}`.trim();
        const dayKey = new Date(startOfDay);
        let cursorStart = c.slotStart;
        for (const j of unit.jobs) {
          const dur = Math.max(1, Math.ceil(j.estimatedDuration || 60));
          const jStart = unit.jobs.length === 1 ? c.slotStart : cursorStart;
          const jEnd = unit.jobs.length === 1 ? c.jobEnd : new Date(cursorStart.getTime() + dur * 60_000);
          result.placements!.push({
            day: dayKey,
            technicianId: c.tid,
            technicianName: techName2,
            jobId: j.id,
            jobTitle: j.title,
            customerName: j.customerName,
            serviceOrderId: j.serviceOrderId,
            serviceOrderTitle: j.serviceOrderTitle,
            priority: unitPriority,
            scheduledStart: jStart,
            scheduledEnd: jEnd,
            grouped: unit.jobs.length > 1,
            travelKm: c.travelKm,
          });
          cursorStart = jEnd;
        }
        placed = true;
        break;

      } catch (e) {
        const msg = `${unit.rep.serviceOrderTitle || unit.rep.title}: ${e instanceof Error ? e.message : 'assign failed'}`;
        result.errors.push(msg);
        if (errorLogged < 5) {
          console.error('[autoFillDay] assign failed', msg, e);
          errorLogged++;
        }
      }
    }

    if (!placed) {
      // Defer to next day when the orchestrator is running a multi-day pass.
      if (opts.returnUnplaced) {
        result.unplaced!.push(...unit.jobs);
      } else {
        result.skipped += unit.jobs.length;
      }
      if (sawOverEnd) addReason(`Duration (${durationMin} min) does not fit before working-hours end on any technician.`);
      else if (sawNoSlot) addReason('No free slot before working-hours end on any technician.');
      else if (sawCapReached) addReason(`Every technician has already reached the per-day cap (${maxPer} jobs).`);
    }
  }

  if (!result.summary && result.assigned === 0 && result.skipped > 0 && result.skipReasons.length > 0) {
    result.summary = result.skipReasons[0];
  }

  return result;
}

/**
 * Multi-day auto-fill: runs {@link autoFillDay} for a horizon of consecutive
 * days starting at `startDay`. Any jobs that couldn't fit on a given day roll
 * over to the next day (via `returnUnplaced`), until either the queue empties
 * or the horizon is exhausted. Only after the last day are the still-unplaced
 * jobs counted as `skipped` and a summary reason is set.
 *
 * This is what powers the dispatcher's "Auto plan" button — the multi-day
 * horizon means a single big service order or a busy day no longer produces
 * "N jobs could not be placed" messages the moment the first day is full.
 */
export async function autoFillDays(
  startDay: Date,
  horizonDays: number,
  unassignedJobs: Job[] | ServiceOrder[],
  technicians: Technician[],
  opts: {
    allowSchedulingInPast: boolean;
    maxJobsPerTech?: number;
    bufferMinutes?: number;
    groupByServiceOrder?: boolean;
    autoDegroupOversized?: boolean;
  } = { allowSchedulingInPast: false },
): Promise<AutoFillResult> {
  const totalDays = Math.max(1, Math.floor(horizonDays));
  const combined: AutoFillResult = {
    assigned: 0,
    skipped: 0,
    errors: [],
    skipReasons: [],
    daysUsed: 0,
    placements: [],
  };

  const seen = new Set<string>();
  const addReason = (r: string) => {
    if (!r || seen.has(r) || combined.skipReasons.length >= 5) return;
    seen.add(r);
    combined.skipReasons.push(r);
  };

  // Flatten to jobs up front — the orchestrator carries `Job[]` between days.
  let queue: Job[] = [];
  for (const item of unassignedJobs) {
    if ('jobs' in item && Array.isArray((item as ServiceOrder).jobs)) {
      queue.push(...(item as ServiceOrder).jobs);
    } else {
      queue.push(item as Job);
    }
  }

  for (let i = 0; i < totalDays && queue.length > 0; i++) {
    const day = new Date(startDay);
    day.setDate(day.getDate() + i);
    // Only the LAST day counts unplaced as skipped; earlier days defer.
    const isLastDay = i === totalDays - 1;
    const res = await autoFillDay(day, queue, technicians, {
      ...opts,
      returnUnplaced: !isLastDay,
    });
    combined.assigned += res.assigned;
    combined.errors.push(...res.errors);
    if (res.placements?.length) combined.placements!.push(...res.placements);
    res.skipReasons.forEach(addReason);
    if (res.assigned > 0) combined.daysUsed = (combined.daysUsed ?? 0) + 1;

    if (isLastDay) {
      combined.skipped += res.skipped;
    } else {
      queue = res.unplaced ?? [];
    }
  }

  if (combined.assigned === 0 && combined.skipped > 0 && combined.skipReasons.length > 0) {
    combined.summary = combined.skipReasons[0];
  } else if (combined.assigned > 0 && (combined.daysUsed ?? 0) > 1) {
    combined.summary = `Scheduled across ${combined.daysUsed} day(s).`;
  }
  return combined;
}
