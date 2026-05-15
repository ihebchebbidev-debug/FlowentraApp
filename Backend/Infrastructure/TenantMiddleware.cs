using System.Collections;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;

namespace MyApi.Infrastructure;

/// <summary>
/// Middleware that reads the X-Tenant header from the request,
/// resolves a per-tenant connection string, and reconfigures
/// the ApplicationDbContext for the current request scope.
///
/// If no header is provided, the default connection string from
/// DATABASE_URL / appsettings is used.
///
/// Special value "__all__" enables cross-company mode for MainAdminUsers.
/// Mutations require an additional X-Target-Tenant header specifying the
/// target tenant ID, so that writes are properly scoped.
/// </summary>
public class TenantMiddleware
{
    public const string TenantHeaderName = "X-Tenant";
    public const string TargetTenantHeaderName = "X-Target-Tenant";
    public const string ViewAllSentinel = "__all__";

    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger, IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var tenant = context.Request.Headers[TenantHeaderName].FirstOrDefault()?.Trim().ToLowerInvariant();

        if (string.Equals(tenant, ViewAllSentinel, StringComparison.OrdinalIgnoreCase))
        {
            // Accept several historical spellings of the user-type claim. The token
            // generator emits "UserType" + "login_type=admin"; older code/tests used
            // "user_type". Be permissive so the gate keys off the JWT, not the header.
            var claims = context.User?.Claims;
            var isMainAdmin = claims != null && claims.Any(c =>
                (string.Equals(c.Type, "UserType", StringComparison.OrdinalIgnoreCase) &&
                 string.Equals(c.Value, "MainAdminUser", StringComparison.OrdinalIgnoreCase)) ||
                (string.Equals(c.Type, "user_type", StringComparison.OrdinalIgnoreCase) &&
                 string.Equals(c.Value, "MainAdminUser", StringComparison.OrdinalIgnoreCase)) ||
                (string.Equals(c.Type, "login_type", StringComparison.OrdinalIgnoreCase) &&
                 string.Equals(c.Value, "admin", StringComparison.OrdinalIgnoreCase)));

            if (!isMainAdmin)
            {
                _logger.LogWarning(
                    "🚫 TENANT-MIDDLEWARE: Non-MainAdmin attempted __all__ mode (IsAuthenticated={Auth}, ClaimCount={Count})",
                    context.User?.Identity?.IsAuthenticated ?? false,
                    claims?.Count() ?? 0);
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { error = "Only MainAdminUser can use view-all mode" });
                return;
            }

            var method = context.Request.Method.ToUpperInvariant();
            var isMutation = method is "POST" or "PUT" or "PATCH" or "DELETE";

            if (isMutation)
            {
                var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
                // System-level endpoints that don't require a target tenant in view-all mode:
                //  • /api/tenants — managing the tenants themselves
                //  • /api/auth   — login/logout/refresh
                //  • /api/systemlogs — global audit/error stream (no tenant scoping)
                //  • /api/logs   — alias for system logs
                var isSafeEndpoint = path.Contains("/api/tenants")
                    || path.Contains("/api/auth")
                    || path.Contains("/api/systemlogs")
                    || path.Contains("/api/logs");

                if (!isSafeEndpoint)
                {
                    var targetTenantHeader = context.Request.Headers[TargetTenantHeaderName].FirstOrDefault();

                    if (string.IsNullOrEmpty(targetTenantHeader) || !int.TryParse(targetTenantHeader, out var targetTenantId))
                    {
                        _logger.LogWarning("🚫 TENANT-MIDDLEWARE: Mutation in view-all mode without valid X-Target-Tenant header");
                        context.Response.StatusCode = 400;
                        await context.Response.WriteAsJsonAsync(new { error = "X-Target-Tenant header with a valid tenant ID is required for mutations in view-all mode." });
                        return;
                    }

                    var validTenantId = TenantSlugCache.IsValidTenantId(targetTenantId);
                    if (!validTenantId)
                    {
                        _logger.LogWarning("🚫 TENANT-MIDDLEWARE: X-Target-Tenant {TenantId} is invalid or inactive", targetTenantId);
                        context.Response.StatusCode = 404;
                        await context.Response.WriteAsJsonAsync(new { error = $"Target tenant {targetTenantId} does not exist or is inactive." });
                        return;
                    }

                    // Translate the real Tenant.Id sent by the frontend into
                    // the data-table TenantId used by EF global query filters
                    // (default tenant collapses to 0; all others pass through).
                    var dataTenantId = TenantSlugCache.ToDataTenantId(targetTenantId);
                    context.Items["Tenant"] = ViewAllSentinel;
                    context.Items["TenantId"] = dataTenantId;
                    context.Items["TenantViewAll"] = true;
                    context.Items["TenantTargetOverride"] = true;
                    _logger.LogDebug("🏢 TENANT-MIDDLEWARE: {Method} {Path} → VIEW-ALL mutation scoped to TenantId={TenantId} (header={Header})",
                        method, context.Request.Path, dataTenantId, targetTenantId);

                    await _next(context);
                    return;
                }
            }

