import type { Technician } from '../../dispatcher/types';
import { LookupsService } from '@/modules/lookups/services/lookups.service';

export function initialsFor(tech: Technician) {
  return `${tech.firstName?.[0] || ''}${tech.lastName?.[0] || ''}`.toUpperCase();
}

export function avatarBgFor(status: Technician['status']) {
  return status === 'available' ? 'bg-green-100 text-green-700 border border-green-200' :
    status === 'busy' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
    status === 'offline' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
    status === 'on_leave' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
    status === 'not_working' ? 'bg-red-100 text-red-700 border border-red-200' :
    status === 'over_capacity' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
    'bg-gray-100 text-gray-600 border border-gray-200';
}

export function dotColorFor(status: Technician['status']) {
  try {
    const items = LookupsService.getTechnicianStatuses();
    const found = items.find(i => i.id === status);
    if (found && found.color) return `__hex__${found.color}`; // special marker for hex
  } catch {}
  return status === 'available' ? 'bg-green-500' :
    status === 'busy' ? 'bg-yellow-500' :
    status === 'offline' ? 'bg-gray-400' :
    status === 'on_leave' ? 'bg-purple-500' :
    status === 'not_working' ? 'bg-red-500' :
    status === 'over_capacity' ? 'bg-orange-500' :
    'bg-gray-400';
}

// Return a hex color string if lookups define it, otherwise undefined
export function lookupHexColorForStatus(status: Technician['status']): string | undefined {
  try {
    const items = LookupsService.getTechnicianStatuses();
    const found = items.find(i => i.id === status);
    return found?.color;
  } catch { return undefined; }
}
