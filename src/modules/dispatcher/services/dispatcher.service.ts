// DispatcherService - Thin facade delegating to sub-services
// This replaces the 1,226-line god class with a clean delegation pattern
import { cacheService } from './cache.service';
import { TechnicianService } from './technician.service';
import { JobMappingService } from './job-mapping.service';
import { DispatchOperationsService, extractTechnicianIdFromDispatch, technicianMatchesDispatch } from './dispatch-operations.service';
import { CollisionService } from './collision.service';
import type { Job, Technician, ServiceOrder } from '../types';
import type { Dispatch } from '@/services/api/dispatchesApi';

export { CollisionService } from './collision.service';
export { extractTechnicianIdFromDispatch, technicianMatchesDispatch } from './dispatch-operations.service';
export type { UndoAction } from './dispatch-operations.service';
export type { CollisionResult } from './collision.service';

export class DispatcherService {
  // ── Technician Management ──────────────────────────
  static fetchTechnicians = TechnicianService.fetchTechnicians;
  static getTechnicians = TechnicianService.getTechnicians;
  static setTechnicianMeta = TechnicianService.setTechnicianMeta;
  static getTechnicianMeta = TechnicianService.getTechnicianMeta;

  // ── Service Orders & Jobs ──────────────────────────
  static fetchServiceOrdersWithUnassignedJobs = JobMappingService.fetchServiceOrdersWithUnassignedJobs;
  static getServiceOrders = JobMappingService.getServiceOrders;
  static getUnassignedJobs = JobMappingService.getUnassignedJobs;

  static async fetchServiceOrders(): Promise<ServiceOrder[]> {
    const result = await JobMappingService.fetchServiceOrdersWithUnassignedJobs();
    return result.serviceOrders;
  }

  static async fetchUnassignedJobs(): Promise<Job[]> {
    const result = await JobMappingService.fetchServiceOrdersWithUnassignedJobs();
    return result.jobs;
  }

  // ── Dispatch Operations ────────────────────────────
  static fetchDispatches = DispatchOperationsService.fetchDispatches;
  static fetchDispatchesCached = DispatchOperationsService.fetchDispatchesCached;
  static createDispatchFromJob = DispatchOperationsService.createDispatchFromJob;
  static assignJob = DispatchOperationsService.assignJob;
  static assignServiceOrderJobs = DispatchOperationsService.assignServiceOrderJobs;
  static assignServiceOrderByInstallations = DispatchOperationsService.assignServiceOrderByInstallations;
  static assignInstallationGroup = DispatchOperationsService.assignInstallationGroup;
  static unassignJob = DispatchOperationsService.unassignJob;
  static deleteDispatch = DispatchOperationsService.deleteDispatch;
  static rescheduleDispatch = DispatchOperationsService.rescheduleDispatch;
  static updateSchedule = DispatchOperationsService.updateSchedule;
  static resizeJob = DispatchOperationsService.resizeJob;
  static lockJob = DispatchOperationsService.lockJob;
  static unlockJob = DispatchOperationsService.unlockJob;

  // Lock checks - sync versions for UI rendering
  static isDispatchLocked(dispatchId: string): boolean {
    return DispatchOperationsService.isDispatchLockedSync(dispatchId);
  }

  static getDispatchLockInfo(dispatchId: string): { isLocked: boolean; lockedAt?: string; lockedBy?: string } {
    return DispatchOperationsService.getDispatchLockInfo(dispatchId);
  }

  // ── Assigned Jobs (Calendar) ───────────────────────
  static getAssignedJobsForTechnician = DispatchOperationsService.getAssignedJobsForTechnician;
  static getAssignedJobsForDateRange = DispatchOperationsService.getAssignedJobsForDateRange;

  // ── Collision Detection ────────────────────────────
  static checkCollision = CollisionService.checkCollision;
  static findNextAvailableSlot = CollisionService.findNextAvailableSlot;

  // ── Undo ───────────────────────────────────────────
  static getLastUndoAction = DispatchOperationsService.getLastUndoAction;
  static undoLastAction = DispatchOperationsService.undoLastAction;

  // ── Sync getters (kept for backward compatibility) ─
  static getAssignedJobs(_technicianId: string, _date: Date): Job[] {
    return [];
  }

  // ── Cache Management ───────────────────────────────
  static clearCache(): void {
    cacheService.clearAll();
  }

  static hasFreshCache(): boolean {
    return cacheService.hasFreshCache();
  }

  static getCachedData(): { technicians: Technician[]; jobs: Job[]; hasFreshCache: boolean } {
    return {
      technicians: cacheService.technicians,
      jobs: cacheService.unassignedJobs,
      hasFreshCache: cacheService.hasFreshCache(),
    };
  }

  // ── Prefetching ────────────────────────────────────
  static prefetch(): Promise<void> {
    if (cacheService.isPrefetching && cacheService.prefetchPromise) {
      return cacheService.prefetchPromise;
    }

    cacheService.isPrefetching = true;
    cacheService.prefetchPromise = (async () => {
      try {
        await Promise.all([
          TechnicianService.fetchTechnicians(),
          DispatchOperationsService.fetchDispatchesCached(),
          JobMappingService._fetchInternal()
        ]);
      } catch (error) {
        console.error('[Dispatcher] Prefetch failed:', error);
      } finally {
        cacheService.isPrefetching = false;
        cacheService.prefetchPromise = null;
      }
    })();

    return cacheService.prefetchPromise;
  }
}

export default DispatcherService;
