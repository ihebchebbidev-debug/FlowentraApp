using System.Collections.Generic;

namespace MyApi.Modules.PlanningProfiles.DTOs
{
    public class PlanningProfileDto
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public string OwnerUserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Color { get; set; }
        public string? Icon { get; set; }
        public bool IsShared { get; set; }
        public List<string> VisibleUserIds { get; set; } = new();
        public List<string>? RequiredSkillIds { get; set; }
        public object Settings { get; set; } = new { };
        public string CreatedAt { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
    }

    public class CreatePlanningProfileDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Color { get; set; }
        public string? Icon { get; set; }
        public bool IsShared { get; set; }
        public List<string> VisibleUserIds { get; set; } = new();
        public List<string>? RequiredSkillIds { get; set; }
        public object Settings { get; set; } = new { };
    }

    public class UpdatePlanningProfileDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Color { get; set; }
        public string? Icon { get; set; }
        public bool? IsShared { get; set; }
        public List<string>? VisibleUserIds { get; set; }
        public List<string>? RequiredSkillIds { get; set; }
        public object? Settings { get; set; }
    }
}
