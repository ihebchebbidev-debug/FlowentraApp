using MyApi.Modules.OAS.Common.Data;

namespace MyApi.Modules.OAS.Devices.Models;

/// <summary>
/// A registered device (tablet / phone / browser) bound to an OAS user —
/// table <c>oas_device_tokens</c>. Backs EF-M2-09 per-device revocation:
/// losing a shop-floor tablet must kill THAT tablet's access without
/// deactivating the operator, who keeps working from another one.
/// </summary>
public class OasDeviceToken : OasEntityBase
{
    public Guid UserId { get; set; }

    /// <summary>android | ios | web</summary>
    public string Platform { get; set; } = "web";

    /// <summary>Push token when there is one; otherwise the device id, since the column is NOT NULL UNIQUE in the base schema.</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>Stable per-installation identifier sent by the client and carried in the JWT's <c>oas_device_id</c> claim.</summary>
    public string? DeviceId { get; set; }

    /// <summary>Human label shown in the admin device list, e.g. "Tablette Ligne 2".</summary>
    public string? Label { get; set; }

    public string? AppVersion { get; set; }
    public string? OsVersion { get; set; }
    public DateTimeOffset LastSeenAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Set when an admin revokes this device — any token carrying its device id is refused from that moment on.</summary>
    public DateTimeOffset? RevokedAt { get; set; }
    public Guid? RevokedBy { get; set; }

    public bool IsRevoked => RevokedAt is not null;
}
