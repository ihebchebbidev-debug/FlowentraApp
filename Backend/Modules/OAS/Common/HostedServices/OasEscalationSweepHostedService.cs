using Microsoft.EntityFrameworkCore;
using MyApi.Infrastructure;
using MyApi.Modules.OAS.Common.Realtime;
using MyApi.Modules.OAS.Events.Models;
using MyApi.Modules.OAS.Hierarchy.Models;
using MyApi.Modules.OAS.Settings.Services;
using MyApi.Modules.OAS.Sla.Models;

namespace MyApi.Modules.OAS.Common.HostedServices;

/// <summary>
/// Replaces `eventStore.ts:226,271-306`'s 30s browser-tab timer (spec §6.3)
/// — SLA escalation only ran when someone had the andon tab open; here it
/// runs server-side regardless. Calls `oas_job_check_sla()` (spec §3:
/// "logique métier critique conservée dans les triggers/fonctions
/// Postgres") for every provisioned *oas tenant database, logs each
/// escalation into oas_escalations, and pushes `event.escalated` on
/// GET /stream — never touches the escalation-level MATH itself, that
/// lives entirely in SQL (floor-based, sequential-only, per spec v15).
///
/// Single-instance only (see OasSseBroadcaster remarks) — if this
/// deployment ever scales to multiple instances, this sweep needs a
/// distributed lock or it will run once per instance and double-log
/// (harmless for the escalation_level itself, since the SQL is
/// idempotent/monotonic, but would double-broadcast and double-insert
/// oas_escalations rows).
/// </summary>
public class OasEscalationSweepHostedService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    private readonly IOasDbContextFactory _dbFactory;
    private readonly IOasNotificationGrouper _grouper;
    private readonly OasSweepDiagnostics _diagnostics;
    private readonly ILogger<OasEscalationSweepHostedService> _logger;

    public OasEscalationSweepHostedService(IOasDbContextFactory dbFactory, IOasNotificationGrouper grouper, OasSweepDiagnostics diagnostics, ILogger<OasEscalationSweepHostedService> logger)
    {
        _dbFactory = dbFactory;
        _grouper = grouper;
        _diagnostics = diagnostics;
        _logger = logger;
    }


    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            foreach (var conn in TenantConnectionResolver.GetConfiguredTenantConnections())
            {
                if (!OasTenant.IsOasSlug(conn.Tenant)) continue;
                await SweepOneAsync(conn.Tenant, stoppingToken);
            }
        }
    }

    private async Task SweepOneAsync(string oasSlug, CancellationToken ct)
    {
        try
        {
            await using var db = _dbFactory.CreateDbContext(oasSlug);

            // Read via raw ADO instead of EF's SqlQueryRaw<T>: the function
            // returns THREE columns and `new_level` is a Postgres enum
            // (oas_escalation_level, mapped on the data source) — EF's
            // SqlQuery only projects scalar types, so the old call threw on
            // every sweep and the exception was swallowed into a log line,
            // which is why no long-open stop ever escalated in production.
            var escalated = await ReadEscalatedAsync(db, ct);
            _diagnostics.RecordRun(oasSlug, escalated.Count);
            if (escalated.Count == 0) return;



            // EF-M5-13 anti-rafale: one line going down escalates a dozen
            // events in the same sweep. The first push goes out live, the
            // rest of the burst is coalesced into a single grouped push.
            var groupWindow = TimeSpan.FromSeconds(
                await OasSettingsReader.GetIntAsync(db, OasSettingKeys.NotificationGroupWindowSeconds, ct));

            // The admin console renders a toast for every escalation — a bare
            // {eventId, level} makes that toast unreadable ("an event escalated"),
            // so resolve the post code once per sweep and ship it in the payload.
            var ids = escalated.Select(r => r.event_id).ToList();
            // IgnoreQueryFilters: the sweep runs outside any request scope
            // (no ambient tenant) and an archived post must still name its stop.
            var postByEvent = await (from e in db.Set<OasEvent>().IgnoreQueryFilters()
                                     join po in db.Set<OasPost>().IgnoreQueryFilters() on e.PostId equals po.Id
                                     where ids.Contains(e.Id)
                                     select new { e.Id, po.Code, e.EventType })
                                    .ToDictionaryAsync(x => x.Id, x => x, ct);

            foreach (var row in escalated)
            {
                postByEvent.TryGetValue(row.event_id, out var meta);
                db.Set<OasEscalation>().Add(new OasEscalation
                {
                    TenantId = row.tenant_id, EventId = row.event_id,
                    Level = Enum.Parse<OasEscalationLevel>(row.new_level, true),
                    Reason = "sla_sweep",
                });

                _grouper.Publish(oasSlug, row.tenant_id, $"escalation:{row.new_level}", "event.escalated",
                    new
                    {
                        eventId = row.event_id,
                        level = row.new_level,
                        postCode = meta?.Code,
                        eventType = meta?.EventType.ToString(),
                    }, groupWindow);
            }

            if (escalated.Count > 0)
            {
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("🏭 OAS-SLA-SWEEP: {Count} event(s) escalated on '{Slug}'", escalated.Count, oasSlug);
            }
        }
        catch (OasTenantNotProvisionedException)
        {
            // Configured env var but no schema applied yet — skip silently, health endpoint already reports this.
        }
        catch (Exception ex)
        {
            _diagnostics.RecordError(oasSlug, ex.Message);
            _logger.LogError(ex, "🏭 OAS-SLA-SWEEP: failed for tenant '{Slug}'", oasSlug);
        }

    }

    /// <summary>
    /// Calls oas_job_check_sla() and materialises its
    /// TABLE(event_id uuid, tenant_id int, new_level oas_escalation_level)
    /// rows. `new_level` is cast to text in SQL so the read never depends on
    /// the enum mapping being present on this data source.
    /// </summary>
    private static async Task<List<EscalatedRow>> ReadEscalatedAsync(OasDbContext db, CancellationToken ct)
    {
        var rows = new List<EscalatedRow>();
        var conn = db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync(ct);

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "select event_id, tenant_id, new_level::text as new_level from public.oas_job_check_sla()";
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            rows.Add(new EscalatedRow
            {
                event_id = reader.GetGuid(0),
                tenant_id = reader.GetInt32(1),
                new_level = reader.GetString(2),
            });
        }
        return rows;
    }

    // Matches oas_job_check_sla()'s TABLE(event_id uuid, tenant_id int, new_level oas_escalation_level) return shape.
    private sealed class EscalatedRow
    {
        public Guid event_id { get; set; }
        public int tenant_id { get; set; }
        public string new_level { get; set; } = string.Empty;
    }

}
