import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
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
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

import type { Job, ServiceOrder, InstallationGroup } from "../types";
import { usePlanningDisplay } from "../context/PlanningDisplayContext";
import { useActivePlanningProfile } from "../hooks/usePlanningProfile";
import { formatCardLabel, getCardLabelLines, buildHoverRows } from "../utils/planningCardFields";
import { DispatcherService } from "../services/dispatcher.service";
import { JobMappingService } from "../services/job-mapping.service";
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
  const display = usePlanningDisplay();
  const { settings: profileSettings } = useActivePlanningProfile();
  const loadPlannedServiceOrders = profileSettings.loadPlannedServiceOrders ?? true;
  const loadClosedServiceOrders = profileSettings.loadClosedServiceOrders ?? false;
  // Expanding a SO card to its jobs is off by default; a profile can enable it.
  const expandServiceOrderJobs = profileSettings.expandServiceOrderJobs ?? false;
  const [expandedServiceOrders, setExpandedServiceOrders] = useState<Set<string>>(new Set());
  const [expandedInstallations, setExpandedInstallations] = useState<Set<string>>(new Set(['__all__']));
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<'so' | 'priority' | 'newest' | 'oldest' | 'customer' | 'duration'>("so");
  const [groupBy, setGroupBy] = useState<'none' | 'contact' | 'status' | 'priority' | 'created'>("none");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount =
    (priorityFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'so' ? 1 : 0) +
    (groupBy !== 'none' ? 1 : 0);
  const [_isDragging, setIsDragging] = useState(false);
  // Default the planned-orders section from the profile's "Load planned service orders" setting.
  const [showPlanned, setShowPlanned] = useState(loadPlannedServiceOrders);
  const [plannedOrders, setPlannedOrders] = useState<ServiceOrder[]>([]);
  const [isLoadingPlanned, setIsLoadingPlanned] = useState(false);
  const [plannedError, setPlannedError] = useState<string | null>(null);
  const [plannedRetryTick, setPlannedRetryTick] = useState(0);

  // Debounce searchTerm so typing doesn't re-run the (sort + group + filter)
  // memo on every keystroke against large unassigned lists.
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm), 200);
    return () => clearTimeout(id);
  }, [searchTerm]);




  
  // Group from the jobs prop itself: it is the source of truth used by Suggest/Auto-fill.
  // Service-order cache is only used for extra display metadata, so a stale/missing SO cache
  // can never hide real unassigned jobs from the sidebar.
  const groupedData = useMemo(() => {
    const serviceOrders = DispatcherService.getServiceOrders();
    const serviceOrdersById = new Map(serviceOrders.map(order => [String(order.id), order]));
    const searchLower = debouncedSearchTerm.trim().toLowerCase();

    const jobsByServiceOrder = jobs.reduce((groups, job) => {
      const serviceOrderId = String(job.serviceOrderId);
      const group = groups.get(serviceOrderId) || [];
      group.push(job);
      groups.set(serviceOrderId, group);
      return groups;
    }, new Map<string, Job[]>());

    return Array.from(jobsByServiceOrder.entries())
      .map(([serviceOrderId, unassignedJobs]) => {
        const cachedOrder = serviceOrdersById.get(serviceOrderId);
        const firstJob = unassignedJobs[0];

        return {
          id: serviceOrderId,
          title: cachedOrder?.title || firstJob?.serviceOrderTitle || firstJob?.serviceOrderNumber || `SO-${serviceOrderId}`,
          customerName: cachedOrder?.customerName || firstJob?.customerName || 'Unknown Customer',
          status: cachedOrder?.status || 'ready_for_planning',
          priority: cachedOrder?.priority || firstJob?.priority || 'medium',
          jobs: cachedOrder?.jobs || unassignedJobs,
          totalEstimatedDuration: cachedOrder?.totalEstimatedDuration ?? unassignedJobs.reduce((sum, job) => sum + (job.estimatedDuration || 0), 0),
          location: cachedOrder?.location || firstJob?.location || { address: 'No address specified' },
          createdAt: cachedOrder?.createdAt || firstJob?.createdAt || new Date(),
          unassignedJobs,
        };
      })
      .filter(order => {
        if (priorityFilter !== 'all' && (order.priority || 'medium') !== priorityFilter) return false;
        if (statusFilter !== 'all' && (order.status || '') !== statusFilter) return false;
        if (!searchLower) return true;
        // Search spans order id/title, customer name, and any job title — so "by contact"
        // works by typing the customer here.
        const matchesOrderId = order.id.toLowerCase().includes(searchLower);
        const matchesOrderTitle = order.title.toLowerCase().includes(searchLower);
        const matchesCustomer = (order.customerName || '').toLowerCase().includes(searchLower);
        const matchesJobTitle = order.unassignedJobs.some(job =>
          job.title.toLowerCase().includes(searchLower)
        );
        return matchesOrderId || matchesOrderTitle || matchesCustomer || matchesJobTitle;
      })
      .sort((a, b) => {
        const prioRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        const ms = (d: any) => { const t = new Date(d).getTime(); return isNaN(t) ? 0 : t; };
        switch (sortBy) {
          case 'priority': return (prioRank[a.priority] ?? 2) - (prioRank[b.priority] ?? 2);
          case 'newest':   return ms(b.createdAt) - ms(a.createdAt);
          case 'oldest':   return ms(a.createdAt) - ms(b.createdAt);
          case 'customer': return (a.customerName || '').localeCompare(b.customerName || '');
          case 'duration': return (b.totalEstimatedDuration || 0) - (a.totalEstimatedDuration || 0);
          default:         return (a.title || '').localeCompare(b.title || '');
        }
      });
    // jobs reference changes whenever the parent reloads unassigned jobs (= SO cache version).
  }, [jobs, debouncedSearchTerm, priorityFilter, statusFilter, sortBy]);

  // ── Section grouping (collapsible headers above the service-order cards) ──
  type SOGroup = (typeof groupedData)[number];
  const getSection = (so: SOGroup): { key: string; label: string } => {
    switch (groupBy) {
      case 'contact': {
        const c = so.customerName || t('dispatcher.unknown_customer', 'Unknown customer');
        return { key: `c:${c}`, label: c };
      }
      case 'status': {
        const s = so.status || 'ready_for_planning';
        return { key: `s:${s}`, label: t(`serviceOrders.status.${s}`, s.replace(/_/g, ' ')) };
      }
      case 'priority': {
        const p = so.priority || 'medium';
        return { key: `p:${p}`, label: t(`dispatcher.priority_${p}`, p) };
      }
      case 'created': {
        const d = new Date(so.createdAt);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const day = new Date(d); day.setHours(0, 0, 0, 0);
        const diff = Math.round((today.getTime() - day.getTime()) / 86400000);
        if (isNaN(diff)) return { key: 'd:unknown', label: t('dispatcher.group_no_date', 'No date') };
        if (diff <= 0) return { key: 'd:today', label: t('dispatcher.group_today', 'Today') };
        if (diff === 1) return { key: 'd:yesterday', label: t('dispatcher.group_yesterday', 'Yesterday') };
        if (diff <= 7) return { key: 'd:week', label: t('dispatcher.group_this_week', 'Earlier this week') };
        if (diff <= 30) return { key: 'd:month', label: t('dispatcher.group_this_month', 'Earlier this month') };
        return { key: 'd:older', label: t('dispatcher.group_older', 'Older') };
      }
      default:
        return { key: '__all__', label: '' };
    }
  };

  // When grouping is active, keep same-section cards contiguous (the existing
  // sort still orders cards within each section).
  const displayData = useMemo(() => {
    if (groupBy === 'none') return groupedData;
    return [...groupedData].sort((a, b) => getSection(a).label.localeCompare(getSection(b).label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedData, groupBy, t]);

  const sectionCounts = useMemo(() => {
    const m = new Map<string, number>();
    if (groupBy !== 'none') displayData.forEach(so => { const k = getSection(so).key; m.set(k, (m.get(k) || 0) + 1); });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayData, groupBy, t]);

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };


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

  // Service orders are COLLAPSED by default — the board shows the service order,
  // and its jobs appear on hover (tooltip) or when you expand the card. This keeps
  // the queue compact and lets you plan a whole order without wading through jobs.

  // Re-apply the profile default when the setting changes (e.g. switching profiles).
  // A manual toggle doesn't change the setting, so it's preserved until then.
  useEffect(() => {
    setShowPlanned(loadPlannedServiceOrders);
  }, [loadPlannedServiceOrders]);

  // Fetch planned orders when toggle is activated (or the user hits Retry).
  useEffect(() => {
    if (!showPlanned) {
      setPlannedOrders([]);
      setPlannedError(null);
      return;
    }
    setIsLoadingPlanned(true);
    setPlannedError(null);
    JobMappingService.fetchPlannedServiceOrders(loadClosedServiceOrders)
      .then(orders => { setPlannedOrders(orders); setPlannedError(null); })
      .catch((err: unknown) => {
        console.error('Failed to load planned orders', err);
        setPlannedOrders([]);
        setPlannedError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setIsLoadingPlanned(false));
  }, [showPlanned, loadClosedServiceOrders, plannedRetryTick]);


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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'text-blue-500 border-blue-300';
      case 'in_progress': return 'text-orange-500 border-orange-300';
      case 'planned': return 'text-purple-500 border-purple-300';
      case 'assigned': return 'text-teal-500 border-teal-300';
      case 'technically_completed': return 'text-green-600 border-green-400';
      default: return 'text-muted-foreground border-border';
    }
  };

  const renderPlannedOrder = (so: ServiceOrder) => {
    const key = `planned_${so.id}`;
    const isExpanded = expandedServiceOrders.has(key);
    const colorClass = getStatusColor(so.status);

    // Configurable card label + hover (driven by the active planning profile).
    const repJob = so.jobs[0];
    const soLabel = repJob
      ? formatCardLabel(repJob, display.cardPrimaryFields, display.cardSeparator, { jobCount: so.jobs.length })
      : (so.title || `SO-${so.id}`);
    const soLines = repJob
      ? getCardLabelLines(repJob, display.cardPrimaryFields, { jobCount: so.jobs.length })
      : [so.title || `SO-${so.id}`];
    const soHover = repJob
      ? [
          soLabel,
          ...buildHoverRows(repJob, display.hoverFields, { jobCount: so.jobs.length }).map(r => `${r.label}: ${r.value}`),
          ...(display.showJobsOnHover ? so.jobs.map(j => `• ${j.title}`) : []),
        ].filter(Boolean).join('\n')
      : soLabel;

    return (
      <div key={key} className="border rounded-lg bg-muted/10 overflow-hidden">
        <div
          className="p-2.5 border-b bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toggleServiceOrder(key)}
          title={soHover}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-0.5">
                {soLines.map((line, i) => (
                  <p key={i} className={`truncate text-xs ${i === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
            <ChevronDown
              className={`h-3 w-3 transition-transform text-muted-foreground flex-shrink-0 mt-0.5 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-1 pl-5">
            <Badge variant="outline" className={`text-rem-65 px-1.5 py-0 h-[18px] ${colorClass}`}>
              {t(`serviceOrders.status.${so.status}`, (so.status || '').replace(/_/g, ' '))}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-rem-65 text-muted-foreground mt-1 pl-5">
            <User className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">{so.customerName}</span>
            <span className="ml-auto flex-shrink-0">{so.jobs.length} {t('dispatcher.jobs', 'jobs')}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="bg-background/30 space-y-1 p-2">
            {so.jobs.length === 0 ? (
              <p className="text-rem-65 text-muted-foreground text-center py-1">
                {t('dispatcher.no_jobs', 'No jobs')}
              </p>
            ) : (
              so.jobs.map(job => (
                <div
                  key={job.id}
                  className="p-2 border rounded bg-muted/10 flex items-center gap-1.5"
                >
                  <Wrench className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">{job.title}</span>
                  <Badge variant="outline" className={`text-rem-60 px-1 py-0 h-[15px] flex-shrink-0 ${getStatusColor(job.status)}`}>
                    {job.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // Render a single job row (compact) with hover popup showing full details
  const renderJobRow = (job: Job) => {
    // Individual job dragging only when conversionMode=service and planningMode=job
    const isJobDraggable = !isMobile && planningMode === 'job' && conversionMode === 'service';
    const hours = Math.floor(job.estimatedDuration / 60);
    const mins = job.estimatedDuration % 60;

    const row = (
      <div
        key={job.id}
        draggable={isJobDraggable}
        onDragStart={(e) => handleJobDragStart(e, job)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => isMobile && onJobClick?.(job)}
        className={`dispatcher-job-item p-1.5 border rounded bg-card transition-all ${
          isMobile
            ? 'mobile cursor-pointer hover:shadow-sm'
            : isJobDraggable ? 'cursor-grab hover:shadow-md' : ''
        } hover:border-primary/50`}
      >
        <div className="flex items-center gap-1.5">
          {isJobDraggable && (
            <GripVertical
              className="grip-icon h-3 w-3 text-muted-foreground flex-shrink-0 opacity-60"
            />
          )}
          <h4 className="font-medium text-xs leading-tight flex-1 min-w-0 truncate">
            {job.title}
          </h4>
          {/* Priority dot — saves space in narrow sidebar; full label is in the HoverCard */}
          <span
            title={t(`dispatcher.priority_${job.priority}`)}
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              job.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
              job.priority === 'high'   ? 'bg-orange-400' :
              job.priority === 'medium' ? 'bg-blue-400' :
              'bg-gray-300'
            }`}
          />
        </div>
      </div>
    );

    if (isMobile) return row;

    return (
      <HoverCard key={job.id} openDelay={250} closeDelay={80}>
        <HoverCardTrigger asChild>{row}</HoverCardTrigger>
        <HoverCardContent side="right" align="start" className="w-72 p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm leading-tight">{job.title}</h4>
              <Badge variant={getPriorityColor(job.priority)} className="text-rem-65 px-1.5 py-0 h-[18px] flex-shrink-0">
                {t(`dispatcher.priority_${job.priority}`)}
              </Badge>
            </div>

            {job.description && (
              <p className="text-xs text-muted-foreground leading-snug">{job.description}</p>
            )}

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{job.customerName}</span>
              </div>

              {(job.installationName || job.installationId) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {job.installationName || t('dispatcher.loading_installation')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>
                  {hours}{t('dispatcher.hours_short')} {mins}{t('dispatcher.minutes_short')}
                </span>
              </div>

              {job.location?.address && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{job.location.address}</span>
                </div>
              )}
            </div>

            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="pt-1 border-t border-border/60">
                <p className="text-rem-65 uppercase tracking-wide text-muted-foreground mb-1">
                  {t('dispatcher.required_skills', 'Required skills')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {job.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-rem-65 px-1 py-0 h-[16px]">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };




  return (
    <Card className="flex h-full min-h-0 flex-col rounded-none border-0">
      <CardHeader className="shrink-0 p-3 pb-2">
        <h3 className="text-sm font-semibold mb-1.5">{t('dispatcher.service_orders')}</h3>
        


        
        {/* Search + a single Filters button (opens the filter/sort/group panel) */}
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('dispatcher.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Button
              variant={showFilters || activeFilterCount > 0 ? 'default' : 'outline'}
              size="sm"
              className="h-8 px-2 gap-1 shrink-0"
              onClick={() => setShowFilters(s => !s)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-rem-60">{activeFilterCount}</Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-col gap-1.5 rounded-md border bg-muted/20 p-1.5">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 w-full bg-background text-xs"><SelectValue placeholder={t('dispatcher.by_priority', 'Priority')} /></SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('dispatcher.by_priority', 'Priority')}</SelectItem>
                  <SelectItem value="urgent">{t('dispatcher.priority_urgent', 'Urgent')}</SelectItem>
                  <SelectItem value="high">{t('dispatcher.priority_high', 'High')}</SelectItem>
                  <SelectItem value="medium">{t('dispatcher.priority_medium', 'Medium')}</SelectItem>
                  <SelectItem value="low">{t('dispatcher.priority_low', 'Low')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-full bg-background text-xs"><SelectValue placeholder={t('dispatcher.by_status', 'Status')} /></SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('dispatcher.by_status', 'Status')}</SelectItem>
                  <SelectItem value="ready_for_planning">{t('serviceOrders.status.ready_for_planning', 'Ready for planning')}</SelectItem>
                  <SelectItem value="planned">{t('serviceOrders.status.planned', 'Planned')}</SelectItem>
                  <SelectItem value="scheduled">{t('serviceOrders.status.scheduled', 'Scheduled')}</SelectItem>
                  <SelectItem value="in_progress">{t('serviceOrders.status.in_progress', 'In progress')}</SelectItem>
                  <SelectItem value="pending">{t('serviceOrders.status.pending', 'Pending')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="h-8 w-full bg-background text-xs"><SelectValue placeholder={t('dispatcher.sort_by', 'Sort by')} /></SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="so">{t('dispatcher.sort_service_order', 'Service order')}</SelectItem>
                  <SelectItem value="priority">{t('dispatcher.sort_priority', 'Urgency')}</SelectItem>
                  <SelectItem value="newest">{t('dispatcher.sort_newest', 'Newest first')}</SelectItem>
                  <SelectItem value="oldest">{t('dispatcher.sort_oldest', 'Oldest first')}</SelectItem>
                  <SelectItem value="customer">{t('dispatcher.sort_customer', 'Customer')}</SelectItem>
                  <SelectItem value="duration">{t('dispatcher.sort_duration', 'Duration')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                <SelectTrigger className="h-8 w-full bg-background text-xs"><SelectValue placeholder={t('dispatcher.group_by', 'Group by')} /></SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="none">{t('dispatcher.group_none', 'No grouping')}</SelectItem>
                  <SelectItem value="contact">{t('dispatcher.group_contact', 'Contact')}</SelectItem>
                  <SelectItem value="status">{t('dispatcher.group_status', 'Status')}</SelectItem>
                  <SelectItem value="priority">{t('dispatcher.group_priority', 'Urgency')}</SelectItem>
                  <SelectItem value="created">{t('dispatcher.group_created', 'Date created')}</SelectItem>
                </SelectContent>
              </Select>
              {activeFilterCount > 0 && (
                <button
                  className="text-rem-70 text-muted-foreground hover:text-foreground underline self-end"
                  onClick={() => { setPriorityFilter('all'); setStatusFilter('all'); setSortBy('so'); setGroupBy('none'); }}
                >
                  {t('dispatcher.clear_filters', 'Clear all')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Show Planned Toggle */}
        <Button
          variant={showPlanned ? "default" : "outline"}
          size="sm"
          onClick={() => setShowPlanned(prev => !prev)}
          className="mt-1.5 h-7 w-full text-rem-70 gap-1"
          disabled={isLoadingPlanned}
        >
          {showPlanned ? <EyeOff className="h-3 w-3 shrink-0" /> : <Eye className="h-3 w-3 shrink-0" />}
          {isLoadingPlanned
            ? t('common.loading', 'Loading…')
            : showPlanned
              ? t('dispatcher.hide_planned', 'Hide Planned')
              : t('dispatcher.show_planned', 'Show Planned')}
        </Button>

      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full [&_[data-orientation=vertical]]:w-1.5 [&_[data-orientation=vertical]>div]:bg-primary/70">
          <div className="space-y-1.5 p-2 pt-0">
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
              displayData.map((serviceOrderData, idx) => {
                const sec = getSection(serviceOrderData);
                const prevSec = idx > 0 ? getSection(displayData[idx - 1]) : null;
                const showHeader = groupBy !== 'none' && sec.key !== prevSec?.key;
                const sectionCollapsed = groupBy !== 'none' && collapsedSections.has(sec.key);
                return (
                <Fragment key={serviceOrderData.id}>
                {showHeader && (
                  <div
                    className="flex items-center gap-1.5 px-1.5 py-1 mt-1 first:mt-0 cursor-pointer select-none"
                    onClick={() => toggleSection(sec.key)}
                  >
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${sectionCollapsed ? '-rotate-90' : ''}`} />
                    <span className="text-rem-70 font-semibold uppercase tracking-wide text-muted-foreground truncate">{sec.label}</span>
                    <Badge variant="secondary" className="h-4 px-1.5 text-rem-60">{sectionCounts.get(sec.key)}</Badge>
                    <div className="h-px flex-1 bg-border ml-1" />
                  </div>
                )}
                {!sectionCollapsed && (
                <div
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
                  {/* Service Order Header (compact) — hover for full details */}
                  <HoverCard openDelay={250} closeDelay={80}>
                    <HoverCardTrigger asChild>
                      <div
                        className={`p-2 border-b bg-muted/30 transition-colors hover:bg-muted/40 ${expandServiceOrderJobs ? 'cursor-pointer' : ''}`}
                        onClick={expandServiceOrderJobs ? () => toggleServiceOrder(serviceOrderData.id) : undefined}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-start gap-1.5 flex-1 min-w-0">
                            {planningMode === 'serviceOrder' && !isMobile && (
                              <GripVertical className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                            )}
                            <Package className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0 space-y-0.5">
                              {/* Each configured field on its own line to save horizontal space. */}
                              {(serviceOrderData.unassignedJobs[0]
                                ? getCardLabelLines(serviceOrderData.unassignedJobs[0], display.cardPrimaryFields, { jobCount: serviceOrderData.unassignedJobs.length })
                                : [serviceOrderData.title || `SO-${serviceOrderData.id}`]
                              ).map((line, i) => (
                                <p key={i} className={`text-xs break-words leading-snug ${i === 0 ? 'font-medium' : 'text-muted-foreground'}`}>
                                  {line}
                                </p>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                            {/* Priority shown as a coloured dot to save space in narrow sidebar.
                                Full label is in the HoverCard. */}
                            <span
                              title={t(`dispatcher.priority_${serviceOrderData.priority}`)}
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                serviceOrderData.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
                                serviceOrderData.priority === 'high'   ? 'bg-orange-400' :
                                serviceOrderData.priority === 'medium' ? 'bg-blue-400' :
                                'bg-gray-300'
                              }`}
                            />
                            {expandServiceOrderJobs && (
                              <ChevronDown
                                className={`h-3 w-3 transition-transform text-muted-foreground ${
                                  expandedServiceOrders.has(serviceOrderData.id) ? 'rotate-180' : ''
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </HoverCardTrigger>
                    {!isMobile && (
                      <HoverCardContent side="right" align="start" className="w-80 p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm leading-tight">
                                {serviceOrderData.title || `SO-${serviceOrderData.id}`}
                              </h4>
                              <p className="text-rem-70 text-muted-foreground mt-0.5">
                                {t(`serviceOrders.status.${serviceOrderData.status}`, serviceOrderData.status)}
                              </p>
                            </div>
                            <Badge variant={getPriorityColor(serviceOrderData.priority)} className="text-rem-65 px-1.5 py-0 h-[18px] flex-shrink-0">
                              {t(`dispatcher.priority_${serviceOrderData.priority}`)}
                            </Badge>
                          </div>

                          <div className="space-y-1 pt-1">
                            {(() => {
                              // Honour the profile's "Hover shows" fields. Each detail on
                              // its own line, labelled, de-duplicated and wrapping.
                              const repJob = serviceOrderData.unassignedJobs[0];
                              const rows = repJob
                                ? buildHoverRows(repJob, display.hoverFields, { jobCount: serviceOrderData.unassignedJobs.length })
                                : [];
                              if (rows.length) {
                                return rows.map(r => (
                                  <div key={r.label} className="flex items-start gap-2 text-xs">
                                    <span className="text-muted-foreground flex-shrink-0 min-w-[88px]">{r.label}</span>
                                    <span className="font-medium break-words leading-snug min-w-0">{r.value}</span>
                                  </div>
                                ));
                              }
                              // No hover fields configured — fall back to the default detail set.
                              return (
                                <>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <User className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{serviceOrderData.customerName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Package className="h-3 w-3 flex-shrink-0" />
                                    <span>
                                      {serviceOrderData.unassignedJobs.length} {t('dispatcher.jobs')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span>
                                      {Math.floor((serviceOrderData.totalEstimatedDuration || 0) / 60)}
                                      {t('dispatcher.hours_short')}{' '}
                                      {(serviceOrderData.totalEstimatedDuration || 0) % 60}
                                      {t('dispatcher.minutes_short')}
                                    </span>
                                  </div>
                                  {serviceOrderData.location?.address && (
                                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                      <span className="leading-snug">{serviceOrderData.location.address}</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          {/* Optionally list the service order's jobs on hover. */}
                          {display.showJobsOnHover && serviceOrderData.unassignedJobs.length > 0 && (
                            <div className="space-y-0.5 pt-1.5 mt-1.5 border-t">
                              <p className="text-rem-65 font-medium uppercase tracking-wide text-muted-foreground">
                                {serviceOrderData.unassignedJobs.length} {t('dispatcher.jobs')}
                              </p>
                              {serviceOrderData.unassignedJobs.slice(0, 8).map(j => (
                                <div key={j.id} className="flex items-start gap-1.5 text-xs">
                                  <span className="text-muted-foreground flex-shrink-0">•</span>
                                  <span className="break-words leading-snug min-w-0">{j.title}</span>
                                </div>
                              ))}
                              {serviceOrderData.unassignedJobs.length > 8 && (
                                <p className="text-rem-70 text-muted-foreground pl-3">
                                  +{serviceOrderData.unassignedJobs.length - 8}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    )}
                  </HoverCard>


                  {/* Expanded content - grouped by installation or flat based on conversionMode */}
                  {expandServiceOrderJobs && expandedServiceOrders.has(serviceOrderData.id) && (
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
                                        className="w-full flex flex-col gap-0.5 px-2 py-1.5 bg-muted/20 hover:bg-muted/40 transition-colors text-left cursor-pointer"
                                      >
                                        <div className="flex items-center gap-1.5 w-full">
                                          {!isMobile && (
                                            <GripVertical className="h-3 w-3 text-primary flex-shrink-0 cursor-grab" />
                                          )}
                                          <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform flex-shrink-0", isOpen && "rotate-90")} />
                                          <Building2 className="h-3 w-3 text-primary flex-shrink-0" />
                                          <span className="font-medium flex-1 break-words leading-snug text-rem-75">
                                            {group.name}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 pl-6">
                                          <span className="text-muted-foreground text-rem-65">
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
                )}
                </Fragment>
                );
              })
            )}
            {/* Planned Orders Section */}
            {showPlanned && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-rem-60 uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle2 className="h-2.5 w-2.5 text-success" />
                    {t('dispatcher.planned_orders', 'Planned Orders')}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {isLoadingPlanned ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-lg p-3 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    ))}
                  </div>
                ) : plannedError ? (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs text-destructive">
                      {t('dispatcher.planned_orders_error', 'Could not load planned orders.')}
                    </p>
                    <p className="text-[11px] text-muted-foreground break-words">{plannedError}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPlannedRetryTick(n => n + 1)}
                    >
                      {t('common.retry', 'Retry')}
                    </Button>
                  </div>
                ) : plannedOrders.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    {t('dispatcher.no_planned_orders', 'No planned orders found')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {plannedOrders.map(so => renderPlannedOrder(so))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
