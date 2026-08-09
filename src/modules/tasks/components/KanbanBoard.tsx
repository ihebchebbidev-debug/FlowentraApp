import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from "react-i18next";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,

  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
// import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, ArrowLeft, Settings, LayoutGrid, List, CheckSquare } from "lucide-react";
import { DroppableColumn } from './DroppableColumn';
import { DraggableTaskCard } from './DraggableTaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { QuickTaskModal } from './QuickTaskModal';
// import { InfoTip } from "@/shared/components";
import { ColumnManager } from './ColumnManager';
import { TeamManagementModal } from './TeamManagementModal';
// import TaskListView from './TaskListView';
import TaskListViewGrouped from './TaskListViewGrouped';
import { Column, Task as TaskType } from '../types';
import { buildStatusColumns, defaultTechnicianColumns, defaultStatusColumns } from "../utils/columns";
import { buildCreateProjectTaskPayload, mapColumnIdToTaskStatus, mapTaskStatusToColumnId, normalizeTaskStatus } from "../utils/taskStatusMapping";
import { enrichTaskAssigneeAvatar, resolveAssigneeProfilePic } from "../utils/assigneeAvatar";
import { useLookups } from "@/shared/contexts/LookupsContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TasksService } from "../services/tasks.service";
import { usersApi } from "@/services/api/usersApi";
import { projectsApi } from "@/services/api/projectsApi";
import { notificationsApi } from "@/services/api/notificationsApi";
import type { User } from "@/types/users";

interface LocalTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  assigneeId?: string;
  assigneeProfilePicUrl?: string;
  dueDate: string;
  columnId: string;
  createdAt: Date;
  lastMoved?: Date;
  projectName?: string;
  projectId?: string;
  status?: string;
}


// Default/status columns helpers are extracted to utils

const defaultInitialTasks: LocalTask[] = [
  {
    id: 'task-1',
    title: 'Design new dashboard',
    description: 'Create wireframes and mockups',
    priority: 'high',
    assignee: 'Sarah Wilson',
    dueDate: 'Today',
    columnId: 'open',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    lastMoved: new Date(Date.now() - 2 * 60 * 60 * 1000),
    projectName: 'Kitchen Renovation Service',
    projectId: 'proj-1',
  },
  {
    id: 'task-2',
    title: 'API integration',
    description: 'Test endpoints',
    priority: 'medium',
    assignee: 'Mike Chen',
    dueDate: 'Tomorrow',
    columnId: 'in-progress',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    lastMoved: new Date(Date.now() - 1 * 60 * 60 * 1000), // moved 1 hour ago
    projectName: 'Sales Pipeline Q1',
    projectId: 'proj-2',
  },
  {
    id: 'task-3',
    title: 'Database optimization',
    description: 'Improve query performance',
    priority: 'high',
    assignee: 'Lisa Johnson',
    dueDate: 'This week',
    columnId: 'completed',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    lastMoved: new Date(Date.now() - 30 * 60 * 1000), // moved 30 min ago
    projectName: 'Kitchen Renovation Service',
    projectId: 'proj-1',
  },
  {
    id: 'task-4',
    title: 'User testing',
    description: 'Conduct usability tests',
    priority: 'medium',
    assignee: 'David Park',
    dueDate: 'Next week',
    columnId: 'completed',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    lastMoved: new Date(Date.now() - 15 * 60 * 1000), // moved 15 min ago
    projectName: 'Sales Pipeline Q1',
    projectId: 'proj-2',
  },
  {
    id: 'task-5',
    title: 'Security audit',
    description: 'Review security measures',
    priority: 'high',
    assignee: 'Sarah Wilson',
    dueDate: 'Today',
    columnId: 'todo',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
    lastMoved: new Date(Date.now() - 10 * 60 * 60 * 1000),
    projectName: 'Kitchen Renovation Service',
    projectId: 'proj-1',
  },
];

