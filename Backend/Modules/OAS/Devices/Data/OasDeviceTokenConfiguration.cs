using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyApi.Modules.OAS.Devices.Models;

namespace MyApi.Modules.OAS.Devices.Data;

public class OasDeviceTokenConfiguration : IEntityTypeConfiguration<OasDeviceToken>
{
    public void Configure(EntityTypeBuilder<OasDeviceToken> b)
    {
        b.ToTable("oas_device_tokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.TenantId).HasColumnName("tenant_id");
        b.Property(x => x.UserId).HasColumnName("user_id");
        b.Property(x => x.Platform).HasColumnName("platform");
        b.Property(x => x.Token).HasColumnName("token");
        b.Property(x => x.DeviceId).HasColumnName("device_id");
        b.Property(x => x.Label).HasColumnName("label");
        b.Property(x => x.AppVersion).HasColumnName("app_version");
        b.Property(x => x.OsVersion).HasColumnName("os_version");
        b.Property(x => x.LastSeenAt).HasColumnName("last_seen_at");
        b.Property(x => x.RevokedAt).HasColumnName("revoked_at");
        b.Property(x => x.RevokedBy).HasColumnName("revoked_by");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.Ignore(x => x.UpdatedAt);
        b.Ignore(x => x.IsRevoked);
        b.HasIndex(x => x.Token).IsUnique();
    }
}
