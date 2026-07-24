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

  // Delete project — rethrows so callers can surface the real error.
  static async deleteProject(id: number): Promise<void> {
    await projectsApi.delete(id);
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
  static async assignTeamMember(projectId: number, userId: number, userName: string, projectName?: string): Promise<void> {
    await projectsApi.assignTeamMember(projectId, { userId, userName });

    // Notification is best-effort — never fail the assignment on notification errors.
    try {
      await notificationsApi.create({
        userId: userId,
        title: 'Added to project',
        description: `You have been added to project ${projectName || `#${projectId}`}`,
        type: 'info',
        category: 'task',
        link: `/dashboard/tasks/projects/${projectId}`,
        relatedEntityId: projectId,
        relatedEntityType: 'project'
      });
    } catch (notifError) {
      console.error('Failed to send project assignment notification:', notifError);
    }
  }

  // Remove team member — rethrows on failure so the UI can show a real error.
  static async removeTeamMember(projectId: number, userId: number): Promise<void> {
    await projectsApi.removeTeamMember(projectId, { userId });
  }

  // Get team members
  static async getTeamMembers(projectId: number): Promise<number[]> {
    return await projectsApi.getTeamMembers(projectId);
  }

  // Bulk update status — rethrows on failure.
  static async bulkUpdateStatus(projectIds: number[], status: string): Promise<void> {
    await projectsApi.bulkUpdateStatus({ projectIds, status });
  }

  // Bulk archive — rethrows on failure.
  static async bulkArchive(projectIds: number[], archive = true): Promise<void> {
    await projectsApi.bulkArchive(projectIds, archive);
  }

  // Internal helper: page through all non-archived projects with the server-capped page size
  // (200 rows/page). Used only where a full working set is unavoidable.
  private static async fetchAllProjects(params: ProjectSearchRequestDto = {}): Promise<Project[]> {
    const pageSize = 200;
    const all: Project[] = [];
    let pageNumber = 1;
    // Safety cap to avoid runaway loops if the server reports a huge count.
    for (let i = 0; i < 50; i++) {
      const result = await projectsApi.getAll({ ...params, pageNumber, pageSize });
      all.push(...result.projects);
      if (result.projects.length < pageSize || all.length >= (result.totalCount ?? all.length)) break;
      pageNumber++;
    }
    return all;
  }

  // Get overdue projects — must page through all rows; server does not filter by "endDate<now".
  static async getOverdueProjects(): Promise<Project[]> {
    const projects = await this.fetchAllProjects({ isArchived: false });
    const now = new Date();
    return projects.filter(project =>
      project.endDate &&
      new Date(project.endDate) < now &&
      project.status !== 'completed'
    );
  }

  // Get active projects
  static async getActiveProjects(): Promise<Project[]> {
    return this.fetchAllProjects({ status: 'active', isArchived: false });
  }

  // Get completed projects
  static async getCompletedProjects(): Promise<Project[]> {
    return this.fetchAllProjects({ status: 'completed' });
  }

  // Get project status counts — uses the server-side aggregated /statistics endpoint
  // instead of paging through every project and reducing client-side.
  static async getProjectStatusCounts(): Promise<Record<string, number>> {
    const stats = await projectsApi.getStatistics();
    return {
      active: stats.activeProjects,
      completed: stats.completedProjects,
      'on-hold': stats.onHoldProjects,
    };
  }

  // Get project completion stats — uses the server-side aggregated /statistics endpoint.
  static async getProjectCompletionStats(): Promise<{ totalProjects: number; completedProjects: number; averageCompletion: number }> {
    const stats = await projectsApi.getStatistics();
    const averageCompletion = stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;
    return {
      totalProjects: stats.totalProjects,
      completedProjects: stats.completedProjects,
      averageCompletion,
    };
  }
}

// Re-export types for backward compatibility
export type { CreateProjectRequestDto, UpdateProjectRequestDto, ProjectSearchRequestDto };
export { projectsApi };
