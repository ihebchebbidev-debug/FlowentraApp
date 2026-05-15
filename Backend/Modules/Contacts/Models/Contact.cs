using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApi.Infrastructure;

namespace MyApi.Modules.Contacts.Models
{
    [Table("Contacts")]
    public class Contact : ITenantEntity, MyApi.Modules.Shared.Models.ISoftDeletable
    {
        public int TenantId { get; set; }
        
        public DateTime? DeletedAt { get; set; }
        public string? DeletedBy { get; set; }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(255)]
        [EmailAddress]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(200)]
        public string? Company { get; set; }

        [MaxLength(100)]
        public string? Position { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? Country { get; set; }

        [MaxLength(20)]
        public string? PostalCode { get; set; }

        [Column(TypeName = "text")]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = string.Empty;

        public DateTime? ModifiedDate { get; set; }

        [MaxLength(100)]
        public string? ModifiedBy { get; set; }

        // Additional fields from DB
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Status { get; set; } = "active";

        [MaxLength(50)]
        public string? Type { get; set; } = "individual";

        [MaxLength(500)]
        public string? Avatar { get; set; }

        public bool Favorite { get; set; } = false;

        public DateTime? LastContactDate { get; set; }

        public bool IsDeleted { get; set; } = false;

        // Fiscal identification fields
        [MaxLength(50)]
        public string? Cin { get; set; }

        [MaxLength(100)]
        public string? MatriculeFiscale { get; set; }

        // Geolocation fields
        [Column("Latitude", TypeName = "decimal(10,7)")]
        public decimal? Latitude { get; set; }

        [Column("Longitude", TypeName = "decimal(10,7)")]
        public decimal? Longitude { get; set; }

        [Column("HasLocation")]
        public int HasLocation { get; set; } = 0;

        // Navigation properties
        public virtual ICollection<ContactNote> ContactNotes { get; set; } = new List<ContactNote>();
        public virtual ICollection<ContactTagAssignment> TagAssignments { get; set; } = new List<ContactTagAssignment>();
    }
}
