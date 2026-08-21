using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Integrations.DTOs;
using MyApi.Modules.OAS.Integrations.Models;
using System.Net;
using System.Net.Sockets;

namespace MyApi.Modules.OAS.Integrations.Services;

public interface IOasIntegrationService
{
    Task<IReadOnlyList<OasIntegrationEndpointDto>> GetEndpointsAsync(int tenantId);
    Task<(bool success, string? error, OasIntegrationEndpointDto? dto)> CreateEndpointAsync(int tenantId, OasIntegrationEndpointCreateRequest request);
    Task<(bool success, string? error)> UpdateEndpointAsync(int tenantId, Guid id, OasIntegrationEndpointUpdateRequest request);
    Task<bool> DeleteEndpointAsync(int tenantId, Guid id);
    Task<IReadOnlyList<OasIntegrationOutboxDto>> GetOutboxAsync(int tenantId, string? status);
    Task<(bool ok, string? error, int fannedOut)> ReceiveWebhookAsync(int tenantId, OasWebhookInRequest request);
}

/// <summary>
/// Outbound MES/ERP integration: <see cref="OasIntegrationEndpoint"/> rows are subscriptions
/// (which URL wants which event types); <see cref="ReceiveWebhookAsync"/> is the ingress every
/// other OAS sub-module (or an external trigger) calls to fan an event out into
/// <see cref="OasIntegrationOutbox"/> rows, one per matching active endpoint. Delivery + retry
/// is handled by <c>OasIntegrationDeliveryHostedService</c>, matching the SLA-sweep pattern.
/// </summary>
public class OasIntegrationService : IOasIntegrationService
{
    private readonly OasDbContext _db;
    public OasIntegrationService(OasDbContext db) => _db = db;

