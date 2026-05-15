namespace MyApi.Modules.WorkflowEngine.Services
{
    /// <summary>
    /// Traverses and executes the workflow graph from a starting node
    /// </summary>
    public interface IWorkflowGraphExecutor
    {
        /// <summary>
        /// Execute the entire workflow graph starting from a trigger node
        /// </summary>
        Task<GraphExecutionResult> ExecuteGraphAsync(
            int workflowId,
            int executionId,
            string startNodeId,
            WorkflowExecutionContext context);
    }

    /// <summary>
    /// Result of executing the entire workflow graph
    /// </summary>
    public class GraphExecutionResult
    {
        public bool Success { get; set; }
        public string FinalStatus { get; set; } = "completed";
        public string? Error { get; set; }
        public int NodesExecuted { get; set; }
        public int NodesFailed { get; set; }
        public int NodesSkipped { get; set; }
        public int TotalDurationMs { get; set; }
        public List<NodeExecutionSummary> NodeResults { get; set; } = new();
    }

    public class NodeExecutionSummary
    {
        public string NodeId { get; set; } = string.Empty;
        public string NodeType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int DurationMs { get; set; }
        public string? Error { get; set; }
    }
}
