using System.ComponentModel.DataAnnotations;

namespace MyApi.Modules.OAS.ShopFloorAuth.DTOs;

/// <summary>
/// Polymorphic body per spec §8.2/§6.1: `{mode:"pin",badge,pin}` or
/// `{mode:"qr",token}`. Deliberately one DTO, one endpoint — there is no
/// `/shopfloor/badge-login` (spec v9: that route never existed and was a
/// documentation error in earlier drafts).
/// </summary>
public class OasShopFloorLoginRequestDto
{
    [Required] public string Mode { get; set; } = string.Empty; // "pin" | "qr"
    public string? Badge { get; set; }
    public string? Pin { get; set; }
    public string? Token { get; set; }
    /// <summary>Optional stable device id (EF-M2-09) — the tablet identifies itself so it can be revoked individually if lost.</summary>
    [MaxLength(128)] public string? DeviceId { get; set; }
    public string? DeviceLabel { get; set; }
    /// <summary>android | ios | web</summary>
    public string? DevicePlatform { get; set; }
}

public class OasPinRegenerateResponseDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    /// <summary>Plaintext, returned exactly once (spec decision v12) — never present on any GET.</summary>
    public string? Pin { get; set; }
}
