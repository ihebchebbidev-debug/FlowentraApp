using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.WorkflowEngine.Models;
using System.Text.Json;

namespace MyApi.Modules.WorkflowEngine.Services
{
    public class WorkflowTriggerService : IWorkflowTriggerService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<WorkflowTriggerService> _logger;
        private readonly IWorkflowNotificationService _notificationService;
        private readonly IServiceProvider _serviceProvider;

        public WorkflowTriggerService(
            ApplicationDbContext db, 
            ILogger<WorkflowTriggerService> logger,
            IWorkflowNotificationService notificationService,
            IServiceProvider serviceProvider)
        {
            _db = db;
            _logger = logger;
            _notificationService = notificationService;
            _serviceProvider = serviceProvider;
        }

        public async Task TriggerStatusChangeAsync(
            string entityType,
            int entityId,
            string oldStatus,
            string newStatus,
            string? userId = null,
            object? context = null)
        {
            _logger.LogInformation(
                "[WORKFLOW-TRIGGER] Status change detected: {EntityType} #{EntityId} from '{OldStatus}' to '{NewStatus}' (User: {UserId})",
                entityType, entityId, oldStatus, newStatus, userId ?? "system");

            // Log all registered triggers for this entity type for debugging
            var allTriggersForEntity = await _db.WorkflowTriggers
                .Include(t => t.Workflow)
                .Where(t => t.EntityType == entityType && t.IsActive)
                .ToListAsync();
            
            _logger.LogInformation(
                "[WORKFLOW-TRIGGER] Found {Count} registered triggers for {EntityType}. Checking matches...",
                allTriggersForEntity.Count, entityType);
            
            foreach (var t in allTriggersForEntity)
            {
                var fromMatch = t.FromStatus == null || t.FromStatus == oldStatus;
                var toMatch = t.ToStatus == null || t.ToStatus == newStatus;
                var workflowActive = t.Workflow == null || (t.Workflow.IsActive && !t.Workflow.IsDeleted);
                
                _logger.LogInformation(
                    "[WORKFLOW-TRIGGER] Trigger #{TriggerId} (Node: {NodeId}): FromStatus={From} (match: {FromMatch}), ToStatus={To} (match: {ToMatch}), WorkflowActive: {WorkflowActive}",
                    t.Id, t.NodeId, t.FromStatus ?? "ANY", fromMatch, t.ToStatus ?? "ANY", toMatch, workflowActive);
            }

            // Find matching triggers
            var triggers = await _db.WorkflowTriggers
                .Include(t => t.Workflow)
                .Where(t => t.IsActive 
                    && t.EntityType == entityType
                    && (t.Workflow == null || (t.Workflow.IsActive && !t.Workflow.IsDeleted))
                    && (t.FromStatus == null || t.FromStatus == oldStatus)
                    && (t.ToStatus == null || t.ToStatus == newStatus))
                .ToListAsync();

            if (!triggers.Any())
            {
                _logger.LogWarning(
                    "[WORKFLOW-TRIGGER] NO MATCHING triggers for {EntityType} #{EntityId}: '{OldStatus}' -> '{NewStatus}'. " +
                    "Check if trigger is registered with correct fromStatus/toStatus values.",
                    entityType, entityId, oldStatus, newStatus);
                return;
            }
            
            _logger.LogInformation(
                "[WORKFLOW-TRIGGER] {Count} triggers MATCHED for {EntityType} #{EntityId}",
                triggers.Count, entityType, entityId);

            _logger.LogInformation("Found {Count} matching triggers for {EntityType} {EntityId}", 
                triggers.Count, entityType, entityId);

