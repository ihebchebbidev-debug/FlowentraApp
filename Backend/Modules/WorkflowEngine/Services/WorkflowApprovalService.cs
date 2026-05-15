using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.WorkflowEngine.DTOs;
using MyApi.Modules.WorkflowEngine.Models;

namespace MyApi.Modules.WorkflowEngine.Services
{
    public class WorkflowApprovalService : IWorkflowApprovalService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<WorkflowApprovalService> _logger;

        public WorkflowApprovalService(ApplicationDbContext db, ILogger<WorkflowApprovalService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<IEnumerable<WorkflowApprovalDto>> GetPendingApprovalsAsync(string userId, string? role = null)
        {
            var query = _db.WorkflowApprovals
                .Include(a => a.Execution)
                    .ThenInclude(e => e!.Workflow)
                .Where(a => a.Status == "pending");

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(a => a.ApproverRole == role);
            }

            var approvals = await query
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return approvals.Select(MapToDto);
        }

        public async Task<WorkflowApprovalDto?> GetApprovalByIdAsync(int approvalId)
        {
            var approval = await _db.WorkflowApprovals
                .Include(a => a.Execution)
                    .ThenInclude(e => e!.Workflow)
                .FirstOrDefaultAsync(a => a.Id == approvalId);

            return approval == null ? null : MapToDto(approval);
        }

        public async Task<bool> RespondToApprovalAsync(int approvalId, ApprovalResponseDto response, string userId)
        {
            var approval = await _db.WorkflowApprovals
                .Include(a => a.Execution)
                .FirstOrDefaultAsync(a => a.Id == approvalId);

            if (approval == null || approval.Status != "pending")
                return false;

            approval.Status = response.Approved ? "approved" : "rejected";
            approval.ResponseNote = response.Note;
            approval.ApprovedById = userId;
            approval.RespondedAt = DateTime.UtcNow;

            // Update the workflow execution status
            if (approval.Execution != null)
            {
                if (response.Approved)
                {
                    approval.Execution.Status = "running";
                    _logger.LogInformation("Approval {ApprovalId} approved, resuming workflow execution {ExecutionId}",
                        approvalId, approval.ExecutionId);
                }
                else
                {
                    approval.Execution.Status = "cancelled";
                    approval.Execution.CompletedAt = DateTime.UtcNow;
                    approval.Execution.Error = $"Rejected by {userId}: {response.Note}";
                    _logger.LogInformation("Approval {ApprovalId} rejected, cancelling workflow execution {ExecutionId}",
                        approvalId, approval.ExecutionId);
                }
            }

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<WorkflowApprovalDto> CreateApprovalRequestAsync(
            int executionId,
            string nodeId,
            string title,
            string? message,
            string approverRole,
            int timeoutHours = 24)
        {
            var approval = new WorkflowApproval
            {
                ExecutionId = executionId,
                NodeId = nodeId,
                Title = title,
                Message = message,
                ApproverRole = approverRole,
                Status = "pending",
                TimeoutHours = timeoutHours,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(timeoutHours)
            };

            _db.WorkflowApprovals.Add(approval);

            // Update execution status to waiting
            var execution = await _db.WorkflowExecutions.FirstOrDefaultAsync(e => e.Id == executionId);
            if (execution != null)
            {
                execution.Status = "waiting_approval";
                execution.CurrentNodeId = nodeId;
            }

            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Created approval request {ApprovalId} for execution {ExecutionId}, expires at {ExpiresAt}",
                approval.Id, executionId, approval.ExpiresAt);

            return MapToDto(approval);
        }

        public async Task<int> ExpireTimedOutApprovalsAsync()
        {
            var expiredApprovals = await _db.WorkflowApprovals
                .Include(a => a.Execution)
                .Where(a => a.Status == "pending" && a.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();

            foreach (var approval in expiredApprovals)
            {
                approval.Status = "expired";
                approval.RespondedAt = DateTime.UtcNow;

                if (approval.Execution != null)
                {
                    approval.Execution.Status = "failed";
                    approval.Execution.CompletedAt = DateTime.UtcNow;
                    approval.Execution.Error = $"Approval request expired after {approval.TimeoutHours} hours";
                }
            }

            await _db.SaveChangesAsync();

            if (expiredApprovals.Any())
            {
                _logger.LogInformation("Expired {Count} timed-out approval requests", expiredApprovals.Count);
            }

            return expiredApprovals.Count;
        }

        private static WorkflowApprovalDto MapToDto(WorkflowApproval approval)
        {
            return new WorkflowApprovalDto
            {
                Id = approval.Id,
                ExecutionId = approval.ExecutionId,
                NodeId = approval.NodeId,
                Title = approval.Title,
                Message = approval.Message,
                ApproverRole = approval.ApproverRole,
                ApprovedById = approval.ApprovedById,
                Status = approval.Status,
                ResponseNote = approval.ResponseNote,
                TimeoutHours = approval.TimeoutHours,
                CreatedAt = approval.CreatedAt,
                RespondedAt = approval.RespondedAt,
                ExpiresAt = approval.ExpiresAt,
                WorkflowName = approval.Execution?.Workflow?.Name,
                EntityType = approval.Execution?.TriggerEntityType,
                EntityId = approval.Execution?.TriggerEntityId
            };
        }
    }
}
