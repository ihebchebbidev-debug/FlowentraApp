// Mock Tasks Service - Static data only
export interface BackendProjectTaskResponse {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  projectName: string;
  contactId?: number;
  contactName?: string;
  assigneeId?: number;
  assigneeName?: string;
  status: string;
  priority: string;
  columnId: number;
  columnTitle: string;
  columnColor: string;
  position: number;
  parentTaskId?: number;
  parentTaskTitle?: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy?: string;
  modifiedBy?: string;
  subTasks: BackendProjectTaskResponse[];
  commentsCount: number;
  attachmentsCount: number;
}

export interface BackendDailyTaskResponse {
  id: number;
  title: string;
  description?: string;
  userId: number;
  userName: string;
  status: string;
  priority: string;
  position: number;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy?: string;
  modifiedBy?: string;
  commentsCount: number;
  attachmentsCount: number;
}

export interface CreateProjectTaskRequest {
  title: string;
  description?: string;
  projectId: number;
  contactId?: number;
  assigneeId?: number;
  assigneeName?: string;
  status?: string;
  priority?: string;
  columnId: number;
  parentTaskId?: number;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  tags: string[];
}

export interface CreateDailyTaskRequest {
  title: string;
  description?: string;
  userId: number;
  userName: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  tags: string[];
}

export interface UpdateProjectTaskRequest {
  title?: string;
  description?: string;
  contactId?: number;
  assigneeId?: number;
  assigneeName?: string;
  status?: string;
  priority?: string;
  columnId?: number;
  position?: number;
  parentTaskId?: number;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  completedAt?: string;
}

export interface UpdateDailyTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  position?: number;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  completedAt?: string;
}

export interface MoveTaskRequest {
  columnId: number;
  position: number;
}

export interface TaskSearchRequest {
  searchTerm?: string;
  status?: string;
  priority?: string;
  projectId?: number;
  assigneeId?: number;
  contactId?: number;
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  isOverdue?: boolean;
  hasParent?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

// Mock data storage
let mockProjectTasks: BackendProjectTaskResponse[] = [
  {
    id: 1,
    title: "Setup project foundation",
    description: "Initialize the project structure and dependencies",
    projectId: 1,
    projectName: "Sample Project",
    contactId: 1,
    contactName: "John Doe",
    assigneeId: 1,
    assigneeName: "Jane Smith",
    status: "In Progress",
    priority: "High",
    columnId: 1,
    columnTitle: "In Progress",
    columnColor: "#3b82f6",
    position: 1,
    dueDate: "2024-12-31",
    startDate: "2024-01-01",
    estimatedHours: 40,
    actualHours: 20,
    tags: ["setup", "foundation"],
    attachments: [],
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    createdBy: "admin",
    modifiedBy: "jane.smith",
    subTasks: [],
    commentsCount: 3,
    attachmentsCount: 0
  }
];

let mockDailyTasks: BackendDailyTaskResponse[] = [
  {
    id: 1,
    title: "Review daily reports",
    description: "Check and review the daily progress reports",
    userId: 1,
    userName: "Jane Smith",
    status: "Todo",
    priority: "Medium",
    position: 1,
    dueDate: "2024-12-31",
    estimatedHours: 2,
    actualHours: 0,
    tags: ["review", "daily"],
    attachments: [],
    createdAt: "2024-01-01T09:00:00Z",
    updatedAt: "2024-01-01T09:00:00Z",
    createdBy: "jane.smith",
    modifiedBy: "jane.smith",
    commentsCount: 0,
    attachmentsCount: 0
  }
];

export class TasksService {
  // Project Tasks
  static async getProjectTasks(projectId: number): Promise<BackendProjectTaskResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    return mockProjectTasks.filter(task => task.projectId === projectId);
  }