    public async Task<IReadOnlyList<OasIntegrationEndpointDto>> GetEndpointsAsync(int tenantId)
    {
        var rows = await _db.Set<OasIntegrationEndpoint>().OrderBy(e => e.Name).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<(bool success, string? error, OasIntegrationEndpointDto? dto)> CreateEndpointAsync(int tenantId, OasIntegrationEndpointCreateRequest request)
    {
        if (!await IsUrlSafeAsync(request.Url)) return (false, "url_not_allowed", null);

        var endpoint = new OasIntegrationEndpoint
        {
            Id = Guid.NewGuid(), TenantId = tenantId, Name = request.Name, Url = request.Url,
            Secret = request.Secret, EventTypes = request.EventTypes, IsActive = request.IsActive,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow,
        };
        _db.Set<OasIntegrationEndpoint>().Add(endpoint);
        await _db.SaveChangesAsync();
        return (true, null, ToDto(endpoint));
    }

    public async Task<(bool success, string? error)> UpdateEndpointAsync(int tenantId, Guid id, OasIntegrationEndpointUpdateRequest request)
    {
        var endpoint = await _db.Set<OasIntegrationEndpoint>().FirstOrDefaultAsync(e => e.Id == id);
        if (endpoint is null) return (false, "not_found");
        if (request.Url is not null)
        {
            if (!await IsUrlSafeAsync(request.Url)) return (false, "url_not_allowed");
            endpoint.Url = request.Url;
        }
        if (request.Name is not null) endpoint.Name = request.Name;
        if (request.Secret is not null) endpoint.Secret = request.Secret;
        if (request.EventTypes is not null) endpoint.EventTypes = request.EventTypes;
        if (request.IsActive is not null) endpoint.IsActive = request.IsActive.Value;
        endpoint.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<bool> DeleteEndpointAsync(int tenantId, Guid id)
    {
        var endpoint = await _db.Set<OasIntegrationEndpoint>().FirstOrDefaultAsync(e => e.Id == id);
        if (endpoint is null) return false;
        _db.Set<OasIntegrationEndpoint>().Remove(endpoint);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IReadOnlyList<OasIntegrationOutboxDto>> GetOutboxAsync(int tenantId, string? status)
    {
        var query = _db.Set<OasIntegrationOutbox>().AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(o => o.Status == status);
        var rows = await query.OrderByDescending(o => o.CreatedAt).Take(500).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<(bool ok, string? error, int fannedOut)> ReceiveWebhookAsync(int tenantId, OasWebhookInRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EventType)) return (false, "event_type_required", 0);

        var endpoints = await _db.Set<OasIntegrationEndpoint>()
            .Where(e => e.IsActive && e.EventTypes.Contains(request.EventType))
            .ToListAsync();
        if (endpoints.Count == 0) return (true, null, 0);

        var payloadJson = System.Text.Json.JsonSerializer.Serialize(request.Payload ?? new { });
        var now = DateTimeOffset.UtcNow;
        foreach (var endpoint in endpoints)
        {
            _db.Set<OasIntegrationOutbox>().Add(new OasIntegrationOutbox
            {
                Id = Guid.NewGuid(), TenantId = tenantId, EndpointId = endpoint.Id,
                EventType = request.EventType, Payload = payloadJson, Status = "pending",
                Attempts = 0, CreatedAt = now,
            });
        }
        await _db.SaveChangesAsync();
        return (true, null, endpoints.Count);
    }

    /// <summary>
    /// SSRF guard: an OAS tenant admin registers an arbitrary URL that
    /// <c>OasIntegrationDeliveryHostedService</c> then POSTs to, unattended,
    /// every 30 seconds — with the HTTP status/response surfaced back via the
    /// outbox endpoint. Without this check that's a blind SSRF probe with a
    /// response oracle (internal admin panels, cloud metadata endpoints,
    /// etc.). Only plain http/https URLs whose resolved address(es) are all
    /// outside loopback/link-local/private ranges are accepted — this must
    /// run at save time (not delivery time) since DNS can be re-pointed
    /// after validation (TOCTOU), but re-validating on every delivery is out
    /// of scope for this fix; it at least closes the "register anything"
    /// hole and the endpoint console page always operates on validated URLs.
    /// </summary>
    private static async Task<bool> IsUrlSafeAsync(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return false;
        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) return false;
        if (string.IsNullOrWhiteSpace(uri.Host)) return false;

        IPAddress[] addresses;
        try
        {
            addresses = IPAddress.TryParse(uri.Host, out var literal)
                ? new[] { literal }
                : await Dns.GetHostAddressesAsync(uri.Host);
        }
        catch
        {
            // Unresolvable host — reject rather than let it through unchecked.
            return false;
        }

        return addresses.Length > 0 && addresses.All(a => !IsUnsafeAddress(a));
    }

    private static bool IsUnsafeAddress(IPAddress address)
    {
        var addr = address.IsIPv4MappedToIPv6 ? address.MapToIPv4() : address;

        if (IPAddress.IsLoopback(addr)) return true;

        if (addr.AddressFamily == AddressFamily.InterNetwork)
        {
            var b = addr.GetAddressBytes();
            if (b[0] == 0) return true;                                   // 0.0.0.0/8
            if (b[0] == 10) return true;                                  // 10.0.0.0/8
            if (b[0] == 127) return true;                                 // 127.0.0.0/8
            if (b[0] == 169 && b[1] == 254) return true;                  // 169.254.0.0/16 link-local
            if (b[0] == 172 && b[1] >= 16 && b[1] <= 31) return true;      // 172.16.0.0/12
            if (b[0] == 192 && b[1] == 168) return true;                  // 192.168.0.0/16
            return false;
        }

        if (addr.AddressFamily == AddressFamily.InterNetworkV6)
        {
            if (addr.IsIPv6LinkLocal) return true;   // fe80::/10
            if (addr.IsIPv6SiteLocal) return true;
            var b = addr.GetAddressBytes();
            if ((b[0] & 0xFE) == 0xFC) return true;  // fc00::/7 unique local
            return false;
        }

        // Unknown address family — reject rather than let it through unchecked.
        return true;
    }

    private static OasIntegrationEndpointDto ToDto(OasIntegrationEndpoint e) => new()
    {
        Id = e.Id, Name = e.Name, Url = e.Url, HasSecret = !string.IsNullOrEmpty(e.Secret),
        EventTypes = e.EventTypes, IsActive = e.IsActive, CreatedAt = e.CreatedAt, UpdatedAt = e.UpdatedAt,
    };

    private static OasIntegrationOutboxDto ToDto(OasIntegrationOutbox o) => new()
    {
        Id = o.Id, EndpointId = o.EndpointId, EventType = o.EventType, Payload = o.Payload,
        Status = o.Status, Attempts = o.Attempts, LastError = o.LastError, CreatedAt = o.CreatedAt, SentAt = o.SentAt,
    };
}
