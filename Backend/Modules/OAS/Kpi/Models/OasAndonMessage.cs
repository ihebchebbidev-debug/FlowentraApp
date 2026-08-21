using MyApi.Modules.OAS.Common.Data;

namespace MyApi.Modules.OAS.Kpi.Models;

/// <summary>
/// v13: `LineId = null` means site-wide (the old client's MOTD had no line
/// association at all — the initial `?lineId=` required contract didn't
/// cover that).
///
/// Implements <see cref="IOasTenantEntity"/> so <c>OasDbContext</c>'s
/// reflection-based setup wires up the automatic per-tenant query filter
/// (see OasDbContext.OnModelCreating) — without it, this table's `TenantId`
/// column was inert data: any tenant could read/overwrite any other
/// tenant's Andon message via <c>GetAndonMessageAsync</c>/
/// <c>SetAndonMessageAsync</c>, which queried by `LineId` alone.
/// </summary>
public class OasAndonMessage : IOasTenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int TenantId { get; set; }
    public Guid? LineId { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? UpdatedBy { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
