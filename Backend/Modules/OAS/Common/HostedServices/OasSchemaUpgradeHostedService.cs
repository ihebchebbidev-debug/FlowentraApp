using Microsoft.EntityFrameworkCore;
using MyApi.Infrastructure;

namespace MyApi.Modules.OAS.Common.HostedServices;

/// <summary>
/// The OAS module has no EF Core migrations — the base schema is applied by
/// hand from public/OAS-SQL/001..004 (see OasDbContext's class doc). That is
/// fine for a first provision, but it means every later additive column
/// would silently be missing on already-provisioned tenant databases until
/// someone remembers to run a script.
///
/// This service closes that gap for ADDITIVE, IDEMPOTENT DDL only: it runs
/// the exact contents of public/OAS-SQL/008_gap_fixes.sql once per
/// provisioned *oas database at startup. It never drops, renames or
/// rewrites anything — destructive changes stay manual on purpose.
/// </summary>
public class OasSchemaUpgradeHostedService : IHostedService
{
    private readonly IOasDbContextFactory _dbFactory;
    private readonly ILogger<OasSchemaUpgradeHostedService> _logger;

    public OasSchemaUpgradeHostedService(IOasDbContextFactory dbFactory, ILogger<OasSchemaUpgradeHostedService> logger)
    {
        _dbFactory = dbFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        foreach (var conn in TenantConnectionResolver.GetConfiguredTenantConnections())
        {
            if (!OasTenant.IsOasSlug(conn.Tenant)) continue;
            await UpgradeOneAsync(conn.Tenant, cancellationToken);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task UpgradeOneAsync(string oasSlug, CancellationToken ct)
    {
        try
        {
            await using var db = _dbFactory.CreateDbContext(oasSlug);
            await db.Database.ExecuteSqlRawAsync(Ddl, ct);
            _logger.LogInformation("🏭 OAS-SCHEMA: additive upgrade 008 applied on '{Slug}'", oasSlug);
        }
        catch (OasTenantNotProvisionedException)
        {
            // Configured env var, base schema not applied yet — nothing to upgrade.
        }
        catch (Exception ex)
        {
            // Never block startup on a single tenant's DDL: the health
            // endpoint already reports schema state, and every consumer of
            // the new columns degrades to its documented default.
            _logger.LogError(ex, "🏭 OAS-SCHEMA: additive upgrade 008 failed for tenant '{Slug}'", oasSlug);
        }
    }

    /// <summary>Kept byte-for-byte equivalent to public/OAS-SQL/008_gap_fixes.sql.</summary>
    private const string Ddl = """
        create table if not exists public.oas_settings (
          id           uuid primary key default gen_random_uuid(),
          tenant_id    int not null default 0,
          setting_key  text not null,
          value        text not null,
          updated_by   uuid references public.oas_users(id) on delete set null,
          updated_at   timestamptz not null default now(),
          created_at   timestamptz not null default now(),
          unique (tenant_id, setting_key)
        );

        alter table public.oas_device_tokens add column if not exists device_id  text;
        alter table public.oas_device_tokens add column if not exists label      text;
        alter table public.oas_device_tokens add column if not exists revoked_at timestamptz;
        alter table public.oas_device_tokens add column if not exists revoked_by uuid references public.oas_users(id) on delete set null;

        create unique index if not exists ux_oas_device_tokens_user_device
          on public.oas_device_tokens (user_id, device_id)
          where device_id is not null;

        create index if not exists ix_oas_device_tokens_active
          on public.oas_device_tokens (tenant_id, revoked_at);

        alter table public.oas_post_sessions add column if not exists closed_reason        text;
        alter table public.oas_post_sessions add column if not exists closed_by            uuid references public.oas_users(id) on delete set null;
        alter table public.oas_post_sessions add column if not exists relayed_from_user_id uuid references public.oas_users(id) on delete set null;

        do $$ begin
          alter table public.oas_post_sessions
            add constraint ck_oas_post_sessions_closed_reason
            check (closed_reason is null or closed_reason in ('manual','relay','shift_end','stale'));
        exception when duplicate_object then null; end $$;

        create index if not exists ix_oas_post_sessions_closed_reason
          on public.oas_post_sessions (tenant_id, closed_reason);

        update public.oas_post_sessions
           set closed_reason = 'manual'
         where ended_at is not null and closed_reason is null;
        """;
}
