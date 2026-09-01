using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using MyApi.Modules.OAS.Devices.Models;
using MyApi.Modules.OAS.Devices.Services;
using MyApi.Modules.OAS.ShopFloorAuth.Models;

namespace MyApi.Modules.OAS.Common;

/// <summary>
/// Role gate for OAS routes, keyed off the `oas_role` JWT claim (admin |
/// supervisor | operator — spec §8.0, §8.1). Distinct from the socle's
/// [RequirePermission] — OAS has no granular permission system, only these
/// three flat roles, and MainAdminUser does NOT bypass it (spec §8.0: OAS
/// auth is entirely separate from socle auth).
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class OasAuthorizeAttribute : Attribute, IAsyncAuthorizationFilter
{
    /// <summary>Comma-separated OAS roles allowed to call this action, e.g. "admin,supervisor". Settable as a named argument: [OasAuthorize(Roles = "admin")].</summary>
    public string Roles { get; set; } = "admin,supervisor,operator";

    /// <summary>
    /// How long a user's IsActive flag is trusted before re-checking the
    /// database. OasAuthService.LogoutAsync only clears the refresh token —
    /// nothing else re-checks IsActive per request, so without this a
    /// deactivated/offboarded user's ~8h access token (OasTokenService)
    /// would keep working for its full remaining lifetime. This bounds that
    /// window to ~60s instead, without a DB round-trip on every request.
    /// </summary>
    private static readonly TimeSpan ActiveStatusCacheTtl = TimeSpan.FromSeconds(60);
    private const string ActiveStatusCacheKeyPrefix = "oas_user_active:";

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new Microsoft.AspNetCore.Mvc.UnauthorizedResult();
            return;
        }

        var allowedRoles = Roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var role = user.FindFirst("oas_role")?.Value;
        if (string.IsNullOrEmpty(role) || !allowedRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
        {
            context.Result = new Microsoft.AspNetCore.Mvc.ObjectResult(new { title = "forbidden", status = 403 })
            {
                StatusCode = 403
            };
            return;
        }

        // Revocation check. The attribute is used directly (`[OasAuthorize(...)]`),
        // not via a service filter, so services are resolved from
        // RequestServices here rather than through constructor injection.
        var userIdClaim = user.FindFirst("oas_user_id")?.Value;
        if (!Guid.TryParse(userIdClaim, out var oasUserId))
        {
            context.Result = new Microsoft.AspNetCore.Mvc.UnauthorizedResult();
            return;
        }

        var cache = context.HttpContext.RequestServices.GetRequiredService<IMemoryCache>();
        var cacheKey = ActiveStatusCacheKeyPrefix + oasUserId;

        if (!cache.TryGetValue(cacheKey, out bool isActive))
        {
            var db = context.HttpContext.RequestServices.GetRequiredService<OasDbContext>();
            isActive = await db.Set<OasUser>().AsNoTracking()
                .Where(u => u.Id == oasUserId)
                .Select(u => (bool?)u.IsActive)
                .FirstOrDefaultAsync() ?? false;

            // The socle's shared MemoryCache is configured with a SizeLimit
            // (Program.cs), so every entry MUST declare a Size or Set() throws
            // and the request fails with 400.
            cache.Set(cacheKey, isActive, new MemoryCacheEntryOptions
            {
                Size = 1,
                AbsoluteExpirationRelativeToNow = ActiveStatusCacheTtl,
            });
        }

        if (!isActive)
        {
            context.Result = new Microsoft.AspNetCore.Mvc.UnauthorizedResult();
            return;
        }

        // EF-M2-09 per-device revocation. Account deactivation (above) is
        // all-or-nothing; a lost/stolen tablet has to lose access WITHOUT
        // locking its operator out of every other terminal. Tokens minted
        // for a registered device carry `oas_device_id`; if that device has
        // been revoked, the token stops working immediately (cached for the
        // same 60s window as the active-status check, and invalidated
        // outright by OasDeviceService the moment an admin revokes).
        var deviceId = user.FindFirst("oas_device_id")?.Value;
        if (string.IsNullOrEmpty(deviceId)) return;

        var deviceCacheKey = OasDeviceRevocation.CacheKey(deviceId);
        if (!cache.TryGetValue(deviceCacheKey, out bool isRevoked))
        {
            var db = context.HttpContext.RequestServices.GetRequiredService<OasDbContext>();
            try
            {
                isRevoked = await db.Set<OasDeviceToken>().AsNoTracking()
                    .AnyAsync(d => d.UserId == oasUserId && d.DeviceId == deviceId && d.RevokedAt != null);
            }
            catch (Npgsql.PostgresException)
            {
                // Columns not provisioned yet on this tenant DB (008 pending):
                // fail OPEN on revocation rather than locking every user out.
                isRevoked = false;
            }

            cache.Set(deviceCacheKey, isRevoked, new MemoryCacheEntryOptions
            {
                Size = 1,
                AbsoluteExpirationRelativeToNow = OasDeviceRevocation.CacheTtl,
            });
        }

        if (isRevoked)
        {
            context.Result = new Microsoft.AspNetCore.Mvc.ObjectResult(new { title = "device_revoked", status = 401 })
            {
                StatusCode = 401
            };
        }
    }
}
