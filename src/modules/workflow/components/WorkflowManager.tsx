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