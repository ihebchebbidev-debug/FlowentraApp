using System.Collections.Concurrent;

namespace MyApi.Modules.OAS.Common.HostedServices;

/// <summary>In-memory operational state for the per-tenant SLA sweep.</summary>
public sealed class OasSweepDiagnostics
{
    private readonly ConcurrentDictionary<string, TenantSweepState> _states = new(StringComparer.OrdinalIgnoreCase);

    public void RecordSuccess(string slug, int escalationCount)
    {
        var now = DateTimeOffset.UtcNow;
        _states.AddOrUpdate(slug,
            _ => new TenantSweepState(now, escalationCount > 0 ? now : null, escalationCount, null),
            (_, previous) => previous with
            {
                LastRunUtc = now,
                LastEscalationUtc = escalationCount > 0 ? now : previous.LastEscalationUtc,
                LastEscalationCount = escalationCount,
                LastError = null,
            });
    }

    public void RecordFailure(string slug, Exception exception)
    {
        var now = DateTimeOffset.UtcNow;
        _states.AddOrUpdate(slug,
            _ => new TenantSweepState(now, null, 0, exception.Message),
            (_, previous) => previous with { LastRunUtc = now, LastEscalationCount = 0, LastError = exception.Message });
    }

    public TenantSweepState? Get(string slug) => _states.TryGetValue(slug, out var state) ? state : null;

    public sealed record TenantSweepState(
        DateTimeOffset LastRunUtc,
        DateTimeOffset? LastEscalationUtc,
        int LastEscalationCount,
        string? LastError);
}