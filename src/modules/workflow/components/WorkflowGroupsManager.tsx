import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FolderOpen, 
  Trash2, 
  Copy, 
  MoreVertical, 
  Play, 
  Loader2,
  Workflow,
  GitBranch,
  Zap,
  Calendar,
  CheckSquare,
  Square,
  Power,
  PowerOff,
  Plus
} from "lucide-react";
import { useWorkflowApi, SavedWorkflow } from '../hooks/useWorkflowApi';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkflowGroupsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadWorkflow: (workflow: SavedWorkflow) => void;
  onNewWorkflow: () => void;
}

export function WorkflowGroupsManager({ 
  open, 
  onOpenChange, 
  onLoadWorkflow,
  onNewWorkflow 
}: WorkflowGroupsManagerProps) {
  const { t } = useTranslation('workflow');
  const { 
    workflows, 
    loading, 
    deleteWorkflow, 
    duplicateWorkflow,
    loadWorkflows,
    activateWorkflow,
    deactivateWorkflow
  } = useWorkflowApi();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);

  // Reload workflows when dialog opens
  useEffect(() => {
    if (open) {
      loadWorkflows();
      setSelectedIds(new Set());
    }
  }, [open, loadWorkflows]);

  const allSelected = workflows.length > 0 && selectedIds.size === workflows.length;
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(workflows.map(w => w.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await deleteWorkflow(id);
    }
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    toast.success(t('workflowGroups.bulkDeleted', `${ids.length} workflow(s) deleted`));
  };

  const handleSingleDelete = async () => {
    if (singleDeleteId) {
      await deleteWorkflow(singleDeleteId);
      selectedIds.delete(singleDeleteId);
      setSelectedIds(new Set(selectedIds));
      setSingleDeleteId(null);
      toast.success(t('workflowGroups.deleted', 'Workflow deleted'));
    }
  };

  const handleDuplicate = (id: string) => {
    const dup = duplicateWorkflow(id);
    if (dup) {
      toast.success(t('workflowGroups.duplicated', 'Workflow duplicated'));
    }
  };

  const handleLoad = (workflow: SavedWorkflow) => {
    onLoadWorkflow(workflow);
    onOpenChange(false);
  };

  const getWorkflowStats = (workflow: SavedWorkflow) => {
    const nodeCount = workflow.nodes?.length || 0;
    const edgeCount = workflow.edges?.length || 0;
    const triggerCount = workflow.nodes?.filter((n: any) => 
      (n.data as any)?.type?.includes('trigger')
    ).length || 0;
    const conditionCount = workflow.nodes?.filter((n: any) => {
      const type = (n.data as any)?.type;
      return type === 'if-else' || type === 'switch' || type === 'condition';
    }).length || 0;
    return { nodeCount, edgeCount, triggerCount, conditionCount };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              {t('workflowGroups.title', 'Workflow Groups')}
            </DialogTitle>
            <DialogDescription>
              {t('workflowGroups.description', 'Manage, load, or delete your saved workflows. Each workflow is a self-contained group.')}
            </DialogDescription>
          </DialogHeader>

          {/* Bulk Actions Bar */}
          <div className="flex items-center justify-between py-2 border-b border-border/60">
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={allSelected} 
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
              <span className="text-sm text-muted-foreground">
                {someSelected 
                  ? t('workflowGroups.selected', '{{count}} selected', { count: selectedIds.size })
                  : t('workflowGroups.selectAll', 'Select all')
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              {someSelected && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteConfirm(true)}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('workflowGroups.deleteSelected', 'Delete Selected ({{count}})', { count: selectedIds.size })}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onNewWorkflow(); onOpenChange(false); }}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('workflowGroups.newWorkflow', 'New Workflow')}
              </Button>
            </div>
          </div>

          {/* Workflow Groups Grid */}
          <ScrollArea className="max-h-[55vh] pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : workflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Workflow className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t('workflowGroups.empty', 'No workflows yet')}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {t('workflowGroups.emptyHint', 'Create your first workflow to see it here')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 py-2">
                {workflows.map((workflow) => {
                  const stats = getWorkflowStats(workflow);
                  const isSelected = selectedIds.has(workflow.id);
                  
                  return (
                    <div
                      key={workflow.id}
                      className={cn(
                        "group relative rounded-xl border transition-all duration-200 cursor-pointer",
                        "hover:shadow-md hover:border-primary/30",
                        isSelected 
                          ? "border-primary/50 bg-primary/[0.04] shadow-sm" 
                          : "border-border/60 bg-card"
                      )}
                    >
                      <div className="flex items-start gap-3 p-4">
                        {/* Checkbox */}
                        <div className="pt-0.5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(workflow.id)}
                            aria-label={`Select ${workflow.name}`}
                          />
                        </div>

                        {/* Workflow Icon */}
                        <div className={cn(
                          "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                          workflow.isActive 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          <Workflow className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0" onClick={() => handleLoad(workflow)}>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {workflow.name}
                            </h4>
                            <Badge 
                              variant={workflow.isActive ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                            >
                              {workflow.isActive 
                                ? t('workflowGroups.active', 'Active') 
                                : t('workflowGroups.inactive', 'Inactive')
                              }
                            </Badge>
                            <span className="text-[10px] text-muted-foreground/60 shrink-0">
                              v{workflow.version}
                            </span>
                          </div>

                          {workflow.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                              {workflow.description}
                            </p>
                          )}

                          {/* Stats Row */}
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {stats.nodeCount} {t('workflowGroups.nodes', 'nodes')}
                            </span>
                            {stats.triggerCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Play className="h-3 w-3" />
                                {stats.triggerCount} {t('workflowGroups.triggers', 'triggers')}
                              </span>
                            )}
                            {stats.conditionCount > 0 && (
                              <span className="flex items-center gap-1">
                                <GitBranch className="h-3 w-3" />
                                {stats.conditionCount} {t('workflowGroups.conditions', 'conditions')}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(workflow.updatedAt, { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleLoad(workflow)}>
                              <FolderOpen className="h-4 w-4 mr-2" />
                              {t('workflowGroups.load', 'Load')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(workflow.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              {t('workflowGroups.duplicate', 'Duplicate')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {workflow.isActive ? (
                              <DropdownMenuItem onClick={() => deactivateWorkflow(workflow.id)}>
                                <PowerOff className="h-4 w-4 mr-2" />
                                {t('workflowGroups.deactivate', 'Deactivate')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => activateWorkflow(workflow.id)}>
                                <Power className="h-4 w-4 mr-2" />
                                {t('workflowGroups.activate', 'Activate')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setSingleDeleteId(workflow.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('workflowGroups.delete', 'Delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>
                {t('workflowGroups.bulkDeleteTitle', 'Delete {{count}} workflow(s)?', { count: selectedIds.size })}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {t('workflowGroups.bulkDeleteDesc', 'This will permanently delete the selected workflows. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('workflowGroups.confirmDelete', 'Delete All Selected')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Delete Confirmation */}
      <AlertDialog open={!!singleDeleteId} onOpenChange={() => setSingleDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>
                {t('workflowGroups.singleDeleteTitle', 'Delete this workflow?')}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {t('workflowGroups.singleDeleteDesc', 'This will permanently delete this workflow and all its configuration. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSingleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('workflowGroups.confirmDeleteSingle', 'Delete Workflow')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
