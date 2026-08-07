import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Save, 
  FolderOpen, 
  Plus, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Play,
  Calendar,
  Edit3,
  Power,
  PowerOff,
  Loader2,
  History,
  Workflow
} from "lucide-react";
import { Node, Edge } from '@xyflow/react';
import { useWorkflowApi, SavedWorkflow } from '../hooks/useWorkflowApi';
import { WorkflowExecutionHistory } from './WorkflowExecutionHistory';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { workflowApi } from '@/services/api/workflowApi';

interface WorkflowManagerProps {
  nodes: Node[];
  edges: Edge[];
  onLoadWorkflow: (workflow: SavedWorkflow) => void;
  onNewWorkflow: () => void;
}

export function WorkflowManager({ nodes, edges, onLoadWorkflow, onNewWorkflow }: WorkflowManagerProps) {
  const { t } = useTranslation();
  const { 
    workflows, 
    currentWorkflow, 
    loading,
    saveWorkflow, 
    deleteWorkflow, 
    duplicateWorkflow, 
    createNewWorkflow,
    activateWorkflow,
    deactivateWorkflow 
  } = useWorkflowApi();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update form when currentWorkflow changes
  useEffect(() => {
    if (currentWorkflow) {
      setWorkflowName(currentWorkflow.name);
      setWorkflowDescription(currentWorkflow.description || '');
    }
  }, [currentWorkflow]);

  const handleSave = async () => {
    if (!workflowName.trim()) return;
    
    setIsSaving(true);
    try {
      const saved = await saveWorkflow(workflowName.trim(), workflowDescription.trim(), nodes, edges);
      if (saved) {
        toast.success(t('toast.workflowUpdated'));
      }
      setSaveDialogOpen(false);
    } catch (err) {
      toast.error(t('toast.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (workflow: SavedWorkflow) => {
    onLoadWorkflow(workflow);
    setLoadDialogOpen(false);
  };

  const handleNew = () => {
    createNewWorkflow();
    onNewWorkflow();
  };

  const handleLoadDefaultWorkflow = async () => {
    try {
      const apiWorkflow = await workflowApi.getDefault();
      if (apiWorkflow) {
        const parsedNodes = typeof apiWorkflow.nodes === 'string' 
          ? JSON.parse(apiWorkflow.nodes) 
          : apiWorkflow.nodes;
        const parsedEdges = typeof apiWorkflow.edges === 'string' 
          ? JSON.parse(apiWorkflow.edges) 
          : apiWorkflow.edges;
          
        const defaultWorkflow: SavedWorkflow = {
          id: String(apiWorkflow.id),
          name: apiWorkflow.name,
          description: apiWorkflow.description,
          nodes: parsedNodes,
          edges: parsedEdges,
          isActive: apiWorkflow.isActive,
          version: apiWorkflow.version,
          createdAt: new Date(apiWorkflow.createdAt),
          updatedAt: apiWorkflow.updatedAt ? new Date(apiWorkflow.updatedAt) : new Date()
        };
        onLoadWorkflow(defaultWorkflow);
        toast.success(t('workflowLoaded', { name: apiWorkflow.name }));
      } else {
        // Backend unavailable - inform user without error cascade
        toast.warning(t('backendUnavailable') || 'Backend unavailable. Using local workflow.');
      }
    } catch (err) {
      // Network error - don't spam console, show user-friendly message
      toast.warning(t('backendUnavailable') || 'Backend unavailable. Please try again later.');
    }
  };

  const handleDuplicate = (workflowId: string) => {
    const duplicate = duplicateWorkflow(workflowId);
    if (duplicate) {
      onLoadWorkflow(duplicate);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current Workflow Info */}
      {currentWorkflow && (
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md">
          <Edit3 className="h-3 w-3 text-primary" />
          <span className="text-sm font-medium text-primary">{currentWorkflow.name}</span>
        </div>
      )}


      {/* Manage workflows (load / play / pause / duplicate / delete) */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            {t('myWorkflows', { defaultValue: 'My workflows' })}
            {workflows.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-px-10">
                {workflows.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('myWorkflows', { defaultValue: 'My workflows' })}</DialogTitle>
            <DialogDescription>
              {t('myWorkflowsDescription', {
                defaultValue: 'Pause or resume any workflow, load it onto the canvas, duplicate or delete it.',
              })}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('loading', { defaultValue: 'Loading…' })}
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <Workflow className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {t('noWorkflowsYet', { defaultValue: 'No saved workflows yet.' })}
              </div>
            ) : (
              <div className="space-y-2">
                {workflows.map((wf) => {
                  const isCurrent = currentWorkflow?.id === wf.id;
                  return (
                    <Card
                      key={wf.id}
                      className={`transition-colors ${isCurrent ? 'border-primary/60 bg-primary/5' : ''}`}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            const next = !wf.isActive;
                            const ok = next
                              ? await activateWorkflow(wf.id)
                              : await deactivateWorkflow(wf.id);
                            if (ok) {
                              toast.success(
                                next
                                  ? t('workflowStarted', { defaultValue: 'Workflow resumed' })
                                  : t('workflowPaused', { defaultValue: 'Workflow paused' }),
                              );
                            } else {
                              toast.error(t('toast.error', { defaultValue: 'Something went wrong' }));
                            }
                          }}
                          className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                            wf.isActive
                              ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          title={
                            wf.isActive
                              ? t('pauseWorkflow', { defaultValue: 'Pause workflow' })
                              : t('resumeWorkflow', { defaultValue: 'Resume workflow' })
                          }
                        >
                          {wf.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{wf.name}</span>
                            <Badge
                              variant={wf.isActive ? 'default' : 'secondary'}
                              className="text-px-10 px-1.5 py-0 h-4"
                            >
                              {wf.isActive
                                ? t('active', { defaultValue: 'Active' })
                                : t('paused', { defaultValue: 'Paused' })}
                            </Badge>
                            {isCurrent && (
                              <Badge variant="outline" className="text-px-10 px-1.5 py-0 h-4">
                                {t('current', { defaultValue: 'Open' })}
                              </Badge>
                            )}
                          </div>
                          {wf.description && (
                            <div className="text-xs text-muted-foreground truncate">{wf.description}</div>
                          )}
                          <div className="text-px-10 text-muted-foreground mt-0.5">
                            {t('updated', { defaultValue: 'Updated' })}{' '}
                            {formatDistanceToNow(new Date(wf.updatedAt), { addSuffix: true })}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleLoad(wf)}>
                            <FolderOpen className="h-3.5 w-3.5 mr-1" />
                            {t('open', { defaultValue: 'Open' })}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDuplicate(wf.id)}>
                                <Copy className="h-3.5 w-3.5 mr-2" />
                                {t('duplicate', { defaultValue: 'Duplicate' })}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                  await deleteWorkflow(wf.id);
                                  toast.success(t('deleted', { defaultValue: 'Deleted' }));
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                {t('delete', { defaultValue: 'Delete' })}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Execution History Button */}
      {currentWorkflow && !isNaN(Number(currentWorkflow.id)) && (
        <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(true)}>
          <History className="h-4 w-4 mr-2" />
          {t('executionHistory.viewHistory')}
        </Button>
      )}

      {/* Save Button */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            {t('save')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentWorkflow ? t('editWorkflow') : t('saveWorkflow')}
            </DialogTitle>
            <DialogDescription>
              {t('saveDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('workflowNameLabel')}</label>
              <Input
                placeholder={t('workflowNamePlaceholder')}
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </div>
            <div>
                <label className="text-sm font-medium mb-2 block">{t('workflowDescriptionLabel')}</label>
              <Textarea
                placeholder={t('workflowDescriptionPlaceholder')}
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSave} disabled={!workflowName.trim() || isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Execution History Dialog */}
      {currentWorkflow && !isNaN(Number(currentWorkflow.id)) && (
        <WorkflowExecutionHistory
          workflowId={Number(currentWorkflow.id)}
          workflowName={currentWorkflow.name}
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
        />
      )}
    </div>
  );
}