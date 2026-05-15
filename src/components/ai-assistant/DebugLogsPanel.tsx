import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SystemLog } from '@/services/api/logsApi';

interface DebugLogsPanelProps {
  logs: SystemLog[];
  issueContext?: string;
  suggestedCause?: string;
}

export function DebugLogsPanel({ logs, issueContext, suggestedCause }: DebugLogsPanelProps) {
  const { t } = useTranslation('aiAssistant');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState<number | null>(null);

  if (logs.length === 0) {
    return null;
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
      default:
        return <Info className="h-3.5 w-3.5 text-primary" />;
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const handleCopyLog = async (log: SystemLog) => {
    const logText = `[${log.level.toUpperCase()}] ${log.timestamp}
Module: ${log.module}
Message: ${log.message}
${log.entityType ? `${t('debugLogs.entity')}: ${log.entityType}` : ''}
${log.entityId ? `${t('debugLogs.entityId')}: ${log.entityId}` : ''}
${log.details ? `Details: ${log.details}` : ''}`;

    try {
      await navigator.clipboard.writeText(logText);
      setCopiedLogId(log.id);
      toast({
        title: t('debugLogs.copied'),
        description: t('debugLogs.copiedDesc'),
      });
      setTimeout(() => setCopiedLogId(null), 2000);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('copyFailed'),
        variant: 'destructive',
      });
    }
  };

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warningCount = logs.filter(l => l.level === 'warning').length;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="mt-3 rounded-lg border border-border/50 bg-muted/30">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-3 py-2 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {t('debugLogs.title')}
              </span>
              <div className="flex items-center gap-1.5">
                {errorCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {errorCount} {errorCount === 1 ? t('debugLogs.error') : t('debugLogs.errors')}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="h-5 px-1.5 text-xs border-warning text-warning">
                    {warningCount} {warningCount === 1 ? t('debugLogs.warning') : t('debugLogs.warnings')}
                  </Badge>
                )}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            {/* Context and suggested cause */}
            {(issueContext || suggestedCause) && (
              <div className="space-y-2 pt-1">
                {issueContext && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{t('debugLogs.context')}:</span>
                    <div className="flex flex-wrap gap-1">
                      {issueContext.split(',').map((ctx, i) => (
                        <Badge key={i} variant="secondary" className="h-5 px-1.5 text-xs">
                          {ctx.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {suggestedCause && (
                  <div className="p-2 rounded-md bg-warning/10 border border-warning/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground">
                        {suggestedCause}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logs list */}
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {logs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "p-2 rounded-md text-xs border",
                      log.level === 'error' && "bg-destructive/5 border-destructive/20",
                      log.level === 'warning' && "bg-warning/5 border-warning/20",
                      log.level !== 'error' && log.level !== 'warning' && "bg-muted/50 border-border/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getLevelIcon(log.level)}
                        <Badge variant={getLevelBadgeVariant(log.level) as any} className="h-5 px-1.5 text-xs uppercase">
                          {log.level}
                        </Badge>
                        <span className="text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <Badge variant="outline" className="h-5 px-1.5 text-xs">
                          {log.module}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleCopyLog(log)}
                      >
                        {copiedLogId === log.id ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    <p className="mt-1.5 font-medium text-foreground">
                      {log.message}
                    </p>

                    {(log.entityType || log.entityId) && (
                      <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                        {log.entityType && <span>{t('debugLogs.entity')}: {log.entityType}</span>}
                        {log.entityId && <span className="opacity-75">{t('debugLogs.entityId')}: {log.entityId}</span>}
                      </div>
                    )}

                    {log.details && (
                      <div className="mt-1.5 p-1.5 rounded bg-background/50 font-mono text-[10px] text-muted-foreground overflow-x-auto">
                        {log.details.length > 200 ? log.details.slice(0, 200) + '...' : log.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {logs.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                {t('debugLogs.moreEntries', { count: logs.length - 10 })}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
