using System.ComponentModel.DataAnnotations;

namespace MyApi.Modules.OAS.Settings.DTOs;

public class OasSettingDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    /// <summary>The built-in value used when nothing is stored for this tenant.</summary>
    public string DefaultValue { get; set; } = string.Empty;
    public DateTimeOffset? UpdatedAt { get; set; }
}

public class OasSettingUpdateRequestDto
{
    [Required] public string Value { get; set; } = string.Empty;
}
