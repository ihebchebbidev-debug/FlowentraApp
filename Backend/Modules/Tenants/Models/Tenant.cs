using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApi.Modules.Tenants.Models
{
    [Table("Tenants")]
    public class Tenant
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int MainAdminUserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Slug { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? CompanyLogoUrl { get; set; }

        [MaxLength(500)]
        public string? CompanyWebsite { get; set; }

        [MaxLength(50)]
        public string? CompanyPhone { get; set; }

        public string? CompanyAddress { get; set; }

        [MaxLength(2)]
        public string? CompanyCountry { get; set; }

        [MaxLength(100)]
        public string? Industry { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsDefault { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
