import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyBadge } from "@/components/CompanyBadge";
import { isViewAllMode } from "@/utils/tenant";
import {
  MoreHorizontal,
  CheckSquare,
  Play,
  Pause,
  Edit3,
  Trash2,
  Eye,
  FolderKanban,
  Users,
  CalendarDays,
  CalendarCheck2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Project, ProjectStats, Technician } from "../types";
import { format } from "date-fns";

interface ProjectsTableProps {
  projects: Project[];
  projectStats: Record<string, ProjectStats>;
  technicians: Technician[];
  onOpenProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleStatus: (projectId: string, status: Project['status']) => void;
  enablePagination?: boolean;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
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
    case 'client': return 'bg-primary/10 text-primary';
    case 'service': return 'bg-primary/10 text-primary';
    case 'sales': return 'bg-success/10 text-success';
    case 'internal': return 'bg-secondary text-secondary-foreground';
    case 'custom': return 'bg-warning/10 text-warning';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

export function ProjectsTable({
  projects,
  projectStats,
  technicians,
  onOpenProject: _onOpenProject,
  onEditProject,
  onDeleteProject,
  onToggleStatus,
  enablePagination = false,
  itemsPerPage = 5,
  currentPage = 1,
  onPageChange,
  totalItems
}: ProjectsTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('tasks');

  const handleProjectClick = (project: Project) => {
    navigate(`/dashboard/tasks/projects/${project.id}`);
  };

  const totalPages = enablePagination && totalItems ? Math.ceil(totalItems / itemsPerPage) : 1;
  const hasNextPage = enablePagination ? currentPage < totalPages : false;
  const hasPreviousPage = enablePagination ? currentPage > 1 : false;

  return (
    <div className="w-full">
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border/50">
        {projects.map(project => {
          const stats = projectStats[project.id] || { totalTasks: 0, completedTasks: 0, completionPercentage: 0 };
          return (
            <div
              key={project.id}
              className="p-4 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FolderKanban className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-foreground leading-snug line-clamp-1 flex-1">
                      {project.name}
                    </p>
                    <Badge className={`text-[10px] px-2 py-0.5 shrink-0 ${getStatusColor(project.status)}`} variant="secondary">
                      {t(`projects.list.status.${project.status}`, { defaultValue: project.status })}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <Badge className={`text-[10px] px-1.5 py-0 ${getTypeColor(project.type)}`} variant="outline">
                      {t(`projects.list.type.${project.type}`, { defaultValue: project.type })}
                    </Badge>
                    {project.description && (
                      <span className="ml-1.5">{project.description}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {stats.completionPercentage > 0 && (
                <div className="pl-12 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${stats.completionPercentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {stats.completionPercentage}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {stats.completedTasks}/{stats.totalTasks} {t('projects.list.tasks')}
                  </p>
                </div>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-12 mt-2">
                {project.startDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    <span>{format(project.startDate, 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarCheck2 className="h-3 w-3 shrink-0" />
                    <span>{format(project.endDate, 'MMM dd, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3 shrink-0" />
                  <span>{project.teamMembers.length} {t('projects.list.members')}</span>
                </div>
                {isViewAllMode() && (
                  <CompanyBadge tenantId={(project as any).tenantId} forceShow />
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pl-12 mt-3">
                <div className="flex items-center gap-1">
                  {project.teamMembers.slice(0, 3).map((memberId: any) => {
                    const member = technicians.find(t => t.id === memberId);
                    return member ? (
                      <Avatar key={member.id} className="h-5 w-5">
                        <AvatarFallback className="text-[9px]">
                          {member.name.split(' ').map((n: any) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ) : null;
                  })}
                  {project.teamMembers.length > 3 && (
                    <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[9px] text-muted-foreground">
                      +{project.teamMembers.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleProjectClick(project)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onEditProject(project)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onToggleStatus(project.id, project.status === 'active' ? 'on-hold' : 'active')}>
                        {project.status === 'active' ? (
                          <><Pause className="h-4 w-4 mr-2" />{t('projects.list.pauseProject')}</>
                        ) : (
                          <><Play className="h-4 w-4 mr-2" />{t('projects.list.resumeProject')}</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleStatus(project.id, 'completed')} disabled={project.status === 'completed'}>
                        <CheckSquare className="h-4 w-4 mr-2" />{t('projects.list.markComplete')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteProject(project.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />{t('projects.list.deleteProject')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <Table className="w-full min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">{t('projects.list.table.project')}</TableHead>
              <TableHead>{t('projects.list.table.type')}</TableHead>
              <TableHead>{t('projects.list.table.status')}</TableHead>
              <TableHead>{t('projects.list.table.progress')}</TableHead>
              <TableHead>{t('projects.list.table.team')}</TableHead>
              <TableHead>{t('projects.list.table.startDate')}</TableHead>
              {isViewAllMode() && (
                <TableHead className="w-[160px]">{t('projects.list.table.company', 'Company')}</TableHead>
              )}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map(project => {
              const stats = projectStats[project.id] || { totalTasks: 0, completedTasks: 0, completionPercentage: 0 };
              return (
                <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50 group" onClick={() => handleProjectClick(project)}>
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {project.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-foreground truncate">{project.name}</div>
                        {project.description && <div className="text-sm text-muted-foreground line-clamp-1">{project.description}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <Badge className={getTypeColor(project.type)} variant="outline">
                      {t(`projects.list.type.${project.type}`, { defaultValue: project.type })}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-4">
                    <Badge className={getStatusColor(project.status)} variant="secondary">
                      {t(`projects.list.status.${project.status}`, { defaultValue: project.status })}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {stats.completedTasks}/{stats.totalTasks} {t('projects.list.tasks')}
                      </div>
                      {stats.completionPercentage > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${stats.completionPercentage}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{stats.completionPercentage}%</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex items-center gap-1">
                      {project.teamMembers.slice(0, 3).map((memberId: any) => {
                        const member = technicians.find(t => t.id === memberId);
                        return member ? (
                          <Avatar key={member.id} className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map((n: any) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ) : null;
                      })}
                      {project.teamMembers.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                          +{project.teamMembers.length - 3}
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground ml-1">
                        {project.teamMembers.length} {t('projects.list.members')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="text-sm text-muted-foreground">
                      {project.startDate ? format(project.startDate, 'MMM dd, yyyy') : '-'}
                    </div>
                  </TableCell>
                  {isViewAllMode() && (
                    <TableCell className="p-4">
                      <CompanyBadge tenantId={(project as any).tenantId} forceShow />
                    </TableCell>
                  )}
                  <TableCell className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e: any) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); handleProjectClick(project); }}>
                          <Eye className="h-4 w-4 mr-2" />{t('projects.list.open')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); onEditProject(project); }}>
                          <Edit3 className="h-4 w-4 mr-2" />{t('projects.list.editProject')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); onToggleStatus(project.id, project.status === 'active' ? 'on-hold' : 'active'); }}>
                          {project.status === 'active' ? (
                            <><Pause className="h-4 w-4 mr-2" />{t('projects.list.pauseProject')}</>
                          ) : (
                            <><Play className="h-4 w-4 mr-2" />{t('projects.list.resumeProject')}</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(project.id, 'completed')} disabled={project.status === 'completed'}>
                          <CheckSquare className="h-4 w-4 mr-2" />{t('projects.list.markComplete')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteProject(project.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />{t('projects.list.deleteProject')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {enablePagination && totalItems && totalItems > itemsPerPage && (
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {t('projects.list.table.showing', {
                  from: (currentPage - 1) * itemsPerPage + 1,
                  to: Math.min(currentPage * itemsPerPage, totalItems),
                  total: totalItems,
                })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={!hasPreviousPage}
              >
                {t('projects.list.table.previous')}
              </Button>
              <span className="px-3 py-1 text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={!hasNextPage}
              >
                {t('projects.list.table.next')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