            context.Items["Tenant"] = ViewAllSentinel;
            context.Items["TenantId"] = -1;
            context.Items["TenantViewAll"] = true;
            _logger.LogDebug("🏢 TENANT-MIDDLEWARE: Request {Method} {Path} → VIEW-ALL mode (MainAdmin)",
                context.Request.Method, context.Request.Path);
        }
        else if (!string.IsNullOrEmpty(tenant))
        {
            var knownTenant = TenantSlugCache.HasTenant(tenant);
            var hasDedicatedDb = TenantConnectionResolver.HasDedicatedConnectionString(tenant);

            if (!knownTenant && !hasDedicatedDb)
            {
                var envKey = TenantConnectionResolver.GetEnvironmentVariableName(tenant);
                _logger.LogWarning(
                    "🏢 TENANT-MIDDLEWARE: Unknown tenant '{Tenant}' will use the default shared DB. Configure '{EnvKey}' or activate the tenant slug to give it its own database.",
                    tenant, envKey);
            }

            context.Items["Tenant"] = tenant;
            var tenantId = TenantSlugCache.GetTenantId(tenant);
            context.Items["TenantId"] = tenantId;
            _logger.LogDebug("🏢 TENANT-MIDDLEWARE: Request {Method} {Path} → tenant='{Tenant}' (TenantId={TenantId}, KnownTenant={KnownTenant}, DedicatedDb={DedicatedDb})",
                context.Request.Method, context.Request.Path, tenant, tenantId, knownTenant, hasDedicatedDb);
        }
        else
        {
            context.Items["TenantId"] = 0;
        }

        await _next(context);
    }
}

/// <summary>
/// Resolves connection strings per tenant.
/// Checks (in order):
///   1. In-memory dictionary (for hardcoded tenants)
///   2. Environment variable TENANT_{NAME}_DATABASE_URL
///   3. Returns null → caller may use default connection
/// </summary>
public static class TenantConnectionResolver
{
    private const string TenantDatabasePrefix = "TENANT_";
    private const string TenantDatabaseSuffix = "_DATABASE_URL";

    private static readonly Dictionary<string, string> _tenantConnections = new(StringComparer.OrdinalIgnoreCase)
    {
        // Add tenant mappings here only if you intentionally want to hardcode them.
        // Prefer Render env vars like TENANT_KROSSIER_DATABASE_URL instead.
    };

    public sealed record ConfiguredTenantConnection(string Tenant, string Source, string EnvironmentVariable, string ConnectionString);

    public static string GetEnvironmentVariableName(string tenant)
        => $"{TenantDatabasePrefix}{tenant.ToUpperInvariant()}{TenantDatabaseSuffix}";

    public static string? GetConnectionString(string? tenant)
    {
        if (string.IsNullOrWhiteSpace(tenant) || string.Equals(tenant, TenantMiddleware.ViewAllSentinel, StringComparison.OrdinalIgnoreCase))
            return null;

        if (_tenantConnections.TryGetValue(tenant, out var connStr) && !string.IsNullOrWhiteSpace(connStr))
            return connStr;

        var envKey = GetEnvironmentVariableName(tenant);
        var envValue = Environment.GetEnvironmentVariable(envKey);
        if (!string.IsNullOrWhiteSpace(envValue))
            return envValue;

        return null;
    }

    public static bool HasDedicatedConnectionString(string? tenant)
        => !string.IsNullOrWhiteSpace(GetConnectionString(tenant));

    public static IReadOnlyList<ConfiguredTenantConnection> GetConfiguredTenantConnections()
    {
        var results = new Dictionary<string, ConfiguredTenantConnection>(StringComparer.OrdinalIgnoreCase);

        foreach (DictionaryEntry entry in Environment.GetEnvironmentVariables())
        {
            if (entry.Key is not string key || entry.Value is not string value) continue;
            if (!key.StartsWith(TenantDatabasePrefix, StringComparison.OrdinalIgnoreCase) ||
                !key.EndsWith(TenantDatabaseSuffix, StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            var tenant = key[TenantDatabasePrefix.Length..^TenantDatabaseSuffix.Length].ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(tenant)) continue;

            results[tenant] = new ConfiguredTenantConnection(tenant, "environment", key, value);
        }

        foreach (var kv in _tenantConnections)
        {
            if (string.IsNullOrWhiteSpace(kv.Value)) continue;
            var tenant = kv.Key.Trim().ToLowerInvariant();
            results[tenant] = new ConfiguredTenantConnection(tenant, "code", GetEnvironmentVariableName(tenant), kv.Value);
        }

        return results.Values.OrderBy(x => x.Tenant).ToList();
    }
}

/// <summary>
/// Resolves a tenant-specific public files base URL.
/// </summary>
public static class TenantPublicUrlResolver
{
    private static readonly Dictionary<string, string> _tenantPublicBases = new(StringComparer.OrdinalIgnoreCase)
    {
    };

    public static string? GetPublicBaseUrl(string? tenant)
    {
        if (string.IsNullOrEmpty(tenant)) return null;

        if (_tenantPublicBases.TryGetValue(tenant, out var baseUrl)) return baseUrl;

        var envKey = $"TENANT_{tenant.ToUpperInvariant()}_PUBLIC_BASE_URL";
        var envVal = Environment.GetEnvironmentVariable(envKey);
        if (!string.IsNullOrEmpty(envVal)) return envVal;

        return null;
    }
}
