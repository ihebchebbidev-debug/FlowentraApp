using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyApi.Modules.OAS.Settings.Models;

namespace MyApi.Modules.OAS.Settings.Data;

public class OasSettingConfiguration : IEntityTypeConfiguration<OasSetting>
{
    public void Configure(EntityTypeBuilder<OasSetting> b)
    {
        b.ToTable("oas_settings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.TenantId).HasColumnName("tenant_id");
        b.Property(x => x.SettingKey).HasColumnName("setting_key").IsRequired();
        b.Property(x => x.Value).HasColumnName("value").IsRequired();
        b.Property(x => x.UpdatedBy).HasColumnName("updated_by");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.HasIndex(x => new { x.TenantId, x.SettingKey }).IsUnique();
    }
}
