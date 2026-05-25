import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Building2, 
  User, 
  Wrench,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Package,
  Search,
} from "lucide-react";

import type { Job, ServiceOrder, InstallationGroup } from "../types";
import { DispatcherService } from "../services/dispatcher.service";
import { cn } from "@/lib/utils";
import './dispatcher-drag.css';

// serviceOrder = drag and plan whole service order at once
// job = plan each job individually (or per installation when conversionMode=installation)
export type PlanningMode = 'serviceOrder' | 'job';

// Conversion mode from Settings (how jobs were created)
export type ConversionMode = 'installation' | 'service';

interface UnassignedJobsListProps {
  jobs: Job[];
  isLoading?: boolean;
  onJobUpdate: () => void;
  onJobClick?: (job: Job) => void;
  isMobile?: boolean;
  planningMode?: PlanningMode;
  onPlanningModeChange?: (mode: PlanningMode) => void;
  conversionMode?: ConversionMode; // From Settings > JobConversionMode
}

export function UnassignedJobsList({ 
  jobs, 
  isLoading, 
  onJobUpdate: _onJobUpdate, 
  onJobClick, 
  isMobile,
  planningMode = 'serviceOrder',
  onPlanningModeChange,
  conversionMode = 'installation'
}: UnassignedJobsListProps) {
  const { t } = useTranslation();
  const [expandedServiceOrders, setExpandedServiceOrders] = useState<Set<string>>(new Set());
  const [expandedInstallations, setExpandedInstallations] = useState<Set<string>>(new Set(['__all__']));
  const [searchTerm, setSearchTerm] = useState("");
  const [_isDragging, setIsDragging] = useState(false);
  
  // Group jobs by service order and filter by search term
  // Only show service orders with status 'ready_for_planning'.
  // Memoized so heavy filtering only re-runs when its inputs change.
  const groupedData = useMemo(() => {
    const serviceOrders = DispatcherService.getServiceOrders();
    const searchLower = searchTerm.trim().toLowerCase();
    return serviceOrders
      .filter(order => order.status === 'ready_for_planning')
      .map(order => ({
        ...order,
        unassignedJobs: jobs.filter(job => job.serviceOrderId === order.id)
      }))
      .filter(order => {
        if (!searchLower) return true;
        const matchesOrderId = order.id.toLowerCase().includes(searchLower);
        const matchesOrderTitle = order.title.toLowerCase().includes(searchLower);
        const matchesJobTitle = order.unassignedJobs.some(job =>
          job.title.toLowerCase().includes(searchLower)
        );
        return matchesOrderId || matchesOrderTitle || matchesJobTitle;
      });
    // jobs reference changes whenever the parent reloads unassigned jobs (= SO cache version).
  }, [jobs, searchTerm]);

  // Group jobs by installation within a service order (used when conversionMode === 'installation')
  const getInstallationGroups = (soJobs: Job[]) => {
    const groups = new Map<string, { name: string; installationId: string; jobs: Job[] }>();
    const ungrouped: Job[] = [];
    
    soJobs.forEach(job => {
      const instId = job.installationId ? String(job.installationId) : '';
      const instName = job.installationName || `Installation #${instId}`;
      
      if (instId) {
        if (!groups.has(instId)) {
          groups.set(instId, { name: instName, installationId: instId, jobs: [] });
        }
        groups.get(instId)!.jobs.push(job);
      } else {
        ungrouped.push(job);
      }
    });
    
    return { groups: Array.from(groups.values()), ungrouped };
  };

  // Auto-expand all service orders in service-order planning mode
  const initializedRef = useRef(false);
  useEffect(() => {
    if (planningMode === 'serviceOrder' && groupedData.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setExpandedServiceOrders(new Set(groupedData.map(so => so.id)));
    }
  }, [planningMode, groupedData.length]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const toggleServiceOrder = (serviceOrderId: string) => {
    setExpandedServiceOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceOrderId)) {
        newSet.delete(serviceOrderId);
      } else {
        newSet.add(serviceOrderId);
      }
      return newSet;
    });
  };

  const toggleInstallation = (id: string) => {
    setExpandedInstallations(prev => {
      const next = new Set(prev);
      next.delete('__all__');
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  // Handle dragging individual jobs (per-job mode, only when conversionMode=service)
  const handleJobDragStart = (e: React.DragEvent, job: Job) => {
    if (isMobile || planningMode !== 'job' || conversionMode === 'installation') {
      e.preventDefault();
      return;
    }
    
    setIsDragging(true);
    document.body.classList.add('dragging');
    
    const dragData = {
      type: 'job',
      item: job,
      timestamp: Date.now()
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    const dragGhost = createJobDragGhost(job);
    e.dataTransfer.setDragImage(dragGhost, dragGhost.offsetWidth / 2, dragGhost.offsetHeight / 2);
    
    const target = e.currentTarget as HTMLElement;
    target.classList.add('dragging');
    
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 50);
  };

  // Handle dragging an installation group (all jobs under one installation)
  // In installation conversionMode, this is allowed regardless of planningMode so users can
  // always drag a single installation card to create exactly one dispatch.
  const handleInstallationGroupDragStart = (e: React.DragEvent, group: { name: string; installationId: string; jobs: Job[] }, serviceOrderData: ServiceOrder & { unassignedJobs: Job[] }) => {
    if (isMobile || conversionMode !== 'installation') {
      e.preventDefault();
      return;
    }

    e.stopPropagation(); // Don't trigger SO drag

    setIsDragging(true);
    document.body.classList.add('dragging');

    const installationGroup: InstallationGroup = {
      installationId: group.installationId,
      installationName: group.name,
      serviceOrderId: serviceOrderData.id,
      serviceOrderTitle: serviceOrderData.title || `SO-${serviceOrderData.id}`,
      jobs: group.jobs,
    };

    const dragData = {
      type: 'installationGroup',
      item: installationGroup,
      timestamp: Date.now()
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';

    const dragGhost = createInstallationGroupDragGhost(installationGroup);
    e.dataTransfer.setDragImage(dragGhost, dragGhost.offsetWidth / 2, dragGhost.offsetHeight / 2);

    const target = e.currentTarget as HTMLElement;
    target.classList.add('dragging');

    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 50);
  };

  // Handle dragging whole service order (batch mode) - drags all jobs of the service order
  const handleServiceOrderDragStart = (e: React.DragEvent, serviceOrder: ServiceOrder & { unassignedJobs: Job[] }) => {
    if (isMobile || planningMode !== 'serviceOrder') {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    document.body.classList.add('dragging');

    const dragData = {
      type: 'serviceOrder',
      item: {
        ...serviceOrder,
        jobs: serviceOrder.unassignedJobs,
      },
      timestamp: Date.now()
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';

    const dragGhost = createServiceOrderDragGhost(serviceOrder);
    e.dataTransfer.setDragImage(dragGhost, dragGhost.offsetWidth / 2, dragGhost.offsetHeight / 2);

    const target = e.currentTarget as HTMLElement;
    target.classList.add('dragging');

    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 50);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    document.body.classList.remove('dragging');
    
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('dragging');
    target.style.opacity = '';
    
    cleanupDragGhost();
  };

  const createJobDragGhost = (job: Job) => {
    const hours = Math.floor(job.estimatedDuration / 60);
    const mins = job.estimatedDuration % 60;
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `
      <div class="p-2 bg-card border rounded-lg shadow-lg min-w-[200px]">
        <div class="font-medium text-sm text-foreground">${job.title}</div>
        <div class="text-xs text-muted-foreground mt-1">${job.customerName}</div>
        <div class="text-xs text-muted-foreground">${hours}${t('dispatcher.hours_short')} ${mins}${t('dispatcher.minutes_short')}</div>
      </div>
    `;
    document.body.appendChild(ghost);
    return ghost;
  };

  const createInstallationGroupDragGhost = (group: InstallationGroup) => {
    const totalDuration = group.jobs.reduce((sum, job) => sum + (job.estimatedDuration || 60), 0);
    const totalHours = Math.round(totalDuration / 60 * 10) / 10;
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `
      <div class="p-3 bg-primary/10 border-2 border-primary rounded-lg shadow-lg min-w-[220px]">
        <div class="flex items-center gap-2 mb-1">
          <svg class="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h6"/>
          </svg>
          <span class="font-semibold text-sm text-foreground">${group.installationName}</span>
        </div>
        <div class="text-xs text-muted-foreground mb-1">${group.serviceOrderTitle}</div>
        <div class="flex items-center gap-3 text-xs text-primary font-medium">
          <span>${group.jobs.length} ${t('dispatcher.jobs')}</span>
          <span>${totalHours}${t('dispatcher.hours_short')} ${t('dispatcher.total')}</span>
        </div>
      </div>
    `;
    document.body.appendChild(ghost);
    return ghost;
  };

  const createServiceOrderDragGhost = (serviceOrder: ServiceOrder & { unassignedJobs: Job[] }) => {
    const totalDuration = serviceOrder.unassignedJobs.reduce((sum, job) => sum + (job.estimatedDuration || 60), 0);
    const jobCount = serviceOrder.unassignedJobs.length;
    const totalHours = Math.round(totalDuration / 60 * 10) / 10;
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `
      <div class="p-3 bg-primary/10 border-2 border-primary rounded-lg shadow-lg min-w-[220px]">
        <div class="flex items-center gap-2 mb-2">
          <svg class="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
          <span class="font-semibold text-sm text-foreground">${serviceOrder.title || `SO-${serviceOrder.id}`}</span>
        </div>
        <div class="flex items-center gap-3 mt-2 text-xs text-primary font-medium">
          <span>${jobCount} ${t('dispatcher.jobs')}</span>
          <span>${totalHours}${t('dispatcher.hours_short')} ${t('dispatcher.total')}</span>
        </div>
      </div>
    `;
    document.body.appendChild(ghost);
    return ghost;
  };

  const cleanupDragGhost = () => {
    const ghosts = document.querySelectorAll('.drag-ghost');
    ghosts.forEach(ghost => ghost.remove());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.add('drag-ready');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-ready');
  };

  // Render a single job row
  const renderJobRow = (job: Job) => {
    // Individual job dragging only when conversionMode=service and planningMode=job
    const isJobDraggable = !isMobile && planningMode === 'job' && conversionMode === 'service';
    return (
    <div
      key={job.id}
      draggable={isJobDraggable}
      onDragStart={(e) => handleJobDragStart(e, job)}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => isMobile && onJobClick?.(job)}
      className={`dispatcher-job-item p-2 border rounded bg-card transition-all ${
        isMobile 
          ? 'mobile cursor-pointer hover:shadow-sm' 
          : isJobDraggable ? 'cursor-grab hover:shadow-md' : ''
      } hover:border-primary/50`}
    >
      <div className="flex items-start gap-1.5">
        {isJobDraggable && (
          <GripVertical 
            className="grip-icon h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0 opacity-60" 
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-medium text-xs leading-tight">
              {job.title}
            </h4>
            <Badge variant={getPriorityColor(job.priority)} className="text-[0.65rem] px-1.5 py-0 h-[18px] flex items-center gap-0.5">
              {job.priority === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
              {t(`dispatcher.priority_${job.priority}`)}
            </Badge>
          </div>
          
          {job.description && (
            <p className="text-muted-foreground mb-1 leading-tight text-[0.7rem]">
              {job.description}
            </p>
          )}
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[0.7rem]">
              <User className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{job.customerName}</span>
            </div>
            
            {planningMode === 'job' && conversionMode === 'service' && (job.installationName || job.installationId) && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-[0.7rem]">
                <Building2 className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="truncate">
                  {job.installationName || t('dispatcher.loading_installation')}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5 text-muted-foreground text-[0.7rem]">
              <Clock className="h-2.5 w-2.5 flex-shrink-0" />
              <span>
                {Math.floor(job.estimatedDuration / 60)}{t('dispatcher.hours_short')} {job.estimatedDuration % 60}{t('dispatcher.minutes_short')}
              </span>
            </div>
          </div>
          
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="mt-1">
              <div className="flex flex-wrap gap-0.5">
                {job.requiredSkills.slice(0, 2).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[0.65rem] px-1 py-0 h-[16px]">
                    {skill}
                  </Badge>
                ))}
                {job.requiredSkills.length > 2 && (
                  <Badge variant="outline" className="text-[0.65rem] px-1 py-0 h-[16px]">
                    +{job.requiredSkills.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  };


  return (
    <Card className="h-full rounded-none border-0">
      <CardHeader className="pb-3">
        <h3 className="text-sm font-semibold mb-2">{t('dispatcher.service_orders')}</h3>
        


        
        {/* Search Input */}
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('dispatcher.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4 pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : groupedData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-success" />
                </div>
                {searchTerm ? (
                  <p className="text-sm">{t('common.noResults', 'No results found')}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      {t('dispatcher.all_jobs_assigned', 'All jobs are assigned ✓')}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                      {t('dispatcher.empty_state_hint', 'Create a new service order to generate jobs for planning.')}
                    </p>
                  </>
                )}
              </div>
            ) : (
              groupedData.map((serviceOrderData) => (
                <div 
                  key={serviceOrderData.id} 
                  className={`border rounded-lg bg-card/50 overflow-hidden ${
                    planningMode === 'serviceOrder' && !isMobile ? 'cursor-grab hover:border-primary/50 hover:shadow-md transition-all' : ''
                  }`}
                  draggable={planningMode === 'serviceOrder' && !isMobile}
                  onDragStart={(e) => {
                    if (planningMode === 'serviceOrder') {
                      handleServiceOrderDragStart(e, serviceOrderData);
                    }
                  }}
                  onDragEnd={handleDragEnd}
                >
                  {/* Service Order Header */}
                  <div 
                    className="p-2.5 border-b bg-muted/30 transition-colors cursor-pointer hover:bg-muted/40"
                    onClick={() => toggleServiceOrder(serviceOrderData.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {planningMode === 'serviceOrder' && !isMobile && (
                          <GripVertical className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        )}
                        <Package className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate text-xs">
                              {serviceOrderData.title || `SO-${serviceOrderData.id}`}
                            </span>
                          </div>
                          <div className="text-muted-foreground text-[0.7rem]">
                            {serviceOrderData.customerName} • {serviceOrderData.unassignedJobs.length} {t('dispatcher.jobs')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={getPriorityColor(serviceOrderData.priority)} className="text-[0.65rem] px-1.5 py-0 h-[18px] flex items-center gap-0.5">
                          {serviceOrderData.priority === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                          {t(`dispatcher.priority_${serviceOrderData.priority}`)}
                        </Badge>
                        <ChevronDown 
                          className={`h-3 w-3 transition-transform text-muted-foreground ${
                            expandedServiceOrders.has(serviceOrderData.id) ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded content - grouped by installation or flat based on conversionMode */}
                  {expandedServiceOrders.has(serviceOrderData.id) && (
                    <div className="bg-background">
                      {conversionMode === 'installation' ? (
                        // INSTALLATION MODE: Group jobs by installation
                        <div className="space-y-1.5 p-2">
                          {(() => {
                            const { groups, ungrouped } = getInstallationGroups(serviceOrderData.unassignedJobs);
                            return (
                              <>
                                {groups.map(group => {
                                  const isOpen = expandedInstallations.has(group.installationId) || expandedInstallations.has('__all__');
                                  const totalDuration = group.jobs.reduce((sum, j) => sum + (j.estimatedDuration || 60), 0);
                                  const totalHours = Math.round(totalDuration / 60 * 10) / 10;
                                  return (
                                    <div 
                                      key={group.installationId} 
                                      className={cn(
                                        "border rounded bg-card/80 overflow-hidden",
                                        !isMobile && "cursor-grab hover:border-primary/50 hover:shadow-md transition-all"
                                      )}
                                      draggable={!isMobile}
                                      onDragStart={(e) => handleInstallationGroupDragStart(e, group, serviceOrderData)}
                                      onDragEnd={handleDragEnd}
                                    >
                                      <div
                                        onClick={(e) => { e.stopPropagation(); toggleInstallation(group.installationId); }}
                                        className="w-full flex flex-col gap-1 px-2.5 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-left cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2 w-full">
                                          {!isMobile && (
                                            <GripVertical className="h-3 w-3 text-primary flex-shrink-0 cursor-grab" />
                                          )}
                                          <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform flex-shrink-0", isOpen && "rotate-90")} />
                                          <Building2 className="h-3 w-3 text-primary flex-shrink-0" />
                                          <span className="font-medium flex-1 break-words leading-snug text-[0.75rem]">
                                            {group.name}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 pl-6">
                                          <span className="text-muted-foreground text-[0.65rem]">
                                            {group.jobs.length} {t('dispatcher.jobs')} • {totalHours}{t('dispatcher.hours_short')}
                                          </span>
                                        </div>
                                      </div>
                                      {isOpen && (
                                        <div className="space-y-1 p-1.5 bg-background/50">
                                          {group.jobs.map(job => renderJobRow(job))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                {ungrouped.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-muted-foreground px-2" style={{ fontSize: '0.6rem' }}>
                                      {t('dispatcher.no_installation_assigned', 'No installation assigned')}
                                    </p>
                                    {ungrouped.map(job => renderJobRow(job))}
                                  </div>
                                )}
                                {groups.length === 0 && ungrouped.length === 0 && (
                                  <p className="text-muted-foreground text-center py-2" style={{ fontSize: '0.65rem' }}>
                                    {t('dispatcher.no_jobs')}
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        // SERVICE MODE: Flat list of individual jobs
                        <div className="space-y-1.5 p-2">
                          {serviceOrderData.unassignedJobs.map((job) => renderJobRow(job))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
