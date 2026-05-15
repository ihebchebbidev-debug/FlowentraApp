import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePaginatedData } from "@/shared/hooks/usePagination";
import { formatStatValue } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Filter,
  Grid,
  List,
  CheckSquare,
  Briefcase,
  ChevronDown
} from "lucide-react";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Project, ProjectStats, Task, Technician } from "../types";
import { ProjectsList } from "./ProjectsList";
import { ProjectsTable } from "./ProjectsTable";
import { EditProjectModal } from "./EditProjectModal";
import { CreateProjectModal } from "./CreateProjectModal";
import { QuickTaskModal } from "./QuickTaskModal";
import { KanbanBoard } from "./KanbanBoard";
import { usePreferences } from "@/hooks/usePreferences";
import { toast } from "sonner";
import { useActionLogger } from "@/hooks/useActionLogger";
import { DeleteConfirmationModal } from "@/shared/components/DeleteConfirmationModal";

// Import services
import { ProjectsService, type CreateProjectRequestDto, type UpdateProjectRequestDto } from "../services/projects.service";
import { TasksService } from "../services/tasks.service";
import { usersApi } from "@/services/api/usersApi";

import defaultColumnsData from "@/data/mock/defaultColumns.json";

const defaultColumns = defaultColumnsData.map(col => ({
  ...col,
  createdAt: new Date(col.createdAt)
}));

interface ProjectManagerProps {
  onSwitchToTasks: () => void;
}

