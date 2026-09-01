using System.Collections.Concurrent;

namespace MyApi.Modules.OAS.Common.Realtime;

/// <summary>
/// EF-M5-13 "anti-rafale": when a line goes down, one incident can produce
/// a dozen escalations and reminders within seconds. Pushing each one is
/// alert fatigue — supervisors mute the app and then miss the real ones.
///
/// Policy (leading-edge + trailing digest, per group key):
///  · the FIRST notification of a group is published immediately — an
///    urgent alert is never delayed by grouping;
///  · every further notification for the same group inside the window is
///    swallowed and accumulated;
///  · when the window closes, if anything was accumulated, ONE
///    "{eventType}.grouped" push goes out carrying the count and the
///    suppressed payloads.
///
/// The group key is chosen by the caller (typically "escalation:{lineId}"
/// or "session.reminder:{tenantId}") so bursts on different lines never
/// collapse into each other.
///
/// Single-instance only, exactly like <see cref="OasSseBroadcaster"/>:
/// buffers live in process memory. With more than one instance each would
/// keep its own window (grouping degrades, correctness does not).
/// </summary>
public interface IOasNotificationGrouper
{
    /// <summary>Publishes now, or accumulates into the open window for this group. Returns true when the payload went out immediately.</summary>
    bool Publish(string oasSlug, int tenantId, string groupKey, string eventType, object payload, TimeSpan window);
}

public class OasNotificationGrouper : IOasNotificationGrouper, IDisposable
{
    private sealed class Group
    {
        public required string OasSlug { get; init; }
        public required int TenantId { get; init; }
        public required string EventType { get; init; }
        public required string GroupKey { get; init; }
        public DateTimeOffset WindowEndsAt { get; set; }
        public List<object> Suppressed { get; } = new();
    }

    private readonly ConcurrentDictionary<string, Group> _groups = new();
    private readonly IOasSseBroadcaster _broadcaster;
    private readonly ILogger<OasNotificationGrouper> _logger;
    private readonly Timer _flushTimer;

    public OasNotificationGrouper(IOasSseBroadcaster broadcaster, ILogger<OasNotificationGrouper> logger)
    {
        _broadcaster = broadcaster;
        _logger = logger;
        // One shared 1s tick instead of a Timer per group: bursts create
        // many short-lived groups and per-group timers would churn.
        _flushTimer = new Timer(_ => FlushDue(), null, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));
    }

    public bool Publish(string oasSlug, int tenantId, string groupKey, string eventType, object payload, TimeSpan window)
    {
        // window == 0 disables grouping entirely (settings value 0).
        if (window <= TimeSpan.Zero)
        {
            _broadcaster.Publish(oasSlug, tenantId, eventType, payload);
            return true;
        }

        var key = $"{oasSlug}:{tenantId}:{eventType}:{groupKey}";
        var now = DateTimeOffset.UtcNow;
        var publishedNow = false;

        _groups.AddOrUpdate(key,
            _ =>
            {
                publishedNow = true;
                return new Group
                {
                    OasSlug = oasSlug, TenantId = tenantId, EventType = eventType,
                    GroupKey = groupKey, WindowEndsAt = now.Add(window),
                };
            },
            (_, existing) =>
            {
                lock (existing)
                {
                    if (now >= existing.WindowEndsAt)
                    {
                        // Window already elapsed but not yet swept: treat this
                        // as the leading edge of a brand-new window.
                        FlushLocked(existing);
                        existing.WindowEndsAt = now.Add(window);
                        publishedNow = true;
                    }
                    else
                    {
                        existing.Suppressed.Add(payload);
                    }
                }
                return existing;
            });

        if (publishedNow) _broadcaster.Publish(oasSlug, tenantId, eventType, payload);
        return publishedNow;
    }

    private void FlushDue()
    {
        try
        {
            var now = DateTimeOffset.UtcNow;
            foreach (var (key, group) in _groups)
            {
                lock (group)
                {
                    if (now < group.WindowEndsAt) continue;
                    FlushLocked(group);
                }
                // Nothing pending and the window is over — drop the group so
                // the dictionary does not grow without bound.
                _groups.TryRemove(new KeyValuePair<string, Group>(key, group));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "🏭 OAS-NOTIF-GROUPER: flush failed");
        }
    }

    /// <summary>Caller must hold the group's lock.</summary>
    private void FlushLocked(Group group)
    {
        if (group.Suppressed.Count == 0) return;

        _broadcaster.Publish(group.OasSlug, group.TenantId, group.EventType + ".grouped", new
        {
            groupKey = group.GroupKey,
            count = group.Suppressed.Count,
            items = group.Suppressed.ToArray(),
        });
        _logger.LogInformation("🏭 OAS-NOTIF-GROUPER: coalesced {Count} '{Type}' notification(s) for group '{Group}'",
            group.Suppressed.Count, group.EventType, group.GroupKey);
        group.Suppressed.Clear();
    }

    public void Dispose() => _flushTimer.Dispose();
}
