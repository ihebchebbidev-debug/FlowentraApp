using System.ComponentModel.DataAnnotations;

namespace MyApi.Modules.OAS.Devices.DTOs;

public class OasDeviceDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? DeviceId { get; set; }
    public string? Label { get; set; }
    public string Platform { get; set; } = "web";
    public string? AppVersion { get; set; }
    public string? OsVersion { get; set; }
    public DateTimeOffset LastSeenAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public bool IsRevoked { get; set; }
}

public class OasDeviceRegisterRequestDto
{
    /// <summary>Stable per-installation id generated and persisted by the client.</summary>
    [Required, MaxLength(128)] public string DeviceId { get; set; } = string.Empty;
    public string? Label { get; set; }
    /// <summary>android | ios | web</summary>
    public string Platform { get; set; } = "web";
    public string? AppVersion { get; set; }
    public string? OsVersion { get; set; }
    /// <summary>Push token, when the client has one. Defaults to the device id.</summary>
    public string? PushToken { get; set; }
}