export function ProjectManager({ onSwitchToTasks: _onSwitchToTasks }: ProjectManagerProps) {
  const { t } = useTranslation('tasks');
  const { preferences } = usePreferences();
  const { logAction, logSearch, logFilter, logFormSubmit } = useActionLogger('Projects');
  
  // Initialize viewMode from user preferences
  const getInitialViewMode = (): 'grid' | 'list' => {
    try {
      const localPrefs = localStorage.getItem('user-preferences');
      if (localPrefs) {
        const prefs = JSON.parse(localPrefs);
        if (prefs.dataView === 'list' || prefs.dataView === 'table') return 'list';
        if (prefs.dataView === 'grid') return 'grid';
      }
    } catch (e) {}
    return 'grid';
  };
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStatsMap, setProjectStatsMap] = useState<Record<string, ProjectStats>>({});
  const [loading, setLoading] = useState(true);
  const [teamUsers, setTeamUsers] = useState<Technician[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Project['status']>('all');
  const [filterType, setFilterType] = useState<'all' | Project['type']>('all');
  const [filterOwner, setFilterOwner] = useState<'all' | string>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | '7' | '30' | '365'>('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(getInitialViewMode);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'projects' | 'project-detail' | 'daily-tasks'>('projects');
  const [selectedStat, setSelectedStat] = useState<string>('all');
  
  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Fetch real users for team/owner display
  useEffect(() => {
    usersApi.getAll()
      .then(res => {
        const users = res.users || [];
        setTeamUsers(users.map((u: any) => ({
          id: String(u.id),
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '',
          email: u.email || '',
          role: u.role || '',
          isActive: u.isActive !== false,
          avatar: u.profilePictureUrl,
        })));
      })
      .catch(() => {
        // Fallback: empty — components handle missing gracefully
        setTeamUsers([]);
      });
  }, []);

  // Log search when search term changes (with debounce effect)
  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => {
        logSearch(searchTerm, filteredProjects?.length || 0, { entityType: 'Project' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Log filter changes
  useEffect(() => {
    if (filterStatus !== 'all') {
      logFilter('Status', filterStatus, { entityType: 'Project' });
    }
  }, [filterStatus]);

  useEffect(() => {
    if (filterType !== 'all') {
      logFilter('Type', filterType, { entityType: 'Project' });
    }
  }, [filterType]);

  // Fetch projects from backend
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedProjects = await ProjectsService.getAllProjects();
      setProjects(fetchedProjects);

      // Show projects immediately, load stats in background
      setLoading(false);

      // Use the dedicated completion percentage endpoint when possible,
      // falling back to task-count based stats. Limit concurrency to 4.
      const CONCURRENCY = 4;
      const statsMap: Record<string, ProjectStats> = {};
      
      const buildStatsForProject = async (project: Project) => {
        const projectId = parseInt(project.id, 10);
        const defaultStats: ProjectStats = {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          activeMembers: project.teamMembers?.length || 0,
          completionPercentage: project.progress || 0,
        };
        if (isNaN(projectId)) return { id: project.id, stats: defaultStats };

        try {
          // Try bulk stats endpoint first (single request vs fetching all tasks)
          const [statusCounts, completionPct] = await Promise.all([
            TasksService.getTaskStatusCounts(projectId).catch(() => ({})),
            TasksService.getTaskCompletionPercentage(projectId).catch(() => 0),
          ]);

          const totalTasks = Object.values(statusCounts).reduce((a, b) => a + b, 0);
          const completedTasks = (statusCounts['done'] || 0) + (statusCounts['completed'] || 0);
          const overdueTasks = statusCounts['overdue'] || 0;

          return {
            id: project.id,
            stats: {
              totalTasks,
              completedTasks,
              overdueTasks,
              activeMembers: project.teamMembers?.length || 0,
              completionPercentage: completionPct || (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0),
            },
          };
        } catch {
          return { id: project.id, stats: defaultStats };
        }
      };

      // Process in batches for controlled concurrency
      for (let i = 0; i < fetchedProjects.length; i += CONCURRENCY) {
        const batch = fetchedProjects.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(batch.map(buildStatsForProject));
        for (const r of results) {
          if (r.status === 'fulfilled') {
            statsMap[r.value.id] = r.value.stats;
          }
        }
        // Update progressively so the UI fills in
        setProjectStatsMap(prev => ({ ...prev, ...statsMap }));
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error(t('projects.toast.loadError'));
      setLoading(false);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Update viewMode when preferences change
  useEffect(() => {
    if (preferences?.dataView) {
      const newMode = preferences.dataView === 'grid' ? 'grid' : 'list';
      setViewMode(newMode);
    }
  }, [preferences?.dataView]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Handle special "late" filter
    const isLateProject = project.endDate && project.endDate < new Date() && project.status === 'active';
    const matchesStatus = filterStatus === 'all' || 
                         project.status === filterStatus || 
                         (selectedStat === 'late' && isLateProject);

    const matchesType = filterType === 'all' || project.type === filterType;

    const matchesOwner = filterOwner === 'all' || project.ownerId === filterOwner || project.ownerName === filterOwner;

    let matchesTimeframe = true;
    if (filterTimeframe !== 'all') {
      const days = Number(filterTimeframe);
      const refDate = project.startDate || project.createdAt || new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = (Date.now() - refDate.getTime()) / msPerDay;
      matchesTimeframe = diffDays <= days;
    }

    return matchesSearch && matchesStatus && matchesType && matchesOwner && matchesTimeframe;
  });

  const pagination = usePaginatedData(filteredProjects, 5);

  // Get current user info from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return { id: user.id || user.userId, name: user.name || user.fullName || 'Current User' };
      }
    } catch (e) {}
    return { id: 1, name: 'Current User' };
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const currentUser = getCurrentUser();
      
      const createRequest: CreateProjectRequestDto = {
        name: projectData.name,
        description: projectData.description,
        ownerId: typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id,
        ownerName: currentUser.name,
        type: projectData.type || 'internal',
        status: projectData.status || 'active',
        priority: projectData.priority || 'medium',
        startDate: projectData.startDate?.toISOString(),
        endDate: projectData.endDate?.toISOString(),
        teamMembers: projectData.teamMembers?.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id)),
        tags: projectData.tags,
      };
      
      // Backend automatically creates default columns (To Do, In Progress, Review, Done)
      const newProject = await ProjectsService.createProject(createRequest);
      
      // Log successful project creation
      logFormSubmit('Create Project', true, { 
        entityType: 'Project', 
        entityId: newProject.id,
        details: `Created project: ${newProject.name}`
      });
      
      setProjects([newProject, ...projects]);
      toast.success(t('projects.toast.createSuccess'));
    } catch (error) {
      console.error('Failed to create project:', error);
      logFormSubmit('Create Project', false, { 
        entityType: 'Project',
        details: `Failed to create project: ${projectData.name}`
      });
      toast.error(t('projects.toast.createError'));
    }
  };

  const navigate = useNavigate();

  const handleOpenProject = (project: Project) => {
    navigate(`/dashboard/tasks/projects/${project.id}`);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const numId = parseInt(projectId, 10);
      if (isNaN(numId)) {
        toast.error(t('projects.toast.invalidId'));
        return;
      }
      
      const updateRequest: UpdateProjectRequestDto = {
        name: updates.name,
        description: updates.description,
        status: updates.status,
        type: updates.type,
        priority: updates.priority,
        startDate: updates.startDate?.toISOString(),
        endDate: updates.endDate?.toISOString(),
        progress: updates.progress,
        tags: updates.tags,
      };
      
      const updatedProject = await ProjectsService.updateProject(numId, updateRequest);
      
      // Log successful project update
      logFormSubmit('Update Project', true, { 
        entityType: 'Project', 
        entityId: projectId,
        details: `Updated project: ${updatedProject.name}`
      });
      
      setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
      setIsEditModalOpen(false);
      setEditingProject(null);
      toast.success(t('projects.toast.updateSuccess'));
    } catch (error) {
      console.error('Failed to update project:', error);
      logFormSubmit('Update Project', false, { 
        entityType: 'Project', 
        entityId: projectId,
        details: `Failed to update project`
      });
      toast.error(t('projects.toast.updateError'));
    }
  };

  const handleRequestDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const numId = parseInt(projectToDelete.id, 10);
      if (isNaN(numId)) {
        toast.error(t('projects.toast.invalidId'));
        return;
      }
      
      await ProjectsService.deleteProject(numId);
      
      // Log successful project deletion
      logAction('delete_project', `Deleted project: ${projectToDelete.name}`, { 
        entityType: 'Project', 
        entityId: projectToDelete.id 
      });
      
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      toast.success(t('projects.toast.deleteSuccess'));
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error(t('projects.toast.deleteError'));
    } finally {
      setProjectToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleToggleStatus = async (projectId: string, status: Project['status']) => {
    try {
      const numId = parseInt(projectId, 10);
      if (isNaN(numId)) return;
      
      await ProjectsService.updateProject(numId, { status });
      setProjects(projects.map(p => 
        p.id === projectId 
          ? { ...p, status, updatedAt: new Date(), completedAt: status === 'completed' ? new Date() : undefined }
          : p
      ));
    } catch (error) {
      console.error('Failed to update project status:', error);
      toast.error(t('projects.toast.statusError'));
    }
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Create task:', taskData);
  };

  const backToProjects = () => {
    setSelectedProject(null);
    setActiveView('projects');
  };

  // Use fetched stats from state, fallback to project.stats or defaults
  const projectStats: Record<string, ProjectStats> = {};
  projects.forEach(p => {
    projectStats[p.id] = projectStatsMap[p.id] || p.stats || {
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      activeMembers: p.teamMembers?.length || 0,
      completionPercentage: p.progress || 0,
    };
  });

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-7 w-40 bg-muted rounded" />
          <div className="h-9 w-28 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/60 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (activeView === 'project-detail' && selectedProject) {
    return (
      <KanbanBoard 
        project={selectedProject}
        onBackToProjects={backToProjects}
        technicians={teamUsers}
      />
    );
  }

  if (activeView === 'daily-tasks') {
    return (
      <KanbanBoard 
        onBackToProjects={() => setActiveView('projects')}
        technicians={teamUsers}
        isDailyTasks={true}
      />
    );
  }

  const Header = () => (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('projects.title')}</h1>
          <p className="text-[11px] text-muted-foreground">{t('projects.description')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => setIsCreateModalOpen(true)} className="gradient-primary text-white shadow-medium hover-lift w-full sm:w-auto bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4 text-white" />
          <span className="hidden sm:inline text-white">{t('projects.buttons.newProject')}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col">
      <Header />

      {/* Project Status Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: t('projects.stats.total'),
              value: projects.length,
              icon: FolderOpen,
              color: "chart-1",
              filter: 'all'
            },
            {
              label: t('projects.stats.active'),
              value: projects.filter(p => p.status === 'active').length,
              icon: CheckSquare,
              color: "chart-2",
              filter: 'active'
            },
            {
              label: t('projects.stats.completed'), 
              value: projects.filter(p => p.status === 'completed').length,
              icon: CheckSquare,
              color: "chart-3", 
              filter: 'completed'
            },
            {
              label: t('projects.stats.late'),
              value: projects.filter(p => p.endDate && p.endDate < new Date() && p.status === 'active').length,
              icon: Filter,
              color: "chart-4",
              filter: 'late'
            }
          ].map((stat, index) => {
            const isSelected = (stat.filter === 'late' && filterStatus === 'active' && selectedStat === 'late') || 
                             (stat.filter !== 'late' && filterStatus === stat.filter);
            return (
              <Card 
                key={index} 
                className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${
                  isSelected 
                    ? 'border-2 border-primary bg-primary/5' 
                    : 'border-0'
                }`}
                onClick={() => {
                  if (stat.filter === 'late') {
                    setFilterStatus('active');
                    setSelectedStat('late');
                  } else if (stat.filter === 'all') {
                    setFilterStatus('all');
                    setFilterType('all');
                    setSelectedStat('all');
                  } else {
                    setFilterStatus(stat.filter as Project['status']);
                    setSelectedStat(stat.filter);
                  }
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                        isSelected 
                          ? 'bg-primary/20' 
                          : `bg-${stat.color}/10 group-hover:bg-${stat.color}/20`
                      }`}>
                        <stat.icon className={`h-4 w-4 transition-all ${
                          isSelected 
                            ? 'text-primary' 
                            : `text-${stat.color}`
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatStatValue(stat.value)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
            <div className="flex-1">
              <CollapsibleSearch 
                placeholder={t('projects.searchPlaceholder')}
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 sm:gap-2 px-2 sm:px-3"
                onClick={() => setShowFilterBar(s => !s)}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('projects.filters.filters')}</span>
                {(filterStatus !== 'all' || filterType !== 'all' || filterOwner !== 'all' || filterTimeframe !== 'all') && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {[filterStatus !== 'all' ? 1 : 0, filterType !== 'all' ? 1 : 0, filterOwner !== 'all' ? 1 : 0, filterTimeframe !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none ${viewMode === 'list' ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            >
              <List className={`h-4 w-4 ${viewMode === 'list' ? 'text-white' : ''}`} />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`flex-1 sm:flex-none ${viewMode === 'grid' ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            >
              <Grid className={`h-4 w-4 ${viewMode === 'grid' ? 'text-white' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-down Filter Bar (matches Contacts/Offers) */}
      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-background/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger><SelectValue placeholder={t('projects.manager.allStatuses')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('projects.manager.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('projects.manager.active')}</SelectItem>
                  <SelectItem value="completed">{t('projects.manager.completed')}</SelectItem>
                  <SelectItem value="on-hold">{t('projects.manager.onHold')}</SelectItem>
                  <SelectItem value="cancelled">{t('projects.manager.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                <SelectTrigger><SelectValue placeholder={t('projects.manager.allTypes')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('projects.manager.allTypes')}</SelectItem>
                  <SelectItem value="service">{t('projects.manager.service')}</SelectItem>
                  <SelectItem value="sales">{t('projects.manager.sales')}</SelectItem>
                  <SelectItem value="internal">{t('projects.manager.internal')}</SelectItem>
                  <SelectItem value="custom">{t('projects.manager.custom')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterOwner} onValueChange={(v) => setFilterOwner(v)}>
                <SelectTrigger><SelectValue placeholder={t('projects.manager.allOwners')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('projects.manager.allOwners')}</SelectItem>
                  {teamUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTimeframe} onValueChange={(v) => setFilterTimeframe(v as any)}>
                <SelectTrigger><SelectValue placeholder={t('projects.manager.anyTime')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('projects.manager.anyTime')}</SelectItem>
                  <SelectItem value="7">{t('projects.manager.last7')}</SelectItem>
                  <SelectItem value="30">{t('projects.manager.last30')}</SelectItem>
                  <SelectItem value="365">{t('projects.manager.last365')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setFilterStatus('all'); setFilterType('all'); setFilterOwner('all'); setFilterTimeframe('all'); setShowFilterBar(false); }}>
                {t('projects.manager.clear')}
              </Button>
            </div>
          </div>
        </div>
      )}

  {/* Projects Grid/List */}
  <div className="p-3 sm:p-4 lg:p-6">
        {filteredProjects.length === 0 ? (
          <div className="border rounded-lg bg-card">
            <div className="text-center p-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('projects.empty.title')}</h3>
              <p className="text-muted-foreground">
                {searchTerm ? t('projects.empty.searchHint') : t('projects.empty.createHint')}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {viewMode === 'list' ? (
              <Card className="shadow-card border-0 bg-card">
                
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    <ProjectsList
                      projects={filteredProjects}
                      projectStats={projectStats}
                      technicians={teamUsers}
                      onOpenProject={handleOpenProject}
                      onEditProject={handleEditProject}
                      onDeleteProject={handleRequestDeleteProject}
                      onToggleStatus={handleToggleStatus}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-card border-0 bg-card">
                
                <CardContent className="p-0">
                  <ProjectsTable
                    projects={pagination.data}
                    projectStats={projectStats}
                    technicians={teamUsers}
                    onOpenProject={handleOpenProject}
                    onEditProject={handleEditProject}
                    onDeleteProject={handleRequestDeleteProject}
                    onToggleStatus={handleToggleStatus}
                    enablePagination={true}
                    itemsPerPage={5}
                    currentPage={pagination.state.currentPage}
                    onPageChange={pagination.actions.goToPage}
                    totalItems={filteredProjects.length}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProject(null);
        }}
        onUpdateProject={handleUpdateProject}
        project={editingProject}
        technicians={teamUsers}
      />

      <QuickTaskModal
        isOpen={isQuickTaskModalOpen}
        onClose={() => setIsQuickTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
        technicians={teamUsers}
        columns={defaultColumns}
        projects={projects}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDeleteProject}
        title={t('projects.deleteConfirm.title')}
        description={t('projects.deleteConfirm.description', { name: projectToDelete?.name || '' })}
        itemName={projectToDelete?.name}
        itemType={t('projects.title')}
      />
    </div>
  );
}