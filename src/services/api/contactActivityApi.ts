import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';

export interface ContactActivityDto {
  id: number;
  contactId: number;
  type: string;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  description?: string | null;
  metadata?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface ContactActivityListResponse {
  activities: ContactActivityDto[];
  totalCount: number;
}

export const contactActivityApi = {
  async getByContact(
    contactId: number,
    page = 1,
    pageSize = 100
  ): Promise<ContactActivityListResponse> {
    const response = await fetch(
      `${API_URL}/api/ContactActivities/contact/${contactId}?page=${page}&pageSize=${pageSize}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    if (!response.ok) {
      throw new Error('Failed to load contact activity');
    }
    const result = await response.json();
    return {
      activities: result.activities || [],
      totalCount: result.totalCount ?? 0,
    };
  },
};
