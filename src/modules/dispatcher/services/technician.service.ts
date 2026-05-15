// Technician fetching and management service
import { usersApi } from '@/services/api/usersApi';
import { cacheService } from './cache.service';
import type { Technician } from '../types';

import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';

function getToken(): string | null {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

export class TechnicianService {
  static async fetchTechnicians(forceRefresh = false): Promise<Technician[]> {
    if (!forceRefresh && cacheService.hasFreshTechnicians()) {
      return cacheService.technicians;
    }

    // Deduplicate concurrent requests
    if (cacheService.pendingTechnicians) {
      return cacheService.pendingTechnicians;
    }

    cacheService.pendingTechnicians = (async () => {
      try {
        const [usersResponse, adminResponse] = await Promise.all([
          usersApi.getAll(),
          API_URL ? fetch(`${API_URL}/api/Auth/user/1`, {
            method: 'GET',
            headers: getAuthHeaders(),
          }).catch(() => null) : Promise.resolve(null)
        ]);

        const users = Array.isArray(usersResponse)
          ? usersResponse
          : (usersResponse as any).users || [];

        const technicians: Technician[] = users.map((user: any) => ({
          id: String(user.id),
          firstName: user.firstName || user.first_name || '',
          lastName: user.lastName || user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          skills: user.skills || [],
          status: user.status || 'available',
          workingHours: {
            start: user.workingHoursStart || '08:00',
            end: user.workingHoursEnd || '17:00',
          },
          avatar: user.profilePictureUrl || user.avatar || undefined,
        }));

        // Add admin user if fetched successfully
        if (adminResponse && adminResponse.ok) {
          try {
            const adminUser = await adminResponse.json();
            const adminExists = technicians.some(t => t.id === '1' || t.email === adminUser.email);
            if (!adminExists && adminUser) {
              technicians.unshift({
                id: '1',
                firstName: adminUser.firstName || adminUser.FirstName || '',
                lastName: adminUser.lastName || adminUser.LastName || '',
                email: adminUser.email || adminUser.Email || '',
                phone: adminUser.phoneNumber || adminUser.PhoneNumber || '',
                skills: [],
                status: 'available',
                workingHours: { start: '08:00', end: '17:00' },
                avatar: adminUser.profilePictureUrl || adminUser.ProfilePictureUrl || undefined,
              });
            }
          } catch {
            console.warn('Failed to parse admin user response');
          }
        }

        cacheService.technicians = technicians;
        return technicians;
      } catch (error) {
        console.error('Failed to fetch technicians:', error);
        return cacheService.technicians;
      } finally {
        cacheService.pendingTechnicians = null;
      }
    })();

    return cacheService.pendingTechnicians;
  }

  static getTechnicians(): Technician[] {
    return cacheService.technicians;
  }

  static setTechnicianMeta(technicianId: string, meta: Record<string, any>): void {
    const key = `technician_meta_${technicianId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...existing, ...meta }));
  }

  static getTechnicianMeta(technicianId: string): Record<string, any> | null {
    const key = `technician_meta_${technicianId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}
