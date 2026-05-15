// Cache management service for dispatcher data
import type { Job, Technician, ServiceOrder } from '../types';
import type { Dispatch } from '@/services/api/dispatchesApi';

// Cache TTLs (milliseconds)
const DISPATCHES_CACHE_TTL = 60000;
const ASSIGNED_JOBS_CACHE_TTL = 30000;
const UNASSIGNED_JOBS_CACHE_TTL = 45000;
const TECHNICIANS_CACHE_TTL = 120000;

class DispatcherCacheService {
  // Technicians
  private _technicians: Technician[] | null = null;
  private _techniciansTimestamp = 0;

  // Service orders & unassigned jobs
  private _serviceOrders: ServiceOrder[] | null = null;
  private _unassignedJobs: Job[] | null = null;
  private _unassignedJobsTimestamp = 0;

  // Dispatches
  private _dispatches: Dispatch[] | null = null;
  private _dispatchesTimestamp = 0;

  // Assigned jobs by technician-date key
  private _assignedJobs = new Map<string, { jobs: Job[]; timestamp: number }>();

  // Installation name cache
  private _installationNames = new Map<string, string>();

  // Pending fetch deduplication
  private _pendingTechnicians: Promise<Technician[]> | null = null;
  private _pendingUnassignedJobs: Promise<{ serviceOrders: ServiceOrder[]; jobs: Job[] }> | null = null;
  private _pendingDispatches: Promise<Dispatch[]> | null = null;

  // Prefetch state
  private _isPrefetching = false;
  private _prefetchPromise: Promise<void> | null = null;

  // ── Technicians ────────────────────────────────────

  get technicians(): Technician[] { return this._technicians || []; }
  set technicians(value: Technician[]) {
    this._technicians = value;
    this._techniciansTimestamp = Date.now();
  }
  get techniciansTimestamp(): number { return this._techniciansTimestamp; }
  hasFreshTechnicians(): boolean {
    return !!this._technicians && this._technicians.length > 0 &&
      Date.now() - this._techniciansTimestamp < TECHNICIANS_CACHE_TTL;
  }

  get pendingTechnicians() { return this._pendingTechnicians; }
  set pendingTechnicians(p: Promise<Technician[]> | null) { this._pendingTechnicians = p; }

  // ── Unassigned Jobs / Service Orders ───────────────

  get serviceOrders(): ServiceOrder[] { return this._serviceOrders || []; }
  set serviceOrders(value: ServiceOrder[]) { this._serviceOrders = value; }

  get unassignedJobs(): Job[] { return this._unassignedJobs || []; }
  set unassignedJobs(value: Job[]) {
    this._unassignedJobs = value;
    this._unassignedJobsTimestamp = Date.now();
  }
  get unassignedJobsTimestamp(): number { return this._unassignedJobsTimestamp; }
  hasFreshUnassignedJobs(): boolean {
    return !!this._unassignedJobs && !!this._serviceOrders &&
      Date.now() - this._unassignedJobsTimestamp < UNASSIGNED_JOBS_CACHE_TTL;
  }
  hasStaleUnassignedJobs(): boolean {
    return !!this._unassignedJobs && !!this._serviceOrders;
  }

  get pendingUnassignedJobs() { return this._pendingUnassignedJobs; }
  set pendingUnassignedJobs(p: Promise<{ serviceOrders: ServiceOrder[]; jobs: Job[] }> | null) { this._pendingUnassignedJobs = p; }

  // ── Dispatches ─────────────────────────────────────

  get dispatches(): Dispatch[] { return this._dispatches || []; }
  set dispatches(value: Dispatch[]) {
    this._dispatches = value;
    this._dispatchesTimestamp = Date.now();
  }
  hasFreshDispatches(): boolean {
    return !!this._dispatches && Date.now() - this._dispatchesTimestamp < DISPATCHES_CACHE_TTL;
  }

  get pendingDispatches() { return this._pendingDispatches; }
  set pendingDispatches(p: Promise<Dispatch[]> | null) { this._pendingDispatches = p; }

  // ── Assigned Jobs ──────────────────────────────────

  getAssignedJobs(key: string): Job[] | null {
    const entry = this._assignedJobs.get(key);
    if (entry && Date.now() - entry.timestamp < ASSIGNED_JOBS_CACHE_TTL) {
      return entry.jobs;
    }
    return null;
  }
  setAssignedJobs(key: string, jobs: Job[]): void {
    this._assignedJobs.set(key, { jobs, timestamp: Date.now() });
  }

  // ── Installation names ─────────────────────────────

  getInstallationName(id: string): string | undefined { return this._installationNames.get(id); }
  setInstallationName(id: string, name: string): void { this._installationNames.set(id, name); }
  hasInstallationName(id: string): boolean { return this._installationNames.has(id); }

  // ── Prefetch state ─────────────────────────────────

  get isPrefetching() { return this._isPrefetching; }
  set isPrefetching(v: boolean) { this._isPrefetching = v; }
  get prefetchPromise() { return this._prefetchPromise; }
  set prefetchPromise(p: Promise<void> | null) { this._prefetchPromise = p; }

  // ── Global ─────────────────────────────────────────

  clearAll(): void {
    this._technicians = null;
    this._serviceOrders = null;
    this._unassignedJobs = null;
    this._dispatches = null;
    this._dispatchesTimestamp = 0;
    this._unassignedJobsTimestamp = 0;
    this._techniciansTimestamp = 0;
    this._assignedJobs.clear();
  }

  invalidateDispatchData(): void {
    this._unassignedJobs = null;
    this._serviceOrders = null;
    this._dispatches = null;
    this._dispatchesTimestamp = 0;
    this._unassignedJobsTimestamp = 0;
  }

  hasFreshCache(): boolean {
    return this.hasFreshTechnicians() && this.hasFreshUnassignedJobs() && this.hasFreshDispatches();
  }
}

// Singleton
export const cacheService = new DispatcherCacheService();
