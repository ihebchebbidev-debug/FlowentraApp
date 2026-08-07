// Mock Columns Service - Static data only
export interface BackendProjectColumnResponse {
  id: number;
  projectId: number;
  title: string;
  color: string;
  position: number;
  isDefault: boolean;
  tasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectColumnRequest {
  projectId: number;
  title: string;
  color: string;
  position?: number;
  isDefault?: boolean;
}

export interface UpdateProjectColumnRequest {
  title?: string;
  color?: string;
  position?: number;
  isDefault?: boolean;
}

export interface ReorderColumnsRequest {
  columnPositions: Array<{
    columnId: number;
    position: number;
  }>;
}

export interface BulkCreateColumnsRequest {
  projectId: number;
  columns: Array<{
    title: string;
    color: string;
    isDefault?: boolean;
  }>;
}

// Mock data storage
let mockColumns: BackendProjectColumnResponse[] = [
  {
    id: 1,
    projectId: 1,
    title: "Todo",
    color: "#6b7280",
    position: 1,
    isDefault: true,
    tasksCount: 0,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z"
  },
  {
    id: 2,
    projectId: 1,
    title: "In Progress",
    color: "#3b82f6",
    position: 2,
    isDefault: true,
    tasksCount: 1,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z"
  },
  {
    id: 3,
    projectId: 1,
    title: "Done",
    color: "#10b981",
    position: 3,
    isDefault: true,
    tasksCount: 0,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z"
  }
];

export class ProjectColumnsService {
  static async getProjectColumns(projectId: number): Promise<BackendProjectColumnResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockColumns.filter(column => column.projectId === projectId);
  }

  static async getProjectColumnById(id: number): Promise<BackendProjectColumnResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const column = mockColumns.find(c => c.id === id);
    if (!column) throw new Error('Column not found');
    return column;
  }

  static async createProjectColumn(data: CreateProjectColumnRequest): Promise<BackendProjectColumnResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newColumn: BackendProjectColumnResponse = {
      id: Math.max(...mockColumns.map(c => c.id), 0) + 1,
      projectId: data.projectId,
      title: data.title,
      color: data.color,
      position: data.position || mockColumns.filter(c => c.projectId === data.projectId).length + 1,
      isDefault: data.isDefault || false,
      tasksCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockColumns.push(newColumn);
    return newColumn;
  }

  static async updateProjectColumn(id: number, data: UpdateProjectColumnRequest): Promise<BackendProjectColumnResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const columnIndex = mockColumns.findIndex(c => c.id === id);
    if (columnIndex === -1) throw new Error('Column not found');
    
    const updatedColumn = {
      ...mockColumns[columnIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    mockColumns[columnIndex] = updatedColumn;
    return updatedColumn;
  }

  static async deleteProjectColumn(id: number, moveTasksToColumnId?: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const columnIndex = mockColumns.findIndex(c => c.id === id);
    if (columnIndex === -1) return false;
    mockColumns.splice(columnIndex, 1);
    return true;
  }

  static async reorderProjectColumns(projectId: number, reorderData: ReorderColumnsRequest): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 400));
    reorderData.columnPositions.forEach(({ columnId, position }) => {
      const column = mockColumns.find(c => c.id === columnId);
      if (column) {
        column.position = position;
        column.updatedAt = new Date().toISOString();
      }
    });
    return true;
  }

  static async bulkCreateColumns(data: BulkCreateColumnsRequest): Promise<BackendProjectColumnResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newColumns: BackendProjectColumnResponse[] = [];
    
    data.columns.forEach((columnData, index) => {
      const newColumn: BackendProjectColumnResponse = {
        id: Math.max(...mockColumns.map(c => c.id), 0) + index + 1,
        projectId: data.projectId,
        title: columnData.title,
        color: columnData.color,
        position: index + 1,
        isDefault: columnData.isDefault || false,
        tasksCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newColumns.push(newColumn);
    });
    
    mockColumns.push(...newColumns);
    return newColumns;
  }

  static async getDefaultColumns(projectId: number): Promise<BackendProjectColumnResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockColumns.filter(column => column.projectId === projectId && column.isDefault);
  }

  static async createDefaultColumns(projectId: number): Promise<BackendProjectColumnResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const defaultColumns = [
      { title: "Todo", color: "#6b7280", isDefault: true },
      { title: "In Progress", color: "#3b82f6", isDefault: true },
      { title: "Done", color: "#10b981", isDefault: true }
    ];
    
    return this.bulkCreateColumns({ projectId, columns: defaultColumns });
  }

  static async getColumnTaskCount(columnId: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const column = mockColumns.find(c => c.id === columnId);
    return column ? column.tasksCount : 0;
  }

  static async validateColumnTaskLimit(columnId: number, limit: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const column = mockColumns.find(c => c.id === columnId);
    return column ? column.tasksCount < limit : false;
  }
}