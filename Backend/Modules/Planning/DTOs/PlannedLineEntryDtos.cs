using System.ComponentModel.DataAnnotations;

namespace MyApi.Modules.Planning.DTOs
{
    public class PlannedLineEntryDto
    {
        public int Id { get; set; }
        public string ParentType { get; set; } = string.Empty;
        public int ParentId { get; set; }
        public int? OriginOfferItemId { get; set; }
        public string Kind { get; set; } = string.Empty;
        public int? PlannedMinutes { get; set; }
        public int? TechnicianCount { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? ExpenseType { get; set; }
        public decimal? PlannedAmount { get; set; }
        public string? Currency { get; set; }
        public string? Description { get; set; }
    }

    public class CreatePlannedLineEntryDto
    {
        [Required] public string Kind { get; set; } = "time"; // time|expense
        public int? PlannedMinutes { get; set; }
        public int? TechnicianCount { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? ExpenseType { get; set; }
        public decimal? PlannedAmount { get; set; }
        public string? Currency { get; set; }
        public string? Description { get; set; }
    }

    public class UpdatePlannedLineEntryDto : CreatePlannedLineEntryDto { }

    public class PlanVsActualLineDto
    {
        public int JobId { get; set; }
        public int PlannedMinutes { get; set; }
        public int ActualMinutes { get; set; }
        public decimal PlannedExpenseTotal { get; set; }
        public decimal ActualExpenseTotal { get; set; }
        public System.Collections.Generic.List<PlanVsActualExpenseBucket> ExpenseBuckets { get; set; } = new();
    }

    public class PlanVsActualExpenseBucket
    {
        public string ExpenseType { get; set; } = string.Empty;
        public decimal Planned { get; set; }
        public decimal Actual { get; set; }
    }
}
