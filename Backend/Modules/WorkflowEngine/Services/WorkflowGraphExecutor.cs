using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.WorkflowEngine.Models;
using System.Diagnostics;
using System.Text.Json;

namespace MyApi.Modules.WorkflowEngine.Services
{
    public class WorkflowGraphExecutor : IWorkflowGraphExecutor
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<WorkflowGraphExecutor> _logger;
        private readonly IWorkflowNodeExecutor _nodeExecutor;
        private readonly IWorkflowNotificationService _notificationService;

        public WorkflowGraphExecutor(
            ApplicationDbContext db,
            ILogger<WorkflowGraphExecutor> logger,
            IWorkflowNodeExecutor nodeExecutor,
            IWorkflowNotificationService notificationService)
        {
            _db = db;
            _logger = logger;
            _nodeExecutor = nodeExecutor;
            _notificationService = notificationService;
        }

        public async Task<GraphExecutionResult> ExecuteGraphAsync(
            int workflowId,
            int executionId,
            string startNodeId,
            WorkflowExecutionContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new GraphExecutionResult();

            try
            {
                // Load workflow definition
                var workflow = await _db.WorkflowDefinitions
                    .FirstOrDefaultAsync(w => w.Id == workflowId && !w.IsDeleted);

                if (workflow == null)
                {
                    return new GraphExecutionResult
                    {
                        Success = false,
                        FinalStatus = "failed",
                        Error = $"Workflow {workflowId} not found"
                    };
                }

                // Parse nodes and edges
                var nodes = ParseNodes(workflow.Nodes);
                var edges = ParseEdges(workflow.Edges);

                if (!nodes.Any())
                {
                    return new GraphExecutionResult
                    {
                        Success = false,
                        FinalStatus = "failed",
                        Error = "Workflow has no nodes"
                    };
                }

                _logger.LogInformation(
                    "Starting graph execution for workflow {WorkflowId} with {NodeCount} nodes and {EdgeCount} edges",
                    workflowId, nodes.Count, edges.Count);

                // Build adjacency map for graph traversal
                var adjacencyMap = BuildAdjacencyMap(edges);
                var executed = new HashSet<string>();
                var queue = new Queue<string>();

                // Start from the trigger node
                queue.Enqueue(startNodeId);

                while (queue.Count > 0)
                {
                    var currentNodeId = queue.Dequeue();

                    if (executed.Contains(currentNodeId))
                    {
                        _logger.LogDebug("[WORKFLOW-GRAPH] Skipping already executed node: {NodeId}", currentNodeId);
                        continue;
                    }

                    var node = nodes.FirstOrDefault(n => n.Id == currentNodeId);
                    if (node == null)
                    {
                        _logger.LogWarning("[WORKFLOW-GRAPH] Node {NodeId} not found in workflow definition!", currentNodeId);
                        continue;
                    }

                    _logger.LogInformation(
                        "[WORKFLOW-GRAPH] Executing node: {NodeId} (Type: {NodeType}, Label: {Label})",
                        node.Id, node.Type, node.Label);

                    executed.Add(currentNodeId);

                    // Notify that node is executing
                    await _notificationService.NotifyNodeExecutingAsync(
                        workflowId, executionId, node.Id, node.Type);

                    // Execute the node
                    var nodeResult = await _nodeExecutor.ExecuteNodeAsync(executionId, node, context);

                    // Log the execution
                    await LogNodeExecutionAsync(executionId, node, nodeResult);

                    // Add to results
                    result.NodeResults.Add(new NodeExecutionSummary
                    {
                        NodeId = node.Id,
                        NodeType = node.Type,
                        Status = nodeResult.Status,
                        DurationMs = nodeResult.DurationMs,
                        Error = nodeResult.Error
                    });

                    if (nodeResult.Success)
                    {
                        result.NodesExecuted++;

                        // Store output for downstream nodes
                        context.NodeOutputs[$"{node.Id}.output"] = nodeResult.Output;
                        
                        // If entity was created, store in context
                        if (nodeResult.CreatedEntityId.HasValue)
                        {
                            context.Variables[$"created_{nodeResult.CreatedEntityType}_id"] = nodeResult.CreatedEntityId.Value;
                        }
                    }
                    else
                    {
                        result.NodesFailed++;
                    }

                    // Notify that node completed
                    await _notificationService.NotifyNodeCompletedAsync(
                        workflowId,
                        executionId,
                        node.Id,
                        node.Type,
                        nodeResult.Success,
                        nodeResult.Error,
                        JsonSerializer.Serialize(nodeResult.Output));

                    // Check if we should stop
                    if (nodeResult.ShouldStop)
                    {
                        _logger.LogInformation(
                            "Execution stopped at node {NodeId} with status {Status}",
                            node.Id, nodeResult.Status);
                        
                        result.FinalStatus = nodeResult.Status;
                        break;
                    }

                    // Check for failure
                    if (!nodeResult.Success)
                    {
                        _logger.LogWarning("Node {NodeId} failed: {Error}", node.Id, nodeResult.Error);
                        result.FinalStatus = "failed";
                        result.Error = nodeResult.Error;
                        break;
                    }

                    // Determine next nodes based on node type and result
                    var nextNodes = GetNextNodes(node, nodeResult, edges, adjacencyMap);
                    
                    _logger.LogInformation(
                        "[WORKFLOW-GRAPH] Node {NodeId} completed. Next nodes: [{NextNodes}] (Branch: {Branch})",
                        node.Id, 
                        string.Join(", ", nextNodes),
                        nodeResult.SelectedBranch ?? "N/A");
                    
                    foreach (var nextNodeId in nextNodes)
                    {
                        if (!executed.Contains(nextNodeId))
                        {
                            _logger.LogDebug("[WORKFLOW-GRAPH] Queueing next node: {NextNodeId}", nextNodeId);
                            queue.Enqueue(nextNodeId);
                        }
                    }
                    
                    // Handle loop nodes: if node is a loop and has iterations remaining,
                    // re-queue its children for the next iteration
                    if (node.Type.Contains("loop") && nodeResult.Success)
                    {
                        var iterKey = $"{node.Id}_iteration";
                        var maxKey = $"{node.Id}_maxIterations";
                        var currentIter = 0;
                        var maxIter = 1;
                        
                        if (context.Variables.TryGetValue(iterKey, out var iterVal))
                            currentIter = iterVal is int i ? i : (int)(iterVal is double d ? d : 0);
                        if (context.Variables.TryGetValue(maxKey, out var maxVal))
                            maxIter = maxVal is int mi ? mi : (int)(maxVal is double md ? md : 1);
                        
                        currentIter++;
                        context.Variables[iterKey] = currentIter;
                        
                        if (currentIter < maxIter)
                        {
                            // Re-allow child nodes to be executed again
                            foreach (var nextNodeId in nextNodes)
                            {
                                executed.Remove(nextNodeId);
                                queue.Enqueue(nextNodeId);
                            }
                            // Also re-allow the loop node itself for next check
                            executed.Remove(node.Id);
                        }
                    }
                }
                
                // Mark skipped nodes
                result.NodesSkipped = nodes.Count - executed.Count;
                result.Success = result.NodesFailed == 0;

                // Set final status to "completed" if no node explicitly set it and there were no failures
                if (result.Success && string.IsNullOrEmpty(result.FinalStatus))
                {
                    result.FinalStatus = "completed";
                }

                _logger.LogInformation(
                    "Graph execution finished with status '{Status}': {Executed} executed, {Failed} failed, {Skipped} skipped",
                    result.FinalStatus, result.NodesExecuted, result.NodesFailed, result.NodesSkipped);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing workflow graph");
                result.Success = false;
                result.FinalStatus = "failed";
                result.Error = ex.Message;
            }

            stopwatch.Stop();
            result.TotalDurationMs = (int)stopwatch.ElapsedMilliseconds;

            return result;
        }

