// Task Comments Service - Fully integrated with backend API
import { getAuthHeaders , getMutationHeaders, getMutationHeadersNoContentType} from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface BackendCommentResponse {
  id: number;
  taskId: number;
  comment: string;
  createdDate: string;
  createdBy: string;
}

const mapBackendToFrontend = (c: BackendCommentResponse): TaskComment => ({
  id: String(c.id),
  taskId: String(c.taskId),
  content: c.comment,
  authorId: c.createdBy,
  authorName: c.createdBy,
  createdAt: new Date(c.createdDate),
});

export const TaskCommentsService = {
  async getComments(taskId: string): Promise<TaskComment[]> {
    const response = await fetch(`${API_URL}/api/TaskComments/task/${taskId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch comments' }));
      throw new Error(error.message || 'Failed to fetch comments');
    }
    
    const data = await response.json();
    const comments = data.comments || data.data?.comments || data || [];
    return comments.map(mapBackendToFrontend);
  },

  async addComment(taskId: string, content: string, authorId: string, authorName: string): Promise<TaskComment> {
    const response = await fetch(`${API_URL}/api/TaskComments`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({
        taskId: parseInt(taskId),
        comment: content,
        createdBy: authorName || authorId,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create comment' }));
      throw new Error(error.message || 'Failed to create comment');
    }
    
    const data = await response.json();
    return mapBackendToFrontend(data.data || data);
  },

  async updateComment(taskId: string, commentId: string, content: string): Promise<TaskComment | null> {
    const response = await fetch(`${API_URL}/api/TaskComments/${commentId}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify({ comment: content }),
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json().catch(() => ({ message: 'Failed to update comment' }));
      throw new Error(error.message || 'Failed to update comment');
    }
    
    const data = await response.json();
    return mapBackendToFrontend(data.data || data);
  },

  async deleteComment(taskId: string, commentId: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/api/TaskComments/${commentId}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });
    
    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete comment' }));
      throw new Error(error.message || 'Failed to delete comment');
    }
    
    return true;
  },
};
