using Microsoft.EntityFrameworkCore;

namespace MyApi.Modules.OAS.Settings.Services;

/// <summary>
/// Connection-level settings reader for callers that hold a raw
/// <see cref="DbContext"/> rather than the scoped
/// <see cref="IOasSettingsService"/> — i.e. the background sweeps, which
/// build one context per tenant outside any request scope.
///
/// Falls back to the built-in default whenever the row is absent or
/// <c>oas_settings</c> does not exist yet (a tenant DB that has not had
/// 008_gap_fixes.sql applied): a missing setting must never break a sweep.
/// </summary>
public static class OasSettingsReader
{
    public static async Task<int> GetIntAsync(DbContext db, string key, CancellationToken ct = default)
    {
        var fallback = int.Parse(OasSettingKeys.Defaults[key]);
        try
        {
            var values = await db.Database
                .SqlQueryRaw<string>("select value from oas_settings where setting_key = {0} limit 1", key)
                .ToListAsync(ct);
            var raw = values.FirstOrDefault();
            if (raw is not null && OasSettingKeys.IsValid(key, raw)) return int.Parse(raw);
        }
        catch (Npgsql.PostgresException)
        {
            // table missing / not provisioned — use the default
        }
        return fallback;
    }
}
