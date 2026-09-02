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
            await db.Database.ExecuteSqlRawAsync(EscalationDdl, ct);
            _logger.LogInformation("🏭 OAS-SCHEMA: additive upgrades 008 + 009 applied on '{Slug}'", oasSlug);
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

    /// <summary>Kept byte-for-byte equivalent to public/OAS-SQL/009_escalation_rules.sql.</summary>
    private const string EscalationDdl = """
        -- =====================================================================
        -- OAS · 009 — Stop escalation rules (additive, idempotent)
        --
        -- Fixes the reason no long-open stop ever auto-escalated in production:
        -- `oas_events.sla_due_at` was NULL on every row of already-provisioned
        -- tenant databases (the `trg_oas_events_sla` BEFORE INSERT trigger from
        -- 003_triggers.sql was never applied there), and `oas_job_check_sla()`
        -- filters on `sla_due_at < now()` — a NULL never matches, so the sweep
        -- swept nothing and the Andon TV never turned an aging stop critical.
        --
        -- The escalation ladder itself stays SQL-side and unchanged in spirit
        -- (spec §6.3, floor-based, sequential-only, monotonic):
        --   level_1  when the event is still open past its SLA target
        --            (`sla_due_at` = declared_at + sla_minutes, from oas_sla_rules
        --            / oas_routing_rules)
        --   level_2  when it is still open past twice that target
        --            (`sla_due_at + sla_minutes`) — this is what the console and
        --            the Andon TV render as CRITICAL.
        --
        -- Everything below is safe to run repeatedly.
        -- =====================================================================

        -- 1) Make sure the SLA stamping trigger exists on this database ---------
        --    (create or replace + drop/create trigger = idempotent).
        create or replace function public.oas_events_apply_sla()
        returns trigger language plpgsql set search_path = public as $$
        declare r record;
        begin
          select target_min into r
            from public.oas_sla_rules
           where tenant_id = new.tenant_id
             and is_active
             and event_type = new.event_type
             and (criticality is null or criticality = new.criticality)
             and (line_id is null or line_id = new.line_id)
           order by priority desc
           limit 1;

          if found then
            new.sla_minutes := r.target_min;
          else
            select sla_minutes into r
              from public.oas_routing_rules
             where tenant_id = new.tenant_id
               and is_active
               and event_type = new.event_type
               and (cause_id is null or cause_id = new.cause_id)
               and (zone_id  is null or zone_id  = new.zone_id)
               and (line_id  is null or line_id  = new.line_id)
             order by priority desc
             limit 1;
            if found then
              new.sla_minutes := r.sla_minutes;
            end if;
          end if;

          new.sla_due_at := new.declared_at + make_interval(mins => new.sla_minutes);
          return new;
        end $$;

        drop trigger if exists trg_oas_events_sla on public.oas_events;
        create trigger trg_oas_events_sla before insert on public.oas_events
          for each row execute function public.oas_events_apply_sla();

        -- 2) Backfill the rows created while the trigger was missing ------------
        update public.oas_events
           set sla_due_at = declared_at + make_interval(mins => coalesce(sla_minutes, 10))
         where sla_due_at is null;

        -- 3) Sweep that no longer depends on sla_due_at being materialised ------
        --    Same sequential ladder as 003_triggers.sql (none -> level_1 ->
        --    level_2, never regressing), only the due date is now computed
        --    defensively so a tenant missing the trigger still escalates instead
        --    of silently going quiet like before.
        create or replace function public.oas_job_check_sla()
        returns table(event_id uuid, tenant_id int, new_level public.oas_escalation_level)
        language plpgsql set search_path = public as $$
        begin
          return query
          with due as (
            select e.id,
                   coalesce(e.sla_due_at,
                            e.declared_at + make_interval(mins => coalesce(e.sla_minutes, 10))) as due_at
              from public.oas_events e
             where e.status not in ('closed','cancelled','resolved')
          ),
          breached as (
            update public.oas_events e
               set sla_breached = true,
                   sla_due_at = d.due_at,
                   escalation_level = case
                     when e.escalation_level = 'level_1'
                          and now() > d.due_at + make_interval(mins => coalesce(e.sla_minutes, 10))
                       then 'level_2'
                     when e.escalation_level = 'none'
                       then 'level_1'
                     else e.escalation_level
                   end::public.oas_escalation_level
              from due d
             where d.id = e.id
               and now() > d.due_at
               and e.escalation_level <> (case
                     when e.escalation_level = 'level_1'
                          and now() > d.due_at + make_interval(mins => coalesce(e.sla_minutes, 10))
                       then 'level_2'
                     when e.escalation_level = 'none'
                       then 'level_1'
                     else e.escalation_level
                   end::public.oas_escalation_level)
            returning e.id, e.tenant_id, e.escalation_level
          )
          select id, tenant_id, escalation_level from breached;
        end $$;


        insert into public.oas_schema_migrations (filename) values ('009_escalation_rules.sql')
          on conflict (filename) do nothing;
        """;
}
