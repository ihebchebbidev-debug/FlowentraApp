/**
 * Transforms backend workflow nodes to use frontend n8n-style node types
 * Maps node types from database schema to React Flow node types
 */
import { Node, Edge } from '@xyflow/react';
import { 
  Users, FileText, DollarSign, ShoppingCart, Truck, GitBranch,
  Play, Zap, Mail, Send, Sparkles, Brain, Bot, Webhook, Calendar,
  Database, Settings, RotateCcw, Split, Shield, Plus, Code
} from 'lucide-react';

// Entity type to icon mapping
const entityIcons: Record<string, React.ComponentType<any>> = {
  offer: FileText,
  sale: DollarSign,
  service_order: ShoppingCart,
  dispatch: Truck,
  contact: Users,
};

// Node type to icon mapping for non-entity nodes
const nodeIcons: Record<string, React.ComponentType<any>> = {
  'if-else': GitBranch,
  'switch': GitBranch,
  'condition': GitBranch,
  'trigger': Play,
  'webhook': Webhook,
  'scheduled': Calendar,
  'email': Mail,
  'email-template': Send,
  'email-llm': Sparkles,
  'llm-writer': Brain,
  'llm-analyzer': Bot,
  'llm-personalizer': Sparkles,
  'database': Database,
  'loop': RotateCcw,
  'parallel': Split,
  'try-catch': Shield,
  'code': Code,
  'javascript': Code,
  'default': Zap,
};

// Determine the frontend node type based on backend node data
function getReactFlowNodeType(backendType: string, nodeData: any): string {
  // Trigger nodes — any type containing "trigger" with status fields
  if (backendType.includes('status-trigger') || 
      (backendType.includes('-trigger') && (nodeData?.fromStatus !== undefined || nodeData?.toStatus !== undefined))) {
    return 'entityTrigger';
  }
  
  // Condition nodes
  if (backendType === 'if-else' || backendType === 'switch' || backendType === 'condition') {
    return 'conditionNode';
  }
  
  // Entity action nodes — detect by config properties or known entity types
  const entityNames = ['offer', 'sale', 'service-order', 'service_order', 'dispatch', 'contact'];
  const isEntityType = entityNames.some(e => backendType === e || backendType.includes(`update-${e}`) || backendType.includes(`create-${e}`));
  
  if (isEntityType) {
    // Status triggers already handled above, so anything remaining is an action
    if (backendType.includes('trigger')) return 'entityTrigger';
    return 'entityAction';
  }
  
  // Check config hints for action detection
  if (nodeData?.config?.autoCreate || nodeData?.config?.newStatus || nodeData?.config?.createPerService) {
    const entityType = getEntityType(backendType);
    if (entityType) return 'entityAction';
  }
  
  // Default to n8n base node — works for any custom/unknown type
  return 'n8nNode';
}

// Determine entity type from node type
function getEntityType(nodeType: string): string | undefined {
  if (nodeType.includes('offer')) return 'offer';
  if (nodeType.includes('sale')) return 'sale';
  if (nodeType.includes('service-order') || nodeType.includes('service_order')) return 'service_order';
  if (nodeType.includes('dispatch')) return 'dispatch';
  if (nodeType.includes('contact')) return 'contact';
  return undefined;
}

// Determine action type from node type
function getActionType(nodeType: string): 'create' | 'update' | 'update-status' | undefined {
  if (nodeType.includes('create') || nodeType === 'sale' || nodeType === 'service-order' || nodeType === 'dispatch') {
    return 'create';
  }
  if (nodeType.includes('update-') && nodeType.includes('-status')) {
    return 'update-status';
  }
  if (nodeType.includes('update')) {
    return 'update';
  }
  return undefined;
}

// Get icon for a node type
function getNodeIcon(nodeType: string, entityType?: string): React.ComponentType<any> {
  if (entityType && entityIcons[entityType]) {
    return entityIcons[entityType];
  }
  
  // Check direct type match
  if (nodeIcons[nodeType]) {
    return nodeIcons[nodeType];
  }
  
  // Check partial match for entity types
  const entity = getEntityType(nodeType);
  if (entity && entityIcons[entity]) {
    return entityIcons[entity];
  }
  
  return nodeIcons.default;
}