        private List<WorkflowNode> ParseNodes(string nodesJson)
        {
            try
            {
                var jsonNodes = JsonSerializer.Deserialize<List<JsonElement>>(nodesJson);
                if (jsonNodes == null) return new List<WorkflowNode>();

                return jsonNodes.Select(ParseNodeFromJson).Where(n => n != null).Cast<WorkflowNode>().ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing nodes JSON");
                return new List<WorkflowNode>();
            }
        }

        private WorkflowNode? ParseNodeFromJson(JsonElement element)
        {
            try
            {
                var node = new WorkflowNode
                {
                    Id = element.TryGetProperty("id", out var idEl) ? idEl.GetString() ?? "" : "",
                    // Read React Flow type as fallback
                    Type = element.TryGetProperty("type", out var typeEl) ? typeEl.GetString() ?? "" : "",
                    Label = ""
                };

                if (element.TryGetProperty("position", out var posEl))
                {
                    node.Position = new NodePosition
                    {
                        X = posEl.TryGetProperty("x", out var xEl) ? xEl.GetDouble() : 0,
                        Y = posEl.TryGetProperty("y", out var yEl) ? yEl.GetDouble() : 0
                    };
                }

                if (element.TryGetProperty("data", out var dataEl))
                {
                    node.Label = dataEl.TryGetProperty("label", out var labelEl) ? labelEl.GetString() ?? "" : "";
                    
                    // CRITICAL: Use business type from data.type instead of React Flow node type
                    // React Flow types are "entityTrigger", "entityAction", "conditionNode", "n8nNode"
                    // Business types are "offer-status-trigger", "sale", "if-else", etc.
                    if (dataEl.TryGetProperty("type", out var dataTypeEl))
                    {
                        var businessType = dataTypeEl.GetString();
                        if (!string.IsNullOrEmpty(businessType))
                        {
                            node.Type = businessType;
                        }
                    }
                    
                    // Parse all data properties
                    foreach (var prop in dataEl.EnumerateObject())
                    {
                        node.Data[prop.Name] = prop.Value.Clone();
                    }
                }

                return node;
            }
            catch
            {
                return null;
            }
        }