            // Create execution for each matching workflow
            foreach (var trigger in triggers)
            {
                try
                {
                    var execution = new WorkflowExecution
                    {
                        WorkflowId = trigger.WorkflowId,
                        TriggerEntityType = entityType,
                        TriggerEntityId = entityId,
                        Status = "running",
                        CurrentNodeId = trigger.NodeId,
                        Context = JsonSerializer.Serialize(new
                        {
                            entityType,
                            entityId,
                            oldStatus,
                            newStatus,
                            triggeredAt = DateTime.UtcNow,
                            additionalContext = context
                        }),
                        StartedAt = DateTime.UtcNow,
                        TriggeredBy = userId
                    };

                    _db.WorkflowExecutions.Add(execution);
                    await _db.SaveChangesAsync();

                    // Notify clients that execution started
                    await _notificationService.NotifyExecutionStartedAsync(
                        trigger.WorkflowId, 
                        execution.Id, 
                        entityType, 
                        entityId, 
                        userId);

                    // Notify that trigger node is executing
                    await _notificationService.NotifyNodeExecutingAsync(
                        trigger.WorkflowId,
                        execution.Id,
                        trigger.NodeId,
                        "status-trigger");

                    // Log the trigger start
                    var triggerLog = new WorkflowExecutionLog
                    {
                        ExecutionId = execution.Id,
                        NodeId = trigger.NodeId,
                        NodeType = "status-trigger",
                        Status = "completed",
                        Input = JsonSerializer.Serialize(new { oldStatus, newStatus }),
                        Output = JsonSerializer.Serialize(new { triggered = true }),
                        Timestamp = DateTime.UtcNow
                    };

                    _db.WorkflowExecutionLogs.Add(triggerLog);
                    await _db.SaveChangesAsync();

                    // Notify that trigger node completed
                    await _notificationService.NotifyNodeCompletedAsync(
                        trigger.WorkflowId,
                        execution.Id,
                        trigger.NodeId,
                        "status-trigger",
                        true,
                        null,
                        JsonSerializer.Serialize(new { triggered = true }));

                    _logger.LogInformation(
                        "Created workflow execution {ExecutionId} for workflow {WorkflowId}",
                        execution.Id, trigger.WorkflowId);

                    // Execute the entire workflow graph
                    var executionContext = new WorkflowExecutionContext
                    {
                        WorkflowId = trigger.WorkflowId,
                        ExecutionId = execution.Id,
                        TriggerEntityType = entityType,
                        TriggerEntityId = entityId,
                        UserId = userId,
                        Variables = new Dictionary<string, object?>
                        {
                            ["oldStatus"] = oldStatus,
                            ["newStatus"] = newStatus,
                            ["entityId"] = entityId,
                            ["entityType"] = entityType,
                            ["additionalContext"] = context // Pass the full context including serviceOrderConfig
                        }
                    };

                    // Resolve the graph executor from service provider to avoid circular dependency
                    var graphExecutor = _serviceProvider.GetRequiredService<IWorkflowGraphExecutor>();
                    var graphResult = await graphExecutor.ExecuteGraphAsync(
                        trigger.WorkflowId,
                        execution.Id,
                        trigger.NodeId,
                        executionContext);

                    // Update execution status based on graph result
                    execution.Status = graphResult.FinalStatus;
                    execution.Error = graphResult.Error;
                    
                    if (graphResult.FinalStatus == "completed" || graphResult.FinalStatus == "failed")
                    {
                        execution.CompletedAt = DateTime.UtcNow;
                    }
                    
                    await _db.SaveChangesAsync();

                    // Notify that execution completed
                    await _notificationService.NotifyExecutionCompletedAsync(
                        trigger.WorkflowId,
                        execution.Id,
                        graphResult.FinalStatus,
                        graphResult.NodesExecuted,
                        graphResult.NodesFailed);

                    _logger.LogInformation(
                        "Workflow execution {ExecutionId} completed with status {Status}. Nodes: {Executed} executed, {Failed} failed, {Skipped} skipped",
                        execution.Id, graphResult.FinalStatus, graphResult.NodesExecuted, graphResult.NodesFailed, graphResult.NodesSkipped);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, 
                        "Error executing workflow {WorkflowId} for trigger {TriggerId}", 
                        trigger.WorkflowId, trigger.Id);

                    // Notify about the error
                    await _notificationService.NotifyExecutionErrorAsync(
                        trigger.WorkflowId,
                        0,
                        trigger.NodeId,
                        ex.Message);
                }
            }
        }

        public async Task<int> GetPendingExecutionsCountAsync(string entityType, int entityId)
        {
            return await _db.WorkflowExecutions
                .CountAsync(e => e.TriggerEntityType == entityType 
                    && e.TriggerEntityId == entityId 
                    && (e.Status == "running" || e.Status == "waiting_approval"));
        }

        public async Task<IEnumerable<WorkflowTriggerInfo>> GetActiveTriggersAsync(string entityType)
        {
            var triggers = await _db.WorkflowTriggers
                .Include(t => t.Workflow)
                .Where(t => t.IsActive 
                    && t.EntityType == entityType
                    && t.Workflow != null 
                    && t.Workflow.IsActive 
                    && !t.Workflow.IsDeleted)
                .ToListAsync();

            return triggers.Select(t => new WorkflowTriggerInfo
            {
                TriggerId = t.Id,
                WorkflowId = t.WorkflowId,
                WorkflowName = t.Workflow?.Name ?? "",
                EntityType = t.EntityType,
                FromStatus = t.FromStatus,
                ToStatus = t.ToStatus,
                IsActive = t.IsActive
            });
        }
    }
}
