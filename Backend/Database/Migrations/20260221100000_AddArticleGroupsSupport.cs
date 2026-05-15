using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace MyApi.Database.Migrations
{
    /// <summary>
    /// Adds ArticleGroup support to the system:
    /// - Creates ArticleGroups table
    /// - Adds GroupId foreign key column to Articles table
    /// This enables articles to be organized into groups
    /// </summary>
    public partial class AddArticleGroupsSupport : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create ArticleGroups table
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

            // Add GroupId column to Articles table
            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "Articles",
                type: "integer",
                nullable: true);

            // Create index on GroupId for better query performance
            migrationBuilder.CreateIndex(
                name: "IX_Articles_GroupId",
                table: "Articles",
                column: "GroupId");

            // Add foreign key constraint
            migrationBuilder.AddForeignKey(
                name: "FK_Articles_ArticleGroups_GroupId",
                table: "Articles",
                column: "GroupId",
                principalTable: "ArticleGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key
            migrationBuilder.DropForeignKey(
                name: "FK_Articles_ArticleGroups_GroupId",
                table: "Articles");

            // Drop index
            migrationBuilder.DropIndex(
                name: "IX_Articles_GroupId",
                table: "Articles");

            // Remove GroupId column
            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "Articles");

            // Drop ArticleGroups table
            migrationBuilder.DropTable(
                name: "ArticleGroups");
        }
    }
}