export function KanbanBoard({ project, onBackToProjects, onSwitchToProjects, technicians = [], isDailyTasks = false, hideHeader = false, columnEditorOpen, onColumnEditorOpenChange, initialTasks, onTasksChange, quickTaskModalOpen, onQuickTaskModalOpenChange }: { project?: any; onBackToProjects?: () => void; onSwitchToProjects?: () => void; technicians?: any[]; isDailyTasks?: boolean; hideHeader?: boolean; columnEditorOpen?: boolean; onColumnEditorOpenChange?: (open: boolean) => void; initialTasks?: LocalTask[]; onTasksChange?: (tasks: LocalTask[]) => void; quickTaskModalOpen?: boolean; onQuickTaskModalOpenChange?: (open: boolean) => void }) {
  const { t } = useTranslation('tasks');
  const { toast } = useToast();
  const { user: currentUser, isMainAdmin } = useAuth();
  const { taskStatuses } = useLookups();
  const [tasks, setTasks] = useState<LocalTask[]>(initialTasks ?? []);
  const skipTasksNotifyRef = useRef(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [activeTask, setActiveTask] = useState<LocalTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<LocalTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(!!quickTaskModalOpen);
  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(!!columnEditorOpen);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [_editingColumn, _setEditingColumn] = useState<any>(null);
  const [_newColumnName, _setNewColumnName] = useState('');
  const [projectTeamColumns, setProjectTeamColumns] = useState<Column[]>([]);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [usersMap, setUsersMap] = useState<Map<number, User>>(new Map());

  // Fetch users for team member name resolution (including MainAdminUser)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersApi.getAll();
        let usersList = response.users || [];
        
        // Include MainAdminUser (id=1) if logged in as admin
        if (isMainAdmin && currentUser) {
          const adminAsUser: User = {
            id: currentUser.id || 1,
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
            email: currentUser.email || '',
            phoneNumber: currentUser.phoneNumber || '',
            country: currentUser.country || '',
            isActive: true,
            createdDate: currentUser.createdAt || new Date().toISOString(),
            createdUser: 'system',
            role: 'Admin',
            profilePictureUrl: currentUser.profilePictureUrl,
          };
          // Add admin if not already in the list
          if (!usersList.some(u => u.id === adminAsUser.id)) {
            usersList = [adminAsUser, ...usersList];
          }
        }
        
        const map = new Map<number, User>();
        usersList.forEach(u => map.set(u.id, u));
        setUsersMap(map);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, [isMainAdmin, currentUser]);

  // Create technicians list from API users for TaskDetailModal and QuickTaskModal
  const apiTechnicians = useMemo(() => {
    const list: { id: string; name: string; email: string; role: string; isActive: boolean; profilePictureUrl?: string; avatar?: string }[] = [];
    usersMap.forEach((user, id) => {
      list.push({
        id: String(id),
        name: `${user.firstName} ${user.lastName}`.trim() || user.email || `User ${id}`,
        email: user.email || '',
        role: user.role || 'User',
        isActive: user.isActive ?? true,
        profilePictureUrl: user.profilePictureUrl,
        avatar: user.profilePictureUrl,
      });
    });
    // Include technicians prop as fallback if no API users
    if (list.length === 0 && technicians.length > 0) {
      return technicians;
    }
    return list;
  }, [usersMap, technicians]);

  // Build status columns - prefer project.columns, then taskStatuses from lookups, then defaults
  const statusColumns = useMemo(() => {
    // If project has its own columns from API, use them
    if (project?.columns && project.columns.length > 0) {
      return project.columns.map((col: any, index: number) => ({
        id: String(col.id),
        title: col.title || col.name || 'Untitled',
        color: col.color || 'bg-slate-500',
        position: col.position ?? index,
        isDefault: col.isDefault ?? (index === 0),
        createdAt: col.createdAt || new Date(),
      }));
    }
    // Use taskStatuses from lookups if available (dynamically editable)
    if (taskStatuses && taskStatuses.length > 0) {
      return buildStatusColumns(taskStatuses);
    }
    // Final fallback to default status columns
    return defaultStatusColumns;
  }, [project?.columns, taskStatuses]);
  
  // Initialize columns with project columns or defaults
  const [customColumns, setCustomColumns] = useState<Column[]>([]);

  // Sync tasks from parent when initialTasks changes (e.g. after fetch or tab mount)
  useEffect(() => {
    if (initialTasks !== undefined) {
      skipTasksNotifyRef.current = true;
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  const isQuickTaskModalControlled = onQuickTaskModalOpenChange !== undefined;

  // Sync external quick-task modal control (parent -> internal)
  useEffect(() => {
    if (isQuickTaskModalControlled && typeof quickTaskModalOpen !== 'undefined') {
      setIsQuickTaskModalOpen(!!quickTaskModalOpen);
    }
  }, [quickTaskModalOpen, isQuickTaskModalControlled]);

  // Update columns when project columns change
  useEffect(() => {
    if (statusColumns.length > 0) {
      setCustomColumns(statusColumns);
    }
  }, [statusColumns]);

  const displayTasks = useMemo(
    () => tasks.map((task) => enrichTaskAssigneeAvatar(task, usersMap)),
    [tasks, usersMap]
  );
  
  // Mouse/pen: small distance threshold so a click still opens the task.
  // Touch: short press-and-hold so vertical scrolling stays natural, then drag.
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    })
  );


  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = displayTasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const allColumnIds = customColumns.map(c => c.id);

    const resolveColumnId = (id: string): string | undefined => {
      if (allColumnIds.includes(id)) return id;

      const overTask = tasks.find(t => t.id === id);
      if (overTask) {
        return mapTaskStatusToColumnId(overTask.status || overTask.columnId, customColumns);
      }
      return undefined;
    };

    const newColumnId = resolveColumnId(String(over.id));

    if (!newColumnId) {
      setActiveTask(null);
      return;
    }

    const currentTask = tasks.find(t => t.id === taskId);
    const currentColumnId = currentTask
      ? mapTaskStatusToColumnId(currentTask.status, customColumns)
      : undefined;
    const hasChanged = currentTask && currentColumnId !== newColumnId;
    
    if (currentTask && hasChanged) {
      const newStatus = mapColumnIdToTaskStatus(newColumnId, customColumns);

      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: newStatus,
                columnId: newColumnId,
                lastMoved: new Date(),
              }
            : task
        )
      );

      try {
        const taskIdNum = parseInt(taskId, 10) || parseInt(taskId.replace(/\D/g, ''), 10);
        
        if (!isNaN(taskIdNum)) {
          await TasksService.moveTask(taskIdNum, { status: newStatus });
        }
      } catch (error) {
        console.error('Failed to move task via API:', error);
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  status: currentTask.status,
                  columnId: currentColumnId || currentTask.columnId,
                }
              : task
          )
        );
        toast({
          title: t('toast.error'),
          description: t('toast.failedUpdate'),
          variant: "destructive",
        });
      }
    }
    
    setActiveTask(null);
  };

  const getTasksForColumn = (columnId: string) => {
    const normalizedColumnId = String(columnId);
    return displayTasks.filter(task =>
      mapTaskStatusToColumnId(task.status, customColumns) === normalizedColumnId
    );
  };

  const getColumns = () => customColumns;

  // Layout: limit columns per row to avoid long single-row horizontal overflow.
  // This makes the board render at most `columnsPerRow` columns per row, then wrap to the next row.
  const columnsPerRow = 4;

  // Memoize project team member IDs to avoid unnecessary updates
  const projectTeamMemberIds = useMemo(() => {
    return project?.teamMembers?.join(',') || '';
  }, [project?.teamMembers]);

  // Memoize users map keys for dependency tracking
  const usersMapSize = usersMap.size;

  // Initialize team columns from project team members using users API data
  useEffect(() => {
    if (project && project.teamMembers && project.teamMembers.length > 0 && usersMapSize > 0) {
      const teamColumns: Column[] = project.teamMembers.map((memberId: string, index: number) => {
        // Parse member ID as number to lookup in users map
        const memberIdNum = parseInt(memberId, 10);
        const user = usersMap.get(memberIdNum);
        
        if (!user) {
          // User not found in map - might be loading or invalid ID
          return null;
        }
        
        const colors = ['bg-primary', 'bg-accent', 'bg-success', 'bg-warning', 'bg-chart-1', 'bg-chart-2'];
        const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;
        
        return {
          id: memberId,
          title: userName,
          color: colors[index % colors.length],
          position: index,
          isDefault: false,
          createdAt: new Date(),
        };
      }).filter(Boolean) as Column[];
      
      if (teamColumns.length > 0) {
        setProjectTeamColumns(teamColumns);
      }
    } else if (project?.teamMembers?.length === 0) {
      // No team members assigned - show empty state
      setProjectTeamColumns([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTeamMemberIds, usersMapSize]); // Use stable deps

  const handleUpdateTeam = async (projectId: string, teamMembers: string[]) => {
    // Update the project team members and refresh columns
    if (project) {
      const projectIdNum = parseInt(projectId, 10);
      
      try {
        // Detect newly added members (for notifications)
        const previousMembers = project.teamMembers || [];
        const newlyAddedMembers = teamMembers.filter(id => !previousMembers.includes(id));
        
        // Convert string IDs to numbers for the API
        const teamMemberIds = teamMembers.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        
        // Update project with new team members using the project update endpoint
        await projectsApi.update(projectIdNum, {
          teamMembers: teamMemberIds,
        });
        
        // Send notifications to newly added team members
        for (const memberId of newlyAddedMembers) {
          const memberIdNum = parseInt(memberId, 10);
          if (!isNaN(memberIdNum)) {
            try {
              await notificationsApi.create({
                userId: memberIdNum,
                title: 'Added to project',
                description: `You have been added to project ${project.name}`,
                type: 'info',
                category: 'task',
                link: `/dashboard/tasks/projects/${projectIdNum}`,
                relatedEntityId: projectIdNum,
                relatedEntityType: 'project'
              });
            } catch (notifError) {
              console.error('Failed to send project assignment notification:', notifError);
            }
          }
        }
        
        // Update local state
        project.teamMembers = teamMembers;
        
        // Build new team columns using users from API
        const teamColumns: Column[] = teamMembers.map((memberId: string, index: number) => {
          const memberIdNum = parseInt(memberId, 10);
          const user = usersMap.get(memberIdNum);
          if (!user) return null;
          
          const colors = ['bg-primary', 'bg-accent', 'bg-success', 'bg-warning', 'bg-chart-1', 'bg-chart-2'];
          const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;
          
          return {
            id: memberId,
            title: userName,
            color: colors[index % colors.length],
            position: index,
            isDefault: false,
            createdAt: new Date(),
          };
        }).filter(Boolean) as Column[];
        
        setProjectTeamColumns(teamColumns);
        
        // Also update tasks that were assigned to removed team members
        const currentMembers = project.teamMembers || [];
        setTasks(prevTasks => 
          prevTasks.map(task => {
            // Check if the current task's assignee is no longer in the team
            const isAssigneeInTeam = currentMembers.some(memberId => {
              const user = usersMap.get(parseInt(memberId, 10));
              if (!user) return false;
              const userName = `${user.firstName} ${user.lastName}`.trim();
              return userName === task.assignee;
            });
            if (!isAssigneeInTeam && task.assignee !== 'Unassigned') {
              return { ...task, assignee: 'Unassigned' };
            }
            return task;
          })
        );
        
        toast({
          title: t('toast.success'),
          description: t('toast.teamMembersUpdated'),
        });
      } catch (error) {
        console.error('Failed to update team members:', error);
        toast({
          title: t('toast.error'),
          description: t('toast.failedTeamUpdate'),
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateColumns = (newColumns: Column[]) => {
    setCustomColumns(newColumns);
  };

  const handleCreateTask = async (taskData: any) => {
    if (isCreatingTask) return;
    
    setIsCreatingTask(true);
    
    try {
      // If we have a project, create a project task via API
      if (project?.id) {
        const projectIdNum = parseInt(String(project.id), 10);
        if (isNaN(projectIdNum)) {
          throw new Error('Invalid project ID');
        }

        const createData = buildCreateProjectTaskPayload(
          {
            ...taskData,
            relatedEntityType: 'project',
            relatedEntityId: projectIdNum,
            status: taskData.status ?? 'open',
          },
          projectIdNum
        );

        const createdTask = await TasksService.createProjectTask(createData as any);

        const taskStatus = createdTask.status || 'open';
        const displayColumnId = mapTaskStatusToColumnId(taskStatus, project.columns || customColumns);

        const newTask: LocalTask = {
          id: String(createdTask.id),
          title: createdTask.title,
          description: createdTask.description || '',
          priority: (createdTask.priority as 'high' | 'medium' | 'low') || 'medium',
          assignee: createdTask.assigneeName || 'Unassigned',
          assigneeId: createdTask.assigneeId ? String(createdTask.assigneeId) : undefined,
          dueDate: createdTask.dueDate ? new Date(createdTask.dueDate).toLocaleDateString() : '',
          columnId: displayColumnId,
          status: taskStatus,
          createdAt: new Date(createdTask.createdAt),
          lastMoved: new Date(),
          projectName: project?.name,
          projectId: String(project?.id),
        };
        
        setTasks(prev => [...prev, newTask]);
        
        toast({
          title: t('toast.success'),
          description: t('toast.taskCreated'),
        });
      } else {
        // Fallback to local task creation for tasks without a project
        const newTask: LocalTask = {
          ...taskData,
          id: `task-${Date.now()}`,
          createdAt: new Date(),
          lastMoved: new Date(),
          projectName: project?.name,
          projectId: project?.id,
        };
        
        setTasks(prev => [...prev, newTask]);
        
        toast({
          title: t('toast.success'),
          description: t('toast.taskCreatedLocal'),
        });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.failedCreate'),
        variant: "destructive",
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleTaskClick = (task: LocalTask) => {
    const enriched = displayTasks.find((t) => t.id === task.id) ?? task;
    setSelectedTask(enriched);
    setIsTaskModalOpen(true);
  };

  const handleTaskUpdated = (updatedTask: any) => {
    const status = normalizeTaskStatus(updatedTask.status ?? updatedTask.columnId);
    const columnId = mapTaskStatusToColumnId(status, customColumns);
    const assigneeProfilePicUrl =
      updatedTask.assigneeProfilePicUrl ??
      resolveAssigneeProfilePic(updatedTask, usersMap);
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id
          ? {
              ...task,
              title: updatedTask.title ?? task.title,
              description: updatedTask.description ?? task.description,
              priority: updatedTask.priority ?? task.priority,
              assignee: updatedTask.assignee ?? task.assignee,
              assigneeId: updatedTask.assigneeId ?? task.assigneeId,
              assigneeProfilePicUrl: assigneeProfilePicUrl ?? task.assigneeProfilePicUrl,
              status,
              columnId,
            }
          : task
      )
    );
    // Update selected task as well so modal shows latest
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(prev => prev ? { ...prev, ...updatedTask } : prev);
    }
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };

  const handleEditColumn = (columnId: string, newTitle?: string) => {
    if (newTitle) {
      // Update column title in the customColumns state
      setCustomColumns(prev => 
        prev.map(col => 
          col.id === columnId 
            ? { ...col, title: newTitle }
            : col
        )
      );
    }
  };

  // Sync external control (parent) for opening/closing the column editor
  useEffect(() => {
    if (typeof columnEditorOpen !== 'undefined') {
      setIsColumnEditorOpen(!!columnEditorOpen);
    }
  }, [columnEditorOpen]);

  const openQuickTaskModal = () => {
    if (isQuickTaskModalControlled) {
      onQuickTaskModalOpenChange?.(true);
    } else {
      setIsQuickTaskModalOpen(true);
    }
  };

  const closeQuickTaskModal = () => {
    if (isQuickTaskModalControlled) {
      onQuickTaskModalOpenChange?.(false);
    } else {
      setIsQuickTaskModalOpen(false);
    }
  };

  const handleAddTask = (_columnId: string) => {
    openQuickTaskModal();
  };

  const handleChangeTheme = (columnId: string, colorClass?: string) => {
    if (colorClass) {
      // Update column color in the customColumns state
      setCustomColumns(prev => 
        prev.map(col => 
          col.id === columnId 
            ? { ...col, color: colorClass }
            : col
        )
      );
    }
  };

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    const doneColumn = statusColumns.find(s =>
      s.title.toLowerCase().includes('completed') || s.title.toLowerCase().includes('done')
    ) ?? statusColumns[statusColumns.length - 1];
    const openColumn = statusColumns[0];
    const targetColumnId = completed ? String(doneColumn?.id ?? 'done') : String(openColumn?.id ?? 'todo');
    const newStatus = mapColumnIdToTaskStatus(targetColumnId, customColumns);
    
    const previousTasks = [...tasks];
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus,
            columnId: targetColumnId,
            lastMoved: new Date(),
          }
        : task
    ));

    try {
      const taskIdNum = parseInt(taskId, 10) || parseInt(taskId.replace(/\D/g, ''), 10);
      
      if (!isNaN(taskIdNum)) {
        await TasksService.moveTask(taskIdNum, { status: newStatus });
      }
      
      toast({
        title: t('toast.success'),
        description: completed ? t('toast.taskCompleted') : t('toast.taskStatusUpdated'),
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
      setTasks(previousTasks);
      toast({
        title: t('toast.error'),
        description: t('toast.failedStatus'),
        variant: "destructive",
      });
    }
  };

  const handleTaskMove = async (taskId: string, newColumnId: string) => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    const currentColumnId = mapTaskStatusToColumnId(currentTask.status, customColumns);
    if (currentColumnId === newColumnId) return;

    const newStatus = mapColumnIdToTaskStatus(newColumnId, customColumns);
    const previousTasks = [...tasks];

    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus,
            columnId: newColumnId,
            lastMoved: new Date(),
          }
        : task
    ));

    try {
      const taskIdNum = parseInt(taskId, 10) || parseInt(taskId.replace(/\D/g, ''), 10);
      if (!isNaN(taskIdNum)) {
        await TasksService.moveTask(taskIdNum, { status: newStatus });
      }
    } catch (error) {
      console.error('Failed to move task:', error);
      setTasks(previousTasks);
    }
  };

  // Notify parent when tasks change from user interactions (not from parent sync)
  useEffect(() => {
    if (skipTasksNotifyRef.current) {
      skipTasksNotifyRef.current = false;
      return;
    }
    if (onTasksChange) {
      onTasksChange(tasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  return (
    <div className={hideHeader ? 'flex flex-col min-h-[400px]' : 'h-screen flex flex-col'}>
      {/* Enhanced Project Header - only show if hideHeader is false */}
      {!hideHeader && (
        <div className="flex flex-col gap-4 p-4 sm:p-6 border-b border-border bg-background/95">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {(onBackToProjects || onSwitchToProjects) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBackToProjects || onSwitchToProjects}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Projects</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="p-2 rounded-xl bg-primary/10 shadow-soft flex-shrink-0">
                    <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight truncate">
                      {isDailyTasks ? 'Daily Tasks' : (project ? project.name : 'Task Management')}
                    </h1>
                    {(project || isDailyTasks) && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {isDailyTasks ? 'Personal Tasks' : 'Project Tasks'}
                        </Badge>
                        {project && (
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {project.status}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm truncate">
                  {isDailyTasks 
                    ? 'Manage your personal daily tasks and to-dos' 
                    : (project ? project.description || 'Manage your project tasks with custom workflows' : 'Simply drag and drop tasks between columns')
                  }
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Button
                  onClick={openQuickTaskModal}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </div>
              {!isDailyTasks && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsColumnEditorOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Manage Columns</span>
                  <span className="sm:hidden">Columns</span>
                </Button>
              )}
              {project && !isDailyTasks && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsTeamModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Team ({project.teamMembers.length})</span>
                  <span className="sm:hidden">Team</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* View Mode Switcher */}
          <div className="flex justify-end">
            <div className="flex items-center border border-border rounded-lg p-1 bg-background">
              <Button
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('board')}
                className="gap-2 h-8"
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2 h-8"
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {viewMode === 'list' ? (
            <TaskListViewGrouped
              tasks={displayTasks.map(task => ({
                ...task,
                status: task.columnId,
                tags: [],
                updatedAt: new Date(),
                position: 0,
                priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
                dueDate: new Date(),
                assigneeName: task.assignee
              } as TaskType))}
              columns={getColumns()}
              onTaskClick={(task: TaskType) => {
                const localTask = displayTasks.find(t => t.id === task.id);
                if (localTask) handleTaskClick(localTask);
              }}
              onAddTask={handleAddTask}
              onTaskComplete={handleTaskComplete}
              onTaskMove={handleTaskMove}
            />
          ) : (
            <>
              {!isDailyTasks && (
                <div className="flex-1 m-0 p-3 sm:p-6">
                  <div className="grid gap-3 sm:gap-4 lg:gap-6 h-full overflow-auto"
                    style={{ gridTemplateColumns: `repeat(${Math.min(columnsPerRow, Math.max(1, customColumns.length))}, minmax(250px, 1fr))`, gridAutoRows: 'minmax(250px, 1fr)' }}>
                    {customColumns.map((column) => (
                      <DroppableColumn
                        key={column.id}
                        column={column}
                        tasks={getTasksForColumn(column.id)}
                        onTaskClick={handleTaskClick}
                        onEditColumn={handleEditColumn}
                        onAddTask={handleAddTask}
                        onChangeTheme={handleChangeTheme}
                        allowEditing={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isDailyTasks && (
                <div className="flex-1 p-3 sm:p-6">
                  <div className="grid gap-3 sm:gap-4 lg:gap-6 h-full overflow-auto"
                    style={{ gridTemplateColumns: `repeat(${Math.min(columnsPerRow, Math.max(1, customColumns.length))}, minmax(250px, 1fr))`, gridAutoRows: 'minmax(250px, 1fr)' }}>
                    {customColumns.map((column) => (
                      <DroppableColumn
                        key={column.id}
                        column={column}
                        tasks={getTasksForColumn(column.id).filter(task => !task.projectId)}
                        onTaskClick={handleTaskClick}
                        onEditColumn={handleEditColumn}
                        onAddTask={handleAddTask}
                        onChangeTheme={handleChangeTheme}
                        allowEditing={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <DragOverlay>
            {activeTask ? (
              <DraggableTaskCard task={activeTask} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>

        <TaskDetailModal 
          open={isTaskModalOpen} 
          onOpenChange={setIsTaskModalOpen} 
          task={selectedTask ? { ...selectedTask, status: selectedTask.status || selectedTask.columnId || 'open' } as any : undefined}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          technicians={apiTechnicians}
        />

        {!isQuickTaskModalControlled && (
          <QuickTaskModal
            isOpen={isQuickTaskModalOpen}
            onClose={closeQuickTaskModal}
            onCreateTask={handleCreateTask}
            technicians={apiTechnicians}
            columns={getColumns()}
            projects={project ? [project] : []}
            projectId={project?.id}
            teamMembers={projectTeamColumns.map(col => ({ id: col.id, name: col.title }))}
          />
        )}

        <ColumnManager
          isOpen={isColumnEditorOpen}
          onClose={() => {
            setIsColumnEditorOpen(false);
            onColumnEditorOpenChange?.(false);
          }}
          columns={customColumns}
          onUpdateColumns={handleUpdateColumns}
          teamMembers={project?.teamMembers || []}
          onUpdateTeamMembers={(members) => {
            if (project) {
              handleUpdateTeam(project.id, members);
            }
          }}
          projectId={project?.id}
        />

        <TeamManagementModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          project={project}
          allTechnicians={technicians}
          onUpdateTeam={handleUpdateTeam}
        />
      </div>
    </div>
  );
}