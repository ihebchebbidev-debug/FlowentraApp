using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Devices.Models;
using MyApi.Modules.OAS.ShopFloorAuth.DTOs;
using MyApi.Modules.OAS.ShopFloorAuth.Models;
using MyApi.Modules.Shared.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MyApi.Modules.OAS.ShopFloorAuth.Services;

/// <summary>
/// Console auth (setup + email/password login) — spec §8.2. Every login and
/// refresh triggers OasUserJitSyncService first (spec §8.3, v11 decision)
/// so a newly source-eligible user can log in on the first attempt and a
/// revoked one is blocked on the next — manually created accounts
/// (source_user_id = null, from /oas/setup) skip the sync flow entirely.
///
/// Account lockout (5 failed attempts → 15 min, spec §8.1) applies to
/// password verification only — a JIT-sync rejection is a separate,
/// earlier failure path (401 invalid_credentials, spec §8.3 step 5).
/// </summary>
public class OasAuthService : IOasAuthService
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromHours(8);

    private readonly OasDbContext _db;
    private readonly IOasUserJitSyncService _jitSync;
    private readonly IOasTokenService _tokenService;
    private readonly ILogger<OasAuthService> _logger;
    private readonly IForgotEmailService _forgotEmailService;
    private readonly string _oasSlug;

    public OasAuthService(OasDbContext db, IOasUserJitSyncService jitSync, IOasTokenService tokenService, ILogger<OasAuthService> logger, IForgotEmailService forgotEmailService, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _jitSync = jitSync;
        _tokenService = tokenService;
        _logger = logger;
        _forgotEmailService = forgotEmailService;
        _oasSlug = httpContextAccessor.HttpContext?.Items["OasSlug"] as string
            ?? throw new InvalidOperationException("OasSlug not resolved on HttpContext — OasTenantMiddleware must run before this service is used.");
    }

    /// <summary>
    /// Maintenance escape hatch (secret-gated in the controller): retires the
    /// tenant's admin account(s) so the one-time /oas/setup bootstrap can be
    /// replayed when the original credentials are lost. Soft-delete rather
    /// than a hard DELETE — other OAS tables (declarations, audit, events)
    /// reference the user id, so removing the row raises an FK violation.
    /// The email is rewritten too, otherwise the unique (tenant, email)
    /// index would reject re-creating the same address. Tenant +
    /// soft-delete scoping comes from OasDbContext's query filter.
    /// </summary>
    /// <summary>
    /// True when this tenant already has an admin account (tenant +
    /// soft-delete scoping comes from OasDbContext's query filter, so a
    /// retired admin from ResetAdminsAsync correctly reads as "none").
    /// </summary>
    public Task<bool> HasAdminAsync() => _db.Users.AnyAsync(u => u.Role == OasAppRole.admin);

    public async Task<int> ResetAdminsAsync()
    {
        var admins = await _db.Users.Where(u => u.Role == OasAppRole.admin).ToListAsync();
        if (admins.Count == 0) return 0;
        var stamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        foreach (var admin in admins)
        {
            admin.IsDeleted = true;
            admin.IsActive = false;
            admin.RefreshToken = null;
            admin.RefreshTokenExpiresAt = null;
            admin.Email = $"retired+{stamp}+{admin.Email}";
            admin.UpdatedAt = DateTimeOffset.UtcNow;
        }
        await _db.SaveChangesAsync();
        _logger.LogWarning("🏭 [OAS/AUTH] ⚠️ ResetAdmins retired {Count} admin account(s) for oas tenant '{Slug}'", admins.Count, _oasSlug);
        return admins.Count;
    }

    public async Task<OasAuthResponseDto> SetupAsync(string oasSlug, int tenantId, OasSetupRequestDto request)
    {
        // Tenant + soft-delete scoping already applied by OasDbContext's
        // combined query filter (SetTenantId is set to `tenantId` for this
        // request) — no IgnoreQueryFilters() here, or this would check for
        // an existing admin across every tenant sharing this database.
        var adminExists = await _db.Users.AnyAsync(u => u.Role == OasAppRole.admin);

        if (adminExists)
        {
            return new OasAuthResponseDto { Success = false, Message = "An admin already exists for this tenant." };
        }

        var user = new OasUser
        {
            TenantId = tenantId,
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, BCrypt.Net.BCrypt.GenerateSalt(12)),
            DisplayName = request.DisplayName,
            Role = OasAppRole.admin,
            Workspace = OasWorkspace.web,
            IsActive = true,
            SourceUserId = null,
            SourceTenantId = null,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("🏭 OAS-SETUP: first admin created for oas tenant '{Slug}' (tenantId={TenantId})", _oasSlug, tenantId);

        var (accessToken, refreshToken, expiresAt) = await IssueTokensAsync(user);
        return new OasAuthResponseDto
        {
            Success = true,
            Message = "Setup complete",
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = ToDto(user),
        };
    }

    public async Task<OasAuthResponseDto> LoginAsync(string oasSlug, int tenantId, OasLoginRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        // Same response whether the account doesn't exist or the password is
        // wrong — no account-enumeration signal (spec §8.3 step 5).
        var genericFailure = new OasAuthResponseDto { Success = false, Message = "Invalid credentials." };

        var syncResult = await _jitSync.SyncByEmailAsync(oasSlug, tenantId, email);
        if (syncResult.Outcome == JitSyncOutcome.RejectedNotEligible) return genericFailure;

        var user = syncResult.User ?? await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null) return genericFailure;

        if (!user.IsActive) return new OasAuthResponseDto { Success = false, Message = "Account is inactive." };

        if (user.LockedUntil is not null && user.LockedUntil > DateTimeOffset.UtcNow)
        {
            return new OasAuthResponseDto { Success = false, Message = "Account is temporarily locked. Try again later." };
        }

        if (string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            await RegisterFailedAttemptAsync(user);
            return genericFailure;
        }

        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        user.LastLoginAt = DateTimeOffset.UtcNow;

        var (deviceId, deviceRevoked) = await RegisterDeviceAsync(user, request.DeviceId, request.DeviceLabel, request.DevicePlatform);
        if (deviceRevoked) return new OasAuthResponseDto { Success = false, Message = "This device has been revoked. Contact your administrator." };

        var (accessToken, refreshToken, expiresAt) = await IssueTokensAsync(user, deviceId);

        return new OasAuthResponseDto
        {
            Success = true,
            Message = "Login successful",
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = ToDto(user),
        };
    }

    private async Task RegisterFailedAttemptAsync(OasUser user)
    {
        user.FailedLoginAttempts++;
        if (user.FailedLoginAttempts >= MaxFailedAttempts)
        {
            user.LockedUntil = DateTimeOffset.UtcNow.Add(LockoutDuration);
            _logger.LogWarning("🏭 OAS-AUTH: user {UserId} locked out after {Attempts} failed attempts", user.Id, user.FailedLoginAttempts);
        }
        await _db.SaveChangesAsync();
    }

    public async Task<OasUserDto?> GetCurrentUserAsync(Guid oasUserId)
    {
        var user = await _db.Users.FindAsync(oasUserId);
        return user is null ? null : ToDto(user);
    }

    /// <summary>Self-service identity edit. Email is normalised and uniqueness-checked against the tenant (IgnoreQueryFilters, like OasOperatorService.CreateAsync, so a soft-deleted row holding the unique index entry yields a clean conflict instead of a 500). Never touches role/scope/active — privilege fields stay admin-only.</summary>
    public async Task<OasAuthResponseDto> UpdateProfileAsync(Guid oasUserId, OasUpdateProfileRequestDto request)
    {
        var user = await _db.Users.FindAsync(oasUserId);
        if (user is null) return new OasAuthResponseDto { Success = false, Message = "User not found." };

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim().ToLowerInvariant();
            if (email != user.Email
                && await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.TenantId == user.TenantId && u.Email == email && u.Id != user.Id))
            {
                return new OasAuthResponseDto { Success = false, Message = "email_already_exists" };
            }
            user.Email = email;
        }

        if (request.DisplayName is not null)
        {
            var displayName = request.DisplayName.Trim();
            if (displayName.Length == 0) return new OasAuthResponseDto { Success = false, Message = "display_name_required" };
            user.DisplayName = displayName;
        }

        if (request.Phone is not null)
        {
            var phone = request.Phone.Trim();
            user.Phone = phone.Length == 0 ? null : phone;
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return new OasAuthResponseDto { Success = true, Message = "Profile updated.", User = ToDto(user) };
    }

    public async Task<OasAuthResponseDto> RefreshAsync(OasRefreshRequestDto request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);
        if (user is null || user.RefreshTokenExpiresAt is null || user.RefreshTokenExpiresAt < DateTimeOffset.UtcNow)
        {
            return new OasAuthResponseDto { Success = false, Message = "Invalid or expired refresh token." };
        }

        // Re-sync before honoring the refresh (spec §8.3): a socle-side
        // revocation cuts access at the next refresh, not just the next
        // fresh login.
        if (user.SourceUserId is not null)
        {
            var syncResult = await _jitSync.SyncByEmailAsync(_oasSlug, user.TenantId, user.Email);
            if (syncResult.Outcome == JitSyncOutcome.RejectedNotEligible)
            {
                return new OasAuthResponseDto { Success = false, Message = "Access has been revoked." };
            }
            user = syncResult.User ?? user;
        }

        if (!user.IsActive)
        {
            return new OasAuthResponseDto { Success = false, Message = "Account is inactive." };
        }

        var (accessToken, refreshToken, expiresAt) = await IssueTokensAsync(user);
        return new OasAuthResponseDto
        {
            Success = true,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = ToDto(user),
        };
    }

    public async Task<bool> LogoutAsync(Guid oasUserId)
    {
        var user = await _db.Users.FindAsync(oasUserId);
        if (user is null) return false;
        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<OasAuthResponseDto> ChangePasswordAsync(Guid oasUserId, OasChangePasswordRequestDto request)
    {
        var user = await _db.Users.FindAsync(oasUserId);
        if (user is null) return new OasAuthResponseDto { Success = false, Message = "User not found." };

        if (string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return new OasAuthResponseDto { Success = false, Message = "Current password is incorrect." };
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, BCrypt.Net.BCrypt.GenerateSalt(12));
        await _db.SaveChangesAsync();
        return new OasAuthResponseDto { Success = true, Message = "Password changed." };
    }

    // ── Password reset by emailed OTP ───────────────────────────────────────
    // Same three-step shape as the socle (POST forgot-password → OTP email →
    // verify-otp → reset-password) and the same sender: IForgotEmailService,
    // i.e. the shared Flowentra support mailbox over OVH SMTP. Differences
    // from the socle, deliberately: the 6-digit code is stored hashed, has a
    // 5-attempt cap, and a 60 s resend throttle. Responses are always
    // non-enumerable ("if an account exists…") like spec §8.3.

    private const int ResetOtpMaxAttempts = 5;
    private static readonly TimeSpan ResetOtpLifetime = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan ResetTokenLifetime = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan ResetOtpResendCooldown = TimeSpan.FromSeconds(60);

    private const string GenericForgotMessage = "If an account with this email exists, a code has been sent.";

    private static string GenerateOtp() => RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

    private static string HashOtp(string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));

    private static string GenerateResetToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    public async Task<OasAuthResponseDto> ForgotPasswordAsync(OasForgotPasswordRequestDto request)
    {
        var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (email.Length < 3) return new OasAuthResponseDto { Success = false, Message = "Email is required." };

        // Tenant + soft-delete scoping comes from OasDbContext's query filter.
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        // Unknown address, an operator-only account with no password, or an
        // inactive one: same generic answer, so this can't enumerate accounts.
        if (user is null || !user.IsActive || string.IsNullOrEmpty(user.PasswordHash))
        {
            _logger.LogInformation("🏭 [OAS/AUTH] forgot-password for unknown/ineligible email on tenant '{Slug}'", _oasSlug);
            return new OasAuthResponseDto { Success = true, Message = GenericForgotMessage };
        }

        if (user.PasswordResetOtpLastSentAt is { } sentAt && DateTimeOffset.UtcNow - sentAt < ResetOtpResendCooldown)
        {
            return new OasAuthResponseDto { Success = true, Message = GenericForgotMessage };
        }

        var otp = GenerateOtp();
        user.PasswordResetOtpHash = HashOtp(otp);
        user.PasswordResetOtpExpiresAt = DateTimeOffset.UtcNow.Add(ResetOtpLifetime);
        user.PasswordResetOtpAttempts = 0;
        user.PasswordResetOtpLastSentAt = DateTimeOffset.UtcNow;
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        var language = string.IsNullOrWhiteSpace(request.Language) ? "en" : request.Language!.ToLowerInvariant();
        var sent = await _forgotEmailService.SendOtpEmailAsync(user.Email, otp, user.DisplayName ?? "User", language);
        if (!sent)
        {
            _logger.LogWarning("🏭 [OAS/AUTH] ⚠️ reset OTP email failed for {Email} (code stored, user can retry)", user.Email);
        }

        return new OasAuthResponseDto { Success = true, Message = GenericForgotMessage };
    }

    public async Task<OasVerifyResetOtpResponseDto> VerifyResetOtpAsync(OasVerifyResetOtpRequestDto request)
    {
        var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
        var code = (request.OtpCode ?? string.Empty).Trim();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user is null || string.IsNullOrEmpty(user.PasswordResetOtpHash) || user.PasswordResetOtpExpiresAt is null)
        {
            return new OasVerifyResetOtpResponseDto { Success = false, Message = "No code pending. Request a new one." };
        }

        if (DateTimeOffset.UtcNow > user.PasswordResetOtpExpiresAt)
        {
            ClearResetOtp(user);
            await _db.SaveChangesAsync();
            return new OasVerifyResetOtpResponseDto { Success = false, Message = "Code expired. Request a new one." };
        }

        if (user.PasswordResetOtpAttempts >= ResetOtpMaxAttempts)
        {
            ClearResetOtp(user);
            await _db.SaveChangesAsync();
            return new OasVerifyResetOtpResponseDto { Success = false, Message = "Too many attempts. Request a new code." };
        }

        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(HashOtp(code)),
                Encoding.UTF8.GetBytes(user.PasswordResetOtpHash)))
        {
            user.PasswordResetOtpAttempts += 1;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            return new OasVerifyResetOtpResponseDto { Success = false, Message = "Invalid code." };
        }

        var token = GenerateResetToken();
        ClearResetOtp(user);
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiresAt = DateTimeOffset.UtcNow.Add(ResetTokenLifetime);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return new OasVerifyResetOtpResponseDto { Success = true, Message = "Code verified.", ResetToken = token };
    }

    public async Task<OasAuthResponseDto> ResetPasswordAsync(OasResetPasswordRequestDto request)
    {
        var token = (request.ResetToken ?? string.Empty).Trim();
        var password = request.NewPassword ?? string.Empty;
        if (token.Length == 0 || password.Length < 8)
        {
            return new OasAuthResponseDto { Success = false, Message = "Password must be at least 8 characters." };
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == token);
        if (user is null || user.PasswordResetTokenExpiresAt is null || DateTimeOffset.UtcNow > user.PasswordResetTokenExpiresAt)
        {
            return new OasAuthResponseDto { Success = false, Message = "Reset link expired. Start over." };
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;
        ClearResetOtp(user);
        // Reset unlocks the account and drops other sessions — a forgotten
        // password often means a locked-out or compromised account.
        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("🏭 [OAS/AUTH] password reset completed for {Email} on tenant '{Slug}'", user.Email, _oasSlug);
        return new OasAuthResponseDto { Success = true, Message = "Password updated. You can sign in now." };
    }

    private static void ClearResetOtp(OasUser user)
    {
        user.PasswordResetOtpHash = null;
        user.PasswordResetOtpExpiresAt = null;
        user.PasswordResetOtpAttempts = 0;
        user.PasswordResetOtpLastSentAt = null;
    }


    /// <summary>
    /// EF-M2-09: records the device the login came from and binds the token to
    /// it. Returns null when the client sent no device id (tokens then behave
    /// exactly as before) or when the tenant DB has not yet received the 008
    /// upgrade — never blocks a legitimate login on registry bookkeeping.
    /// A device an admin revoked cannot log in again: `revoked` is returned so
    /// the caller can reject the attempt outright instead of minting a token
    /// that the authorization filter would refuse on the very next request.
    /// </summary>
    private async Task<(string? deviceId, bool revoked)> RegisterDeviceAsync(OasUser user, string? deviceId, string? label, string? platform)
    {
        if (string.IsNullOrWhiteSpace(deviceId)) return (null, false);
        deviceId = deviceId.Trim();

        try
        {
            var device = await _db.Set<OasDeviceToken>().FirstOrDefaultAsync(d => d.UserId == user.Id && d.DeviceId == deviceId);
            if (device is not null && device.RevokedAt is not null) return (deviceId, true);

            if (device is null)
            {
                device = new OasDeviceToken
                {
                    TenantId = user.TenantId,
                    UserId = user.Id,
                    DeviceId = deviceId,
                    Token = $"{user.Id}:{deviceId}",
                };
                _db.Set<OasDeviceToken>().Add(device);
            }

            device.Label = label ?? device.Label;
            device.Platform = platform is "android" or "ios" or "web" ? platform : (device.Platform ?? "web");
            device.LastSeenAt = DateTimeOffset.UtcNow;
        }
        catch (Npgsql.PostgresException ex)
        {
            _logger.LogWarning(ex, "🏭 OAS-AUTH: device registry unavailable (008 upgrade pending?) — continuing without device binding");
            return (null, false);
        }

        return (deviceId, false);
    }

    private async Task<(string accessToken, string refreshToken, DateTimeOffset expiresAt)> IssueTokensAsync(OasUser user, string? deviceId = null)
    {
        var (accessToken, refreshToken, expiresAt) = _tokenService.IssueTokens(user, _oasSlug, deviceId);
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(30);
        await _db.SaveChangesAsync();
        return (accessToken, refreshToken, expiresAt);
    }

    private static OasUserDto ToDto(OasUser u) => new()
    {
        Id = u.Id,
        Email = u.Email,
        DisplayName = u.DisplayName,
        Phone = u.Phone,
        Role = u.Role.ToString(),
        Workspace = u.Workspace.ToString(),
        IsActive = u.IsActive,
        ScopeSiteId = u.ScopeSiteId,
        ScopeZoneId = u.ScopeZoneId,
        ScopeLineId = u.ScopeLineId,
    };
}
