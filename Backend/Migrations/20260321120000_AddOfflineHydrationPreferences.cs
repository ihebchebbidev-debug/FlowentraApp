using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApi.Migrations
{
    /// <inheritdoc />
    public partial class AddOfflineHydrationPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""OfflineHydrationPreferences"" (
    ""Id"" SERIAL PRIMARY KEY,
    ""TenantId"" INTEGER NOT NULL,
    ""UserId"" INTEGER NOT NULL,
    ""ModulesJson"" JSONB NOT NULL DEFAULT '{}'::jsonb,
    ""UpdatedAt"" TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE UNIQUE INDEX IF NOT EXISTS ""IX_OfflineHydrationPreferences_TenantId_UserId""
    ON ""OfflineHydrationPreferences"" (""TenantId"", ""UserId"");
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""OfflineHydrationPreferences"";");
        }
    }
}
