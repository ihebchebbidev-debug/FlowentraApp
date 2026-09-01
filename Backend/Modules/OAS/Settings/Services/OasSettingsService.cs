using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Settings.DTOs;
using MyApi.Modules.OAS.Settings.Models;

namespace MyApi.Modules.OAS.Settings.Services;

/// <summary>
/// The whole accepted configuration surface. A key not listed here is
/// rejected by <see cref="OasSettingsService.SetAsync"/> — settings are a
/// typed contract, not a free-form store.
/// </summary>
public static class OasSettingKeys
{
    /// <summary>
    /// EF-M7-01/02 — hour (0-23, UTC) at which the production day starts.
    /// A 3x8 plant's day runs 06:00 -> 06:00, so every daily KPI window and
    /// every per-day grouping is offset by this many hours instead of being
    /// cut at UTC midnight in the middle of the night shift.
    /// </summary>
    public const string ShiftDayStartHour = "ShiftDayStartHour";

    /// <summary>
    /// EF-M5-13 — anti-rafale window in seconds. The first notification of a
    /// burst goes out immediately; everything landing in the same group
    /// within this window is coalesced into a single grouped push.
    /// </summary>
    public const string NotificationGroupWindowSeconds = "NotificationGroupWindowSeconds";

    public static readonly IReadOnlyDictionary<string, string> Defaults = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [ShiftDayStartHour] = "6",
        [NotificationGroupWindowSeconds] = "60",
    };

    public static bool IsValid(string key, string value)
    {
        if (!Defaults.ContainsKey(key)) return false;
        if (!int.TryParse(value, out var n)) return false;
        return key switch
        {
            ShiftDayStartHour => n is >= 0 and <= 23,
            NotificationGroupWindowSeconds => n is >= 0 and <= 3600,
            _ => false,
        };
    }
}

public interface IOasSettingsService
{
    Task<IReadOnlyList<OasSettingDto>> GetAllAsync(int tenantId);
    Task<int> GetIntAsync(int tenantId, string key);
    Task<(bool success, string? error, OasSettingDto? dto)> SetAsync(int tenantId, Guid? actorId, string key, string value);
}

public class OasSettingsService : IOasSettingsService
{
    private readonly OasDbContext _db;
    public OasSettingsService(OasDbContext db) => _db = db;

    public async Task<IReadOnlyList<OasSettingDto>> GetAllAsync(int tenantId)
    {
        var stored = await _db.Set<OasSetting>().ToDictionaryAsync(s => s.SettingKey, StringComparer.OrdinalIgnoreCase);
        return OasSettingKeys.Defaults.Select(kv =>
        {
            stored.TryGetValue(kv.Key, out var row);
            return new OasSettingDto
            {
                Key = kv.Key,
                Value = row?.Value ?? kv.Value,
                DefaultValue = kv.Value,
                UpdatedAt = row?.UpdatedAt,
            };
        }).ToList();
    }

    public async Task<int> GetIntAsync(int tenantId, string key)
    {
        var fallback = int.Parse(OasSettingKeys.Defaults[key]);
        try
        {
            var row = await _db.Set<OasSetting>().FirstOrDefaultAsync(s => s.SettingKey == key);
            if (row is not null && int.TryParse(row.Value, out var n) && OasSettingKeys.IsValid(key, row.Value)) return n;
        }
        catch (Npgsql.PostgresException)
        {
            // oas_settings not provisioned yet (008 not applied on this
            // database): behave exactly as if nothing were configured
            // rather than failing every KPI request.
        }
        return fallback;
    }

    public async Task<(bool success, string? error, OasSettingDto? dto)> SetAsync(int tenantId, Guid? actorId, string key, string value)
    {
        var canonical = OasSettingKeys.Defaults.Keys.FirstOrDefault(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
        if (canonical is null) return (false, "unknown_setting", null);
        if (!OasSettingKeys.IsValid(canonical, value)) return (false, "invalid_value", null);

        var row = await _db.Set<OasSetting>().FirstOrDefaultAsync(s => s.SettingKey == canonical);
        if (row is null)
        {
            row = new OasSetting { TenantId = tenantId, SettingKey = canonical };
            _db.Set<OasSetting>().Add(row);
        }
        row.Value = value;
        row.UpdatedBy = actorId;
        row.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return (true, null, new OasSettingDto
        {
            Key = canonical, Value = row.Value,
            DefaultValue = OasSettingKeys.Defaults[canonical], UpdatedAt = row.UpdatedAt,
        });
    }
}
