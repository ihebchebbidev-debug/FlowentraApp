using System.ComponentModel.DataAnnotations;

namespace MyApi.Modules.OAS.ShopFloorAuth.DTOs;

public class OasSetupRequestDto
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required, MinLength(8)] public string Password { get; set; } = string.Empty;
    [Required] public string DisplayName { get; set; } = string.Empty;
}

public class OasLoginRequestDto
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
    /// <summary>Optional stable device id (EF-M2-09): registers the device and binds the issued token to it so it can be revoked individually.</summary>
    [MaxLength(128)] public string? DeviceId { get; set; }
    public string? DeviceLabel { get; set; }
    /// <summary>android | ios | web</summary>
    public string? DevicePlatform { get; set; }
}

public class OasRefreshRequestDto
{
    [Required] public string RefreshToken { get; set; } = string.Empty;
}

public class OasChangePasswordRequestDto
{
    [Required] public string CurrentPassword { get; set; } = string.Empty;
    [Required, MinLength(8)] public string NewPassword { get; set; } = string.Empty;
}

/// <summary>Self-service profile edit (PUT /api/oas/auth/me) — the signed-in user's own identity fields. Role, scope and active flag are deliberately NOT editable here: those stay admin-only via /api/oas/operators/*.</summary>
public class OasUpdateProfileRequestDto
{
    [EmailAddress] public string? Email { get; set; }
    public string? DisplayName { get; set; }
    public string? Phone { get; set; }
}

public class OasAuthResponseDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public OasUserDto? User { get; set; }
}

/// <summary>
/// Never includes Pin or PasswordHash (spec decision v12: GET-shaped
/// responses never return the PIN in plaintext — only the one-time
/// regenerate-pin response does, added in Lot 2).
/// </summary>
public class OasUserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Workspace { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public Guid? ScopeSiteId { get; set; }
    public Guid? ScopeZoneId { get; set; }
    public Guid? ScopeLineId { get; set; }
}

/// <summary>Step 1 of the emailed-OTP password reset (mirrors the socle's ForgotPasswordRequestDto).</summary>
public class OasForgotPasswordRequestDto
{
    public string Email { get; set; } = string.Empty;
    /// <summary>Email language: "en" or "fr" (defaults to "en").</summary>
    public string? Language { get; set; }
}

/// <summary>Step 2: exchange the 6-digit emailed code for a short-lived reset token.</summary>
public class OasVerifyResetOtpRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
}

public class OasVerifyResetOtpResponseDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? ResetToken { get; set; }
}

/// <summary>Step 3: set the new password using the reset token from step 2.</summary>
public class OasResetPasswordRequestDto
{
    public string ResetToken { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
