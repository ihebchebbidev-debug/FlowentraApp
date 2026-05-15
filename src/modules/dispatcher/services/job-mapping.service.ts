// Job mapping and service order fetching service
import { serviceOrdersApi, type ServiceOrder as ApiServiceOrder, type ServiceOrderJob } from '@/services/api/serviceOrdersApi';
import { installationsApi } from '@/services/api/installationsApi';
import { dispatchesApi, type Dispatch } from '@/services/api/dispatchesApi';
import { cacheService } from './cache.service';
import { DispatchOperationsService } from './dispatch-operations.service';
import type { Job, ServiceOrder } from '../types';

export class JobMappingService {
  // ── Fetch unassigned jobs from service orders ──────

  static async fetchServiceOrdersWithUnassignedJobs(forceRefresh = false): Promise<{ serviceOrders: ServiceOrder[]; jobs: Job[] }> {
    // Stale-while-revalidate
    if (!forceRefresh && cacheService.hasFreshUnassignedJobs()) {
      return { serviceOrders: cacheService.serviceOrders, jobs: cacheService.unassignedJobs };
    }

    if (!forceRefresh && cacheService.hasStaleUnassignedJobs()) {
      JobMappingService._fetchInternal().catch(console.error);
      return { serviceOrders: cacheService.serviceOrders, jobs: cacheService.unassignedJobs };
    }

    return JobMappingService._fetchInternal();
  }

  static async _fetchInternal(): Promise<{ serviceOrders: ServiceOrder[]; jobs: Job[] }> {
    if (cacheService.pendingUnassignedJobs) {
      return cacheService.pendingUnassignedJobs;
    }

    cacheService.pendingUnassignedJobs = (async () => {
      try {
        const [ordersResponse, dispatches] = await Promise.all([
          serviceOrdersApi.getAll({ pageSize: 200 }),
          DispatchOperationsService.fetchDispatchesCached()
        ]);

        const orders = ordersResponse.data.serviceOrders || [];
        const dispatchedJobIds = new Set<string>();
        dispatches.forEach((d: Dispatch) => {
          if (d.jobId) dispatchedJobIds.add(String(d.jobId));
        });

        const activeOrders = orders.filter((so: any) =>
          so.status === 'planned' || so.status === 'ready_for_planning' || so.status === 'pending'
        );

        const serviceOrdersWithJobs: ServiceOrder[] = [];
        const allUnassignedJobs: Job[] = [];
        const installationIdsToResolve = new Set<string>();

        const batchSize = 20;
        for (let i = 0; i < activeOrders.length; i += batchSize) {
          const batch = activeOrders.slice(i, i + batchSize);
          const batchResults = await Promise.allSettled(
            batch.map(async (so: any) => {
              try {
                const fullOrder = await serviceOrdersApi.getById(so.id, true);
                return { so, fullOrder };
              } catch {
                return null;
              }
            })
          );

          for (const result of batchResults) {
            if (result.status !== 'fulfilled' || !result.value) continue;
            const { so, fullOrder } = result.value;
            const jobs = fullOrder.jobs || [];

            const unassignedJobs: Job[] = [];
            for (const job of jobs) {
              const jobId = String(job.id);
              const isDispatched = dispatchedJobIds.has(jobId);
              const jobStatus = (job.status || 'pending').toLowerCase();
              const isPlannedOrCompleted = ['completed', 'cancelled', 'dispatched', 'in_progress', 'scheduled', 'planned', 'assigned'].includes(jobStatus);

              if (!isDispatched && !isPlannedOrCompleted) {
                const mappedJob = JobMappingService.mapApiJobToLocal(job, fullOrder);
                unassignedJobs.push(mappedJob);
                allUnassignedJobs.push(mappedJob);
                if (!mappedJob.installationName && mappedJob.installationId) {
                  installationIdsToResolve.add(String(mappedJob.installationId));
                }
              }
            }

            const shouldInclude = unassignedJobs.length > 0 || so.status === 'planned' || so.status === 'ready_for_planning' || so.status === 'pending';
            if (shouldInclude) {
              const soAny = so as any;
              const customerName = so.contactName ||
                soAny.contact?.name ||
                (soAny.contact?.firstName && soAny.contact?.lastName
                  ? `${soAny.contact.firstName} ${soAny.contact.lastName}`
                  : soAny.contact?.company || 'Unknown Customer');

              serviceOrdersWithJobs.push({
                id: String(so.id),
                title: so.title || so.orderNumber || `SO-${so.id}`,
                customerName,
                status: so.status as any,
                priority: (so.priority || 'medium') as any,
                jobs: unassignedJobs,
                totalEstimatedDuration: unassignedJobs.reduce((sum, j) => sum + (j.estimatedDuration || 0), 0),
                location: { address: so.notes || fullOrder.notes || 'No address specified' },
                createdAt: new Date(so.createdDate || Date.now()),
              });
            }
          }
        }

        // Resolve installation names
        await JobMappingService.resolveInstallationNames(installationIdsToResolve, allUnassignedJobs, serviceOrdersWithJobs);

        cacheService.serviceOrders = serviceOrdersWithJobs;
        cacheService.unassignedJobs = allUnassignedJobs;

        return { serviceOrders: serviceOrdersWithJobs, jobs: allUnassignedJobs };
      } catch (error) {
        console.error('Failed to fetch service orders with unassigned jobs:', error);
        return { serviceOrders: cacheService.serviceOrders, jobs: cacheService.unassignedJobs };
      } finally {
        cacheService.pendingUnassignedJobs = null;
      }
    })();

    return cacheService.pendingUnassignedJobs;
  }

