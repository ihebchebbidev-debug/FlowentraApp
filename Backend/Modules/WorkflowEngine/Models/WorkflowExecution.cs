using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApi.Infrastructure;

namespace MyApi.Modules.WorkflowEngine.Models
{
    [Table("WorkflowExecutions")]
    public class WorkflowExecution : ITenantEntity
    {
        public int TenantId { get; set; }
        [Key]
        public int Id { get; set; }

        [Required]
        public int WorkflowId { get; set; }

        [Required]
        [MaxLength(30)]
        public string TriggerEntityType { get; set; } = string.Empty;

        [Required]
        public int TriggerEntityId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "running"; // 'running', 'waiting_approval', 'completed', 'failed', 'cancelled'

        [MaxLength(50)]
        public string? CurrentNodeId { get; set; }

        [Column(TypeName = "jsonb")]
        public string Context { get; set; } = "{}";

        [MaxLength(1000)]
        public string? Error { get; set; }

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedAt { get; set; }

        [MaxLength(100)]
        public string? TriggeredBy { get; set; }

        // Navigation properties
        [ForeignKey("WorkflowId")]
        public virtual WorkflowDefinition? Workflow { get; set; }

        public virtual ICollection<WorkflowExecutionLog> Logs { get; set; } = new List<WorkflowExecutionLog>();
        public virtual ICollection<WorkflowApproval> Approvals { get; set; } = new List<WorkflowApproval>();
    }
}
