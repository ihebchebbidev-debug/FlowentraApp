import { useState, useRef } from 'react';
import '../../styles/workflow.css';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Code, AlertCircle, CheckCircle } from "lucide-react";
import { Node, Edge } from '@xyflow/react';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (nodes: Node[], edges: Edge[], name?: string) => void;
}

interface WorkflowData {
  name?: string;
  nodes: Node[];
  edges: Edge[];
  version?: string;
  metadata?: any;
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    data?: WorkflowData;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateWorkflowData = (data: any): { isValid: boolean; error?: string; data?: WorkflowData } => {
    try {
      if (!data || typeof data !== 'object') {
        return { isValid: false, error: t('import.errors.invalidJson') || 'File must contain a valid JSON object' };
      }

      if (!Array.isArray(data.nodes)) {
        return { isValid: false, error: t('import.errors.nodesRequired') || "'nodes' field is required and must be an array" };
      }

      if (!Array.isArray(data.edges)) {
        return { isValid: false, error: t('import.errors.edgesRequired') || "'edges' field is required and must be an array" };
      }

      // Validate nodes structure
      for (const node of data.nodes) {
        if (!node.id || !node.type || !node.position || !node.data) {
          return { isValid: false, error: t('import.errors.nodeStructure') || 'Each node must have id, type, position and data' };
        }
      }

      // Validate edges structure
      for (const edge of data.edges) {
        if (!edge.id || !edge.source || !edge.target) {
          return { isValid: false, error: t('import.errors.edgeStructure') || 'Each connection must have id, source and target' };
        }
      }

      return { 
        isValid: true, 
        data: {
          name: data.name || t('import.importedDefaultName') || 'Imported Workflow',
          nodes: data.nodes,
          edges: data.edges,
          version: data.version,
          metadata: data.metadata
        }
      };
    } catch (error) {
      return { isValid: false, error: t('import.errors.validationError') + ": " + (error as Error).message };
    }
  };

  const parseContent = (content: string, isYAML = false) => {
    try {
      let data;
      
      if (isYAML) {
        // Simple YAML parsing (basic implementation)
        data = JSON.parse(content.replace(/^(\s*)([^:\s]+):\s*$/gm, '$1"$2":'));
      } else {
        data = JSON.parse(content);
      }

      const result = validateWorkflowData(data);
      setValidationResult(result);
      return result;
    } catch (error) {
      const errorResult = { 
        isValid: false, 
        error: `${t('import.errors.parsingError', { format: isYAML ? 'YAML' : 'JSON' }) || `Parsing error ${isYAML ? 'YAML' : 'JSON'}`}: ${(error as Error).message}` 
      };
      setValidationResult(errorResult);
      return errorResult;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTextContent(content);
      const isYAML = file.name.endsWith('.yaml') || file.name.endsWith('.yml');
      parseContent(content, isYAML);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (content: string) => {
    setTextContent(content);
    if (content.trim()) {
      parseContent(content);
    } else {
      setValidationResult(null);
    }
  };

  const handleImport = () => {
    if (validationResult?.isValid && validationResult.data) {
      onImport(
        validationResult.data.nodes,
        validationResult.data.edges,
        validationResult.data.name
      );
      toast.success(t('import.success', { name: validationResult.data.name }) || `Workflow "${validationResult.data.name}" imported successfully!`);
      setTextContent("");
      setValidationResult(null);
      onClose();
    }
  };

  const handleClose = () => {
    setTextContent("");
    setValidationResult(null);
    onClose();
  };

  const renderValidationStatus = () => {
    if (!validationResult) return null;

    if (validationResult.isValid) {
      return (
        <div className="flex items-start gap-2 p-3 bg-success/5 border border-success/20 rounded-lg">
          <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">{t('import.validWorkflow') || 'Valid workflow'}</p>
            {validationResult.data && (
              <div className="text-xs text-success/80 mt-1">
                <div>{t('name')}: {validationResult.data.name}</div>
                <div>{t('nodesLabel')}: {validationResult.data.nodes.length}</div>
                <div>{t('edges')}: {validationResult.data.edges.length}</div>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{t('import.validationError') || 'Validation error'}</p>
            <p className="text-xs text-destructive/80 mt-1">{validationResult.error}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="workflow-module max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('importTitle') || 'Import Workflow'}
          </DialogTitle>
          <DialogDescription>
            {t('importDescription') || 'Import a workflow from JSON or YAML format.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              {t('import.pasteTab') || 'Paste'}
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('import.fileTab') || 'File'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="flex-1 flex flex-col space-y-4">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium mb-2">
                {t('import.pasteContent') || 'Paste your workflow content (JSON)'}
              </label>
              <Textarea
                placeholder={t('import.pastePlaceholder') || 'Paste your exported workflow JSON here...'}
                value={textContent}
                onChange={(e) => handleTextChange(e.target.value)}
                className="flex-1 min-h-[250px] font-mono text-sm"
              />
            </div>
            {renderValidationStatus()}
          </TabsContent>

          <TabsContent value="file" className="flex-1 flex flex-col space-y-4">
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('import.selectFile') || 'Select a file'}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('import.supportedFormats') || 'Supported formats: JSON (.json), YAML (.yaml, .yml)'}
              </p>
              <Button variant="outline">
                {t('import.browseFiles') || 'Browse files'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {textContent && renderValidationStatus()}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {validationResult?.isValid ? (
              <span className="text-success">✓ {t('import.readyToImport') || 'Ready to import'}</span>
            ) : validationResult?.error ? (
              <span className="text-destructive">✗ {t('import.correctionNeeded') || 'Correction needed'}</span>
            ) : (
              t('import.waitingForData') || "Waiting for data..."
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!validationResult?.isValid}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {t('import.importButton') || 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}