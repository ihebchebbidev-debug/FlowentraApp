using System.ComponentModel.DataAnnotations;

namespace MyApi.Modules.Contacts.DTOs
{
    // Response DTOs
    public class ContactResponseDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Name => $"{FirstName} {LastName}".Trim();
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Company { get; set; }
        public string? Position { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedBy { get; set; }
        
        // Additional fields
        public string? Status { get; set; } = "active";
        public string? Type { get; set; } = "individual";
        public string? Avatar { get; set; }
        public bool Favorite { get; set; }
        public DateTime? LastContactDate { get; set; }
        
        // Fiscal identification fields
        public string? Cin { get; set; }
        public string? MatriculeFiscale { get; set; }
        
        // Geolocation fields
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int HasLocation { get; set; } = 0;

        public List<ContactTagDto> Tags { get; set; } = new List<ContactTagDto>();
        public List<ContactNoteDto> ContactNotes { get; set; } = new List<ContactNoteDto>();
    }

    public class ContactListResponseDto
    {
        public List<ContactResponseDto> Contacts { get; set; } = new List<ContactResponseDto>();
        public int TotalCount { get; set; }
        public int PageSize { get; set; }
        public int PageNumber { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // Request DTOs
    public class CreateContactRequestDto
    {
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        // Legacy Name field - parsed into FirstName/LastName if provided
        public string? Name { get; set; }

        [EmailAddress]
        [StringLength(255)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(200)]
        public string? Company { get; set; }

        [StringLength(100)]
        public string? Position { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        public string? Notes { get; set; }

        [StringLength(50)]
        public string? Status { get; set; } = "active";

        [StringLength(50)]
        public string? Type { get; set; } = "individual";

        [StringLength(500)]
        public string? Avatar { get; set; }

        public bool? Favorite { get; set; }

        public DateTime? LastContactDate { get; set; }

        // Fiscal identification fields
        [StringLength(50)]
        public string? Cin { get; set; }

        [StringLength(100)]
        public string? MatriculeFiscale { get; set; }

        // Geolocation fields
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        public List<int> TagIds { get; set; } = new List<int>();
    }

    public class UpdateContactRequestDto
    {
        [StringLength(100)]
        public string? FirstName { get; set; }

        [StringLength(100)]
        public string? LastName { get; set; }

        // Legacy Name field
        public string? Name { get; set; }

        [EmailAddress]
        [StringLength(255)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(200)]
        public string? Company { get; set; }

        [StringLength(100)]
        public string? Position { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        public string? Notes { get; set; }

        public bool? IsActive { get; set; }

        [StringLength(50)]
        public string? Status { get; set; }

        [StringLength(50)]
        public string? Type { get; set; }

        [StringLength(500)]
        public string? Avatar { get; set; }

        public bool? Favorite { get; set; }

        public DateTime? LastContactDate { get; set; }

        // Fiscal identification fields
        [StringLength(50)]
        public string? Cin { get; set; }

        [StringLength(100)]
        public string? MatriculeFiscale { get; set; }

        // Geolocation fields
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        public List<int>? TagIds { get; set; }
    }

    public class ContactSearchRequestDto
    {
        public string? SearchTerm { get; set; }
        public bool? IsActive { get; set; }
        public string? Status { get; set; }
        public string? Type { get; set; }
        public bool? Favorite { get; set; }
        public List<int>? TagIds { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string? SortBy { get; set; } = "CreatedDate";
        public string? SortDirection { get; set; } = "desc";
    }

    public class BulkImportContactRequestDto
    {
        public List<CreateContactRequestDto> Contacts { get; set; } = new List<CreateContactRequestDto>();
        public bool SkipDuplicates { get; set; } = true;
        public bool UpdateExisting { get; set; } = false;
    }

    public class BulkImportResultDto
    {
        public int TotalProcessed { get; set; }
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public int SkippedCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<ContactResponseDto> ImportedContacts { get; set; } = new List<ContactResponseDto>();
    }
}
