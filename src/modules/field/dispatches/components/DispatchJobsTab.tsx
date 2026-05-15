import { useState, useEffect } from "react";
import { ContentSkeleton } from "@/components/ui/page-skeleton";
import { useNavigate } from "react-router-dom";
import { getStatusColorClass } from "@/config/entity-statuses";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { 
  Wrench, Clock, AlertTriangle, CheckCircle, 
  Building2, Loader2, MoreVertical, Eye, Edit, 
  User, Calendar, Trash2, Filter, ChevronDown, X, List
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { serviceOrdersApi, type ServiceOrderJob } from "@/services/api/serviceOrdersApi";
import { installationsApi } from "@/services/api/installationsApi";
import { appSettingsApi } from "@/services/api/appSettingsApi";

interface DispatchJobsTabProps {
  dispatchId: string;
  jobId: string;
  jobIds?: number[];
  installationId?: number;
  installationName?: string;
  serviceOrderId: string;
  dispatchStatus?: string;
  dispatchPriority?: string;
  dispatchEstimatedDuration?: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
}

export function DispatchJobsTab({ 
  dispatchId, 
  jobId,
  jobIds,
  installationId,
  installationName: propInstallationName,
  serviceOrderId,
  dispatchStatus,
  dispatchPriority,
  dispatchEstimatedDuration,
  scheduledStartTime,
  scheduledEndTime
}: DispatchJobsTabProps) {
  const { t } = useTranslation('job-detail');
  const navigate = useNavigate();
  const [job, setJob] = useState<ServiceOrderJob | null>(null);
  const [multiJobs, setMultiJobs] = useState<ServiceOrderJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWorkType, setFilterWorkType] = useState('all');
  const [resolvedInstallationName, setResolvedInstallationName] = useState<string | null>(null);
  const [conversionMode, setConversionMode] = useState<'installation' | 'service'>('installation');

  const isMultiJob = jobIds && jobIds.length > 1;
  const displayInstallationName = propInstallationName || resolvedInstallationName;

  // Fetch job conversion mode from settings
  useEffect(() => {
    appSettingsApi.getSetting('JobConversionMode').then(mode => {
      if (mode === 'service' || mode === 'installation') {
        setConversionMode(mode);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!serviceOrderId) {
        setLoading(false);
        setError("Missing service order reference");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const serviceOrderIdNum = parseInt(serviceOrderId);
        if (isNaN(serviceOrderIdNum)) {
          setError("Invalid service order ID");
          setLoading(false);
          return;
        }

        if (isMultiJob) {
          // Multi-job mode: fetch service order with all jobs, filter to jobIds
          const soData: any = await serviceOrdersApi.getById(serviceOrderIdNum, true);
          if (soData?.jobs && Array.isArray(soData.jobs)) {
            const jobIdSet = new Set(jobIds.map(String));
            const matchedJobs = soData.jobs.filter((j: any) => jobIdSet.has(String(j.id)));
            setMultiJobs(matchedJobs);
          }
        } else if (jobId) {
          // Single-job mode (existing behavior)
          const jobIdNum = parseInt(jobId);
          if (isNaN(jobIdNum)) {
            setError("Invalid job ID");
            setLoading(false);
            return;
          }

          const fetchedJob = await serviceOrdersApi.getJobById(serviceOrderIdNum, jobIdNum);
          setJob(fetchedJob);

          // Fetch installation name if needed
          if (fetchedJob?.installationId && !fetchedJob?.installationName) {
            try {
              const installation = await installationsApi.getById(String(fetchedJob.installationId));
              if (installation?.name) {
                setResolvedInstallationName(installation.name);
              }
            } catch (err) {
              console.warn('Failed to fetch installation name:', err);
            }
          } else if (fetchedJob?.installationName) {
            setResolvedInstallationName(fetchedJob.installationName);
          }
        }
      } catch (err) {
        console.error('Failed to fetch job(s):', err);
        setError("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [serviceOrderId, jobId, isMultiJob, jobIds]);

  const getStatusColor = (status: string) => {
    return getStatusColorClass('job', status) + " hover:opacity-80 transition-colors";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'dispatched': return <CheckCircle className="h-3 w-3" />;
      case 'ready': return <Clock className="h-3 w-3" />;
      case 'cancelled': return <AlertTriangle className="h-3 w-3" />;
      case 'unscheduled': return <Wrench className="h-3 w-3" />;
      default: return <Wrench className="h-3 w-3" />;
    }
  };

  const activeFiltersCount = [
    filterStatus !== 'all' ? 1 : 0,
    filterWorkType !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <Card className="bg-background border">
        <CardContent className="py-4">
          <ContentSkeleton rows={4} />
        </CardContent>
      </Card>
    );
  }

  // Build jobs array for rendering
  const jobsToRender: Array<{
    id: number;
    title: string;
    jobNumber: string;
    status: string;
    workType: string;
    installationName?: string;
    installationId?: number;
    estimatedDuration?: number;
  }> = [];

  if (isMultiJob) {
    for (const mj of multiJobs) {
      jobsToRender.push({
        id: mj.id,
        title: mj.title || `Job #${mj.id}`,
        jobNumber: `JOB-${mj.id}`,
        status: mj.status || 'unscheduled',
        workType: mj.workType || 'service',
        installationName: mj.installationName || displayInstallationName || undefined,
        installationId: mj.installationId,
        estimatedDuration: mj.estimatedDuration,
      });
    }
  } else {
    const jobData = job || (jobId ? {
      id: parseInt(jobId),
      title: `Job #${jobId}`,
      jobNumber: `JOB-${jobId}`,
      status: (dispatchStatus === 'completed' ? 'dispatched' : 
               dispatchStatus === 'in_progress' ? 'ready' : 'unscheduled'),
      workType: 'service',
    } : null);

    if (jobData) {
      jobsToRender.push({
        id: jobData.id,
        title: job?.title || jobData.title,
        jobNumber: `JOB-${jobData.id}`,
        status: job?.status || jobData.status,
        workType: (job as any)?.workType || jobData.workType,
        installationName: resolvedInstallationName || job?.installationName || undefined,
        installationId: job?.installationId,
        estimatedDuration: (job as any)?.estimatedDuration,
      });
    }
  }

  if (jobsToRender.length === 0) {
    return (
      <Card className="bg-background border">
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t('jobs_tab.no_jobs')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter logic
  const filteredJobs = jobsToRender.filter(j => {
    const matchesSearch = !searchTerm || 
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.workType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || j.status === filterStatus;
    const matchesWorkType = filterWorkType === 'all' || j.workType === filterWorkType;
    return matchesSearch && matchesStatus && matchesWorkType;
  });

  // Compute dispatch duration: prop > compute from start/end times > planner-consistent fallback (60min)
  const computedDuration = (() => {
    if (dispatchEstimatedDuration && dispatchEstimatedDuration > 0) return dispatchEstimatedDuration;
    if (scheduledStartTime && scheduledEndTime) {
      const [sh, sm] = scheduledStartTime.split(':').map(Number);
      const [eh, em] = scheduledEndTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) return diff;
    }
    // Fallback: 60min when dispatch exists (matches planner default)
    return 60;
  })();

  const formatDuration = (minutes: number) => {
    if (minutes <= 0) return '0min';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Installation Header for multi-job dispatches */}
        {isMultiJob && displayInstallationName && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm text-foreground">{displayInstallationName}</h3>
              <p className="text-xs text-muted-foreground">{t('jobs_tab.jobs_count', { count: jobsToRender.length })} · {t('jobs_tab.duration_total', { duration: formatDuration(computedDuration) })}</p>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between mb-4">
          <div className="flex-1">
            <CollapsibleSearch 
              placeholder={t('jobs_tab.search_jobs')}
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full"
            />
          </div>
           <div className="flex items-center gap-2">
              {/* Conversion Mode Indicator */}
              <Badge 
                variant="outline" 
                className="gap-1.5 text-xs px-2.5 py-1 border-primary/30 text-primary bg-primary/5"
              >
                {conversionMode === 'installation' ? (
                  <>
                    <Building2 className="h-3 w-3" />
                    {t('field.conversionMode.installation', 'Par installation')}
                  </>
                ) : (
                  <>
                    <List className="h-3 w-3" />
                    {t('field.conversionMode.service', 'Par service')}
                  </>
                )}
              </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 px-3 z-20" 
              onClick={() => setShowFilterBar(s => !s)}
            >
              <Filter className="h-4 w-4" />
               {t('jobs_tab.filters')}
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
                <label className="text-xs font-medium text-muted-foreground">{t('jobs_tab.status')}</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('jobs_tab.all_statuses')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('jobs_tab.all_statuses')}</SelectItem>
                    <SelectItem value="unscheduled">{t('statuses.pending', 'Unscheduled')}</SelectItem>
                    <SelectItem value="ready">{t('statuses.scheduled', 'Ready')}</SelectItem>
                    <SelectItem value="dispatched">{t('statuses.completed', 'Dispatched')}</SelectItem>
                    <SelectItem value="cancelled">{t('statuses.cancelled', 'Cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">{t('jobs_tab.work_type')}</label>
                <Select value={filterWorkType} onValueChange={setFilterWorkType}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('jobs_tab.all_work_types')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('jobs_tab.all_work_types')}</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="repair">{t('dispatches.time_booking.types.work', 'Repair')}</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(filterStatus !== 'all' || filterWorkType !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { 
                    setSearchTerm('');
                    setFilterStatus('all'); 
                    setFilterWorkType('all'); 
                    setShowFilterBar(false); 
                  }}
                  className="h-9 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('jobs_tab.clear_filters')}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Jobs Table */}
        {filteredJobs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('jobs_tab.no_jobs_match')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('jobs_tab.job')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('jobs_tab.status')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('jobs_tab.work_type')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('jobs_tab.installation')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((jobItem) => (
                  <tr key={jobItem.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{jobItem.title}</div>
                        <div className="text-sm text-muted-foreground">
                          <span>{jobItem.jobNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={getStatusColor(jobItem.status)}>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(jobItem.status)}
                          <span className="capitalize font-medium">{jobItem.status.replace('_', ' ')}</span>
                        </div>
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-sm">{jobItem.workType.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {jobItem.installationName ? (
                          <>
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span 
                              className="text-sm cursor-pointer hover:text-primary hover:underline transition-colors font-medium"
                              onClick={() => navigate(`/dashboard/installations/${jobItem.installationId}`)}
                            >
                              {jobItem.installationName}
                            </span>
                          </>
                        ) : jobItem.installationId ? (
                          <>
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span 
                              className="text-sm text-muted-foreground cursor-pointer hover:text-primary hover:underline transition-colors"
                              onClick={() => navigate(`/dashboard/installations/${jobItem.installationId}`)}
                            >
                              Installation #{jobItem.installationId}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">{t('jobs_tab.no_installation')}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
