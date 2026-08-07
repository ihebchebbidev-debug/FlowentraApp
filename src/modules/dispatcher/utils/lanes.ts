// Lane assignment utilities for stacking overlapping jobs in the calendar
import type { Job } from '../types';

export interface LanedJob {
  job: Job;
  lane: number;
}

/** Greedy lane assignment: each job goes to the first lane whose previous job ended ≤ its start. */
export function assignLanes(jobs: Job[]): LanedJob[] {
  const sorted = [...jobs]
    .filter(j => j.scheduledStart && j.scheduledEnd)
    .sort((a, b) => {
      const aS = (a.scheduledStart instanceof Date ? a.scheduledStart : new Date(a.scheduledStart!)).getTime();
      const bS = (b.scheduledStart instanceof Date ? b.scheduledStart : new Date(b.scheduledStart!)).getTime();
      return aS - bS;
    });
  const laneEnds: number[] = [];
  const result: LanedJob[] = [];
  for (const job of sorted) {
    const start = (job.scheduledStart instanceof Date ? job.scheduledStart : new Date(job.scheduledStart!)).getTime();
    const end = (job.scheduledEnd instanceof Date ? job.scheduledEnd : new Date(job.scheduledEnd!)).getTime();
    let lane = laneEnds.findIndex(t => t <= start);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(end); }
    else { laneEnds[lane] = end; }
    result.push({ job, lane });
  }
  return result;
}

/** Max number of overlapping lanes used by any of the supplied job buckets. */
export function maxLanes(jobBuckets: Job[][]): number {
  let max = 1;
  for (const jobs of jobBuckets) {
    if (jobs.length === 0) continue;
    const used = assignLanes(jobs).reduce((m, l) => Math.max(m, l.lane + 1), 1);
    if (used > max) max = used;
  }
  return max;
}
