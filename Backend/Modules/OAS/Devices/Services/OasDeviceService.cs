using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Devices.DTOs;
using MyApi.Modules.OAS.Devices.Models;

namespace MyApi.Modules.OAS.Devices.Services;

public interface IOasDeviceService
{
    Task<IReadOnlyList<OasDeviceDto>> GetAllAsync(int tenantId, Guid? userId);
    Task<OasDeviceDto> RegisterAsync(int tenantId, Guid userId, OasDeviceRegisterRequestDto request);
    Task<(bool success, string? error)> RevokeAsync(int tenantId, Guid actorId, Guid deviceRowId);
    Task<(bool success, string? error)> RestoreAsync(int tenantId, Guid deviceRowId);
}

/// <summary>
/// EF-M2-09 device registry. Revocation is per DEVICE, not per account:
/// a stolen tablet is revoked while its operator keeps working elsewhere,
/// which account deactivation (the only tool that existed before) could
/// not express.
/// </summary>
public class OasDeviceService : IOasDeviceService
{
    private readonly OasDbContext _db;
    private readonly IMemoryCache _cache;

    public OasDeviceService(OasDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<IReadOnlyList<OasDeviceDto>> GetAllAsync(int tenantId, Guid? userId)
    {
        var query = _db.Set<OasDeviceToken>().AsNoTracking().AsQueryable();
        if (userId is not null) query = query.Where(d => d.UserId == userId);
        var rows = await query.OrderByDescending(d => d.LastSeenAt).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<OasDeviceDto> RegisterAsync(int tenantId, Guid userId, OasDeviceRegisterRequestDto request)
    {
        var deviceId = request.DeviceId.Trim();
        var device = await _db.Set<OasDeviceToken>().FirstOrDefaultAsync(d => d.UserId == userId && d.DeviceId == deviceId);

        if (device is null)
        {
            device = new OasDeviceToken
            {
                TenantId = tenantId, UserId = userId, DeviceId = deviceId,
                // `token` is NOT NULL UNIQUE in the base schema and a browser
                // has no push token — scope the device id per user so two
                // users on the same shared tablet don't collide on it.
                Token = string.IsNullOrWhiteSpace(request.PushToken) ? $"{userId}:{deviceId}" : request.PushToken!,
            };
            _db.Set<OasDeviceToken>().Add(device);
        }

        device.Label = request.Label ?? device.Label;
        device.Platform = request.Platform is "android" or "ios" or "web" ? request.Platform : "web";
        device.AppVersion = request.AppVersion ?? device.AppVersion;
        device.OsVersion = request.OsVersion ?? device.OsVersion;
        device.LastSeenAt = DateTimeOffset.UtcNow;
        if (!string.IsNullOrWhiteSpace(request.PushToken)) device.Token = request.PushToken!;

        await _db.SaveChangesAsync();
        InvalidateCache(deviceId);
        return ToDto(device);
    }

    public async Task<(bool success, string? error)> RevokeAsync(int tenantId, Guid actorId, Guid deviceRowId)
    {
        var device = await _db.Set<OasDeviceToken>().FindAsync(deviceRowId);
        if (device is null) return (false, "not_found");
        if (device.RevokedAt is not null) return (true, null); // idempotent

        device.RevokedAt = DateTimeOffset.UtcNow;
        device.RevokedBy = actorId;
        await _db.SaveChangesAsync();
        InvalidateCache(device.DeviceId);
        return (true, null);
    }

    public async Task<(bool success, string? error)> RestoreAsync(int tenantId, Guid deviceRowId)
    {
        var device = await _db.Set<OasDeviceToken>().FindAsync(deviceRowId);
        if (device is null) return (false, "not_found");

        device.RevokedAt = null;
        device.RevokedBy = null;
        await _db.SaveChangesAsync();
        InvalidateCache(device.DeviceId);
        return (true, null);
    }

    /// <summary>Revocation must bite immediately, not after the authorization filter's 60s cache expires.</summary>
    private void InvalidateCache(string? deviceId)
    {
        if (!string.IsNullOrEmpty(deviceId)) _cache.Remove(OasDeviceRevocation.CacheKey(deviceId));
    }

    private static OasDeviceDto ToDto(OasDeviceToken d) => new()
    {
        Id = d.Id, UserId = d.UserId, DeviceId = d.DeviceId, Label = d.Label, Platform = d.Platform,
        AppVersion = d.AppVersion, OsVersion = d.OsVersion, LastSeenAt = d.LastSeenAt,
        RevokedAt = d.RevokedAt, IsRevoked = d.RevokedAt is not null,
    };
}

/// <summary>Shared cache key + TTL between the device service and OasAuthorizeAttribute's per-request check.</summary>
public static class OasDeviceRevocation
{
    public static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(60);
    public static string CacheKey(string deviceId) => "oas_device_revoked:" + deviceId;
}