  // ── Resolve installation names in batch ────────────

  private static async resolveInstallationNames(
    idsToResolve: Set<string>,
    allJobs: Job[],
    serviceOrders: ServiceOrder[]
  ): Promise<void> {
    const missingIds = Array.from(idsToResolve).filter(id => !cacheService.hasInstallationName(id));
    if (missingIds.length === 0) return;

    const batchSize = 15;
    const batches = [];
    for (let i = 0; i < missingIds.length; i += batchSize) {
      const batch = missingIds.slice(i, i + batchSize);
      batches.push(
        Promise.allSettled(
          batch.map(async (id) => {
            try {
              const installation = await installationsApi.getById(id);
              const name = (installation as any)?.name;
              if (name) cacheService.setInstallationName(id, String(name));
            } catch { /* ignore */ }
          })
        )
      );
    }
    await Promise.all(batches);

    // Apply resolved names
    const applyName = (j: Job) => {
      if (!j.installationName && j.installationId) {
        const name = cacheService.getInstallationName(String(j.installationId));
        if (name) j.installationName = name;
      }
    };
    allJobs.forEach(applyName);
    serviceOrders.forEach(so => so.jobs.forEach(applyName));
  }

  // ── Map API job to local Job type ──────────────────

  static mapApiJobToLocal(job: ServiceOrderJob, so: ApiServiceOrder): Job {
    const soAny = so as any;
    const contact = soAny.contact;

    const customerName = so.contactName ||
      contact?.name ||
      (contact?.firstName && contact?.lastName ? `${contact.firstName} ${contact.lastName}` : null) ||
      contact?.company || 'Unknown Customer';

    return {
      id: String(job.id),
      serviceOrderId: String(so.id),
      serviceOrderTitle: so.title || so.orderNumber || `SO-${so.id}`,
      serviceOrderNumber: so.orderNumber || `SO-${so.id}`,
      title: job.title || job.jobDescription,
      description: job.jobDescription,
      status: job.status === 'pending' ? 'unassigned' : (job.status as any),
      priority: (job.priority || so.priority || 'medium') as any,
      estimatedDuration: job.estimatedDuration || 60,
      originalDuration: (job as any).originalDuration || job.estimatedDuration || 60,
      requiredSkills: [],
      installationId: job.installationId,
      installationName: job.installationName,
      location: { address: job.installationName || so.notes || 'No address' },
      customerName,
      customerPhone: contact?.phone || contact?.phoneNumber || soAny.contactPhone || undefined,
      customerEmail: contact?.email || soAny.contactEmail || undefined,
      customerCompany: contact?.company || contact?.companyName || soAny.company || undefined,
      contactId: so.contactId || contact?.id,
      createdAt: new Date(so.createdDate || Date.now()),
      updatedAt: new Date(so.modifiedDate || Date.now()),
    };
  }

  static getServiceOrders(): ServiceOrder[] {
    return cacheService.serviceOrders;
  }

  static getUnassignedJobs(): Job[] {
    return cacheService.unassignedJobs;
  }
}
