using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.WorkflowEngine.DTOs;
using MyApi.Modules.WorkflowEngine.Models;
using System.Text.Json;

namespace MyApi.Modules.WorkflowEngine.Services
{
    public class WorkflowEngineService : IWorkflowEngineService
    {
        private readonly ApplicationDbContext _db;

        public WorkflowEngineService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<WorkflowDefinitionDto>> GetAllWorkflowsAsync()
        {
            var workflows = await _db.WorkflowDefinitions
                .Where(w => !w.IsDeleted)
                .Include(w => w.Triggers)
                .Include(w => w.Executions)
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();

            return workflows.Select(MapToDto);
        }

        public async Task<WorkflowDefinitionDto?> GetWorkflowByIdAsync(int id)
        {
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Triggers)
                .Include(w => w.Executions)
                .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);

            return workflow == null ? null : MapToDto(workflow);
        }

        /// <summary>
        /// Gets the default workflow (Name = 'Default Business Workflow', IsActive = true)
        /// This workflow is application-wide and always running
        /// </summary>
        public async Task<WorkflowDefinitionDto?> GetDefaultWorkflowAsync()
        {
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Triggers)
                .Include(w => w.Executions)
                .FirstOrDefaultAsync(w => 
                    w.Name == "Default Business Workflow" 
                    && w.IsActive 
                    && !w.IsDeleted);

            return workflow == null ? null : MapToDto(workflow);
        }

        public async Task<WorkflowDefinitionDto> CreateWorkflowAsync(CreateWorkflowDto dto, string createdBy)
        {
            var workflow = new WorkflowDefinition
            {
                Name = dto.Name,
                Description = dto.Description,
                Nodes = JsonSerializer.Serialize(dto.Nodes),
                Edges = JsonSerializer.Serialize(dto.Edges),
                IsActive = dto.IsActive,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
            };

            _db.WorkflowDefinitions.Add(workflow);
            await _db.SaveChangesAsync();

            // Extract and register triggers from nodes
            await ExtractAndRegisterTriggersAsync(workflow);

            return MapToDto(workflow);
        }

        public async Task<WorkflowDefinitionDto?> UpdateWorkflowAsync(int id, UpdateWorkflowDto dto, string modifiedBy)
        {
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Triggers)
                .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);

            if (workflow == null) return null;

            if (dto.Name != null) workflow.Name = dto.Name;
            if (dto.Description != null) workflow.Description = dto.Description;
            if (dto.Nodes != null) workflow.Nodes = JsonSerializer.Serialize(dto.Nodes);
            if (dto.Edges != null) workflow.Edges = JsonSerializer.Serialize(dto.Edges);
            if (dto.IsActive.HasValue) workflow.IsActive = dto.IsActive.Value;

            workflow.UpdatedAt = DateTime.UtcNow;
            workflow.ModifiedBy = modifiedBy;
            workflow.Version++;

            await _db.SaveChangesAsync();

            // Re-extract and register triggers if nodes changed
            if (dto.Nodes != null)
            {
                // Remove old triggers
                _db.WorkflowTriggers.RemoveRange(workflow.Triggers);
                await _db.SaveChangesAsync();
                
                // Register new triggers
                await ExtractAndRegisterTriggersAsync(workflow);
            }

            return MapToDto(workflow);
        }

        public async Task<bool> DeleteWorkflowAsync(int id)
        {
            var workflow = await _db.WorkflowDefinitions.FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);
            if (workflow == null) return false;

            workflow.IsDeleted = true;
            workflow.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ActivateWorkflowAsync(int id)
        {
            var workflow = await _db.WorkflowDefinitions.FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);
            if (workflow == null) return false;

            workflow.IsActive = true;
            workflow.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeactivateWorkflowAsync(int id)
        {
            var workflow = await _db.WorkflowDefinitions.FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);
            if (workflow == null) return false;

            workflow.IsActive = false;
            workflow.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return true;
        }

        // ─── Version Management ─────────────────────────────────────────────

        /// <summary>
        /// Creates a draft copy of an existing workflow for safe editing.
        /// The original workflow remains active and untouched.
        /// </summary>
        public async Task<WorkflowDefinitionDto> CreateDraftFromWorkflowAsync(int id, string createdBy)
        {
            var source = await _db.WorkflowDefinitions
                .Include(w => w.Triggers)
                .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);

            if (source == null)
                throw new KeyNotFoundException($"Workflow {id} not found");

            // Create a draft copy with incremented version
            var draft = new WorkflowDefinition
            {
                Name = $"{source.Name} (Draft v{source.Version + 1})",
                Description = source.Description,
                Nodes = source.Nodes,   // Deep-copy the JSON as-is
                Edges = source.Edges,
                IsActive = false,       // Drafts are never active
                Version = source.Version + 1,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
            };

            _db.WorkflowDefinitions.Add(draft);
            await _db.SaveChangesAsync();

            // Copy triggers so the draft has the same trigger configuration
            if (source.Triggers != null && source.Triggers.Any())
            {
                foreach (var srcTrigger in source.Triggers)
                {
                    _db.WorkflowTriggers.Add(new WorkflowTrigger
                    {
                        WorkflowId = draft.Id,
                        NodeId = srcTrigger.NodeId,
                        EntityType = srcTrigger.EntityType,
                        FromStatus = srcTrigger.FromStatus,
                        ToStatus = srcTrigger.ToStatus,
                        IsActive = false, // Draft triggers are inactive
                        CreatedAt = DateTime.UtcNow
                    });
                }
                await _db.SaveChangesAsync();
            }

            // Reload with navigation properties
            var result = await _db.WorkflowDefinitions
                .Include(w => w.Triggers)
                .Include(w => w.Executions)
                .FirstAsync(w => w.Id == draft.Id);

            return MapToDto(result);
        }

        /// <summary>
        /// Promotes a draft/inactive workflow to active.
        /// Deactivates any other active workflow with a similar base name to prevent conflicts.
        /// </summary>
        public async Task<WorkflowDefinitionDto?> PromoteWorkflowAsync(int id, string modifiedBy)
        {
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Triggers)
                .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);

            if (workflow == null) return null;

            // Already active? Nothing to do
            if (workflow.IsActive)
            {
                return MapToDto(workflow);
            }

            // Determine the base name (strip " (Draft vN)" suffix)
            var baseName = workflow.Name;
            var draftIdx = baseName.IndexOf(" (Draft", StringComparison.OrdinalIgnoreCase);
            if (draftIdx > 0) baseName = baseName.Substring(0, draftIdx);

            // Deactivate any currently active workflows with the same base name
            var activeConflicts = await _db.WorkflowDefinitions
                .Where(w => !w.IsDeleted && w.IsActive && w.Id != id
                    && (w.Name == baseName || w.Name.StartsWith(baseName + " (")))
                .ToListAsync();

            foreach (var conflict in activeConflicts)
            {
                conflict.IsActive = false;
                conflict.UpdatedAt = DateTime.UtcNow;
                conflict.ModifiedBy = modifiedBy;
            }

            // Promote this workflow
            workflow.IsActive = true;
            workflow.Name = baseName; // Clean the name (remove Draft suffix)
            workflow.UpdatedAt = DateTime.UtcNow;
            workflow.ModifiedBy = modifiedBy;

            // Activate its triggers
            if (workflow.Triggers != null)
            {
                foreach (var trigger in workflow.Triggers)
                {
                    trigger.IsActive = true;
                }
            }

            await _db.SaveChangesAsync();

            // Re-extract triggers to make sure they're current with the nodes
            _db.WorkflowTriggers.RemoveRange(workflow.Triggers ?? Enumerable.Empty<WorkflowTrigger>());
            await _db.SaveChangesAsync();
            await ExtractAndRegisterTriggersAsync(workflow);

            // Reload
            var result = await _db.WorkflowDefinitions
                .Include(w => w.Triggers)
                .Include(w => w.Executions)
                .FirstAsync(w => w.Id == id);

            return MapToDto(result);
        }

        /// <summary>
        /// Archives a workflow (soft-delete that preserves history).
        /// Cannot archive a workflow that has running executions.
        /// </summary>
        public async Task<bool> ArchiveWorkflowAsync(int id, string modifiedBy)
        {
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Triggers)
                .Include(w => w.Executions)
                .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);

            if (workflow == null) return false;

            // Safety: don't archive if there are running executions
            var hasRunning = workflow.Executions?.Any(e => e.Status == "running" || e.Status == "waiting_approval") ?? false;
            if (hasRunning)
                throw new InvalidOperationException("Cannot archive a workflow with running executions. Cancel them first.");

            // Deactivate and soft-delete
            workflow.IsActive = false;
            workflow.IsDeleted = true;
            workflow.UpdatedAt = DateTime.UtcNow;
            workflow.ModifiedBy = modifiedBy;

            // Deactivate all triggers
            if (workflow.Triggers != null)
            {
                foreach (var trigger in workflow.Triggers)
                {
                    trigger.IsActive = false;
                }
            }

            await _db.SaveChangesAsync();
            return true;
        }


        public async Task<IEnumerable<WorkflowTriggerDto>> GetWorkflowTriggersAsync(int workflowId)
        {
            var triggers = await _db.WorkflowTriggers
                .Where(t => t.WorkflowId == workflowId)
                .ToListAsync();

            return triggers.Select(t => new WorkflowTriggerDto
            {
                Id = t.Id,
                WorkflowId = t.WorkflowId,
                NodeId = t.NodeId,
                EntityType = t.EntityType,
                FromStatus = t.FromStatus,
                ToStatus = t.ToStatus,
                IsActive = t.IsActive
            });
        }

        public async Task<WorkflowTriggerDto> RegisterTriggerAsync(RegisterTriggerDto dto)
        {
            var trigger = new WorkflowTrigger
            {
                WorkflowId = dto.WorkflowId,
                NodeId = dto.NodeId,
                EntityType = dto.EntityType,
                FromStatus = string.IsNullOrEmpty(dto.FromStatus) || dto.FromStatus == "any" ? null : dto.FromStatus,
                ToStatus = string.IsNullOrEmpty(dto.ToStatus) || dto.ToStatus == "any" ? null : dto.ToStatus,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.WorkflowTriggers.Add(trigger);
            await _db.SaveChangesAsync();

            return new WorkflowTriggerDto
            {
                Id = trigger.Id,
                WorkflowId = trigger.WorkflowId,
                NodeId = trigger.NodeId,
                EntityType = trigger.EntityType,
                FromStatus = trigger.FromStatus,
                ToStatus = trigger.ToStatus,
                IsActive = trigger.IsActive
            };
        }

        public async Task<bool> RemoveTriggerAsync(int triggerId)
        {
            var trigger = await _db.WorkflowTriggers.FirstOrDefaultAsync(t => t.Id == triggerId);
            if (trigger == null) return false;

            _db.WorkflowTriggers.Remove(trigger);
            await _db.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<WorkflowExecutionDto>> GetWorkflowExecutionsAsync(int workflowId, int page = 1, int pageSize = 20)
        {
            var executions = await _db.WorkflowExecutions
                .Where(e => e.WorkflowId == workflowId)
                .Include(e => e.Workflow)
                .Include(e => e.Logs)
                .OrderByDescending(e => e.StartedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return executions.Select(MapExecutionToDto);
        }

        public async Task<WorkflowExecutionDto?> GetExecutionByIdAsync(int executionId)
        {
            var execution = await _db.WorkflowExecutions
                .Include(e => e.Workflow)
                .Include(e => e.Logs)
                .FirstOrDefaultAsync(e => e.Id == executionId);

            return execution == null ? null : MapExecutionToDto(execution);
        }

        public async Task<bool> CancelExecutionAsync(int executionId)
        {
            var execution = await _db.WorkflowExecutions.FirstOrDefaultAsync(e => e.Id == executionId);
            if (execution == null || execution.Status == "completed" || execution.Status == "cancelled")
                return false;

            execution.Status = "cancelled";
            execution.CompletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RetryExecutionAsync(int executionId)
        {
            var execution = await _db.WorkflowExecutions
                .Include(e => e.Logs)
                .FirstOrDefaultAsync(e => e.Id == executionId);
            if (execution == null || execution.Status != "failed")
                return false;

            execution.Status = "running";
            execution.Error = null;
            execution.CompletedAt = null;
            await _db.SaveChangesAsync();

            // Determine the node to restart from: the last failed node, or the first node
            var lastFailedLog = execution.Logs?
                .Where(l => l.Status == "failed")
                .OrderByDescending(l => l.Timestamp)
                .FirstOrDefault();
            
            var restartNodeId = lastFailedLog?.NodeId ?? execution.CurrentNodeId;
            
            if (string.IsNullOrEmpty(restartNodeId))
            {
                // If no node to restart from, fail gracefully
                execution.Status = "failed";
                execution.Error = "Cannot determine restart node";
                await _db.SaveChangesAsync();
                return false;
            }

            // Note: The actual graph re-execution should be triggered by the caller 
            // (controller or trigger service) using IWorkflowGraphExecutor.
            // We set the state here; the controller should resolve graph executor and call ExecuteGraphAsync.
            execution.CurrentNodeId = restartNodeId;
            await _db.SaveChangesAsync();

            return true;
        }
        
        public async Task<int> CleanupStuckExecutionsAsync(int olderThanMinutes = 5)
        {
            var cutoffTime = DateTime.UtcNow.AddMinutes(-olderThanMinutes);
            
            var stuckExecutions = await _db.WorkflowExecutions
                .Where(e => e.Status == "running" && e.StartedAt < cutoffTime)
                .ToListAsync();
            
            foreach (var execution in stuckExecutions)
            {
                execution.Status = "failed";
                execution.Error = $"Execution timed out after {olderThanMinutes} minutes (auto-cleanup)";
                execution.CompletedAt = DateTime.UtcNow;
            }
            
            await _db.SaveChangesAsync();
            return stuckExecutions.Count;
        }
        
        public async Task<WorkflowExecutionDto?> TriggerManualExecutionAsync(int workflowId, string entityType, int entityId, string? userId = null)
        {
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Triggers)
                .FirstOrDefaultAsync(w => w.Id == workflowId && !w.IsDeleted);
            
            if (workflow == null) return null;
            
            // Find a trigger for this entity type (prefer one without status constraints)
            var trigger = workflow.Triggers?
                .Where(t => t.EntityType == entityType && t.IsActive)
                .OrderBy(t => t.FromStatus != null ? 1 : 0) // Prefer triggers without fromStatus constraint
                .FirstOrDefault();
            
            var startNodeId = trigger?.NodeId ?? "manual-trigger";
            
            // Create execution record
            var execution = new WorkflowExecution
            {
                WorkflowId = workflowId,
                TriggerEntityType = entityType,
                TriggerEntityId = entityId,
                Status = "running",
                CurrentNodeId = startNodeId,
                Context = JsonSerializer.Serialize(new
                {
                    entityType,
                    entityId,
                    triggeredAt = DateTime.UtcNow,
                    triggerSource = "manual",
                    userId
                }),
                StartedAt = DateTime.UtcNow,
                TriggeredBy = userId
            };
            
            _db.WorkflowExecutions.Add(execution);
            await _db.SaveChangesAsync();
            
            // Log the manual trigger
            var triggerLog = new WorkflowExecutionLog
            {
                ExecutionId = execution.Id,
                NodeId = startNodeId,
                NodeType = "manual-trigger",
                Status = "completed",
                Input = JsonSerializer.Serialize(new { source = "manual", entityType, entityId }),
                Output = JsonSerializer.Serialize(new { triggered = true, manual = true }),
                Timestamp = DateTime.UtcNow
            };
            
            _db.WorkflowExecutionLogs.Add(triggerLog);
            await _db.SaveChangesAsync();
            
            // Return the execution (caller should invoke graph executor if needed)
            return MapExecutionToDto(execution);
        }

        private async Task ExtractAndRegisterTriggersAsync(WorkflowDefinition workflow)
        {
            try
            {
                var nodes = JsonSerializer.Deserialize<List<JsonElement>>(workflow.Nodes);
                if (nodes == null) return;

                foreach (var node in nodes)
                {
                    // CRITICAL: Read business type from data.type, NOT from the React Flow "type" field
                    // React Flow types are: "entityTrigger", "conditionNode", "n8nNode", "entityAction"
                    // Business types are: "offer-status-trigger", "sale-status-trigger", etc.
                    string? nodeType = null;
                    
                    // First try data.type (business type - this is what we need)
                    if (node.TryGetProperty("data", out var dataElement) && 
                        dataElement.TryGetProperty("type", out var dataTypeElement))
                    {
                        nodeType = dataTypeElement.GetString();
                    }
                    
                    // Fall back to top-level type (for seed data where type IS the business type)
                    if (string.IsNullOrEmpty(nodeType) && node.TryGetProperty("type", out var typeElement))
                    {
                        nodeType = typeElement.GetString();
                    }
                    
                    if (nodeType == null || !nodeType.Contains("status-trigger")) continue;

                    var entityType = GetEntityTypeFromNodeType(nodeType);
                    if (entityType == null) continue;

                    var nodeId = node.TryGetProperty("id", out var idElement) ? idElement.GetString() ?? "" : "";
                    string? fromStatus = null;
                    string? toStatus = null;

                    if (node.TryGetProperty("data", out var dataEl))
                    {
                        if (dataEl.TryGetProperty("fromStatus", out var fromElement))
                        {
                            var from = fromElement.GetString();
                            if (!string.IsNullOrEmpty(from) && from != "any") fromStatus = from;
                        }
                        if (dataEl.TryGetProperty("toStatus", out var toElement))
                        {
                            var to = toElement.GetString();
                            if (!string.IsNullOrEmpty(to) && to != "any") toStatus = to;
                        }
                        // Also check config.fromStatus / config.toStatus (NodeConfigPanel saves there)
                        if (fromStatus == null && dataEl.TryGetProperty("config", out var configEl))
                        {
                            if (configEl.TryGetProperty("fromStatus", out var cfgFrom))
                            {
                                var from = cfgFrom.GetString();
                                if (!string.IsNullOrEmpty(from) && from != "any") fromStatus = from;
                            }
                            if (toStatus == null && configEl.TryGetProperty("toStatus", out var cfgTo))
                            {
                                var to = cfgTo.GetString();
                                if (!string.IsNullOrEmpty(to) && to != "any") toStatus = to;
                            }
                        }
                    }

                    await RegisterTriggerAsync(new RegisterTriggerDto
                    {
                        WorkflowId = workflow.Id,
                        NodeId = nodeId,
                        EntityType = entityType,
                        FromStatus = fromStatus,
                        ToStatus = toStatus
                    });
                }
            }
            catch
            {
                // Silently fail if nodes JSON is invalid
            }
        }

        private static string? GetEntityTypeFromNodeType(string nodeType)
        {
            if (nodeType.Contains("offer")) return "offer";
            if (nodeType.Contains("sale")) return "sale";
            if (nodeType.Contains("service-order")) return "service_order";
            if (nodeType.Contains("dispatch")) return "dispatch";
            return null;
        }

        private static WorkflowDefinitionDto MapToDto(WorkflowDefinition workflow)
        {
            return new WorkflowDefinitionDto
            {
                Id = workflow.Id,
                Name = workflow.Name,
                Description = workflow.Description,
                Nodes = JsonSerializer.Deserialize<object>(workflow.Nodes) ?? new List<object>(),
                Edges = JsonSerializer.Deserialize<object>(workflow.Edges) ?? new List<object>(),
                IsActive = workflow.IsActive,
                Version = workflow.Version,
                CreatedBy = workflow.CreatedBy,
                CreatedAt = workflow.CreatedAt,
                UpdatedAt = workflow.UpdatedAt,
                TriggersCount = workflow.Triggers?.Count ?? 0,
                ExecutionsCount = workflow.Executions?.Count ?? 0,
                Triggers = workflow.Triggers?.Select(t => new WorkflowTriggerDto
                {
                    Id = t.Id,
                    WorkflowId = t.WorkflowId,
                    NodeId = t.NodeId,
                    EntityType = t.EntityType,
                    FromStatus = t.FromStatus,
                    ToStatus = t.ToStatus,
                    IsActive = t.IsActive
                }).ToList() ?? new List<WorkflowTriggerDto>()
            };
        }

        private static WorkflowExecutionDto MapExecutionToDto(WorkflowExecution execution)
        {
            return new WorkflowExecutionDto
            {
                Id = execution.Id,
                WorkflowId = execution.WorkflowId,
                WorkflowName = execution.Workflow?.Name,
                TriggerEntityType = execution.TriggerEntityType,
                TriggerEntityId = execution.TriggerEntityId,
                Status = execution.Status,
                CurrentNodeId = execution.CurrentNodeId,
                Context = string.IsNullOrEmpty(execution.Context) ? null : JsonSerializer.Deserialize<object>(execution.Context),
                Error = execution.Error,
                StartedAt = execution.StartedAt,
                CompletedAt = execution.CompletedAt,
                TriggeredBy = execution.TriggeredBy,
                Duration = execution.CompletedAt.HasValue 
                    ? (long)(execution.CompletedAt.Value - execution.StartedAt).TotalMilliseconds 
                    : null,
                Logs = execution.Logs?.Select(log => new WorkflowExecutionLogDto
                {
                    Id = log.Id,
                    NodeId = log.NodeId,
                    NodeType = log.NodeType,
                    Status = log.Status,
                    Input = string.IsNullOrEmpty(log.Input) ? null : JsonSerializer.Deserialize<object>(log.Input),
                    Output = string.IsNullOrEmpty(log.Output) ? null : JsonSerializer.Deserialize<object>(log.Output),
                    Error = log.Error,
                    Duration = log.Duration,
                    Timestamp = log.Timestamp
                }).ToList() ?? new List<WorkflowExecutionLogDto>()
            };
        }
    }
}
