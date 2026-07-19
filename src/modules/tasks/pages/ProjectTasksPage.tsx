import { useState, useEffect, useCallback } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isSameDay } from "date-fns";
import {
  ArrowLeft,
  PlusCircle,
  Settings,
  FolderOpen,
  Handshake,
} from "lucide-react";
import { Task, Project } from '../types';
import { useTranslation } from 'react-i18next';
import { TasksService } from '../services/tasks.service';
import { ProjectsService } from '../services/projects.service';
import { usersApi } from '@/services/api/usersApi';
import { useLookups } from '@/shared/contexts/LookupsContext';
import { useActionLogger } from "@/hooks/useActionLogger";
import { useLayoutModeContext } from "@/hooks/useLayoutMode";

// Import tab components
import { ProjectOverviewTab } from '../components/project-detail/ProjectOverviewTab';
import { ProjectTasksTab } from '../components/project-detail/ProjectTasksTab';
import { ProjectTeamTab } from '../components/project-detail/ProjectTeamTab';
import { ProjectNotesActivityTab } from '../components/project-detail/ProjectNotesActivityTab';
import { ProjectDocumentsTab } from '../components/project-detail/ProjectDocumentsTab';
import { ChecklistsSection } from '@/modules/shared/components/documents';
import { ProjectOffersTab } from '../components/project-detail/ProjectOffersTab';
import { EditProjectModal } from '../components/EditProjectModal';
import { QuickTaskModal } from '../components/QuickTaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { useToast } from '@/hooks/use-toast';
import {
  buildCreateProjectTaskPayload,
  isCompletedTaskStatus,
  mapTaskStatusToColumnId,
  normalizeTaskStatus,
  taskMatchesUiFilterStatus,
} from '../utils/taskStatusMapping';

// Interface for technician/assignable users
interface Technician {
  id: string;
  name: string;
  email?: string;
  profilePictureUrl?: string;
  avatar?: string;
}

