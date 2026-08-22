using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common.Data;
using MyApi.Modules.OAS.Common.Models;
using MyApi.Modules.OAS.ShopFloorAuth.Models;

namespace MyApi.Modules.OAS.Common;

/// <summary>
/// Separate EF Core context for the whole OAS module (spec §3). Never
/// references <c>MyApi.Data.ApplicationDbContext</c> or any socle entity —
/// enforced by the architecture test in OasIsolationTests (spec §3.4).
///
/// Every table is mapped to schema "public" (no HasDefaultSchema — spec §3)
/// with an explicit `oas_` prefix, uuid keys, and a tenant_id global query
/// filter mirroring the socle's ApplicationDbContext (spec §4.1). Referential
/// entities that implement <see cref="IOasSoftDeletable"/> also get an
/// IsDeleted=false filter; fact entities (declarations, events) never
/// implement it and are never soft-deleted.
///
/// No migrations. The schema is created by the operator running
/// public/OAS-SQL/001..004 by hand (spec §5.0) — OasDbContext only maps to
/// tables that must already exist.
/// </summary>
public class OasDbContext : DbContext
{
    private int _currentTenantId = 0;
    private Guid? _currentUserId;

    public OasDbContext(DbContextOptions<OasDbContext> options) : base(options) { }

    /// <summary>-1 = view all tenants within this OAS database (reserved for future admin tooling; not used in the initial phase).</summary>
    public void SetTenantId(int tenantId) => _currentTenantId = tenantId;
    public int GetTenantId() => _currentTenantId;

    /// <summary>
    /// The authenticated OAS caller for this request (from the `oas_user_id`
    /// JWT claim — see OasModuleRegistration's DbContext factory). Null for
    /// the two anonymous auth endpoints. Used only to stamp `trg_oas_audit_*`
    /// rows with who made the change (see SaveChanges below) — never used
    /// for authorization, which stays on the controller/service claims.
    /// </summary>
    public void SetCurrentUserId(Guid? userId) => _currentUserId = userId;
    public Guid? GetCurrentUserId() => _currentUserId;

    public DbSet<OasPluginActivation> PluginActivations => Set<OasPluginActivation>();
    public DbSet<OasUser> Users => Set<OasUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Pick up every IEntityTypeConfiguration<T> in this assembly — each
        // OAS sub-module drops its own configuration class next to its
        // entity and it is wired up here automatically, without ever
        // touching this file again (spec §4.1: "une entité sans ToTable
        // explicite est un échec de revue" — enforced per-configuration,
        // not by a blanket convention here).
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OasDbContext).Assembly,
            t => t.Namespace != null && t.Namespace.StartsWith("MyApi.Modules.OAS."));

        // IMPORTANT: EF Core's HasQueryFilter does NOT combine multiple calls
        // on the same entity — a second call silently REPLACES the first,
        // not ANDs it. Every entity gets exactly one HasQueryFilter call,
        // built from whichever marker interfaces it actually implements, so
        // a referential entity that is both tenant-scoped AND soft-deletable
        // never loses its tenant isolation to a soft-delete filter applied
        // afterwards (or vice versa).
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clrType = entityType.ClrType;
            var isTenantScoped = typeof(IOasTenantEntity).IsAssignableFrom(clrType);
            var isSoftDeletable = typeof(IOasSoftDeletable).IsAssignableFrom(clrType);

            if (!isTenantScoped && !isSoftDeletable) continue;

            var methodName = (isTenantScoped, isSoftDeletable) switch
            {
                (true, true) => nameof(SetTenantAndSoftDeleteFilter),
                (true, false) => nameof(SetTenantFilter),
                (false, true) => nameof(SetSoftDeleteFilter),
                _ => throw new InvalidOperationException("unreachable"),
            };

            typeof(OasDbContext)
                .GetMethod(methodName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!
                .MakeGenericMethod(clrType)
                .Invoke(this, new object[] { modelBuilder });
        }
    }

    private void SetTenantFilter<T>(ModelBuilder modelBuilder) where T : class, IOasTenantEntity
    {
        modelBuilder.Entity<T>().HasQueryFilter(e =>
            _currentTenantId == -1 || e.TenantId == _currentTenantId);
    }

    private void SetSoftDeleteFilter<T>(ModelBuilder modelBuilder) where T : class, IOasSoftDeletable
    {
        modelBuilder.Entity<T>().HasQueryFilter(e => e.IsDeleted == false);
    }

    private void SetTenantAndSoftDeleteFilter<T>(ModelBuilder modelBuilder) where T : class, IOasTenantEntity, IOasSoftDeletable
    {
        modelBuilder.Entity<T>().HasQueryFilter(e =>
            (_currentTenantId == -1 || e.TenantId == _currentTenantId) && e.IsDeleted == false);
    }

    public override int SaveChanges()
    {
        StampAudit();
        if (_currentUserId is null) return base.SaveChanges();

        // The socle configures Npgsql with EnableRetryOnFailure, which forbids
        // user-initiated transactions unless they run inside the provider's
        // execution strategy as one retriable unit. Without this wrapper every
        // authenticated write threw "NpgsqlRetryingExecutionStrategy does not
        // support user-initiated transactions" (seen on POST /oas/operators).
        var strategy = Database.CreateExecutionStrategy();
        return strategy.Execute(() =>
        {
            var ownsTransaction = Database.CurrentTransaction is null;
            var tx = ownsTransaction ? Database.BeginTransaction() : null;
            try
            {
                // is_local=true (SET LOCAL semantics): visible to trg_oas_audit_*
                // for the rest of this transaction only, then reset automatically
                // — never leaks onto a pooled connection's next, unrelated use.
                Database.ExecuteSqlInterpolated($"SELECT set_config('oas.current_user_id', {_currentUserId!.Value.ToString()}, true)");
                var result = base.SaveChanges();
                tx?.Commit();
                return result;
            }
            catch
            {
                tx?.Rollback();
                throw;
            }
            finally
            {
                tx?.Dispose();
            }
        });
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampAudit();
        if (_currentUserId is null) return await base.SaveChangesAsync(cancellationToken);

        var strategy = Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async ct =>
        {
            var ownsTransaction = Database.CurrentTransaction is null;
            var tx = ownsTransaction ? await Database.BeginTransactionAsync(ct) : null;
            try
            {
                await Database.ExecuteSqlInterpolatedAsync($"SELECT set_config('oas.current_user_id', {_currentUserId!.Value.ToString()}, true)", ct);
                var result = await base.SaveChangesAsync(ct);
                if (tx is not null) await tx.CommitAsync(ct);
                return result;
            }
            catch
            {
                if (tx is not null) await tx.RollbackAsync(ct);
                throw;
            }
            finally
            {
                if (tx is not null) await tx.DisposeAsync();
            }
        }, cancellationToken);
    }


    private void StampAudit()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<OasEntityBase>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
                if (entry.Entity.TenantId == 0 && _currentTenantId > 0)
                {
                    entry.Entity.TenantId = _currentTenantId;
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
