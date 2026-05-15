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
import { ProjectNotesTab } from '../components/project-detail/ProjectNotesTab';
import { ProjectDocumentsTab } from '../components/project-detail/ProjectDocumentsTab';
import { ProjectActivityTab } from '../components/project-detail/ProjectActivityTab';
import { ProjectSettingsTab } from '../components/project-detail/ProjectSettingsTab';

// Interface for technician/assignable users
interface Technician {
  id: string;
  name: string;
  email?: string;
}

export default function ProjectTasksPage() {
  const { t } = useTranslation('tasks');
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useLayoutModeContext();
  const { logAction, logSearch, logFilter } = useActionLogger('Projects');
  
  // Tab management
  const [activeTab, setActiveTab] = useState('overview');
  
  // Task view mode
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'list'>('board');
  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  
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

  const mapToLocal = useCallback((apiTasks: Task[]) => apiTasks.map(pt => ({
    id: pt.id,
    title: pt.title,
    description: pt.description || '',
    priority: (pt.priority as 'high' | 'medium' | 'low') || 'medium',
    assignee: (pt.assignee as string) || pt.assigneeName || '',
    assigneeId: pt.assigneeId || '',
    dueDate: pt.dueDate instanceof Date ? pt.dueDate.toLocaleDateString() : String(pt.dueDate || ''),
    columnId: String(pt.columnId) || (pt.status as string) || 'todo',
    createdAt: pt.createdAt || new Date(),
    projectId: pt.projectId || projectId,
  })), [projectId]);

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
      setTasksState(mapToLocal(apiTasks));
    } catch (error) {
      console.error('Failed to fetch tasks from API:', error);
      setTasksError('Failed to load tasks');
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

  const projectStats = {
    totalTasks: tasksState.length,
    completedTasks: tasksState.filter((task: any) => (task.columnId === 'done') || task.completedAt).length,
    inProgressTasks: tasksState.filter((task: any) => task.columnId === 'in-progress').length,
    overdueTasks: tasksState.filter((task: any) => {
      try {
        const d = new Date(task.dueDate);
        return d < new Date() && !task.completedAt;
      } catch {
        return false;
      }
    }).length,
    totalEstimatedHours: tasksState.reduce((sum: number, task: any) => sum + (task.estimatedHours || 0), 0),
    totalActualHours: tasksState.reduce((sum: number, task: any) => sum + (task.actualHours || 0), 0),
    completionPercentage: tasksState.length > 0
      ? Math.round((tasksState.filter((task: any) => (task.columnId === 'done') || task.completedAt).length / tasksState.length) * 100)
      : 0
  };

  const getFilteredTasks = () => {
    let filtered = tasksState
      .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description||'').toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(t => filterStatus === 'all' ? true : (t.columnId === filterStatus))
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
  const openTasks = filteredTasks.filter(t => t.columnId !== 'done' && !t.completedAt);
  const completedTasks = filteredTasks.filter(t => t.columnId === 'done' || t.completedAt);

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
  };

  const handleAddTask = () => {
    setIsQuickTaskModalOpen(true);
  };

  const handleTaskComplete = (taskId: string) => {
    console.log('Complete task:', taskId);
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
          <Button variant="outline" size="sm" onClick={() => setIsColumnEditorOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            {t('projects.header.manage')}
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
            <Button variant="outline" size="sm" onClick={() => setIsColumnEditorOpen(true)} className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
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
                    {activeTab === 'notes' && t('projects.detail.tabs.notes')}
                    {activeTab === 'documents' && t('projects.detail.tabs.documents')}
                    {activeTab === 'activity' && t('projects.detail.tabs.activity')}
                    {activeTab === 'settings' && t('projects.detail.tabs.settings')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card">
                  <SelectItem value="overview">{t('projects.detail.tabs.overview')}</SelectItem>
                  <SelectItem value="tasks">{t('projects.detail.tabs.tasks')}</SelectItem>
                  <SelectItem value="team">{t('projects.detail.tabs.team')}</SelectItem>
                  <SelectItem value="notes">{t('projects.detail.tabs.notes')}</SelectItem>
                  <SelectItem value="documents">{t('projects.detail.tabs.documents')}</SelectItem>
                  <SelectItem value="activity">{t('projects.detail.tabs.activity')}</SelectItem>
                  <SelectItem value="settings">{t('projects.detail.tabs.settings')}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-lg grid grid-cols-7">
                <TabsTrigger value="overview" className="px-3 py-2 text-xs sm:text-sm font-medium">
                  {t('projects.detail.tabs.overview')}
                </TabsTrigger>
                <TabsTrigger value="tasks" className="px-3 py-2 text-xs sm:text-sm font-medium">
                  {t('projects.detail.tabs.tasks')}
                </TabsTrigger>
                <TabsTrigger value="team" className="px-3 py-2 text-xs sm:text-sm font-medium">
                  {t('projects.detail.tabs.team')}
                </TabsTrigger>
                <TabsTrigger value="notes" className="px-3 py-2 text-xs sm:text-sm font-medium">
                  {t('projects.detail.tabs.notes')}
                </TabsTrigger>
                <TabsTrigger value="documents" className="px-3 py-2 text-xs sm:text-sm font-medium">
                  {t('projects.detail.tabs.documents')}
                </TabsTrigger>
                <TabsTrigger value="activity" className="px-3 py-2 text-xs sm:text-sm font-medium">
                  {t('projects.detail.tabs.activity')}
                </TabsTrigger>
                <TabsTrigger value="settings" className="px-3 py-2 text-xs sm:text-sm font-medium">
                  {t('projects.detail.tabs.settings')}
                </TabsTrigger>
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
                />
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <ProjectNotesTab project={project} />
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <ProjectDocumentsTab project={project} />
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <ProjectActivityTab project={project} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <ProjectSettingsTab />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
