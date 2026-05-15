using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;

namespace MyApi.Infrastructure;

/// <summary>
/// In-memory cache mapping tenant slugs to their numeric TenantId.
/// Populated at startup and refreshed on tenant CRUD operations.
/// 
/// IMPORTANT: TenantId in data tables does NOT equal Tenant.Id.
/// - TenantId = 0 means "default tenant" (existing data before multi-tenancy)
/// - TenantId = Tenant.Id for all other tenants
/// - The "default" tenant (Slug="default", IsDefault=true) maps to TenantId = 0
/// </summary>
public static class TenantSlugCache
{
    private static readonly ConcurrentDictionary<string, int> _slugToId = new(StringComparer.OrdinalIgnoreCase);
    // Real Tenant.Id values for every active tenant (independent of the
    // data-table TenantId remap that turns the default tenant into 0).
    // Used to validate X-Target-Tenant headers from the frontend, which
    // sends the real Tenant.Id from /api/Tenants.
    private static readonly HashSet<int> _realTenantIds = new();

    public static void Initialize(ApplicationDbContext db)
    {
        try
        {
            // Use IgnoreQueryFilters since Tenant table doesn't have TenantId filter
            var tenants = db.Tenants
                .Where(t => t.IsActive)
                .Select(t => new { t.Slug, t.Id, t.IsDefault })
                .ToList();

            _slugToId.Clear();
            _realTenantIds.Clear();

            // IMPORTANT — TenantId convention:
            //   • All pre-multi-tenancy data was stamped with TenantId = 0.
            //   • The tenant flagged IsDefault = true represents that legacy
            //     bucket and therefore MUST map to TenantId = 0, otherwise
            //     the default company's data (and every brand-new tenant
            //     installation) appears empty because the EF global query
            //     filter looks for a TenantId that no rows have.
            //   • Every other tenant maps to its real Tenant.Id so its data
            //     stays isolated.
            foreach (var t in tenants)
            {
                _slugToId[t.Slug] = t.IsDefault ? 0 : t.Id;
                _realTenantIds.Add(t.Id);
            }
        }
        catch (Exception ex)
        {
            // Surface the underlying Postgres error so we can tell whether it's
            // a missing table (pre-migration) vs. a real DB failure (quota, auth, network).
            var connStr = db.Database.GetConnectionString() ?? "";
            string host = "unknown", name = "unknown";
            try
            {
                var csb = new Npgsql.NpgsqlConnectionStringBuilder(connStr);
                host = csb.Host ?? "unknown";
                name = csb.Database ?? "unknown";
            }
            catch { }

            if (ex is Npgsql.PostgresException pg)
            {
                Console.WriteLine($"[TenantSlugCache] ❌ Postgres error on host='{host}' db='{name}' → SqlState={pg.SqlState} Message={pg.MessageText}");
            }
            else
            {
                Console.WriteLine($"[TenantSlugCache] ❌ Could not initialize on host='{host}' db='{name}': {ex.GetType().Name}: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Refresh the cache (call after tenant CRUD operations).
    /// </summary>
    public static void Refresh(ApplicationDbContext db)
    {
        Initialize(db);
    }

    /// <summary>
    /// Get the numeric TenantId for a slug. Returns 0 (default) if unknown.
    /// </summary>
    public static int GetTenantId(string? slug)
    {
        if (string.IsNullOrEmpty(slug))
            return 0;

        if (_slugToId.TryGetValue(slug, out var id))
            return id;

        // Unknown slug → default tenant
        return 0;
    }

    /// <summary>
    /// Check if a slug exists in the cache.
    /// </summary>
    public static bool HasTenant(string slug) => _slugToId.ContainsKey(slug);

    /// <summary>
    /// Check if a numeric tenant ID exists and is active.
    /// Accepts BOTH the real Tenant.Id (sent by the frontend, e.g. id=1 for
    /// the default Krossier tenant) AND the data-table TenantId (0 for the
    /// default bucket, real id for the rest).
    /// </summary>
    public static bool IsValidTenantId(int tenantId) =>
        tenantId == 0 || _realTenantIds.Contains(tenantId) || _slugToId.Values.Contains(tenantId);

    /// <summary>
    /// Translate a real Tenant.Id (as sent by the frontend) into the
    /// data-table TenantId used by EF global query filters.
    /// The default tenant's real id resolves to 0; every other id passes
    /// through unchanged. Unknown ids also resolve to 0 (safe default).
    /// </summary>
    public static int ToDataTenantId(int realTenantId)
    {
        if (realTenantId == 0) return 0;
        // _slugToId.Values contains 0 (for the default tenant) plus the real
        // id of every non-default tenant. If realTenantId appears there it's
        // a non-default tenant — pass through. Otherwise it must be the
        // default tenant's real id (or unknown) — collapse to 0.
        return _slugToId.Values.Contains(realTenantId) ? realTenantId : 0;
    }
}
