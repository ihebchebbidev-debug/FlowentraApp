import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MoreHorizontal, 
  Calendar, 
  Users, 
  CheckSquare,
  Play,
  Pause,
  Edit3,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Project, ProjectStats, Technician } from "../types";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface ProjectsListProps {
  projects: Project[];
  projectStats: Record<string, ProjectStats>;
  technicians: Technician[];
  onOpenProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleStatus: (projectId: string, status: Project['status']) => void;
}

const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'active': return 'bg-success text-success-foreground';
    case 'completed': return 'bg-primary text-primary-foreground';
    case 'on-hold': return 'bg-warning text-warning-foreground';
    case 'cancelled': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getTypeColor = (type: Project['type']) => {
  switch (type) {
    case 'service': return 'bg-primary/10 text-primary';
    case 'sales': return 'bg-success/10 text-success';
    case 'internal': return 'bg-secondary text-secondary-foreground';
    case 'custom': return 'bg-warning/10 text-warning';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

export function ProjectsList({
  projects,
  projectStats,
  technicians,
  onOpenProject,
  onEditProject,
  onDeleteProject,
  onToggleStatus
}: ProjectsListProps) {
  const { t } = useTranslation('tasks');
  
  return (
    <div className="divide-y divide-border">
      {projects.map((project) => {
        const stats = projectStats[project.id] || {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          activeMembers: project.teamMembers.length,
          completionPercentage: 0,
        };

        return (
          <div 
              key={project.id}
              className="p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors group cursor-pointer text-[0.85rem]"
              onClick={() => onOpenProject(project)}
            >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                  <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                    {project.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-foreground text-xs sm:text-sm truncate">{project.name}</h3>
                      <Badge className={`${getStatusColor(project.status)} text-xs`}>
                        {t(`projects.list.status.${project.status}`)}
                      </Badge>
                    </div>
                    <Badge className={`${getTypeColor(project.type)} text-xs`}>
                      {t(`projects.list.type.${project.type}`)}
                    </Badge>
                  </div>
                  {project.description && (
                    <div className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                      {project.description}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    {project.startDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(project.startDate, "MMM dd, yyyy")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <CheckSquare className="h-3 w-3" />
                      <span>{stats.completedTasks}/{stats.totalTasks} {t('projects.list.tasks')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{project.teamMembers.length} {t('projects.list.members')}</span>
                    </div>
                    {stats.completionPercentage > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${stats.completionPercentage}%` }} />
                        </div>
                        <span className="text-xs">{stats.completionPercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                {/* Team Avatars */}
                <div className="hidden md:flex items-center gap-1">
                  {project.teamMembers.slice(0, 3).map((memberId) => {
                    const member = technicians.find(t => t.id === memberId);
                    return member ? (
                      <Avatar key={member.id} className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ) : null;
                  })}
                  {project.teamMembers.length > 3 && (
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                      +{project.teamMembers.length - 3}
                    </div>
                  )}
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={(e) => { e.stopPropagation(); onOpenProject(project); }}
                >
                  {t('projects.list.open')}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-background border border-border shadow-lg">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditProject(project); }}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      {t('projects.list.editProject')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(project.id, project.status === 'active' ? 'on-hold' : 'active'); }}>
                      {project.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          {t('projects.list.pauseProject')}
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          {t('projects.list.resumeProject')}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(project.id, 'completed'); }} disabled={project.status === 'completed'}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      {t('projects.list.markComplete')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('projects.list.deleteProject')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}