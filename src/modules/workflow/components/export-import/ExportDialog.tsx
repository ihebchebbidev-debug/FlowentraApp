import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, FileText, Code, Database } from "lucide-react";
import { Node, Edge } from '@xyflow/react';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  workflowName?: string;
}

export function ExportDialog({ isOpen, onClose, nodes, edges, workflowName = "Default Workflow" }: ExportDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("json");

  const generateJSON = () => {
    // Serialize nodes without React components (icons)
    const serializableNodes = nodes.map(node => {
      const { icon, ...nodeDataWithoutIcon } = node.data;
      return {
        ...node,
        data: nodeDataWithoutIcon
      };
    });

    return JSON.stringify({
      name: workflowName,
      version: "1.0.0",
      created: new Date().toISOString(),
      nodes: serializableNodes,
      edges,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        exportedBy: "Workflow Builder"
      }
    }, null, 2);
  };

  const generateYAML = () => {
    const data = {
      name: workflowName,
      version: "1.0.0",
      created: new Date().toISOString(),
      nodes: nodes.map(node => {
        const { icon, ...nodeDataWithoutIcon } = node.data;
        return {
          id: node.id,
          type: node.type,
          position: node.position,
          data: nodeDataWithoutIcon
        };
      }),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type
      })),
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        exportedBy: "Workflow Builder"
      }
    };

    // Simple YAML conversion (basic implementation)
    const toYAML = (obj: any, indent = 0): string => {
      const spaces = '  '.repeat(indent);
      let yaml = '';
      
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          yaml += `${spaces}${key}:\n${toYAML(value, indent + 1)}`;
        } else if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          value.forEach((item) => {
            if (typeof item === 'object') {
              yaml += `${spaces}  - ${toYAML(item, indent + 2).trim()}\n`;
            } else {
              yaml += `${spaces}  - ${item}\n`;
            }
          });
        } else {
          yaml += `${spaces}${key}: ${typeof value === 'string' ? `"${value}"` : value}\n`;
        }
      });
      
      return yaml;
    };

    return toYAML(data);
  };

  const generateSQL = () => {
    // Serialize nodes and edges without React components
    const serializableNodes = nodes.map(node => {
      const { icon, ...nodeDataWithoutIcon } = node.data;
      return {
        ...node,
        data: nodeDataWithoutIcon
      };
    });

    const nodesJson = JSON.stringify(serializableNodes);
    const edgesJson = JSON.stringify(edges);
    const safeName = workflowName.replace(/'/g, "''");

    return `-- Workflow: ${workflowName}
-- Generated: ${new Date().toISOString()}
-- Nodes: ${nodes.length}, Edges: ${edges.length}

-- Insert or update the workflow definition
INSERT INTO "WorkflowDefinitions" (
  "Name",
  "Description",
  "Nodes",
  "Edges",
  "IsActive",
  "Version",
  "CreatedBy",
  "CreatedAt",
  "UpdatedAt",
  "IsDeleted"
) VALUES (
  '${safeName}',
  'Auto-generated workflow export',
  '${nodesJson.replace(/'/g, "''")}',
  '${edgesJson.replace(/'/g, "''")}',
  true,
  1,
  'system',
  NOW(),
  NOW(),
  false
)
ON CONFLICT ("Name") DO UPDATE SET
  "Nodes" = EXCLUDED."Nodes",
  "Edges" = EXCLUDED."Edges",
  "UpdatedAt" = NOW(),
  "Version" = "WorkflowDefinitions"."Version" + 1;

-- Register triggers for entity status changes
-- Offer Accepted → Create Sale
INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
SELECT id, 'trigger-offer-accepted', 'offer', 'pending', 'accepted', true, NOW()
FROM "WorkflowDefinitions" WHERE "Name" = '${safeName}'
ON CONFLICT DO NOTHING;

-- Sale In Progress → Create Service Order  
INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
SELECT id, 'trigger-sale-in-progress', 'sale', 'created', 'in_progress', true, NOW()
FROM "WorkflowDefinitions" WHERE "Name" = '${safeName}'
ON CONFLICT DO NOTHING;

-- Service Order Scheduled → Create Dispatch
INSERT INTO "WorkflowTriggers" ("WorkflowId", "NodeId", "EntityType", "FromStatus", "ToStatus", "IsActive", "CreatedAt")
SELECT id, 'trigger-job-planned', 'service_order', 'pending', 'scheduled', true, NOW()
FROM "WorkflowDefinitions" WHERE "Name" = '${safeName}'
ON CONFLICT DO NOTHING;
`;
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success(t('copiedToClipboard'));
    }).catch(() => {
      toast.error(t('copyError'));
    });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('fileDownloaded', { filename }));
  };

  const getContent = () => {
    switch (activeTab) {
      case "json":
        return generateJSON();
      case "yaml":
        return generateYAML();
      case "sql":
        return generateSQL();
      default:
        return "";
    }
  };

  const getFileExtension = () => {
    switch (activeTab) {
      case "json":
        return "json";
      case "yaml":
        return "yaml";
      case "sql":
        return "sql";
      default:
        return "txt";
    }
  };

  const getMimeType = () => {
    switch (activeTab) {
      case "json":
        return "application/json";
      case "yaml":
        return "text/yaml";
      case "sql":
        return "application/sql";
      default:
        return "text/plain";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('exportWorkflow')}
          </DialogTitle>
          <DialogDescription>
            {t('exportWorkflowDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="json" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="yaml" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              YAML
            </TabsTrigger>
            <TabsTrigger value="sql" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              SQL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="flex-1 flex flex-col">
            <div className="bg-muted/50 rounded-lg p-4 flex-1 overflow-auto max-h-[400px]">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {generateJSON()}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="yaml" className="flex-1 flex flex-col">
            <div className="bg-muted/50 rounded-lg p-4 flex-1 overflow-auto max-h-[400px]">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {generateYAML()}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="sql" className="flex-1 flex flex-col">
            <div className="bg-muted/50 rounded-lg p-4 flex-1 overflow-auto max-h-[400px]">
              <pre className="text-sm font-mono whitespace-pre-wrap text-xs">
                {generateSQL()}
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {t('exportFormat')}: {activeTab.toUpperCase()} • {nodes.length} {t('nodesLabel')} • {edges.length} {t('edges')}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(getContent())}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {t('copy')}
            </Button>
            <Button
              onClick={() => downloadFile(
                getContent(),
                `${workflowName.toLowerCase().replace(/\s+/g, '-')}.${getFileExtension()}`,
                getMimeType()
              )}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('download')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}