using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApi.Infrastructure;

namespace MyApi.Modules.HR.Models
{
    [Table("hr_attendance")]
    public class HrAttendance : ITenantEntity
    {
        public int TenantId { get; set; }

        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("date")]
        public DateTime Date { get; set; }

        [Column("check_in")]
        public DateTime? CheckIn { get; set; }

        [Column("check_out")]
        public DateTime? CheckOut { get; set; }

        [Column("break_minutes")]
        public int BreakMinutes { get; set; }

        [Column("total_hours", TypeName = "decimal(10,2)")]
        public decimal TotalHours { get; set; }

        [Column("overtime_hours", TypeName = "decimal(10,2)")]
        public decimal OvertimeHours { get; set; }

        [Column("status")]
        [MaxLength(40)]
        public string Status { get; set; } = "present";

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("source")]
        [MaxLength(40)]
        public string Source { get; set; } = "manual";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}