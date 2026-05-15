import { DispatcherService } from '../../dispatcher/services/dispatcher.service';
import type { Job, Technician } from '../../dispatcher/types';

// Delegate to DispatcherService to keep a single source of truth for technicians and meta
export class SchedulingService {
  static getTechnicians(): Technician[] {
    return DispatcherService.getTechnicians();
  }

  static getUnassignedJobs(): Job[] {
    return DispatcherService.getUnassignedJobs();
  }

  static setTechnicianMeta(technicianId: string, meta: Record<string, any>): void {
    DispatcherService.setTechnicianMeta(technicianId, meta);
  }

  static getTechnicianMeta(technicianId: string): Record<string, any> | null {
    return DispatcherService.getTechnicianMeta(technicianId);
  }
}
