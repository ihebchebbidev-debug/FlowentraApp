// Mock Projects Service - Static data only
export interface BackendProjectResponse {
  id: number;
  name: string;
  description?: string;
  contactId?: number;
  contactName?: string;
  ownerId: number;
  ownerName: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  modifiedBy?: string;
  tasksCount: number;
  openTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  membersCount: number;
  isActive: boolean;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  contactId?: number;
  ownerId: number;
  ownerName: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  estimatedHours?: number;
  tags?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  contactId?: number;
  ownerId?: number;
  ownerName?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage?: number;
  tags?: string[];
  isActive?: boolean;
}

export interface ProjectSearchRequest {
  searchTerm?: string;
  status?: string;
  priority?: string;
  ownerId?: number;
  contactId?: number;
  tags?: string[];
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  isActive?: boolean;
  isOverdue?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

// Mock data storage
let mockProjects: BackendProjectResponse[] = [
  {
    id: 1,
    name: "Sample Project",
    description: "A sample project for demonstration",
    contactId: 1,
    contactName: "John Doe",
    ownerId: 1,
    ownerName: "Jane Smith",
    status: "Active",
    priority: "High",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    budget: 10000,
    estimatedHours: 500,
    actualHours: 150,
    completionPercentage: 30,
    tags: ["demo", "sample"],
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    createdBy: "admin",
    modifiedBy: "jane.smith",
    tasksCount: 1,
    openTasksCount: 1,
    completedTasksCount: 0,
    overdueTasksCount: 0,
    membersCount: 3,
    isActive: true
  }
];

export class ProjectsService {
  static async getAllProjects(): Promise<BackendProjectResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjects.filter(project => project.isActive);
  }

  static async getProjectById(id: number): Promise<BackendProjectResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const project = mockProjects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    return project;
  }

  static async createProject(data: CreateProjectRequest): Promise<BackendProjectResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newProject: BackendProjectResponse = {
      id: Math.max(...mockProjects.map(p => p.id), 0) + 1,
      name: data.name,
      description: data.description,
      contactId: data.contactId,
      contactName: data.contactId ? "Contact Name" : undefined,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      status: data.status || "Active",
      priority: data.priority || "Medium",
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      estimatedHours: data.estimatedHours,
      actualHours: 0,
      completionPercentage: 0,
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current-user",
      modifiedBy: "current-user",
      tasksCount: 0,
      openTasksCount: 0,
      completedTasksCount: 0,
      overdueTasksCount: 0,
      membersCount: 1,
      isActive: true
    };
    mockProjects.push(newProject);
    return newProject;
  }

  static async updateProject(id: number, data: UpdateProjectRequest): Promise<BackendProjectResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) throw new Error('Project not found');
    
    const updatedProject = {
      ...mockProjects[projectIndex],
      ...data,
      updatedAt: new Date().toISOString(),
      modifiedBy: "current-user"
    };
    mockProjects[projectIndex] = updatedProject;
    return updatedProject;
  }

  static async deleteProject(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) return false;
    mockProjects[projectIndex].isActive = false;
    mockProjects[projectIndex].updatedAt = new Date().toISOString();
    return true;
  }

  static async searchProjects(searchRequest: ProjectSearchRequest) {
    await new Promise(resolve => setTimeout(resolve, 400));
    let results = [...mockProjects];
    
    if (searchRequest.searchTerm) {
      results = results.filter(project => 
        project.name.toLowerCase().includes(searchRequest.searchTerm!.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchRequest.searchTerm!.toLowerCase())
      );
    }
    
    if (searchRequest.status) {
      results = results.filter(project => project.status === searchRequest.status);
    }
    
    if (searchRequest.priority) {
      results = results.filter(project => project.priority === searchRequest.priority);
    }
    
    if (searchRequest.ownerId) {
      results = results.filter(project => project.ownerId === searchRequest.ownerId);
    }
    
    if (searchRequest.contactId) {
      results = results.filter(project => project.contactId === searchRequest.contactId);
    }
    
    if (searchRequest.isActive !== undefined) {
      results = results.filter(project => project.isActive === searchRequest.isActive);
    }
    
    return {
      success: true,
      data: results,
      totalCount: results.length
    };
  }

  static async getProjectsByOwner(ownerId: number): Promise<BackendProjectResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjects.filter(project => project.ownerId === ownerId && project.isActive);
  }

  static async getProjectsByContact(contactId: number): Promise<BackendProjectResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjects.filter(project => project.contactId === contactId && project.isActive);
  }

  static async getOverdueProjects(): Promise<BackendProjectResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const now = new Date();
    return mockProjects.filter(project => 
      project.endDate && 
      new Date(project.endDate) < now && 
      project.status !== "Completed" &&
      project.isActive
    );
  }

  static async getActiveProjects(): Promise<BackendProjectResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjects.filter(project => project.status === "Active" && project.isActive);
  }

  static async getCompletedProjects(): Promise<BackendProjectResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjects.filter(project => project.status === "Completed");
  }

  static async getProjectStatusCounts(): Promise<Record<string, number>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const counts: Record<string, number> = {};
    
    mockProjects.filter(p => p.isActive).forEach(project => {
      counts[project.status] = (counts[project.status] || 0) + 1;
    });
    
    return counts;
  }

  static async getProjectCompletionStats(): Promise<{ totalProjects: number; completedProjects: number; averageCompletion: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const activeProjects = mockProjects.filter(p => p.isActive);
    const completedProjects = activeProjects.filter(p => p.status === "Completed");
    const averageCompletion = activeProjects.length > 0 
      ? activeProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / activeProjects.length 
      : 0;
    
    return {
      totalProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      averageCompletion: Math.round(averageCompletion)
    };
  }
}