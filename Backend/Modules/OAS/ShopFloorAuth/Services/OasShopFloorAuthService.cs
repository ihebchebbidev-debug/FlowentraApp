using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.ShopFloorAuth.DTOs;
using MyApi.Modules.OAS.ShopFloorAuth.Models;
using System.Security.Cryptography;

namespace MyApi.Modules.OAS.ShopFloorAuth.Services;

/// <summary>
/// Shopfloor login (spec §8.2): a single endpoint, polymorphic body.
///   • mode "pin" — badge (oas_users.employee_code) + pin, JIT-synced first.
///   • mode "qr"  — oas_posts.qr_token identifies a POST, not a person; the
///     operator authenticated is whoever holds today's published
///     assignment for that post (oas_assignments, published_at not null,
///     work_date = today). Queried via raw SQL for now: oas_assignments has
///     no EF entity yet (that lands in Lot 4's Assignments sub-module) but
///     the table already exists physically once 001_schema.sql has run, so
///     this works correctly today and can be swapped for a clean
///     EF-based query once Lot 4's entity exists — not a placeholder, a
///     real bridge.
/// </summary>
public class OasShopFloorAuthService : IOasShopFloorAuthService
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly OasDbContext _db;
    private readonly IOasUserJitSyncService _jitSync;
    private readonly IOasTokenService _tokenService;
    private readonly ILogger<OasShopFloorAuthService> _logger;
    private readonly System.Security.Claims.ClaimsPrincipal? _caller;
    private readonly string _oasSlug;

    public OasShopFloorAuthService(OasDbContext db, IOasUserJitSyncService jitSync, IOasTokenService tokenService, ILogger<OasShopFloorAuthService> logger, Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _jitSync = jitSync;
        _tokenService = tokenService;
        _logger = logger;
        _caller = httpContextAccessor.HttpContext?.User;
        _oasSlug = httpContextAccessor.HttpContext?.Items["OasSlug"] as string
            ?? throw new InvalidOperationException("OasSlug not resolved on HttpContext — OasTenantMiddleware must run before this service is used.");
    }

    private Guid? CallerScopeClaim(string type)
    {
        var value = _caller?.FindFirst(type)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }

    public async Task<OasAuthResponseDto> LoginAsync(string oasSlug, int tenantId, OasShopFloorLoginRequestDto request)
    {
        return request.Mode.Trim().ToLowerInvariant() switch
        {
            "pin" => await LoginByPinAsync(oasSlug, tenantId, request),
            "qr" => await LoginByQrAsync(tenantId, request),
            _ => new OasAuthResponseDto { Success = false, Message = "mode must be \"pin\" or \"qr\"." },
        };
    }

    private async Task<OasAuthResponseDto> LoginByPinAsync(string oasSlug, int tenantId, OasShopFloorLoginRequestDto request)
    {
        var genericFailure = new OasAuthResponseDto { Success = false, Message = "Invalid credentials." };

        if (string.IsNullOrWhiteSpace(request.Badge) || string.IsNullOrWhiteSpace(request.Pin))
        {
            return new OasAuthResponseDto { Success = false, Message = "badge and pin are required." };
        }

        var syncResult = await _jitSync.SyncByEmployeeCodeAsync(oasSlug, tenantId, request.Badge);
        if (syncResult.Outcome == JitSyncOutcome.RejectedNotEligible) return genericFailure;

        var user = syncResult.User ?? await _db.Users.FirstOrDefaultAsync(u => u.EmployeeCode == request.Badge);
        if (user is null) return genericFailure;

        if (!user.IsActive) return new OasAuthResponseDto { Success = false, Message = "Account is inactive." };

        if (user.LockedUntil is not null && user.LockedUntil > DateTimeOffset.UtcNow)
        {
            return new OasAuthResponseDto { Success = false, Message = "Account is temporarily locked. Try again later." };
        }

        // PBKDF2-hashed comparison (OasPinHasher) — pin used to be stored and
        // compared as plaintext. Existing rows may still hold a legacy
        // plaintext 4-6 digit PIN (LooksLikeHash returns false for those);
        // a matching plaintext PIN is accepted for this one login and the
        // row is immediately upgraded to a hash, so every account is
        // transparently migrated on its next successful login with no
        // separate migration script and no forced PIN reset.
        var pinValid = false;
        if (!string.IsNullOrEmpty(user.Pin))
        {
            if (OasPinHasher.LooksLikeHash(user.Pin))
            {
                pinValid = OasPinHasher.Verify(request.Pin, user.Pin);
                // Same transparent-upgrade idea applied to the KDF cost: a row
                // hashed at the old iteration count is re-hashed at the current
                // one while the plaintext PIN is still in hand.
                if (pinValid && OasPinHasher.NeedsRehash(user.Pin))
                {
                    user.Pin = OasPinHasher.Hash(request.Pin);
                }
            }
            else if (user.Pin == request.Pin)
            {
                pinValid = true;
                user.Pin = OasPinHasher.Hash(request.Pin);
            }
        }

        if (!pinValid)
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.LockedUntil = DateTimeOffset.UtcNow.Add(LockoutDuration);
                _logger.LogWarning("🏭 OAS-SHOPFLOOR-AUTH: user {UserId} locked out after {Attempts} failed PIN attempts", user.Id, user.FailedLoginAttempts);
            }
            await _db.SaveChangesAsync();
            return genericFailure;
        }

        return await IssueLoginResponseAsync(user);
    }

    private async Task<OasAuthResponseDto> LoginByQrAsync(int tenantId, OasShopFloorLoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return new OasAuthResponseDto { Success = false, Message = "token is required." };
        }

        var assignedUserId = await _db.Database.SqlQueryRaw<Guid?>(
            """
            select a.user_id as "Value"
            from oas_posts p
            join oas_assignments a on a.post_id = p.id and a.tenant_id = p.tenant_id
            where p.qr_token = {0}
              and p.tenant_id = {1}
              and a.published_at is not null
              and a.work_date = current_date
            order by a.created_at desc
            limit 1
            """, request.Token, tenantId).FirstOrDefaultAsync();

        if (assignedUserId is null)
        {
            return new OasAuthResponseDto { Success = false, Message = "No published assignment found for this post today." };
        }

        var user = await _db.Users.FindAsync(assignedUserId.Value);
        if (user is null || !user.IsActive)
        {
            return new OasAuthResponseDto { Success = false, Message = "Assigned operator's account is unavailable." };
        }

        return await IssueLoginResponseAsync(user);
    }

    private async Task<OasAuthResponseDto> IssueLoginResponseAsync(OasUser user)
    {
        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        user.LastLoginAt = DateTimeOffset.UtcNow;

        var (accessToken, refreshToken, expiresAt) = _tokenService.IssueTokens(user, _oasSlug);
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(30);
        await _db.SaveChangesAsync();

        return new OasAuthResponseDto
        {
            Success = true,
            Message = "Login successful",
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = new OasUserDto
            {
                Id = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Role = user.Role.ToString(),
                Workspace = user.Workspace.ToString(),
                IsActive = user.IsActive,
                ScopeSiteId = user.ScopeSiteId,
                ScopeZoneId = user.ScopeZoneId,
                ScopeLineId = user.ScopeLineId,
            },
        };
    }

    public async Task<OasPinRegenerateResponseDto> RegeneratePinAsync(int tenantId, Guid targetUserId, string actorRole)
    {
        if (!string.Equals(actorRole, "admin", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(actorRole, "supervisor", StringComparison.OrdinalIgnoreCase))
        {
            return new OasPinRegenerateResponseDto { Success = false, Message = "Only admin/supervisor may regenerate a PIN." };
        }

        var user = await _db.Users.FindAsync(targetUserId);
        if (user is null) return new OasPinRegenerateResponseDto { Success = false, Message = "Operator not found." };

        // A supervisor is scoped to a perimeter (BL-012) but this endpoint only
        // checked the role, so any supervisor could reset — and therefore read —
        // the PIN of any operator in the tenant, including another site's admin.
        // Admin stays unrestricted; supervisors are held to their own scope.
        if (string.Equals(actorRole, "supervisor", StringComparison.OrdinalIgnoreCase))
        {
            if (user.Role == OasAppRole.admin)
            {
                return new OasPinRegenerateResponseDto { Success = false, Message = "Not permitted for this operator." };
            }

            var actorSiteId = CallerScopeClaim("oas_scope_site_id");
            var actorZoneId = CallerScopeClaim("oas_scope_zone_id");
            var actorLineId = CallerScopeClaim("oas_scope_line_id");

            var outOfScope =
                (actorLineId is not null && user.ScopeLineId != actorLineId)
                || (actorLineId is null && actorZoneId is not null && user.ScopeZoneId != actorZoneId)
                || (actorLineId is null && actorZoneId is null && actorSiteId is not null && user.ScopeSiteId != actorSiteId);

            if (outOfScope)
            {
                return new OasPinRegenerateResponseDto { Success = false, Message = "Not permitted for this operator." };
            }
        }

        var newPin = RandomNumberGenerator.GetInt32(0, 10_000).ToString("D4");
        user.Pin = OasPinHasher.Hash(newPin);
        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        await _db.SaveChangesAsync();

        // The raw PIN is returned once here (spec §8.1: only the
        // regenerate-pin endpoint ever exposes it, never a GET) so it can be
        // communicated to the operator — only the hash is persisted.
        return new OasPinRegenerateResponseDto { Success = true, Pin = newPin };
    }
}
