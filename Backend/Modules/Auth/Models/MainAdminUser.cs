using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApi.Modules.Auth.Models
{
    [Table("MainAdminUsers")]
    public class MainAdminUser
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginDate { get; set; }

        public bool OnboardingCompleted { get; set; } = false;

        [Column(TypeName = "text")]
        public string? AccessToken { get; set; }

        [Column(TypeName = "text")]
        public string? RefreshToken { get; set; }

        public DateTime? TokenExpiresAt { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(2)]
        public string? Country { get; set; }

        [MaxLength(100)]
        public string? Industry { get; set; } = "";

        [MaxLength(255)]
        public string? CompanyName { get; set; }

        [MaxLength(500)]
        public string? CompanyWebsite { get; set; }

        [MaxLength(500)]
        public string? CompanyLogoUrl { get; set; }

        [MaxLength(500)]
        public string? ProfilePictureUrl { get; set; }

        [Column(TypeName = "text")]
        public string? PreferencesJson { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public DateTime? LastLoginAt { get; set; }

        // Forgot Password Fields
        [MaxLength(6)]
        public string? OtpCode { get; set; }

        public DateTime? OtpExpiresAt { get; set; }

        [MaxLength(500)]
        public string? PasswordResetToken { get; set; }

        public DateTime? PasswordResetTokenExpiresAt { get; set; }
    }
}
