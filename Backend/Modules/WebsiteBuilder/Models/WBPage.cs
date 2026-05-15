using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApi.Infrastructure;

namespace MyApi.Modules.WebsiteBuilder.Models
{
    [Table("WB_Pages")]
    public class WBPage : ITenantEntity
    {
        public int TenantId { get; set; }
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int SiteId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Slug { get; set; } = string.Empty;

        [Required]
        [Column("ComponentsJson", TypeName = "jsonb")]
        public string ComponentsJson { get; set; } = "[]";

        [Required]
        [Column("SeoJson", TypeName = "jsonb")]
        public string SeoJson { get; set; } = "{}";

        [Column("TranslationsJson", TypeName = "jsonb")]
        public string? TranslationsJson { get; set; }

        public bool IsHomePage { get; set; } = false;

        public int SortOrder { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = "system";

        [MaxLength(100)]
        public string? ModifiedBy { get; set; }

        public bool IsDeleted { get; set; } = false;

        public DateTime? DeletedAt { get; set; }

        [MaxLength(100)]
        public string? DeletedBy { get; set; }

        // Navigation properties
        [ForeignKey("SiteId")]
        public virtual WBSite? Site { get; set; }

        public virtual ICollection<WBPageVersion> Versions { get; set; } = new List<WBPageVersion>();
    }
}
