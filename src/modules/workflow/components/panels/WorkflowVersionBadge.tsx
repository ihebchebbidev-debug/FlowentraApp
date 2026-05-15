import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  GitBranch,
  History,
  ChevronDown,
  Archive,
  CheckCircle2,
  FileEdit,
  Copy,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export type WorkflowVersionStatus = 'draft' | 'active' | 'archived';

interface WorkflowVersion {
  version: number;
  status: WorkflowVersionStatus;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

interface WorkflowVersionBadgeProps {
  currentVersion: number;
  versionStatus: WorkflowVersionStatus;
  isActive: boolean;
  workflowName?: string;
  versions?: WorkflowVersion[];
  onCreateDraft?: () => void;
  onPromoteToActive?: () => void;
  onArchive?: () => void;
  onRollback?: (version: number) => void;
}

const statusConfig: Record<WorkflowVersionStatus, {
  label: string;
  icon: React.ComponentType<any>;
  className: string;
}> = {
  draft: {
    label: 'version.draft',
    icon: FileEdit,
    className: 'bg-warning/15 text-warning border-warning/30',
  },
  active: {
    label: 'version.active',
    icon: CheckCircle2,
    className: 'bg-success/15 text-success border-success/30',
  },
  archived: {
    label: 'version.archived',
    icon: Archive,
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export function WorkflowVersionBadge({
  currentVersion,
  versionStatus,
  isActive,
  workflowName,
  versions = [],
  onCreateDraft,
  onPromoteToActive,
  onArchive,
  onRollback,
}: WorkflowVersionBadgeProps) {
  const { t } = useTranslation('workflow');
  const config = statusConfig[versionStatus];
  const StatusIcon = config.icon;

  // Derive status from isActive if no explicit versionStatus logic
  const effectiveStatus: WorkflowVersionStatus = isActive ? 'active' :
    versionStatus === 'archived' ? 'archived' : 'draft';
  const effectiveConfig = statusConfig[effectiveStatus];
  const EffectiveIcon = effectiveConfig.icon;

  return (
    <div className="flex items-center gap-2">
      {/* Version Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5 px-2.5 py-1 text-xs font-medium cursor-default',
                effectiveConfig.className
              )}
            >
              <EffectiveIcon className="h-3 w-3" />
              {t(effectiveConfig.label, effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1))}
              <span className="text-[10px] opacity-70">v{currentVersion}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('version.tooltip', 'Version {{version}} - {{status}}', {
              version: currentVersion,
              status: t(effectiveConfig.label)
            })}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Version Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <History className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium">{t('version.title', 'Version History')}</p>
            <p className="text-[10px] text-muted-foreground">
              {workflowName || t('version.currentWorkflow', 'Current Workflow')}
            </p>
          </div>
          <DropdownMenuSeparator />

          {effectiveStatus === 'active' && onCreateDraft && (
            <DropdownMenuItem onClick={() => {
              onCreateDraft();
              toast.success(t('version.draftCreated', 'Created version created'));
            }}>
              <Copy className="h-3.5 w-3.5 mr-2" />
              {t('version.createDraft', 'Create Created Version')}
            </DropdownMenuItem>
          )}

          {effectiveStatus === 'draft' && onPromoteToActive && (
            <DropdownMenuItem onClick={() => {
              onPromoteToActive();
              toast.success(t('version.promoted', 'Version promoted to active'));
            }}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
              {t('version.promote', 'Promote to Active')}
            </DropdownMenuItem>
          )}

          {effectiveStatus !== 'archived' && onArchive && (
            <DropdownMenuItem onClick={() => {
              onArchive();
              toast.success(t('version.archived', 'Version archived'));
            }}>
              <Archive className="h-3.5 w-3.5 mr-2" />
              {t('version.archive', 'Archive Version')}
            </DropdownMenuItem>
          )}

          {versions.length > 1 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">
                  {t('version.previousVersions', 'Previous Versions')}
                </p>
              </div>
              {versions
                .filter(v => v.version !== currentVersion)
                .slice(0, 5)
                .map(v => {
                  const vConfig = statusConfig[v.status];
                  const VIcon = vConfig.icon;
                  return (
                    <DropdownMenuItem
                      key={v.version}
                      onClick={() => onRollback?.(v.version)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-2" />
                      <span className="flex-1">v{v.version}</span>
                      <Badge variant="outline" className={cn('text-[9px] h-4 px-1', vConfig.className)}>
                        <VIcon className="h-2 w-2 mr-0.5" />
                        {t(vConfig.label)}
                      </Badge>
                    </DropdownMenuItem>
                  );
                })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