  static async getColumnTasks(columnId: number): Promise<BackendProjectTaskResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjectTasks.filter(task => task.columnId === columnId);
  }

  static async getProjectTaskById(id: number): Promise<BackendProjectTaskResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const task = mockProjectTasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    return task;
  }

  static async createProjectTask(data: CreateProjectTaskRequest): Promise<BackendProjectTaskResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newTask: BackendProjectTaskResponse = {
      id: Math.max(...mockProjectTasks.map(t => t.id), 0) + 1,
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      projectName: "Sample Project",
      contactId: data.contactId,
      contactName: data.contactId ? "Contact Name" : undefined,
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      status: data.status || "Todo",
      priority: data.priority || "Medium",
      columnId: data.columnId,
      columnTitle: "Todo",
      columnColor: "#6b7280",
      position: mockProjectTasks.filter(t => t.columnId === data.columnId).length + 1,
      parentTaskId: data.parentTaskId,
      dueDate: data.dueDate,
      startDate: data.startDate,
      estimatedHours: data.estimatedHours,
      actualHours: 0,
      tags: data.tags || [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current-user",
      modifiedBy: "current-user",
      subTasks: [],
      commentsCount: 0,
      attachmentsCount: 0
    };
    mockProjectTasks.push(newTask);
    return newTask;
  }

  static async updateProjectTask(id: number, data: UpdateProjectTaskRequest): Promise<BackendProjectTaskResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const taskIndex = mockProjectTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) throw new Error('Task not found');
    
    const updatedTask = {
      ...mockProjectTasks[taskIndex],
      ...data,
      updatedAt: new Date().toISOString(),
      modifiedBy: "current-user"
    };
    mockProjectTasks[taskIndex] = updatedTask;
    return updatedTask;
  }

  static async deleteProjectTask(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const taskIndex = mockProjectTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return false;
    mockProjectTasks.splice(taskIndex, 1);
    return true;
  }

  // Daily Tasks
  static async getUserDailyTasks(userId: number): Promise<BackendDailyTaskResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDailyTasks.filter(task => task.userId === userId);
  }

  static async getDailyTaskById(id: number): Promise<BackendDailyTaskResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const task = mockDailyTasks.find(t => t.id === id);
    if (!task) throw new Error('Daily task not found');
    return task;
  }

  static async createDailyTask(data: CreateDailyTaskRequest): Promise<BackendDailyTaskResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newTask: BackendDailyTaskResponse = {
      id: Math.max(...mockDailyTasks.map(t => t.id), 0) + 1,
      title: data.title,
      description: data.description,
      userId: data.userId,
      userName: data.userName,
      status: data.status || "Todo",
      priority: data.priority || "Medium",
      position: mockDailyTasks.filter(t => t.userId === data.userId).length + 1,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
      actualHours: 0,
      tags: data.tags || [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.userName,
      modifiedBy: data.userName,
      commentsCount: 0,
      attachmentsCount: 0
    };
    mockDailyTasks.push(newTask);
    return newTask;
  }

  static async updateDailyTask(id: number, data: UpdateDailyTaskRequest): Promise<BackendDailyTaskResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const taskIndex = mockDailyTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) throw new Error('Daily task not found');
    
    const updatedTask = {
      ...mockDailyTasks[taskIndex],
      ...data,
      updatedAt: new Date().toISOString(),
      modifiedBy: "current-user"
    };
    mockDailyTasks[taskIndex] = updatedTask;
    return updatedTask;
  }

  static async deleteDailyTask(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const taskIndex = mockDailyTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return false;
    mockDailyTasks.splice(taskIndex, 1);
    return true;
  }

  // Task Operations
  static async moveTask(taskId: number, moveData: MoveTaskRequest): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const task = mockProjectTasks.find(t => t.id === taskId);
    if (!task) return false;
    task.columnId = moveData.columnId;
    task.position = moveData.position;
    task.updatedAt = new Date().toISOString();
    return true;
  }

  static async assignTask(taskId: number, assigneeId: number, assigneeName: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const task = mockProjectTasks.find(t => t.id === taskId);
    if (!task) return false;
    task.assigneeId = assigneeId;
    task.assigneeName = assigneeName;
    task.updatedAt = new Date().toISOString();
    return true;
  }

  static async unassignTask(taskId: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const task = mockProjectTasks.find(t => t.id === taskId);
    if (!task) return false;
    task.assigneeId = undefined;
    task.assigneeName = undefined;
    task.updatedAt = new Date().toISOString();
    return true;
  }

  static async completeTask(taskId: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const task = mockProjectTasks.find(t => t.id === taskId);
    if (!task) return false;
    task.status = "Completed";
    task.completedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    return true;
  }

  static async updateTaskStatus(taskId: number, status: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const task = mockProjectTasks.find(t => t.id === taskId);
    if (!task) return false;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    return true;
  }

  // Search and Filtering
  static async searchTasks(searchRequest: TaskSearchRequest) {
    await new Promise(resolve => setTimeout(resolve, 400));
    let results = [...mockProjectTasks];
    
    if (searchRequest.searchTerm) {
      results = results.filter(task => 
        task.title.toLowerCase().includes(searchRequest.searchTerm!.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchRequest.searchTerm!.toLowerCase())
      );
    }
    
    if (searchRequest.status) {
      results = results.filter(task => task.status === searchRequest.status);
    }
    
    if (searchRequest.priority) {
      results = results.filter(task => task.priority === searchRequest.priority);
    }
    
    if (searchRequest.projectId) {
      results = results.filter(task => task.projectId === searchRequest.projectId);
    }
    
    if (searchRequest.assigneeId) {
      results = results.filter(task => task.assigneeId === searchRequest.assigneeId);
    }
    
    return {
      success: true,
      data: results,
      totalCount: results.length
    };
  }

  static async getTasksByAssignee(assigneeId: number, projectId?: number): Promise<BackendProjectTaskResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let results = mockProjectTasks.filter(task => task.assigneeId === assigneeId);
    if (projectId) {
      results = results.filter(task => task.projectId === projectId);
    }
    return results;
  }

  static async getOverdueTasks(projectId?: number, assigneeId?: number): Promise<BackendProjectTaskResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const now = new Date();
    let results = mockProjectTasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now && task.status !== "Completed";
    });
    
    if (projectId) {
      results = results.filter(task => task.projectId === projectId);
    }
    
    if (assigneeId) {
      results = results.filter(task => task.assigneeId === assigneeId);
    }
    
    return results;
  }

  static async getTasksByContact(contactId: number): Promise<BackendProjectTaskResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjectTasks.filter(task => task.contactId === contactId);
  }

  static async getSubTasks(parentTaskId: number): Promise<BackendProjectTaskResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjectTasks.filter(task => task.parentTaskId === parentTaskId);
  }

  // Task Statistics
  static async getTaskStatusCounts(projectId: number): Promise<Record<string, number>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tasks = mockProjectTasks.filter(task => task.projectId === projectId);
    const counts: Record<string, number> = {};
    
    tasks.forEach(task => {
      counts[task.status] = (counts[task.status] || 0) + 1;
    });
    
    return counts;
  }

  static async getUserTaskStatusCounts(userId: number): Promise<Record<string, number>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tasks = mockProjectTasks.filter(task => task.assigneeId === userId);
    const counts: Record<string, number> = {};
    
    tasks.forEach(task => {
      counts[task.status] = (counts[task.status] || 0) + 1;
    });
    
    return counts;
  }

  static async getUserOverdueTaskCount(userId: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const now = new Date();
    return mockProjectTasks.filter(task => 
      task.assigneeId === userId &&
      task.dueDate &&
      new Date(task.dueDate) < now &&
      task.status !== "Completed"
    ).length;
  }

  static async getTaskCompletionPercentage(projectId: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tasks = mockProjectTasks.filter(task => task.projectId === projectId);
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === "Completed");
    return Math.round((completedTasks.length / tasks.length) * 100);
  }
}