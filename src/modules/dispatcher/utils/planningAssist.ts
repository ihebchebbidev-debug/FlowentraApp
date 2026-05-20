// Planning assistance utilities — smart technician suggestions + auto-fill day.
// Pure functions, no React, no side-effects (except DispatcherService.assignJob for auto-fill).
import type { Job, ServiceOrder, Technician } from '../types';
import { DispatcherService } from '../services/dispatcher.service';

/** Haversine distance in km between two lat/lng points. */
function distanceKm(a?: { lat?: number; lng?: number }, b?: { lat?: number; lng?: number }): number {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return 999;
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
  distanceKm: number;
  reasons: string[];
}

/**
 * Score every technician for a given job: skills, availability, distance.
 * Returns sorted descending by score.
 */
export function rankTechniciansForJob(
  job: Job | { requiredSkills?: string[]; location?: { lat?: number; lng?: number } },
  technicians: Technician[],
): TechnicianScore[] {
  const required = (job.requiredSkills ?? []).map(s => s.toLowerCase());
  return technicians
    .map<TechnicianScore>(tech => {
      const techSkills = (tech.skills ?? []).map(s => s.toLowerCase());
      const matched = required.length === 0
        ? 1
        : required.filter(s => techSkills.includes(s)).length / required.length;

      const available = tech.status === 'available' || tech.status === 'busy';
      const dist = distanceKm(tech.location, job.location);

      // weights
      const skillPoints = matched * 50;
      const availPoints = available ? 30 : 0;
      const distPoints = dist >= 999 ? 10 : Math.max(0, 20 - dist);
      const score = Math.round(skillPoints + availPoints + distPoints);

      const reasons: string[] = [];
      if (matched === 1 && required.length > 0) reasons.push('all skills match');
      else if (matched > 0) reasons.push(`${Math.round(matched * 100)}% skill match`);
      if (available) reasons.push('available');
      else reasons.push(tech.status);
      if (dist < 999) reasons.push(`${dist.toFixed(1)} km away`);

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

export interface AutoFillResult {
  assigned: number;
  skipped: number;
  errors: string[];
}

/**
 * Naive auto-fill: round-robin assign unassigned jobs to visible technicians,
 * stacking them back-to-back inside each technician's working hours.
 *
 * Does NOT fetch existing assignments — assumes the operator has a mostly
 * empty day. Pairs well with the confirmOnOverlap profile setting (a follow-up
 * refresh will surface conflicts visually).
 */
export async function autoFillDay(
  day: Date,
  unassignedJobs: Job[] | ServiceOrder[],
  technicians: Technician[],
  opts: { allowSchedulingInPast: boolean; maxJobsPerTech?: number } = { allowSchedulingInPast: false },
): Promise<AutoFillResult> {
  const result: AutoFillResult = { assigned: 0, skipped: 0, errors: [] };
  if (technicians.length === 0) {
    result.errors.push('No visible technicians');
    return result;
  }

  // Flatten ServiceOrder -> jobs[]
  const jobs: Job[] = [];
  for (const item of unassignedJobs) {
    if ('jobs' in item && Array.isArray((item as ServiceOrder).jobs)) {
      jobs.push(...(item as ServiceOrder).jobs);
    } else {
      jobs.push(item as Job);
    }
  }

  // Skip past day unless allowed
  const startOfDay = new Date(day); startOfDay.setHours(0, 0, 0, 0);
  if (!opts.allowSchedulingInPast && startOfDay.getTime() < new Date().setHours(0, 0, 0, 0)) {
    result.errors.push('Cannot auto-fill a past day with current profile settings');
    return result;
  }

  // Per-tech cursor inside working hours
  const cursors = new Map<string, Date>();
  const endTimes = new Map<string, Date>();
  for (const t of technicians) {
    cursors.set(t.id, timeOnDay(day, t.workingHours?.start || '09:00'));
    endTimes.set(t.id, timeOnDay(day, t.workingHours?.end || '17:00'));
  }
  const counts = new Map<string, number>();
  const maxPer = opts.maxJobsPerTech ?? 8;

  for (const job of jobs) {
    // Rank technicians by fit, then pick the best one whose cursor still fits the job
    const ranked = rankTechniciansForJob(job, technicians);
    const duration = (job.estimatedDuration || 60) * 60_000;
    let placed = false;

    for (const r of ranked) {
      const tid = r.technician.id;
      if ((counts.get(tid) ?? 0) >= maxPer) continue;
      const cursor = cursors.get(tid)!;
      const end = endTimes.get(tid)!;
      const jobEnd = new Date(cursor.getTime() + duration);
      if (jobEnd.getTime() > end.getTime()) continue;

      try {
        const techName = `${r.technician.firstName} ${r.technician.lastName}`.trim();
        await DispatcherService.assignJob(job.id, tid, new Date(cursor), jobEnd, techName, job.priority || 'medium');
        cursors.set(tid, jobEnd);
        counts.set(tid, (counts.get(tid) ?? 0) + 1);
        result.assigned++;
        placed = true;
        break;
      } catch (e) {
        result.errors.push(`${job.title}: ${e instanceof Error ? e.message : 'assign failed'}`);
      }
    }

    if (!placed) result.skipped++;
  }
  return result;
}
