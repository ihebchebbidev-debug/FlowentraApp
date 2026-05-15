// Projects Service - Backend API Integration
import { projectsApi, type CreateProjectRequestDto, type UpdateProjectRequestDto, type ProjectSearchRequestDto } from '@/services/api/projectsApi';
import type { Project, ProjectStats } from '@/modules/tasks/types';
import { notificationsApi } from '@/services/api/notificationsApi';

export class ProjectsService {
  // Get all projects
  static async getAllProjects(params?: ProjectSearchRequestDto): Promise<Project[]> {
    const result = await projectsApi.getAll(params);
    return result.projects;
  }

  // Get project by ID
  static async getProjectById(id: number): Promise<Project> {
    return await projectsApi.getById(id);
  }

  // Create project
  static async createProject(data: CreateProjectRequestDto): Promise<Project> {
    return await projectsApi.create(data);
  }

  // Update project
  static async updateProject(id: number, data: UpdateProjectRequestDto): Promise<Project> {
    return await projectsApi.update(id, data);
  }

  // Delete project
  static async deleteProject(id: number): Promise<boolean> {
    try {
      await projectsApi.delete(id);
      return true;
    } catch {
      return false;
    }
  }

  // Search projects
  static async searchProjects(searchRequest: ProjectSearchRequestDto) {
    const result = await projectsApi.getAll(searchRequest);
    return {
      success: true,
      data: result.projects,
      totalCount: result.totalCount,
    };
  }

  // Get projects by owner
  static async getProjectsByOwner(ownerId: number): Promise<Project[]> {
    const result = await projectsApi.getByOwner(ownerId);
    return result.projects;
  }

  // Get projects by contact
  static async getProjectsByContact(contactId: number): Promise<Project[]> {
    const result = await projectsApi.getByContact(contactId);
    return result.projects;
  }

  // Get projects by team member
  static async getProjectsByTeamMember(userId: number): Promise<Project[]> {
    const result = await projectsApi.getByTeamMember(userId);
    return result.projects;
  }

  // Get project statistics
  static async getProjectStats(projectId: number): Promise<ProjectStats> {
    return await projectsApi.getStats(projectId);
  }

  static async getProjectLinks(projectId: number) {
    return await projectsApi.getProjectLinks(projectId);
  }

  static async linkEntity(projectId: number, entityType: string, entityId: number) {
    return await projectsApi.linkEntity(projectId, entityType, entityId);
  }

  static async unlinkEntity(projectId: number, entityType: string, entityId: number) {
    return await projectsApi.unlinkEntity(projectId, entityType, entityId);
  }

  static async getSettings() {
    return await projectsApi.getSettings();
  }

  static async updateSettings(settings: {
    autoLinkConvertedEntities: boolean;
    requireProjectBeforeConvertingOffer: boolean;
    defaultTaskStatus: string;
    allowCrossProjectDispatch: boolean;
    showFinancialDataInProjectTabs: boolean;
    defaultLinkedEntityType: string;
  }) {
    return await projectsApi.updateSettings(settings);
  }

  // Assign team member
  static async assignTeamMember(projectId: number, userId: number, userName: string, projectName?: string): Promise<boolean> {
    try {
      await projectsApi.assignTeamMember(projectId, { userId, userName });
      
      // Send notification to the assigned user
      try {
        await notificationsApi.create({
          userId: userId,
          title: 'Added to project',
          description: `You have been added to project ${projectName || `#${projectId}`}`,
          type: 'info',
          category: 'task',
          link: `/tasks/projects/${projectId}`,
          relatedEntityId: projectId,
          relatedEntityType: 'project'
        });
      } catch (notifError) {
        console.error('Failed to send project assignment notification:', notifError);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // Remove team member
  static async removeTeamMember(projectId: number, userId: number): Promise<boolean> {
    try {
      await projectsApi.removeTeamMember(projectId, { userId });
      return true;
    } catch {
      return false;
    }
  }

  // Get team members
  static async getTeamMembers(projectId: number): Promise<number[]> {
    return await projectsApi.getTeamMembers(projectId);
  }

  // Bulk update status
  static async bulkUpdateStatus(projectIds: number[], status: string): Promise<boolean> {
    try {
      await projectsApi.bulkUpdateStatus({ projectIds, status });
      return true;
    } catch {
      return false;
    }
  }

  // Bulk archive
  static async bulkArchive(projectIds: number[], archive = true): Promise<boolean> {
    try {
      await projectsApi.bulkArchive(projectIds, archive);
      return true;
    } catch {
      return false;
    }
  }

  // Get overdue projects
  static async getOverdueProjects(): Promise<Project[]> {
    const result = await projectsApi.getAll({ isArchived: false });
    const now = new Date();
    return result.projects.filter(project => 
      project.endDate && 
      new Date(project.endDate) < now && 
      project.status !== 'completed'
    );
  }

  // Get active projects
  static async getActiveProjects(): Promise<Project[]> {
    const result = await projectsApi.getAll({ status: 'active', isArchived: false });
    return result.projects;
  }

  // Get completed projects
  static async getCompletedProjects(): Promise<Project[]> {
    const result = await projectsApi.getAll({ status: 'completed' });
    return result.projects;
  }

  // Get project status counts
  static async getProjectStatusCounts(): Promise<Record<string, number>> {
    const result = await projectsApi.getAll({ isArchived: false });
    const counts: Record<string, number> = {};
    
    result.projects.forEach(project => {
      counts[project.status] = (counts[project.status] || 0) + 1;
    });
    
    return counts;
  }

  // Get project completion stats
  static async getProjectCompletionStats(): Promise<{ totalProjects: number; completedProjects: number; averageCompletion: number }> {
    const result = await projectsApi.getAll({ isArchived: false });
    const completedProjects = result.projects.filter(p => p.status === 'completed');
    const averageCompletion = result.projects.length > 0 
      ? result.projects.reduce((sum, p) => sum + (p.progress || 0), 0) / result.projects.length 
      : 0;
    
    return {
      totalProjects: result.projects.length,
      completedProjects: completedProjects.length,
      averageCompletion: Math.round(averageCompletion),
    };
  }
}

// Re-export types for backward compatibility
export type { CreateProjectRequestDto, UpdateProjectRequestDto, ProjectSearchRequestDto };
export { projectsApi };
