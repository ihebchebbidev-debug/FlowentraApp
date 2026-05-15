// Tasks Service - Backend API Integration
import { 
  tasksApi, 
  type CreateProjectTaskRequestDto, 
  type UpdateProjectTaskRequestDto,
  type CreateDailyTaskRequestDto,
  type UpdateDailyTaskRequestDto,
  type MoveTaskRequestDto,
  type TaskSearchRequestDto,
  type AssignTaskRequestDto,
  type BulkMoveTasksRequestDto,
  type BulkAssignTasksRequestDto,
  type BulkUpdateTaskStatusDto,
  type ProjectTaskResponseDto,
  type DailyTaskResponseDto,
} from '@/services/api/tasksApi';
import type { Task, DailyTask } from '@/modules/tasks/types';

// Re-export DailyTask as BackendDailyTaskResponse for backward compatibility
export type BackendDailyTaskResponse = DailyTask;
export type BackendProjectTaskResponse = Task;

export class TasksService {
  // ============ Project Tasks ============

  // Get project tasks
  static async getProjectTasks(projectId: number): Promise<Task[]> {
    return await tasksApi.getProjectTasks(projectId);
  }

  // Get column tasks
  static async getColumnTasks(columnId: number): Promise<Task[]> {
    return await tasksApi.getColumnTasks(columnId);
  }

  // Get project task by ID
  static async getProjectTaskById(id: number): Promise<Task> {
    return await tasksApi.getProjectTaskById(id);
  }

  // Create project task
  static async createProjectTask(data: CreateProjectTaskRequestDto): Promise<Task> {
    return await tasksApi.createProjectTask(data);
  }

  // Update project task
  static async updateProjectTask(id: number, data: UpdateProjectTaskRequestDto): Promise<Task> {
    return await tasksApi.updateProjectTask(id, data);
  }

  // Delete project task
  static async deleteProjectTask(id: number): Promise<boolean> {
    try {
      await tasksApi.deleteProjectTask(id);
      return true;
    } catch {
      return false;
    }
  }

  // ============ Daily Tasks ============

  // Get user daily tasks
  static async getUserDailyTasks(userId: number): Promise<DailyTask[]> {
    return await tasksApi.getUserDailyTasks(userId);
  }

  // Get daily task by ID
  static async getDailyTaskById(id: number): Promise<DailyTask> {
    return await tasksApi.getDailyTaskById(id);
  }

  // Create daily task
  static async createDailyTask(data: CreateDailyTaskRequestDto): Promise<DailyTask> {
    return await tasksApi.createDailyTask(data);
  }

  // Update daily task
  static async updateDailyTask(id: number, data: UpdateDailyTaskRequestDto): Promise<DailyTask> {
    return await tasksApi.updateDailyTask(id, data);
  }

  // Delete daily task
  static async deleteDailyTask(id: number): Promise<boolean> {
    try {
      await tasksApi.deleteDailyTask(id);
      return true;
    } catch {
      return false;
    }
  }

  // Complete daily task (mark as fully closed via dedicated endpoint)
  static async completeDailyTask(id: number): Promise<DailyTask | null> {
    try {
      return await tasksApi.completeDailyTask(id);
    } catch {
      return null;
    }
  }

  // ============ Task Operations ============

  // Move task
  static async moveTask(taskId: number, moveData: MoveTaskRequestDto): Promise<boolean> {
    try {
      await tasksApi.moveTask(taskId, moveData);
      return true;
    } catch {
      return false;
    }
  }

  // Bulk move tasks
  static async bulkMoveTasks(bulkMoveDto: BulkMoveTasksRequestDto): Promise<boolean> {
    try {
      await tasksApi.bulkMoveTasks(bulkMoveDto);
      return true;
    } catch {
      return false;
    }
  }

  // Assign task
  static async assignTask(taskId: number, assigneeId: number, assigneeName: string): Promise<boolean> {
    try {
      await tasksApi.assignTask(taskId, { assignedUserId: assigneeId });
      return true;
    } catch {
      return false;
    }
  }