        private List<WorkflowEdge> ParseEdges(string edgesJson)
        {
            try
            {
                var jsonEdges = JsonSerializer.Deserialize<List<JsonElement>>(edgesJson);
                if (jsonEdges == null) return new List<WorkflowEdge>();

                return jsonEdges.Select(ParseEdgeFromJson).Where(e => e != null).Cast<WorkflowEdge>().ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing edges JSON");
                return new List<WorkflowEdge>();
            }
        }

        private WorkflowEdge? ParseEdgeFromJson(JsonElement element)
        {
            try
            {
                return new WorkflowEdge
                {
                    Id = element.TryGetProperty("id", out var idEl) ? idEl.GetString() ?? "" : "",
                    Source = element.TryGetProperty("source", out var srcEl) ? srcEl.GetString() ?? "" : "",
                    Target = element.TryGetProperty("target", out var tgtEl) ? tgtEl.GetString() ?? "" : "",
                    SourceHandle = element.TryGetProperty("sourceHandle", out var srcHEl) ? srcHEl.GetString() : null,
                    TargetHandle = element.TryGetProperty("targetHandle", out var tgtHEl) ? tgtHEl.GetString() : null,
                    Label = element.TryGetProperty("label", out var lblEl) ? lblEl.GetString() : null
                };
            }
            catch
            {
                return null;
            }
        }

        private Dictionary<string, List<WorkflowEdge>> BuildAdjacencyMap(List<WorkflowEdge> edges)
        {
            var map = new Dictionary<string, List<WorkflowEdge>>();

            foreach (var edge in edges)
            {
                if (!map.ContainsKey(edge.Source))
                {
                    map[edge.Source] = new List<WorkflowEdge>();
                }
                map[edge.Source].Add(edge);
            }

            return map;
        }

        private List<string> GetNextNodes(
            WorkflowNode node,
            NodeExecutionResult result,
            List<WorkflowEdge> edges,
            Dictionary<string, List<WorkflowEdge>> adjacencyMap)
        {
            var nextNodes = new List<string>();

            if (!adjacencyMap.TryGetValue(node.Id, out var outgoingEdges))
            {
                return nextNodes;
            }

            // For condition nodes, filter by branch
            if (node.Type.Contains("condition") || node.Type.Contains("if-"))
            {
                var selectedBranch = result.SelectedBranch?.ToLower() ?? "yes";
                
                // Normalize to yes/no for consistent matching
                if (selectedBranch == "true") selectedBranch = "yes";
                if (selectedBranch == "false") selectedBranch = "no";
                
                foreach (var edge in outgoingEdges)
                {
                    var handle = edge.SourceHandle?.ToLower() ?? "";
                    var label = edge.Label?.ToLower() ?? "";

                    // Match by handle or label (now using normalized yes/no)
                    if (handle == selectedBranch || label == selectedBranch)
                    {
                        nextNodes.Add(edge.Target);
                    }
                }

                // If no specific match found and yes, follow all edges as fallback
                if (!nextNodes.Any() && selectedBranch == "yes")
                {
                    nextNodes.AddRange(outgoingEdges.Select(e => e.Target));
                }
            }
            // For switch nodes, filter by case
            else if (node.Type.Contains("switch"))
            {
                var selectedCase = result.SelectedCase?.ToLower() ?? "default";
                var matchedCase = false;

                foreach (var edge in outgoingEdges)
                {
                    var handle = edge.SourceHandle?.ToLower() ?? "";
                    var label = edge.Label?.ToLower() ?? "";

                    // Match the specific case handle (handle ID = case value)
                    if (handle == selectedCase || label == selectedCase)
                    {
                        nextNodes.Add(edge.Target);
                        matchedCase = true;
                    }
                }

                // Only follow default if no specific case matched
                if (!matchedCase)
                {
                    foreach (var edge in outgoingEdges)
                    {
                        var handle = edge.SourceHandle?.ToLower() ?? "";
                        if (handle == "default")
                        {
                            nextNodes.Add(edge.Target);
                        }
                    }
                }
            }
            // For regular nodes, follow all outgoing edges
            else
            {
                nextNodes.AddRange(outgoingEdges.Select(e => e.Target));
            }

            return nextNodes;
        }

        private async Task LogNodeExecutionAsync(int executionId, WorkflowNode node, NodeExecutionResult result)
        {
            try
            {
                var log = new WorkflowExecutionLog
                {
                    ExecutionId = executionId,
                    NodeId = node.Id,
                    NodeType = node.Type,
                    Status = result.Status,
                    Input = JsonSerializer.Serialize(node.Data),
                    Output = JsonSerializer.Serialize(result.Output),
                    Error = result.Error,
                    Duration = result.DurationMs,
                    Timestamp = DateTime.UtcNow
                };

                _db.WorkflowExecutionLogs.Add(log);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to log node execution for {NodeId}", node.Id);
            }
        }
    }
}
