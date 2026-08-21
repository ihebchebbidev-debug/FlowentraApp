using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
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

            cache.Set(cacheKey, isActive, ActiveStatusCacheTtl);
        }

        if (!isActive)
        {
            context.Result = new Microsoft.AspNetCore.Mvc.UnauthorizedResult();
        }
    }
}
