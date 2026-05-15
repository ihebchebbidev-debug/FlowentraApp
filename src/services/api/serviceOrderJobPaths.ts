/**
 * Canonical service-order job API paths (kebab-case).
 * Keep in sync with backend: ServiceOrdersController routes and SyncService.ApplyServiceOrderJobAsync.
 */
export const SERVICE_ORDER_JOB_PATH_REGEX = /service-orders\/(\d+)\/jobs\/(\d+)/i;

export function serviceOrderJobPaths(serviceOrderId: number, jobId: number) {
  const base = `/api/service-orders/${serviceOrderId}/jobs/${jobId}`;
  return {
    base,
    /** PATCH body: { status } */
    status: `${base}/status`,
  } as const;
}
