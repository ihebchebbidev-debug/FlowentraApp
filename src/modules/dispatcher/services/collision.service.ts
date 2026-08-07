// Collision detection service for the planning board
import type { Job } from '../types';

export interface CollisionResult {
  hasCollision: boolean;
  overlappingJobs: Job[];
  message?: string;
}

export class CollisionService {
  /**
   * Check if a proposed time slot collides with existing jobs for a technician on a date.
   */
  static checkCollision(
    proposedStart: Date,
    proposedEnd: Date,
    existingJobs: Job[],
    excludeJobId?: string
  ): CollisionResult {
    const overlapping: Job[] = [];

    for (const job of existingJobs) {
      if (excludeJobId && job.id === excludeJobId) continue;
      if (!job.scheduledStart || !job.scheduledEnd) continue;

      const jobStart = job.scheduledStart instanceof Date ? job.scheduledStart : new Date(job.scheduledStart);
      const jobEnd = job.scheduledEnd instanceof Date ? job.scheduledEnd : new Date(job.scheduledEnd);

      // Check for overlap: two intervals overlap if start1 < end2 AND start2 < end1
      if (proposedStart < jobEnd && jobStart < proposedEnd) {
        overlapping.push(job);
      }
    }

    if (overlapping.length === 0) {
      return { hasCollision: false, overlappingJobs: [] };
    }

    const jobTitles = overlapping.map(j => j.title || `Job #${j.id}`).join(', ');
    return {
      hasCollision: true,
      overlappingJobs: overlapping,
      message: `Time slot overlaps with: ${jobTitles}`,
    };
  }

  /**
   * Find the next available slot after proposed start for a given duration.
   * Scans existing jobs and finds a gap.
   */
  static findNextAvailableSlot(
    proposedStart: Date,
    durationMinutes: number,
    existingJobs: Job[],
    workingHoursEnd = 17
  ): Date | null {
    // Sort jobs by start time
    const sortedJobs = [...existingJobs]
      .filter(j => j.scheduledStart && j.scheduledEnd)
      .sort((a, b) => {
        const aStart = a.scheduledStart instanceof Date ? a.scheduledStart : new Date(a.scheduledStart!);
        const bStart = b.scheduledStart instanceof Date ? b.scheduledStart : new Date(b.scheduledStart!);
        return aStart.getTime() - bStart.getTime();
      });

    let candidateStart = new Date(proposedStart);

    for (const job of sortedJobs) {
      const jobStart = job.scheduledStart instanceof Date ? job.scheduledStart : new Date(job.scheduledStart!);
      const jobEnd = job.scheduledEnd instanceof Date ? job.scheduledEnd : new Date(job.scheduledEnd!);

      const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60000);

      // If candidate fits before this job, we found a slot
      if (candidateEnd <= jobStart) {
        return candidateStart;
      }

      // Otherwise, move candidate to after this job
      if (candidateStart < jobEnd) {
        candidateStart = new Date(jobEnd);
      }
    }

    // Check if remaining time fits before end of working hours (minute precision)
    const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60000);
    const candidateEndMinutes = candidateEnd.getHours() * 60 + candidateEnd.getMinutes();
    const cutoffMinutes = workingHoursEnd * 60;
    if (candidateEndMinutes <= cutoffMinutes) {
      return candidateStart;
    }

    return null;
  }
}
