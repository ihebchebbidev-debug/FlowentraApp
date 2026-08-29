namespace MyApi.Modules.OAS.Common;

/// <summary>
/// Routing guard for every `api/oas/*` request (spec §1.2 bis points 4-5).
/// Reuses the socle's X-Tenant resolution as-is — never modifies
/// TenantMiddleware — and only acts on OAS routes:
///
///   • X-Tenant does not end in "oas" on an api/oas/* route  → default to the
///     "testoas" tenant (see DefaultOasSlug) so hosts without a proper *oas
///     slug (localhost, a raw IP, a preview deploy, a client that forgot the
///     header) still work against the test database instead of hard-failing.
///   • X-Tenant ends in "oas" but has no dedicated database   → 503 oas_tenant_not_provisioned
///     — this still fails closed: a real, named tenant that just isn't
///     provisioned yet is never silently redirected to another tenant's data.
///   • Otherwise                                              → stash the slug for
///     the scoped OasDbContext factory (see OasModuleRegistration) and continue.
///
/// api/oas/health and api/oas/setup are exempt from the *oas requirement
/// (point 5) — they report/bootstrap explicitly by slug and must not be
/// silently redirected to the default tenant.
/// Non-OAS routes are untouched — this middleware is a no-op for them.
///
/// api/oas/stream is a browser EventSource connection — it cannot set any
/// custom header at all (same limitation OasModuleRegistration already
/// works around for the JWT via `?access_token=`), so the slug falls back
/// to a `?tenant=` query parameter for that one path only; every other
/// route still requires the X-Tenant header, unchanged.
/// </summary>
public class OasTenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<OasTenantMiddleware> _logger;

    private static readonly string[] CrossSlugExemptPaths = { "/api/oas/health", "/api/oas/setup" };
    private const string StreamPath = "/api/oas/stream";

    /// <summary>Tenant used for any request whose host/X-Tenant doesn't resolve to a real *oas slug — must itself be a provisioned *oas tenant (TENANT_TESTOAS_DATABASE_URL).</summary>
    public const string DefaultOasSlug = "testoas";

    public OasTenantMiddleware(RequestDelegate next, ILogger<OasTenantMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IOasDbContextFactory dbFactory)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        if (!path.StartsWith("/api/oas", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var slug = context.Request.Headers[Infrastructure.TenantMiddleware.TenantHeaderName]
            .FirstOrDefault()?.Trim().ToLowerInvariant();

        if (string.IsNullOrEmpty(slug) && path.StartsWith(StreamPath, StringComparison.OrdinalIgnoreCase))
        {
            slug = context.Request.Query["tenant"].FirstOrDefault()?.Trim().ToLowerInvariant();
        }

        var isExempt = CrossSlugExemptPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase));

        if (!OasTenant.IsOasSlug(slug))
        {
            // "No tenant detected at all" — no X-Tenant header (and no ?tenant=
            // on the stream route). This is the localhost / raw-IP / file://
            // (Electron) / capacitor://localhost (APK) case, where the bundle
            // has no deployed subdomain to derive a slug from. Those clients
            // must land on the test tenant, INCLUDING on the exempt routes:
            // otherwise /health answers "no_tenant" and /setup 500s on a
            // missing OasSlug, which is exactly what made the packaged mobile
            // and desktop builds look broken.
            if (string.IsNullOrEmpty(slug))
            {
                _logger.LogWarning("🏭 OAS-TENANT: {Path} — no X-Tenant sent, defaulting to '{Default}'", path, DefaultOasSlug);
                slug = DefaultOasSlug;
            }
            else if (isExempt)
            {
                // An explicit but non-*oas slug on /health or /setup is a
                // deliberate probe by slug — never silently redirect it.
                await _next(context);
                return;
            }
            else
            {
                _logger.LogWarning("🏭 OAS-TENANT: {Path} — X-Tenant '{Slug}' does not end in 'oas', defaulting to '{Default}'", path, slug, DefaultOasSlug);
                slug = DefaultOasSlug;
            }
        }

        try
        {
            // Pre-flight resolution: throws OasTenantNotProvisionedException if
            // no dedicated database is configured for this slug (fail-closed —
            // OAS never silently falls back to a shared database in Production).
            dbFactory.GetConnectionString(slug!);
        }
        catch (OasTenantNotProvisionedException ex)
        {
            _logger.LogError("🏭 OAS-TENANT: {Slug} not provisioned ({Path})", ex.Slug, path);
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            await context.Response.WriteAsJsonAsync(new { error = "oas_tenant_not_provisioned", tenant = ex.Slug });
            return;
        }

        context.Items["OasSlug"] = slug;

        // OAS access tokens are tenant-bound. Without this explicit check, a
        // token minted for tenant A could be replayed with tenant B's header
        // and would be rejected only incidentally when its user GUID was not
        // found in B's database. Legacy tokens without the claim are rejected
        // and must refresh/sign in again.
        var tokenUserId = context.User.FindFirst("oas_user_id")?.Value;
        if (!string.IsNullOrEmpty(tokenUserId))
        {
            var tokenSlug = context.User.FindFirst("oas_slug")?.Value;
            if (!string.Equals(tokenSlug, slug, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("🏭 OAS-TENANT: rejected token tenant mismatch on {Path}", path);
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { error = "oas_tenant_mismatch" });
                return;
            }
        }

        await _next(context);
    }
}

public static class OasTenantMiddlewareExtensions
{
    public static IApplicationBuilder UseOasTenantMiddleware(this IApplicationBuilder app)
        => app.UseMiddleware<OasTenantMiddleware>();
}
