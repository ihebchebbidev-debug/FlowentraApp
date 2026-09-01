using MyApi.Modules.OAS.Common.Data;

namespace MyApi.Modules.OAS.Settings.Models;

/// <summary>
/// Per-tenant runtime configuration (table <c>oas_settings</c>).
/// Only keys listed in <see cref="Services.OasSettingKeys"/> are accepted —
/// this is a typed configuration surface, not a free-form KV dump.
/// </summary>
public class OasSetting : OasEntityBase
{
    public string SettingKey { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public Guid? UpdatedBy { get; set; }
}
