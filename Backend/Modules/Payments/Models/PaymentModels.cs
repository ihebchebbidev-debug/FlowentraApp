using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApi.Infrastructure;

namespace MyApi.Modules.Payments.Models
{
    [Table("payment_plans")]
    public class PaymentPlan : ITenantEntity
    {
        public int TenantId { get; set; }
        [Key]
        [Column("id")]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("entity_type")]
        [MaxLength(20)]
        public string EntityType { get; set; } = string.Empty; // "offer" or "sale"

        [Required]
        [Column("entity_id")]
        [MaxLength(50)]
        public string EntityId { get; set; } = string.Empty;

        [Required]
        [Column("name")]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [Column("total_amount", TypeName = "decimal(15,2)")]
        public decimal TotalAmount { get; set; }

        [Column("currency")]
        [MaxLength(3)]
        public string Currency { get; set; } = "TND";

        [Column("installment_count")]
        public int InstallmentCount { get; set; } = 2;

        [Required]
        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "active";

        [Required]
        [Column("created_by")]
        [MaxLength(50)]
        public string CreatedBy { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual ICollection<PaymentPlanInstallment> Installments { get; set; } = new List<PaymentPlanInstallment>();
    }

    [Table("payment_plan_installments")]
    public class PaymentPlanInstallment : ITenantEntity
    {
        public int TenantId { get; set; }
        [Key]
        [Column("id")]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("plan_id")]
        [MaxLength(50)]
        public string PlanId { get; set; } = string.Empty;

        [Column("installment_number")]
        public int InstallmentNumber { get; set; }

        [Required]
        [Column("amount", TypeName = "decimal(15,2)")]
        public decimal Amount { get; set; }

        [Required]
        [Column("due_date")]
        public DateTime DueDate { get; set; }

        [Required]
        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "pending";

        [Column("paid_amount", TypeName = "decimal(15,2)")]
        public decimal PaidAmount { get; set; } = 0;

        [Column("paid_at")]
        public DateTime? PaidAt { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("PlanId")]
        public virtual PaymentPlan? Plan { get; set; }
    }

    [Table("payments")]
    public class Payment : ITenantEntity
    {
        public int TenantId { get; set; }
        [Key]
        [Column("id")]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("entity_type")]
        [MaxLength(20)]
        public string EntityType { get; set; } = string.Empty;

        [Required]
        [Column("entity_id")]
        [MaxLength(50)]
        public string EntityId { get; set; } = string.Empty;

        [Column("plan_id")]
        [MaxLength(50)]
        public string? PlanId { get; set; }

        [Column("installment_id")]
        [MaxLength(50)]
        public string? InstallmentId { get; set; }

        [Required]
        [Column("amount", TypeName = "decimal(15,2)")]
        public decimal Amount { get; set; }

        [Column("currency")]
        [MaxLength(3)]
        public string Currency { get; set; } = "TND";

        [Required]
        [Column("payment_method")]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "cash";

        [Column("payment_reference")]
        [MaxLength(255)]
        public string? PaymentReference { get; set; }

        [Column("payment_date")]
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [Required]
        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "completed";

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("receipt_number")]
        [MaxLength(100)]
        public string? ReceiptNumber { get; set; }

        [Required]
        [Column("created_by")]
        [MaxLength(50)]
        public string CreatedBy { get; set; } = string.Empty;

        [Column("created_by_name")]
        [MaxLength(255)]
        public string? CreatedByName { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual ICollection<PaymentItemAllocation> ItemAllocations { get; set; } = new List<PaymentItemAllocation>();
    }

    [Table("payment_item_allocations")]
    public class PaymentItemAllocation : ITenantEntity
    {
        public int TenantId { get; set; }
        [Key]
        [Column("id")]
        [MaxLength(50)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("payment_id")]
        [MaxLength(50)]
        public string PaymentId { get; set; } = string.Empty;

        [Required]
        [Column("item_id")]
        [MaxLength(50)]
        public string ItemId { get; set; } = string.Empty;

        [Column("item_name")]
        [MaxLength(255)]
        public string ItemName { get; set; } = string.Empty;

        [Required]
        [Column("allocated_amount", TypeName = "decimal(15,2)")]
        public decimal AllocatedAmount { get; set; }

        [Column("item_total", TypeName = "decimal(15,2)")]
        public decimal ItemTotal { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("PaymentId")]
        public virtual Payment? Payment { get; set; }
    }
}
