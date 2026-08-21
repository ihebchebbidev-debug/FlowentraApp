using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyApi.Modules.OAS.Kpi.Models;

namespace MyApi.Modules.OAS.Kpi.Data;

public class OasAndonMessageConfiguration : IEntityTypeConfiguration<OasAndonMessage>
{
    public void Configure(EntityTypeBuilder<OasAndonMessage> b)
    {
        b.ToTable("oas_andon_messages");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        // Column was already mapped and already carried real tenant_id
        // values — the cross-tenant leak was that OasAndonMessage didn't
        // implement IOasTenantEntity, so OasDbContext's reflection-based
        // OnModelCreating never attached the per-tenant HasQueryFilter to
        // this entity at all (this column mapping alone does nothing to
        // scope queries). No mapping change needed here; see OasAndonMessage.cs.
        b.Property(x => x.TenantId).HasColumnName("tenant_id");
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.Message).HasColumnName("message");
        b.Property(x => x.UpdatedBy).HasColumnName("updated_by");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        b.HasIndex(x => new { x.TenantId, x.LineId });
    }
}
