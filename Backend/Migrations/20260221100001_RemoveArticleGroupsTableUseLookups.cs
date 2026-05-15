using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApi.Migrations
{
    /// <inheritdoc />
    public partial class RemoveArticleGroupsTableUseLookups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Drop the foreign key constraint
            migrationBuilder.DropForeignKey(
                name: "FK_Articles_ArticleGroups_GroupId",
                table: "Articles");

            // Step 2: Drop the index on GroupId
            migrationBuilder.DropIndex(
                name: "IX_Articles_GroupId",
                table: "Articles");

            // Step 3: Migrate existing ArticleGroups data to LookupItems
            migrationBuilder.Sql(
                @"INSERT INTO ""LookupItems"" (""LookupType"", ""Name"", ""Description"", ""IsActive"", ""SortOrder"", ""CreatedDate"", ""CreatedUser"", ""ModifyDate"", ""ModifyUser"", ""Color"")
                SELECT 
                    'article-groups' AS ""LookupType"",
                    ""Name"",
                    ""Description"",
                    ""IsActive"",
                    0 AS ""SortOrder"",
                    ""CreatedDate"",
                    NULL AS ""CreatedUser"",
                    NOW() AT TIME ZONE 'UTC' AS ""ModifyDate"",
                    NULL AS ""ModifyUser"",
                    NULL AS ""Color""
                FROM ""ArticleGroups"" ag
                WHERE NOT EXISTS (
                    SELECT 1 FROM ""LookupItems"" li 
                    WHERE li.""LookupType"" = 'article-groups' AND li.""Name"" = ag.""Name""
                );");

            // Step 4: Drop the ArticleGroups table
            migrationBuilder.DropTable(
                name: "ArticleGroups");

            // Step 5: Add a comment to the GroupId column
            migrationBuilder.Sql(
                @"COMMENT ON COLUMN ""Articles"".""GroupId"" IS 'Foreign key to LookupItems table where LookupType=''article-groups''. Stores the lookup ID.';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rollback: Recreate the ArticleGroups table
            migrationBuilder.CreateTable(
                name: "ArticleGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGeneratedOnAdd", true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, 
                        defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleGroups", x => x.Id);
                });

            // Recreate the foreign key
            migrationBuilder.AddForeignKey(
                name: "FK_Articles_ArticleGroups_GroupId",
                table: "Articles",
                column: "GroupId",
                principalTable: "ArticleGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // Recreate the index
            migrationBuilder.CreateIndex(
                name: "IX_Articles_GroupId",
                table: "Articles",
                column: "GroupId");
        }
    }
}
