// Planning assistance utilities — smart technician suggestions + auto-fill day.
// Pure functions, no React, no side-effects (except DispatcherService.assignJob for auto-fill).
import type { Job, ServiceOrder, Technician } from '../types';
import { DispatcherService } from '../services/dispatcher.service';
import { CollisionService } from '../services/collision.service';

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

export interface AutoFillResult {
  assigned: number;
  skipped: number;
  errors: string[];
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
  } = { allowSchedulingInPast: false },
): Promise<AutoFillResult> {
  const result: AutoFillResult = { assigned: 0, skipped: 0, errors: [] };
  if (technicians.length === 0) {
    result.errors.push('No visible technicians');
    return result;
  }

  // Flatten ServiceOrder -> jobs[]
  let jobs: Job[] = [];
  for (const item of unassignedJobs) {
    if ('jobs' in item && Array.isArray((item as ServiceOrder).jobs)) {
      jobs.push(...(item as ServiceOrder).jobs);
    } else {
      jobs.push(item as Job);
    }
  }

  // Skip past day unless allowed
  const startOfDay = new Date(day); startOfDay.setHours(0, 0, 0, 0);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  if (!opts.allowSchedulingInPast && startOfDay.getTime() < todayStart.getTime()) {
    result.errors.push('Cannot auto-fill a past day with current profile settings');
    return result;
  }

  // §3.4: sort jobs by priority desc, then by duration desc (long jobs early
  // are easier to fit before the day fills up).
  jobs = [...jobs].sort((a, b) => {
    const pw = priorityWeight(b.priority) - priorityWeight(a.priority);
    if (pw !== 0) return pw;
    return (b.estimatedDuration || 60) - (a.estimatedDuration || 60);
  });

  // §3.1 + §3.3: per-tech cursor and per-tech existing assignments cache
  const cursors = new Map<string, Date>();
  const endTimes = new Map<string, Date>();
  const existingByTech = new Map<string, Job[]>();
  const now = new Date();
  const isToday = startOfDay.getTime() === todayStart.getTime();
  const buffer = (opts.bufferMinutes ?? 0) * 60_000;

  for (const t of technicians) {
    const whStart = timeOnDay(day, t.workingHours?.start || '09:00');
    const whEnd   = timeOnDay(day, t.workingHours?.end   || '17:00');

    // §3.1: fetch what's already on this tech's calendar today, so we never
    // overwrite or double-book existing assignments.
    let existing: Job[] = [];
    try {
      existing = await DispatcherService.getAssignedJobsForTechnician(t.id, day);
    } catch (e) {
      console.error(`[autoFillDay] failed to load existing jobs for ${t.id}`, e);
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
  const counts = new Map<string, number>();
  const maxPer = opts.maxJobsPerTech ?? 8;
  let errorLogged = 0;

  for (const job of jobs) {
    // §3.9: pass current per-tech counts so ranker applies load-balancing penalty.
    const ranked = rankTechniciansForJob(job, technicians, counts);
    const duration = (job.estimatedDuration || 60) * 60_000;
    const durationMin = Math.ceil(duration / 60_000);
    let placed = false;

    for (const r of ranked) {
      const tid = r.technician.id;
      if ((counts.get(tid) ?? 0) >= maxPer) continue;
      const cursor = cursors.get(tid)!;
      const end = endTimes.get(tid)!;
      const existing = existingByTech.get(tid) ?? [];

      // §3.1: ask collision service for the first free slot >= cursor that
      // doesn't overlap any existing job and ends before working-hours end.
      const slotStart = CollisionService.findNextAvailableSlot(
        cursor,
        durationMin,
        existing,
        end.getHours() + end.getMinutes() / 60,
      );
      if (!slotStart) continue;
      const jobEnd = new Date(slotStart.getTime() + duration);
      if (jobEnd.getTime() > end.getTime()) continue;

      try {
        const techName = `${r.technician.firstName} ${r.technician.lastName}`.trim();
        await DispatcherService.assignJob(job.id, tid, slotStart, jobEnd, techName, job.priority || 'medium');
        // §3.1: also push the just-assigned job into the local existing list
        // so the next iteration's collision check sees it.
        existing.push({ ...(job as Job), scheduledStart: slotStart, scheduledEnd: jobEnd });
        existingByTech.set(tid, existing);
        cursors.set(tid, jobEnd);
        counts.set(tid, (counts.get(tid) ?? 0) + 1);
        result.assigned++;
        placed = true;
        break;
      } catch (e) {
        const msg = `${job.title}: ${e instanceof Error ? e.message : 'assign failed'}`;
        result.errors.push(msg);
        // §3.11: surface the first few errors instead of swallowing all of them silently.
        if (errorLogged < 5) {
          console.error('[autoFillDay] assign failed', msg, e);
          errorLogged++;
        }
      }
    }

    if (!placed) result.skipped++;
  }
  return result;
}