export default function ProjectTasksPage() {
  const { t } = useTranslation('tasks');
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useLayoutModeContext();
  const { toast } = useToast();
  const { logAction, logSearch, logFilter } = useActionLogger('Projects');
  
  // Tab management
  const [activeTab, setActiveTab] = useState('overview');
  
  // Task view mode
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'list'>('board');
  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in-progress' | 'review' | 'done'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<'all' | string>('all');
  
  // Date filter state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllDates, setShowAllDates] = useState(true);
  
  // Completed tasks section
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  
  // API state
  const [tasksState, setTasksState] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  
  // Project state from API
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectLinks, setProjectLinks] = useState<any | null>(null);
  
  // Technicians/Users state
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const { priorities: lookupPriorities } = useLookups();

  // Log project view
  useEffect(() => {
    if (projectId && project) {
      logAction('view_project', `Viewed project: ${project.name}`, { 
        entityType: 'Project', 
        entityId: projectId 
      });
    }
  }, [projectId, project?.name]);

  // Log search
  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => {
        logSearch(searchTerm, tasksState?.length || 0, { entityType: 'ProjectTask' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Log filter changes
  useEffect(() => {
    if (filterStatus !== 'all') {
      logFilter('Status', filterStatus, { entityType: 'ProjectTask' });
    }
  }, [filterStatus]);

  useEffect(() => {
    if (filterPriority !== 'all') {
      logFilter('Priority', filterPriority, { entityType: 'ProjectTask' });
    }
  }, [filterPriority]);

  // Fetch users for task assignment
  const fetchTechnicians = useCallback(async () => {
    try {
      const techList: Technician[] = [];
      
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const mainAdmin = JSON.parse(userData);
          if (mainAdmin && mainAdmin.id) {
            techList.push({
              id: String(mainAdmin.id),
              name: `${mainAdmin.firstName || ''} ${mainAdmin.lastName || ''}`.trim() || mainAdmin.email || 'Admin',
              email: mainAdmin.email,
              profilePictureUrl: mainAdmin.profilePictureUrl,
              avatar: mainAdmin.profilePictureUrl,
            });
          }
        } catch (e) {
          console.warn('Failed to parse user_data for MainAdminUser');
        }
      }
      
      try {
        const usersResult = await usersApi.getAll();
        if (usersResult.users) {
          usersResult.users.forEach(user => {
            if (!techList.some(t => t.id === String(user.id))) {
              techList.push({
                id: String(user.id),
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                email: user.email,
                profilePictureUrl: user.profilePictureUrl,
                avatar: user.profilePictureUrl,
              });
            }
          });
        }
      } catch (e) {
        console.warn('Failed to fetch users from API:', e);
      }
      
      setTechnicians(techList);
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);
  
  const numericProjectId = projectId ? parseInt(projectId, 10) : null;

  const mapToLocal = useCallback((apiTasks: Task[]) => apiTasks.map(pt => {
    const status = normalizeTaskStatus(pt.status);
    const columns = project?.columns || [];
    const columnId =
      columns.length > 0
        ? mapTaskStatusToColumnId(status, columns)
        : String(pt.columnId || mapTaskStatusToColumnId(status));
    return {
      id: pt.id,
      title: pt.title,
      description: pt.description || '',
      priority: (pt.priority as 'high' | 'medium' | 'low') || 'medium',
      assignee: (pt.assignee as string) || pt.assigneeName || '',
      assigneeId: pt.assigneeId || '',
      assigneeProfilePicUrl: pt.assigneeProfilePicUrl,
      // Keep as ISO string so `new Date(task.dueDate)` re-parses correctly in every
      // locale. Previously used `toLocaleDateString()` which produced DD/MM/YYYY in
      // fr-FR and silently broke overdue detection and date filtering.
      dueDate: pt.dueDate instanceof Date ? pt.dueDate.toISOString() : String(pt.dueDate || ''),
      status,
      columnId,
      createdAt: pt.createdAt || new Date(),
      projectId: pt.projectId || projectId,
      completedAt: pt.completedAt,
    };
  }), [projectId, project?.columns]);

  const fetchProject = useCallback(async () => {
    if (!numericProjectId || isNaN(numericProjectId)) {
      setProjectError('Invalid project ID');
      setIsLoadingProject(false);
      return;
    }

    setIsLoadingProject(true);
    setProjectError(null);

    try {
      const fetchedProject = await ProjectsService.getProjectById(numericProjectId);
      setProject(fetchedProject);
    } catch (error) {
      console.error('Failed to fetch project from API:', error);
      setProjectError('Failed to load project');
    } finally {
      setIsLoadingProject(false);
    }
  }, [numericProjectId]);

  const fetchTasks = useCallback(async () => {
    if (!numericProjectId || isNaN(numericProjectId)) {
      return;
    }

    setIsLoadingTasks(true);
    setTasksError(null);

    try {
      const apiTasks = await TasksService.getProjectTasks(numericProjectId);
      const mapped = mapToLocal(apiTasks);
      setTasksState(mapped);
    } catch (error) {
      console.error('Failed to fetch tasks from API:', error);
      setTasksError('Failed to load tasks');
      setTasksState([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [numericProjectId, mapToLocal]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project) {
      fetchTasks();
      ProjectsService.getProjectLinks(Number(project.id)).then(setProjectLinks).catch(() => setProjectLinks(null));
    }
  }, [project, fetchTasks]);

  const isTaskCompleted = (task: any) => {
    if (task.completedAt) return true;
    if (isCompletedTaskStatus(task.status)) return true;
    const col = project?.columns?.find((c: any) => String(c.id) === String(task.columnId));
    if (col && /done|completed|termin/i.test(col.title || '')) return true;
    return task.columnId === 'done';
  };

  const projectStats = {
    totalTasks: tasksState.length,
    completedTasks: tasksState.filter((task: any) => isTaskCompleted(task)).length,
    inProgressTasks: tasksState.filter((task: any) => normalizeTaskStatus(task.status) === 'in progress').length,
    overdueTasks: tasksState.filter((task: any) => {
      try {
        const d = new Date(task.dueDate);
        return d < new Date() && !isTaskCompleted(task);
      } catch {
        return false;
      }
    }).length,
    totalEstimatedHours: tasksState.reduce((sum: number, task: any) => sum + (task.estimatedHours || 0), 0),
    totalActualHours: tasksState.reduce((sum: number, task: any) => sum + (task.actualHours || 0), 0),
    completionPercentage: tasksState.length > 0
      ? Math.round((tasksState.filter((task: any) => isTaskCompleted(task)).length / tasksState.length) * 100)
      : 0
  };

  const getFilteredTasks = () => {
    const columns = project?.columns || [];
    let filtered = tasksState
      .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description||'').toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(t => taskMatchesUiFilterStatus(t, filterStatus, columns))
      .filter(t => filterPriority === 'all' ? true : t.priority === filterPriority)
      .filter(t => filterAssignee === 'all' ? true : t.assignee === filterAssignee);
    
    if (!showAllDates) {
      filtered = filtered.filter(t => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        const createdDate = t.createdAt ? new Date(t.createdAt) : null;
        return (dueDate && isSameDay(dueDate, selectedDate)) || (createdDate && isSameDay(createdDate, selectedDate));
      });
    }
    
    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const openTasks = filteredTasks.filter((t) => !isTaskCompleted(t));
  const completedTasks = filteredTasks.filter((t) => isTaskCompleted(t));

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleTaskUpdated = (updatedTask: any) => {
    const status = normalizeTaskStatus(updatedTask.status ?? updatedTask.columnId);
    const columnId = mapTaskStatusToColumnId(status, project?.columns || []);
    setTasksState((prev) =>
      prev.map((t) =>
        t.id === updatedTask.id
          ? {
              ...t,
              ...updatedTask,
              status,
              columnId,
            }
          : t
      )
    );
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask((prev: any) => (prev ? { ...prev, ...updatedTask, status, columnId } : prev));
    }
  };

  const handleTaskDeleted = async (_taskId: string) => {
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
    await fetchTasks();
  };

  const handleAddTask = () => {
    if (activeTab !== 'tasks') setActiveTab('tasks');
    setIsQuickTaskModalOpen(true);
  };

  const handleManageProject = () => {
    setIsEditProjectOpen(true);
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      if (!project?.id) {
        toast({ title: t('toast.error'), description: t('toast.failedCreate'), variant: 'destructive' });
        return;
      }
      const projectIdNum = parseInt(String(project.id), 10);
      if (isNaN(projectIdNum)) throw new Error('Invalid project ID');

      await TasksService.createProjectTask(
        buildCreateProjectTaskPayload(
          {
            ...taskData,
            relatedEntityType: 'project',
            relatedEntityId: projectIdNum,
            status: taskData.status ?? 'open',
          },
          projectIdNum
        ) as any
      );

      await fetchTasks();
      toast({ title: t('toast.success'), description: t('toast.taskCreated') });
    } catch (err) {
      toast({ title: t('toast.error'), description: t('toast.failedCreate'), variant: 'destructive' });
      throw err;
    }
  };

  // "Manage" opens a modal to edit the project itself (name, status, type, …).
  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    try {
      await ProjectsService.updateProject(Number(id), updates as any);
      setIsEditProjectOpen(false);
      await fetchProject();
      toast({ title: t('projects.toast.updated', 'Project updated') });
    } catch {
      toast({ title: t('projects.toast.updateFailed', 'Failed to update project'), variant: 'destructive' });
    }
  };


  const handleTaskComplete = async (taskId: string) => {
    try {
      const taskIdNum = parseInt(taskId, 10) || parseInt(taskId.replace(/\D/g, ''), 10);
      if (isNaN(taskIdNum)) return;
      await TasksService.moveTask(taskIdNum, { status: 'completed' });
      await fetchTasks();
      toast({ title: t('toast.success'), description: t('toast.taskCompleted') });
    } catch {
      toast({ title: t('toast.error'), description: t('toast.failedStatus'), variant: 'destructive' });
    }
  };

  const handleBackToProjects = () => {
    navigate("/dashboard/tasks/projects");
  };

  if (isLoadingProject) {
    return <PageSkeleton />;
  }

  if (!project || projectError) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('projects.notFoundTitle')}</h2>
          <p className="text-muted-foreground mb-4">{projectError || t('projects.notFoundDesc')}</p>
          <Button onClick={handleBackToProjects} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('projects.header.back')}
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'on-hold': return 'bg-warning text-warning-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-primary/10 text-primary';
      case 'sales': return 'bg-success/10 text-success';
      case 'internal': return 'bg-secondary text-secondary-foreground';
      case 'custom': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="sm" onClick={handleBackToProjects} className="gap-2 hover:bg-background/80 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            {t('projects.header.back')}
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="p-2 rounded-lg bg-primary/10">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground break-words line-clamp-2">{project.name}</h1>
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              <Badge className={getTypeColor(project.type)} variant="outline">{project.type}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleManageProject} className="gap-2">
            <Settings className="h-4 w-4" />
            {t('projects.header.manage')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate(`/dashboard/deals/add?projectId=${projectId}`)}
          >
            <Handshake className="h-4 w-4" />
            {t('projects.header.addDeal', 'New Deal')}
          </Button>
          <Button
            className="gradient-primary text-primary-foreground shadow-medium hover-lift gap-2"
            onClick={handleAddTask}
          >
            <PlusCircle className="h-4 w-4" />
            {t('projects.header.addTask')}
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <Button variant="ghost" size="sm" onClick={handleBackToProjects} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            {t('projects.header.backShort')}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleManageProject} className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => navigate(`/dashboard/deals/add?projectId=${projectId}`)}
              title={t('projects.header.addDeal', 'New Deal')}
            >
              <Handshake className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground shadow-medium hover-lift gap-2"
              onClick={handleAddTask}
            >
              <PlusCircle className="h-4 w-4" />
              {t('projects.header.add')}
            </Button>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-foreground break-words line-clamp-2">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getStatusColor(project.status)} text-[10px] px-1.5 py-0`}>{project.status}</Badge>
                <Badge className={`${getTypeColor(project.type)} text-[10px] px-1.5 py-0`} variant="outline">{project.type}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-card">
            {/* Mobile: Dropdown Select */}
            {isMobile ? (
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue>
                    {activeTab === 'overview' && t('projects.detail.tabs.overview')}
                    {activeTab === 'tasks' && t('projects.detail.tabs.tasks')}
                    {activeTab === 'team' && t('projects.detail.tabs.team')}
                    {activeTab === 'documents' && t('projects.detail.tabs.documents')}
                    {activeTab === 'activity' && t('projects.detail.tabs.notesActivity', 'Notes & Activity')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card">
                  <SelectItem value="overview">{t('projects.detail.tabs.overview')}</SelectItem>
                  <SelectItem value="offers">{t('projects.detail.tabs.offers')}</SelectItem>
                  <SelectItem value="deals">{t('projects.detail.tabs.deals')}</SelectItem>
                  <SelectItem value="tasks">{t('projects.detail.tabs.tasks')}</SelectItem>
                  <SelectItem value="team">{t('projects.detail.tabs.team')}</SelectItem>
                  <SelectItem value="documents">{t('projects.detail.tabs.documents')}</SelectItem>
                  <SelectItem value="checklists">{t('projects.detail.tabs.checklists', 'Checklists')}</SelectItem>
                  <SelectItem value="activity">{t('projects.detail.tabs.notesActivity', 'Notes & Activity')}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <TabsList variant="underline">
                <TabsTrigger value="overview">{t('projects.detail.tabs.overview')}</TabsTrigger>
                <TabsTrigger value="offers">{t('projects.detail.tabs.offers')}</TabsTrigger>
                <TabsTrigger value="deals">{t('projects.detail.tabs.deals')}</TabsTrigger>
                <TabsTrigger value="tasks">{t('projects.detail.tabs.tasks')}</TabsTrigger>
                <TabsTrigger value="team">{t('projects.detail.tabs.team')}</TabsTrigger>
                <TabsTrigger value="documents">{t('projects.detail.tabs.documents')}</TabsTrigger>
                <TabsTrigger value="checklists">{t('projects.detail.tabs.checklists', 'Checklists')}</TabsTrigger>
                <TabsTrigger value="activity">{t('projects.detail.tabs.notesActivity', 'Notes & Activity')}</TabsTrigger>
              </TabsList>

            )}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6">
              <TabsContent value="overview" className="mt-0">
                <ProjectOverviewTab 
                  project={project}
                  projectStats={projectStats}
                  technicians={technicians}
                  projectLinks={projectLinks}
                />
              </TabsContent>

              <TabsContent value="offers" className="mt-0">
                <ProjectOffersTab projectLinks={projectLinks} mode="offers" projectId={projectId} />
              </TabsContent>

              <TabsContent value="deals" className="mt-0">
                <ProjectOffersTab projectLinks={projectLinks} mode="deals" sales={projectLinks?.sales ?? []} projectId={projectId} />
              </TabsContent>

              <TabsContent value="tasks" className="mt-0">
                <ProjectTasksTab
                  project={project}
                  tasksState={tasksState}
                  technicians={technicians}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  filterPriority={filterPriority}
                  setFilterPriority={setFilterPriority}
                  filterAssignee={filterAssignee}
                  setFilterAssignee={setFilterAssignee}
                  showFilterBar={showFilterBar}
                  setShowFilterBar={setShowFilterBar}
                  showAllDates={showAllDates}
                  setShowAllDates={setShowAllDates}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  taskViewMode={taskViewMode}
                  setTaskViewMode={setTaskViewMode}
                  showCompletedSection={showCompletedSection}
                  setShowCompletedSection={setShowCompletedSection}
                  isColumnEditorOpen={isColumnEditorOpen}
                  setIsColumnEditorOpen={setIsColumnEditorOpen}
                  isQuickTaskModalOpen={isQuickTaskModalOpen}
                  setIsQuickTaskModalOpen={setIsQuickTaskModalOpen}
                  isLoadingTasks={isLoadingTasks}
                  tasksError={tasksError}
                  openTasks={openTasks}
                  completedTasks={completedTasks}
                  handleTaskClick={handleTaskClick}
                  handleAddTask={handleAddTask}
                  handleTaskComplete={handleTaskComplete}
                  fetchTasks={fetchTasks}
                  lookupPriorities={lookupPriorities}
                  setTasksState={setTasksState}
                />
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <ProjectTeamTab
                  project={project}
                  technicians={technicians}
                  tasksState={tasksState}
                  onTeamUpdated={() => { fetchProject(); fetchTasks(); }}
                />
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <ProjectDocumentsTab project={project} />
              </TabsContent>

              <TabsContent value="checklists" className="mt-0">
                <ChecklistsSection entityType="project" entityId={project.id} />
              </TabsContent>

              {/* Combined Notes & Activity */}
              <TabsContent value="activity" className="mt-0">
                <ProjectNotesActivityTab project={project} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      <QuickTaskModal
        isOpen={isQuickTaskModalOpen}
        onClose={() => setIsQuickTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
        technicians={technicians as any}
        columns={(project.columns as any) || []}
        projects={[project]}
        projectId={project.id}
      />

      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        onUpdateProject={handleUpdateProject}
        project={project}
        technicians={technicians as any}
      />

      <TaskDetailModal
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
        technicians={technicians as any}
      />
    </div>
  );
}
