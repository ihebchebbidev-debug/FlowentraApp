import { Node, Edge } from '@xyflow/react';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class WorkflowValidator {
  static validateWorkflow(nodes: Node[], edges: Edge[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (nodes.length === 0) {
      errors.push("The workflow must contain at least one node");
      return { isValid: false, errors, warnings };
    }

    // Check for trigger nodes
    const triggerNodes = nodes.filter(node => {
      const nodeData = node.data as any;
      const nodeType = nodeData.type || '';
      return ['trigger', 'webhook', 'scheduled'].includes(nodeType) || 
             nodeType.includes('-trigger') || 
             nodeType.includes('trigger') ||
             nodeData.isTrigger === true;
    });
    
    if (triggerNodes.length === 0) {
      warnings.push("It's recommended to have at least one trigger in the workflow");
    }

    // Check for orphaned nodes (nodes without incoming or outgoing connections)
    const connectedNodeIds = new Set<string>();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const orphanedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
    if (orphanedNodes.length > 0 && nodes.length > 1) {
      warnings.push(`${orphanedNodes.length} isolated node(s): ${orphanedNodes.map(n => (n.data as any).label || n.id).join(', ')}`);
    }

    // Check for cycles — but EXCLUDE intentional loop nodes
    const loopNodeIds = new Set(
      nodes
        .filter(n => {
          const t = (n.data as any).type || '';
          return t === 'loop' || t === 'while' || t === 'forEach';
        })
        .map(n => n.id)
    );
    
    if (this.hasUnintentionalCycles(nodes, edges, loopNodeIds)) {
      errors.push("The workflow contains unintentional cycles (outside loop nodes)");
    }

    // Validate conditional nodes have proper outputs
    const conditionalNodes = nodes.filter(node => {
      const nodeData = node.data as any;
      return ['if-else', 'switch', 'condition'].includes(nodeData.type);
    });

    conditionalNodes.forEach(node => {
      const outgoingEdges = edges.filter(edge => edge.source === node.id);
      const nodeType = (node.data as any).type;
      
      if (nodeType === 'if-else') {
        const hasYes = outgoingEdges.some(e => e.sourceHandle === 'yes');
        const hasNo = outgoingEdges.some(e => e.sourceHandle === 'no');
        if (!hasYes && !hasNo) {
          warnings.push(`IF/ELSE "${(node.data as any).label}" has no outputs connected`);
        } else if (!hasYes) {
          warnings.push(`IF/ELSE "${(node.data as any).label}" missing "Yes" branch`);
        } else if (!hasNo) {
          warnings.push(`IF/ELSE "${(node.data as any).label}" missing "No" branch`);
        }
      }
      
      if (nodeType === 'switch' && outgoingEdges.length < 2) {
        warnings.push(`SWITCH "${(node.data as any).label}" should have at least 2 outputs`);
      }
    });

    // Validate parallel nodes
    const parallelNodes = nodes.filter(node => (node.data as any).type === 'parallel');
    parallelNodes.forEach(node => {
      const outgoingEdges = edges.filter(edge => edge.source === node.id);
      if (outgoingEdges.length < 2) {
        warnings.push(`Parallel "${(node.data as any).label}" should have at least 2 outputs`);
      }
    });

    // Check for unreachable nodes from triggers
    if (triggerNodes.length > 0) {
      const reachableNodes = this.findReachableNodes(nodes, edges, triggerNodes);
      const unreachableNodes = nodes.filter(node => !reachableNodes.has(node.id));
      if (unreachableNodes.length > 0) {
        warnings.push(`${unreachableNodes.length} node(s) not reachable from triggers`);
      }
    }

    // Validate node configurations
    nodes.forEach(node => {
      const nodeData = node.data as any;
      const configErrors = this.validateNodeConfiguration(nodeData);
      errors.push(...configErrors);
    });

    // Validate no duplicate edges
    const edgeKeys = new Set<string>();
    edges.forEach(edge => {
      const key = `${edge.source}:${edge.sourceHandle || 'default'}->${edge.target}:${edge.targetHandle || 'default'}`;
      if (edgeKeys.has(key)) {
        warnings.push(`Duplicate connection detected`);
      }
      edgeKeys.add(key);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if a proposed connection is valid
   */
  static isValidConnection(
    source: string, 
    target: string, 
    sourceHandle: string | null, 
    nodes: Node[], 
    edges: Edge[]
  ): { valid: boolean; reason?: string } {
    // Cannot connect to self
    if (source === target) {
      return { valid: false, reason: 'Cannot connect a node to itself' };
    }

    // Cannot create duplicate connections
    const exists = edges.some(e => 
      e.source === source && 
      e.target === target && 
      (e.sourceHandle || null) === sourceHandle
    );
    if (exists) {
      return { valid: false, reason: 'Connection already exists' };
    }

    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    if (!sourceNode || !targetNode) return { valid: false, reason: 'Node not found' };

    const targetType = (targetNode.data as any).type || '';
    const sourceType = (sourceNode.data as any).type || '';

    // Triggers should not have incoming connections
    if (targetType.includes('trigger') || (targetNode.data as any).isTrigger) {
      return { valid: false, reason: 'Triggers cannot receive incoming connections' };
    }

    // Check if connecting would create a cycle (excluding loops)
    const loopNodeIds = new Set(
      nodes.filter(n => ['loop', 'while', 'forEach'].includes((n.data as any).type || '')).map(n => n.id)
    );
    const testEdges = [...edges, { id: 'test', source, target, sourceHandle } as Edge];
    if (this.hasUnintentionalCycles(nodes, testEdges, loopNodeIds)) {
      return { valid: false, reason: 'This connection would create a cycle' };
    }

    return { valid: true };
  }

  private static validateNodeConfiguration(nodeData: any): string[] {
    const errors: string[] = [];
    const config = nodeData.config;

    if (!config) return errors;

    // Validate email nodes
    if (nodeData.type.includes('email') && config.emailData) {
      if (!config.emailData.subject?.trim()) {
        errors.push(`Email "${nodeData.label}" must have a subject`);
      }
    }

    // Validate API nodes
    if ((nodeData.type === 'api' || nodeData.type === 'http-request') && config.url) {
      try {
        new URL(config.url);
      } catch {
        errors.push(`API "${nodeData.label}" has an invalid URL`);
      }
    }

    return errors;
  }

  /**
   * Detect cycles that are NOT part of intentional loop nodes
   */
  private static hasUnintentionalCycles(nodes: Node[], edges: Edge[], loopNodeIds: Set<string>): boolean {
    // Filter out edges that go back to loop nodes (intentional back-edges)
    const filteredEdges = edges.filter(e => !loopNodeIds.has(e.target) || !loopNodeIds.has(e.source));
    
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoing = filteredEdges.filter(e => e.source === nodeId);
      for (const edge of outgoing) {
        if (dfs(edge.target)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }

    return false;
  }

  private static findReachableNodes(nodes: Node[], edges: Edge[], startNodes: Node[]): Set<string> {
    const reachable = new Set<string>();
    const queue = [...startNodes.map(n => n.id)];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (reachable.has(nodeId)) continue;

      reachable.add(nodeId);
      
      edges
        .filter(e => e.source === nodeId)
        .forEach(e => {
          if (!reachable.has(e.target)) queue.push(e.target);
        });
    }

    return reachable;
  }

  /**
   * Get execution order respecting conditional branches, parallel splits, and topological order.
   * Returns an array of "steps" where each step is an array of node IDs to execute in parallel.
   */
  static getExecutionSteps(nodes: Node[], edges: Edge[]): string[][] {
    if (nodes.length === 0) return [];

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Initialize
    nodes.forEach(n => {
      inDegree.set(n.id, 0);
      adjList.set(n.id, []);
    });

    // Build adjacency
    edges.forEach(e => {
      if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
        adjList.get(e.source)!.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    });

    // Kahn's algorithm - topological sort with parallel grouping
    const steps: string[][] = [];
    let currentLevel = nodes
      .filter(n => inDegree.get(n.id) === 0)
      .map(n => n.id);

    const visited = new Set<string>();

    while (currentLevel.length > 0) {
      steps.push([...currentLevel]);
      currentLevel.forEach(id => visited.add(id));

      const nextLevel: string[] = [];
      for (const nodeId of currentLevel) {
        for (const neighbor of (adjList.get(nodeId) || [])) {
          const newDegree = (inDegree.get(neighbor) || 1) - 1;
          inDegree.set(neighbor, newDegree);
          if (newDegree === 0 && !visited.has(neighbor)) {
            nextLevel.push(neighbor);
          }
        }
      }
      currentLevel = nextLevel;
    }

    // Add any unvisited nodes (disconnected)
    const remaining = nodes.filter(n => !visited.has(n.id)).map(n => n.id);
    if (remaining.length > 0) {
      steps.push(remaining);
    }

    return steps;
  }
}
