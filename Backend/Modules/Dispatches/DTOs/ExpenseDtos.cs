using System;
using System.ComponentModel.DataAnnotations;

namespace MyApi.Modules.Dispatches.DTOs
{
    public class CreateExpenseDto
    {
        [Required]
        public string TechnicianId { get; set; } = null!;
        public string? TechnicianName { get; set; }
        [Required]
        public string Type { get; set; } = null!;
        [Required]
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public string? Description { get; set; }
        public DateTime? Date { get; set; }
    }

    public class UpdateExpenseDto
    {
        public string? TechnicianId { get; set; }
        public string? TechnicianName { get; set; }
        public string? Type { get; set; }
        public decimal? Amount { get; set; }
        public string? Currency { get; set; }
        public string? Description { get; set; }
        public DateTime? Date { get; set; }
    }

    public class ExpenseDto
    {
        public int Id { get; set; }
        public int DispatchId { get; set; }
        public string TechnicianId { get; set; } = null!;
        public string? TechnicianName { get; set; }
        public string Type { get; set; } = null!;
        public decimal Amount { get; set; }
        public string? Currency { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = null!;
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? InvoiceStatus { get; set; }
        public string? SourceTable { get; set; } // "service_order" or "dispatch"
    }

    public class ApproveExpenseDto
    {
        public string ApprovedBy { get; set; } = null!;
    }
}