  // Unassign task
  static async unassignTask(taskId: number): Promise<boolean> {
    try {
      await tasksApi.unassignTask(taskId);
      return true;
    } catch {
      return false;
    }
  }

  // Bulk assign tasks
  static async bulkAssignTasks(taskIds: number[], assigneeId: number, assigneeName: string): Promise<boolean> {
    try {
      await tasksApi.bulkAssignTasks({ taskIds, assignedUserId: assigneeId });
      return true;
    } catch {
      return false;
    }
  }

  // Complete task
  static async completeTask(taskId: number): Promise<boolean> {
    try {
      await tasksApi.completeTask(taskId);
      return true;
    } catch {
      return false;
    }
  }

  // Update task status
  static async updateTaskStatus(taskId: number, status: string): Promise<boolean> {
    try {
      await tasksApi.updateTaskStatus(taskId, status);
      return true;
    } catch {
      return false;
    }
  }

  // Bulk update task status
  static async bulkUpdateTaskStatus(taskIds: number[], status: string): Promise<boolean> {
    try {
      await tasksApi.bulkUpdateTaskStatus({ taskIds, status });
      return true;
    } catch {
      return false;
    }
  }

  // ============ Search and Filtering ============

  // Search tasks
  static async searchTasks(searchRequest: TaskSearchRequestDto) {
    const result = await tasksApi.searchTasks(searchRequest);
    return {
      success: true,
      data: result.tasks,
      totalCount: result.totalCount,
    };
  }

  // Get tasks by assignee
  static async getTasksByAssignee(assigneeId: number, projectId?: number): Promise<Task[]> {
    return await tasksApi.getTasksByAssignee(assigneeId, projectId);
  }

  // Get overdue tasks
  static async getOverdueTasks(projectId?: number, assigneeId?: number): Promise<Task[]> {
    return await tasksApi.getOverdueTasks(projectId, assigneeId);
  }

  // Get tasks by contact
  static async getTasksByContact(contactId: number): Promise<Task[]> {
    return await tasksApi.getTasksByContact(contactId);
  }

  // Get sub-tasks
  static async getSubTasks(parentTaskId: number): Promise<Task[]> {
    return await tasksApi.getSubTasks(parentTaskId);
  }

  // ============ Task Statistics ============

  // Get task status counts
  static async getTaskStatusCounts(projectId: number): Promise<Record<string, number>> {
    return await tasksApi.getTaskStatusCounts(projectId);
  }

  // Get user task status counts
  static async getUserTaskStatusCounts(userId: number): Promise<Record<string, number>> {
    return await tasksApi.getUserTaskStatusCounts(userId);
  }

  // Get user overdue task count
  static async getUserOverdueTaskCount(userId: number): Promise<number> {
    return await tasksApi.getUserOverdueTaskCount(userId);
  }

  // Get task completion percentage
  static async getTaskCompletionPercentage(projectId: number): Promise<number> {
    return await tasksApi.getTaskCompletionPercentage(projectId);
  }

  // ============ Sub-tasks ============

  // Create sub-task
  static async createSubTask(parentTaskId: number, data: CreateProjectTaskRequestDto): Promise<Task> {
    return await tasksApi.createSubTask(parentTaskId, data);
  }

  // Convert to sub-task
  static async convertToSubTask(taskId: number, parentTaskId: number): Promise<boolean> {
    try {
      await tasksApi.convertToSubTask(taskId, parentTaskId);
      return true;
    } catch {
      return false;
    }
  }

  // Convert to standalone task
  static async convertToStandaloneTask(taskId: number): Promise<boolean> {
    try {
      await tasksApi.convertToStandaloneTask(taskId);
      return true;
    } catch {
      return false;
    }
  }
}

// Re-export types for backward compatibility
export type { 
  CreateProjectTaskRequestDto, 
  UpdateProjectTaskRequestDto,
  CreateDailyTaskRequestDto,
  UpdateDailyTaskRequestDto,
  MoveTaskRequestDto,
  TaskSearchRequestDto,
  AssignTaskRequestDto,
  BulkMoveTasksRequestDto,
  BulkAssignTasksRequestDto,
  BulkUpdateTaskStatusDto,
};
export { tasksApi };
