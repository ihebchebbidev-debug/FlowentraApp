using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApi.Infrastructure;

namespace MyApi.Modules.Dispatches.Models
{
    [Table("TimeEntries")]
    public class TimeEntry : ITenantEntity
    {
        public int TenantId { get; set; }
        [Key]
        [Column("Id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [Column("DispatchId")]
        public int DispatchId { get; set; }

        [Required]
        [Column("TechnicianId")]
        public int TechnicianId { get; set; }

        [Required]
        [Column("StartTime")]
        public DateTime StartTime { get; set; }

        [Column("EndTime")]
        public DateTime? EndTime { get; set; }

        // Store duration in minutes. Use larger precision to avoid overflow (e.g., multi-day entries).
        [Column("Duration", TypeName = "decimal(18,2)")]
        public decimal? Duration { get; set; }

        [Required]
        [Column("ActivityType")]
        [MaxLength(50)]
        public string WorkType { get; set; } = "work";

        [Column("Description")]
        public string? Description { get; set; }

        [Required]
        [Column("CreatedDate")]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
