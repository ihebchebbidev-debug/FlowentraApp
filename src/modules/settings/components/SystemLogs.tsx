import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, Search, Filter, RefreshCw, AlertCircle, CheckCircle, XCircle, Info,
  Calendar, User, Trash2, BarChart3, Clock
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logsApi, SystemLog, LogSearchParams, LogLevel, LogStatistics } from "@/services/api/logsApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const LOG_LEVELS = [
  { id: 'all', name: 'All Levels' },
  { id: 'info', name: 'Info' },
  { id: 'warning', name: 'Warning' },
  { id: 'error', name: 'Error' },
  { id: 'success', name: 'Success' }
];

// Helper to mask internal Lovable URLs for display
const maskInternalUrls = (text: string): string => {
  if (!text) return text;
  return text.replace(
    /https:\/\/[a-f0-9-]+\.lovableproject\.com/gi,
    'https://flowentra.vercel.app'
  );
};

export function SystemLogs() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(50);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchParams: LogSearchParams = {
    searchTerm: debouncedSearch || undefined,
    level: levelFilter as LogLevel | 'all',
    module: moduleFilter !== 'all' ? moduleFilter : undefined,
    pageNumber,
    pageSize,
  };

  // Fetch logs
  const { data: logsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['system-logs', searchParams],
    queryFn: () => logsApi.getAll(searchParams),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['system-logs-stats'],
    queryFn: () => logsApi.getStatistics(),
    refetchInterval: 60000,
  });

  // Fetch available modules
  const { data: modules = [] } = useQuery({
    queryKey: ['system-logs-modules'],
    queryFn: () => logsApi.getModules(),
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: (daysOld: number) => logsApi.deleteOld(daysOld),
    onSuccess: (data) => {
      toast.success(t('systemLogs.cleanupSuccess', { count: data.deletedCount }));
      queryClient.invalidateQueries({ queryKey: ['system-logs'] });
      queryClient.invalidateQueries({ queryKey: ['system-logs-stats'] });
      setShowCleanupDialog(false);
    },
    onError: () => {
      toast.error('Failed to cleanup logs');
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['system-logs-stats'] });
    toast.success('Logs refreshed');
  }, [refetch, queryClient]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getLevelBadgeVariant = (level: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  const logs = logsData?.logs || [];
  const totalCount = logsData?.totalCount || 0;
  const totalPages = logsData?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('systemLogs.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageNumber(1);
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select
            value={levelFilter}
            onValueChange={(v) => { setLevelFilter(v); setPageNumber(1); }}
          >
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder={t('systemLogs.selectLevelPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {LOG_LEVELS.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={moduleFilter}
            onValueChange={(v) => { setModuleFilter(v); setPageNumber(1); }}
          >
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder={t('systemLogs.selectModulePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('systemLogs.allModules')}</SelectItem>
              {modules.map((module) => (
                <SelectItem key={module} value={module}>{module}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">{t('systemLogs.refresh')}</span>
          </Button>
          <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('systemLogs.clearAll')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('systemLogs.cleanupTitle')}</DialogTitle>
                <DialogDescription>{t('systemLogs.cleanupDescription')}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCleanupDialog(false)}>
                  {t('systemLogs.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => cleanupMutation.mutate(0)}
                  disabled={cleanupMutation.isPending}
                >
                  {cleanupMutation.isPending ? t('systemLogs.cleaning') : t('systemLogs.cleanupNow')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Meta line */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('systemLogs.applicationLogsTitle', { count: totalCount })}</span>
        <span className="hidden sm:inline">{t('systemLogs.recentActivity')} · Auto-refreshes every 30s</span>
      </div>

      {/* Logs list */}
      <div className="rounded-lg border border-border/60 bg-background/30 overflow-hidden">
        <ScrollArea className="h-[520px]">
          <div className="divide-y divide-border/50">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-4">
                  <Skeleton className="h-4 w-4 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32 ml-auto" />
                    </div>
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : isError ? (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-destructive/10">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Failed to load logs</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    The backend server may be starting up. This can take 30-60 seconds on first load.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {t('systemLogs.noLogsFound')}
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{log.module}</Badge>
                      {log.action && log.action !== 'other' && (
                        <Badge variant="outline" className="text-xs bg-muted/50">{log.action}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {maskInternalUrls(log.message)}
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {maskInternalUrls(log.details)}
                      </p>
                    )}
                    {(log.userName || log.userId) && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.userName || `User ID: ${log.userId}`}
                      </p>
                    )}
                    {log.entityType && log.entityId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.entityType}: {log.entityId}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Page {pageNumber} of {totalPages} · {totalCount} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                disabled={pageNumber >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>


      {/* Log Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getLevelIcon(selectedLog.level)}
              {t('systemLogs.logDetails.title')}
            </DialogTitle>
            <DialogDescription>
              {t('systemLogs.logDetails.description')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="flex-1 min-h-0 pr-4">
              <div className="space-y-4 pb-4">
                {/* Header Info */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getLevelBadgeVariant(selectedLog.level)}>
                    {selectedLog.level.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{selectedLog.module}</Badge>
                  {selectedLog.action && selectedLog.action !== 'other' && (
                    <Badge variant="outline" className="bg-muted/50">
                      {selectedLog.action}
                    </Badge>
                  )}
                </div>

                {/* Timestamp */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('systemLogs.logDetails.timestamp')}
                  </label>
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(selectedLog.timestamp), 'PPpp')}
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('systemLogs.logDetails.message')}
                  </label>
                  <div className="text-sm text-foreground bg-muted/30 p-3 rounded-lg break-words whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {maskInternalUrls(selectedLog.message)}
                  </div>
                </div>

                {/* Details */}
                {selectedLog.details && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('systemLogs.logDetails.details')}
                    </label>
                    <pre className="text-xs text-foreground bg-muted/30 p-3 rounded-lg overflow-auto whitespace-pre-wrap break-words font-mono max-h-[250px]">
                      {maskInternalUrls(selectedLog.details)}
                    </pre>
                  </div>
                )}

                {/* User Info */}
                {(selectedLog.userName || selectedLog.userId) && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('systemLogs.logDetails.user')}
                    </label>
                    <p className="text-sm text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      {selectedLog.userName || selectedLog.userId}
                      {selectedLog.userName && selectedLog.userId && (
                        <span className="text-muted-foreground">({selectedLog.userId})</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Entity Info */}
                {selectedLog.entityType && selectedLog.entityId && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('systemLogs.logDetails.relatedEntity')}
                    </label>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{selectedLog.entityType}:</span> {selectedLog.entityId}
                    </p>
                  </div>
                )}

                {/* IP Address */}
                {selectedLog.ipAddress && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('systemLogs.logDetails.ipAddress')}
                    </label>
                    <p className="text-sm text-foreground font-mono">{selectedLog.ipAddress}</p>
                  </div>
                )}

                {/* Log ID */}
                <div className="space-y-1 pt-2 border-t border-border">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('systemLogs.logDetails.logId')}
                  </label>
                  <p className="text-xs text-muted-foreground font-mono">{selectedLog.id}</p>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="mt-4 flex-shrink-0">
            <Button variant="outline" onClick={() => setSelectedLog(null)}>
              {t('systemLogs.logDetails.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
