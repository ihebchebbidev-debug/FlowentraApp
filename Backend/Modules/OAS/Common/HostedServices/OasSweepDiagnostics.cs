using System.Collections.Concurrent;

namespace MyApi.Modules.OAS.Common.HostedServices;

/// <summary>
/// In-memory, per-tenant record of the last SLA escalation sweep.
///
/// The sweep is a background loop: when it throws (a missing SQL function, a
/// bad projection, an unreachable tenant DB) the only trace is a log line on
/// the host, which is invisible from the client. Exposing the last run,
/// the number of events escalated and the last error on GET /api/oas/health
/// turns "no stop ever escalates" from a guess into an observable fact.
///
/// Deliberately not persisted — it describes THIS process instance.
/// </summary>
public class OasSweepDiagnostics
{
    public sealed record SweepState(
        DateTimeOffset? LastRunUtc,
        DateTimeOffset? LastEscalationUtc,
        int LastEscalatedCount,
        long TotalRuns,
        long TotalEscalated,
        string? LastError);

    private readonly ConcurrentDictionary<string, SweepState> _states = new(StringComparer.OrdinalIgnoreCase);

    public void RecordRun(string slug, int escalatedCount)
        => _states.AddOrUpdate(slug,
            _ => new SweepState(DateTimeOffset.UtcNow, escalatedCount > 0 ? DateTimeOffset.UtcNow : null, escalatedCount, 1, escalatedCount, null),
            (_, prev) => prev with
            {
                LastRunUtc = DateTimeOffset.UtcNow,
                LastEscalationUtc = escalatedCount > 0 ? DateTimeOffset.UtcNow : prev.LastEscalationUtc,
                LastEscalatedCount = escalatedCount,
                TotalRuns = prev.TotalRuns + 1,
                TotalEscalated = prev.TotalEscalated + escalatedCount,
                LastError = null,
            });

    public void RecordError(string slug, string error)
        => _states.AddOrUpdate(slug,
            _ => new SweepState(DateTimeOffset.UtcNow, null, 0, 1, 0, error),
            (_, prev) => prev with
            {
                LastRunUtc = DateTimeOffset.UtcNow,
                TotalRuns = prev.TotalRuns + 1,
                LastError = error,
            });

    public SweepState? Get(string slug) => _states.TryGetValue(slug, out var s) ? s : null;
}