/**
 * Transform a single backend node to frontend n8n-style format
 */
export function transformBackendNode(backendNode: any): Node {
  const nodeData = backendNode.data || {};
  const nodeType = nodeData.type || backendNode.type || '';
  
  // Determine the React Flow node type
  const reactFlowType = getReactFlowNodeType(nodeType, nodeData);
  
  // Determine entity type
  const entityType = getEntityType(nodeType);
  
  // Get appropriate icon
  const icon = getNodeIcon(nodeType, entityType);
  
  // Determine action type for action nodes - check saved data first, then infer
  const actionType = nodeData.actionType || getActionType(nodeType);
  
  // Merge config fields to top-level so both frontend display and backend executor can read them
  const config = nodeData.config || {};
  
  // Build the transformed node
  const transformedNode: Node = {
    id: backendNode.id,
    type: reactFlowType,
    position: backendNode.position || { x: 0, y: 0 },
    data: {
      ...nodeData,
      // Ensure required fields are present
      label: nodeData.label || nodeType,
      type: nodeType,
      icon,
      // Entity-specific fields
      entityType: entityType || nodeData.entityType,
      // Trigger-specific fields (check both top-level and config)
      fromStatus: nodeData.fromStatus ?? config.fromStatus,
      toStatus: nodeData.toStatus ?? config.toStatus,
      // Action-specific fields
      actionType: actionType || nodeData.actionType,
      newStatus: nodeData.newStatus ?? config.newStatus,
      autoCreate: nodeData.autoCreate ?? config.autoCreate,
      createPerService: nodeData.createPerService ?? config.createPerService,
      // Condition fields
      field: nodeData.field ?? config.field,
      operator: nodeData.operator ?? config.operator,
      value: nodeData.value ?? config.value,
      // Notification/Approval fields
      title: nodeData.title ?? config.title ?? config.notificationTitle ?? config.approvalTitle,
      message: nodeData.message ?? config.message ?? config.notificationMessage ?? config.approvalMessage,
      approverRole: nodeData.approverRole ?? config.approverRole,
      timeoutHours: nodeData.timeoutHours ?? config.timeoutHours,
      requiresApproval: nodeData.requiresApproval ?? config.requiresApproval,
      recipientType: nodeData.recipientType ?? config.recipientType,
      // Email fields
      subject: nodeData.subject ?? config.subject ?? config.emailSubject,
      template: nodeData.template ?? config.template ?? config.emailTemplate,
      // Config passthrough
      config: config,
      // Execution state (default to idle)
      executionState: nodeData.executionState || 'idle',
    },
  };
  
  return transformedNode;
}

/**
 * Transform an array of backend nodes to frontend format
 */
export function transformBackendNodes(backendNodes: any[]): Node[] {
  return backendNodes.map(transformBackendNode);
}

/**
 * Transform backend edges (usually just need to ensure proper typing)
 */
export function transformBackendEdges(backendEdges: any[]): Edge[] {
  return backendEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'smoothstep',
    animated: edge.animated ?? true,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
    data: edge.data,
  }));
}

/**
 * Transform complete workflow from backend format
 */
export function transformWorkflowFromBackend(workflow: {
  nodes: string | any[];
  edges: string | any[];
}): { nodes: Node[]; edges: Edge[] } {
  let parsedNodes: any[] = [];
  let parsedEdges: any[] = [];
  
  try {
    parsedNodes = typeof workflow.nodes === 'string' 
      ? JSON.parse(workflow.nodes) 
      : workflow.nodes;
    parsedEdges = typeof workflow.edges === 'string' 
      ? JSON.parse(workflow.edges) 
      : workflow.edges;
  } catch (e) {
    console.error('Failed to parse workflow data:', e);
    return { nodes: [], edges: [] };
  }
  
  return {
    nodes: transformBackendNodes(parsedNodes),
    edges: transformBackendEdges(parsedEdges),
  };
}
