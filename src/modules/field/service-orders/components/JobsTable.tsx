import { useState, useMemo, useEffect, useRef } from "react";
import { getStatusColorClass } from "@/config/entity-statuses";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Plus, Eye, MoreVertical, Clock, 
  Wrench, AlertTriangle, CheckCircle, Calendar,
  User, Filter, ChevronDown, Building2, X, ChevronRight, Users
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Job } from "../entities/jobs/types";
import { ScheduleJobModal } from "./ScheduleJobModal";
import { cn } from "@/lib/utils";

interface JobsTableProps {
  jobs: Job[];
  onJobUpdate?: () => void;
  viewMode?: 'installation' | 'service'; // conversion mode
}

export function JobsTable({ jobs, onJobUpdate, viewMode = 'service' }: JobsTableProps) {
  const { t } = useTranslation("service_orders");
  const { t: tCommon } = useTranslation("common");
  const navigate = useNavigate();
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterWorkType, setFilterWorkType] = useState('all');

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedJobForSchedule, setSelectedJobForSchedule] = useState<Job | null>(null);

  // Collapsible state for installation groups
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['__all__']));

  // Filter the jobs based on current filters and search term
  const filteredJobs = jobs.filter(job => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (job.title || '').toLowerCase().includes(searchLower) ||
        (job.jobNumber || '').toLowerCase().includes(searchLower) ||
        (job.workType || '').toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    if (filterStatus !== 'all' && job.status !== filterStatus) return false;
    if (filterPriority !== 'all' && job.priority !== filterPriority) return false;
    if (filterWorkType !== 'all' && job.workType !== filterWorkType) return false;
    return true;
  });

  // Group jobs by installation for installation-based view
  const groupedJobs = useMemo(() => {
    if (viewMode !== 'installation') return null;
    
    const groups = new Map<string, { name: string; installationId: string; jobs: Job[] }>();
    const ungrouped: Job[] = [];
    
    filteredJobs.forEach(job => {
      const instId = job.installationId;
      const instName = job.installationName || job.installation?.name;
      
      if (instId && instName) {
        if (!groups.has(instId)) {
          groups.set(instId, { name: instName, installationId: instId, jobs: [] });
        }
        groups.get(instId)!.jobs.push(job);
      } else {
        ungrouped.push(job);
      }
    });
    
    return { groups: Array.from(groups.values()), ungrouped };
  }, [filteredJobs, viewMode]);

  // Initialize all groups as open on first render
  const initializedRef = useRef(false);
  useEffect(() => {
    if (groupedJobs && !initializedRef.current) {
      initializedRef.current = true;
      const allKeys = new Set(groupedJobs.groups.map(g => g.installationId));
      if (groupedJobs.ungrouped.length > 0) allKeys.add('__ungrouped__');
      setOpenGroups(allKeys);
    }
  }, [groupedJobs]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.delete('__all__');
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeFiltersCount = [
    filterStatus !== 'all' ? 1 : 0,
    filterPriority !== 'all' ? 1 : 0,
    filterWorkType !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const getStatusColor = (status: string) => {
    return getStatusColorClass('job', status || 'unscheduled');
  };

  const getStatusLabel = (status: string) => {
    const s = status || 'unscheduled';
    const key = `jobs_table.status_${s}`;
    const translated = t(key);
    // If translation key not found, fallback to capitalized status
    return translated !== key ? translated : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
  };

  const getPriorityColor = (priority: Job['priority']) => {
    switch (priority) {
      case 'urgent':
        return "bg-destructive/10 text-destructive border-destructive/20 transition-colors";
      case 'high':
        return "bg-warning/10 text-warning border-warning/20 transition-colors";
      case 'medium':
        return "bg-primary/10 text-primary border-primary/20 transition-colors";
      case 'low':
        return "bg-success/10 text-success border-success/20 transition-colors";
      default:
        return "bg-muted/50 text-muted-foreground border-muted transition-colors";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'dispatched':
        return <CheckCircle className="h-3 w-3" />;
      case 'ready':
        return <Clock className="h-3 w-3" />;
      case 'cancelled':
        return <AlertTriangle className="h-3 w-3" />;
      case 'unscheduled':
      default:
        return <Wrench className="h-3 w-3" />;
    }
  };

  const getGroupStatusSummary = (groupJobs: Job[]) => {
    const total = groupJobs.length;
    const dispatched = groupJobs.filter(j => j.status === 'dispatched').length;
    const ready = groupJobs.filter(j => j.status === 'ready').length;
    const unscheduled = groupJobs.filter(j => j.status === 'unscheduled' || !j.status).length;
    
    if (dispatched === total) return { label: t('jobs_table.status_dispatched'), color: 'secondary' as const };
    if (ready + dispatched === total) return { label: t('jobs_table.status_ready'), color: 'info' as const };
    return { label: `${unscheduled} ${t('jobs_table.status_unscheduled').toLowerCase()}`, color: 'default' as const };
  };

  const handleScheduleJob = (job: Job) => {
    setSelectedJobForSchedule(job);
    setScheduleModalOpen(true);
  };

  const renderJobRow = (job: Job, compact = false) => (
    <tr key={job.id} className="border-b hover:bg-muted/50 transition-colors">
      <td className={cn("px-4 py-3", compact && "pl-10")}>
        <div className="space-y-1">
          <div className="font-medium text-sm">{job.title}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{job.jobNumber}</span>
            {job.assignedTechnicians && job.assignedTechnicians.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-primary/80">
                  <Users className="h-3 w-3" />
                  {job.assignedTechnicians.map(t => t.name || t.Name).join(', ')}
                </span>
              </>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge 
          variant="outline" 
          className={cn("border", getStatusColor(job.status))}
        >
          <div className="flex items-center gap-1.5">
            {getStatusIcon(job.status)}
            <span className="font-medium">{getStatusLabel(job.status)}</span>
          </div>
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="capitalize text-sm">{(job.workType || 'maintenance').replace('_', ' ')}</span>
      </td>
      {viewMode !== 'installation' && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {job.installation ? (
              <>
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div 
                  className="text-sm cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/dashboard/installations/${job.installation?.id || job.installationId}`)}
                >
                  <div className="font-medium hover:underline">{job.installation.name}</div>
                  {job.installation.location && (
                    <div className="text-xs text-muted-foreground">{job.installation.location}</div>
                  )}
                </div>
              </>
            ) : job.installationName ? (
              <>
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span 
                  className="text-sm cursor-pointer hover:text-primary hover:underline transition-colors"
                  onClick={() => navigate(`/dashboard/installations/${job.installationId}`)}
                >
                  {job.installationName}
                </span>
              </>
            ) : job.installationId ? (
              <>
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span 
                  className="text-sm text-muted-foreground cursor-pointer hover:text-primary hover:underline transition-colors"
                  onClick={() => navigate(`/dashboard/installations/${job.installationId}`)}
                >
                  Installation #{job.installationId}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{t("jobs_table.no_installation")}</span>
            )}
          </div>
        </td>
      )}
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border border-border">
            <DropdownMenuItem className="gap-2">
              <Eye className="h-4 w-4" />
              {t("jobs_table.view_details")}
            </DropdownMenuItem>
            {job.status !== 'dispatched' && (
              <>
                <DropdownMenuItem className="gap-2">
                  <User className="h-4 w-4" />
                  {t("jobs_table.assign_technicians")}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => handleScheduleJob(job)}>
                  <Calendar className="h-4 w-4" />
                  {t("jobs_table.schedule_job")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );

  const renderInstallationGroup = (group: { name: string; installationId: string; jobs: Job[] }) => {
    const isOpen = openGroups.has(group.installationId);
    const statusSummary = getGroupStatusSummary(group.jobs);
    
    return (
      <div key={group.installationId} className="border border-border rounded-lg overflow-hidden mb-3">
        <button
          onClick={() => toggleGroup(group.installationId)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        >
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
          <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
          <span 
            className="font-medium text-sm flex-1 hover:text-primary cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/installations/${group.installationId}`);
            }}
          >
            {group.name}
          </span>
          <Badge variant={statusSummary.color} className="text-[10px]">
            {statusSummary.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {group.jobs.length} {group.jobs.length === 1 ? t('jobs_table.job_singular', 'job') : t('jobs_table.job_plural', 'jobs')}
          </span>
        </button>
        {isOpen && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 pl-10 text-xs font-medium text-muted-foreground">{t("jobs_table.col_job")}</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("jobs_table.col_status")}</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("jobs_table.col_work_type")}</th>
                  <th className="w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {group.jobs.map(job => renderJobRow(job, true))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between mb-4 mt-6">
        <div className="flex-1">
          <CollapsibleSearch 
            placeholder={t("jobs_table.search_placeholder")}
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 px-3 z-20" 
            onClick={() => setShowFilterBar(s => !s)}
          >
            <Filter className="h-4 w-4" />
            {t("jobs_table.filters")}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilterBar && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t("jobs_table.all_statuses")}</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t("jobs_table.all_statuses")} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t("jobs_table.all_statuses")}</SelectItem>
                  <SelectItem value="unscheduled">{t("jobs_table.status_unscheduled")}</SelectItem>
                  <SelectItem value="ready">{t("jobs_table.status_ready")}</SelectItem>
                  <SelectItem value="dispatched">{t("jobs_table.status_dispatched")}</SelectItem>
                  <SelectItem value="cancelled">{t("jobs_table.status_cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t("jobs_table.all_priorities")}</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t("jobs_table.all_priorities")} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t("jobs_table.all_priorities")}</SelectItem>
                  <SelectItem value="low">{t("priorities.low")}</SelectItem>
                  <SelectItem value="medium">{t("priorities.medium")}</SelectItem>
                  <SelectItem value="high">{t("priorities.high")}</SelectItem>
                  <SelectItem value="urgent">{t("priorities.urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t("jobs_table.all_work_types")}</label>
              <Select value={filterWorkType} onValueChange={setFilterWorkType}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t("jobs_table.all_work_types")} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t("jobs_table.all_work_types")}</SelectItem>
                  <SelectItem value="installation">{t("jobs_table.work_type_installation")}</SelectItem>
                  <SelectItem value="repair">{t("jobs_table.work_type_repair")}</SelectItem>
                  <SelectItem value="maintenance">{t("jobs_table.work_type_maintenance")}</SelectItem>
                  <SelectItem value="inspection">{t("jobs_table.work_type_inspection")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterStatus !== 'all' || filterPriority !== 'all' || filterWorkType !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { 
                  setSearchTerm('');
                  setFilterStatus('all'); 
                  setFilterPriority('all'); 
                  setFilterWorkType('all'); 
                  setShowFilterBar(false); 
                }}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t("jobs_table.clear_filters")}
              </Button>
            )}
          </div>
        </div>
      )}
      
      {filteredJobs.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {jobs.length === 0 ? t("jobs_table.no_jobs") : t("jobs_table.no_matching_jobs")}
        </p>
      ) : viewMode === 'installation' && groupedJobs ? (
        // Installation-grouped view
        <div className="mt-4 space-y-1">
          {groupedJobs.groups.map(group => renderInstallationGroup(group))}
          
          {groupedJobs.ungrouped.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden mb-3">
              <button
                onClick={() => toggleGroup('__ungrouped__')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", openGroups.has('__ungrouped__') && "rotate-90")} />
                <Wrench className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm flex-1 text-muted-foreground">
                  {t('jobs_table.no_installation', 'No Installation')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {groupedJobs.ungrouped.length} {groupedJobs.ungrouped.length === 1 ? t('jobs_table.job_singular', 'job') : t('jobs_table.job_plural', 'jobs')}
                </span>
              </button>
              {openGroups.has('__ungrouped__') && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-3 pl-10 text-xs font-medium text-muted-foreground">{t("jobs_table.col_job")}</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("jobs_table.col_status")}</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("jobs_table.col_work_type")}</th>
                        <th className="w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedJobs.ungrouped.map(job => renderJobRow(job, true))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Flat service-based view
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("jobs_table.col_job")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("jobs_table.col_status")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("jobs_table.col_work_type")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("jobs_table.col_installation")}</th>
                <th className="w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => renderJobRow(job))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Job Modal */}
      {selectedJobForSchedule && (
        <ScheduleJobModal
          open={scheduleModalOpen}
          onOpenChange={(open) => {
            setScheduleModalOpen(open);
            if (!open) setSelectedJobForSchedule(null);
          }}
          job={{
            id: selectedJobForSchedule.id,
            title: selectedJobForSchedule.title,
            priority: selectedJobForSchedule.priority,
            serviceOrderId: selectedJobForSchedule.serviceOrderId,
          }}
          onScheduled={onJobUpdate}
        />
      )}
    </>
  );
}
