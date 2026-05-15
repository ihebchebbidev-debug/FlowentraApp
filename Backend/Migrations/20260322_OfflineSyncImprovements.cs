using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FlowServiceBackend.Migrations
{
    /// <inheritdoc />
    public partial class OfflineSyncImprovements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create SyncFailureLog table
            migrationBuilder.CreateTable(
                name: "SyncFailureLog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DeviceId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    OpId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    HttpStatus = table.Column<int>(type: "integer", nullable: true),
                    HttpBody = table.Column<string>(type: "text", nullable: true),
                    Endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Method = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Resolved = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Tenant = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncFailureLog", x => x.Id);
                });

            // Create SyncPerformanceLog table
            migrationBuilder.CreateTable(
                name: "SyncPerformanceLog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DeviceId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    SyncDuration = table.Column<long>(type: "bigint", nullable: false),
                    OperationsAttempted = table.Column<int>(type: "integer", nullable: false),
                    OperationsSucceeded = table.Column<int>(type: "integer", nullable: false),
                    OperationsFailed = table.Column<int>(type: "integer", nullable: false),
                    BytesSent = table.Column<long>(type: "bigint", nullable: true),
                    BytesReceived = table.Column<long>(type: "bigint", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Tenant = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    NetworkType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncPerformanceLog", x => x.Id);
                });

            // Create TokenRefreshLog table
            migrationBuilder.CreateTable(
                name: "TokenRefreshLog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Tenant = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    DeviceId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenRefreshLog", x => x.Id);
                });

            // Add SyncFailureLog indexes
            migrationBuilder.CreateIndex(
                name: "IX_SyncFailureLog_DeviceId_Timestamp",
                table: "SyncFailureLog",
                columns: new[] { "DeviceId", "Timestamp" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_SyncFailureLog_UserId_Timestamp",
                table: "SyncFailureLog",
                columns: new[] { "UserId", "Timestamp" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_SyncFailureLog_EntityType",
                table: "SyncFailureLog",
                column: "EntityType");

            migrationBuilder.CreateIndex(
                name: "IX_SyncFailureLog_Status",
                table: "SyncFailureLog",
                column: "Status");

            // Add SyncPerformanceLog indexes
            migrationBuilder.CreateIndex(
                name: "IX_SyncPerformanceLog_DeviceId_Timestamp",
                table: "SyncPerformanceLog",
                columns: new[] { "DeviceId", "Timestamp" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_SyncPerformanceLog_UserId_Timestamp",
                table: "SyncPerformanceLog",
                columns: new[] { "UserId", "Timestamp" },
                descending: new[] { false, true });

            // Add TokenRefreshLog indexes
            migrationBuilder.CreateIndex(
                name: "IX_TokenRefreshLog_UserId_Timestamp",
                table: "TokenRefreshLog",
                columns: new[] { "UserId", "Timestamp" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_TokenRefreshLog_Success",
                table: "TokenRefreshLog",
                column: "Success");

            // Add columns to SupportTickets
            migrationBuilder.AddColumn<string>(
                name: "OfflineDeviceId",
                table: "SupportTickets",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SyncedAt",
                table: "SupportTickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SyncVersion",
                table: "SupportTickets",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            // Add columns to SupportTicketComments
            migrationBuilder.AddColumn<string>(
                name: "OfflineDeviceId",
                table: "SupportTicketComments",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SyncedAt",
                table: "SupportTicketComments",
                type: "timestamp with time zone",
                nullable: true);

            // Add indexes for sync tracking
            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_SyncedAt",
                table: "SupportTickets",
                column: "SyncedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_OfflineDeviceId",
                table: "SupportTickets",
                column: "OfflineDeviceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop indexes on SupportTickets
            migrationBuilder.DropIndex(
                name: "IX_SupportTickets_OfflineDeviceId",
                table: "SupportTickets");

            migrationBuilder.DropIndex(
                name: "IX_SupportTickets_SyncedAt",
                table: "SupportTickets");

            // Drop columns from SupportTicketComments
            migrationBuilder.DropColumn(
                name: "SyncedAt",
                table: "SupportTicketComments");

            migrationBuilder.DropColumn(
                name: "OfflineDeviceId",
                table: "SupportTicketComments");

            // Drop columns from SupportTickets
            migrationBuilder.DropColumn(
                name: "SyncVersion",
                table: "SupportTickets");

            migrationBuilder.DropColumn(
                name: "SyncedAt",
                table: "SupportTickets");

            migrationBuilder.DropColumn(
                name: "OfflineDeviceId",
                table: "SupportTickets");

            // Drop all tables
            migrationBuilder.DropTable(
                name: "TokenRefreshLog");

            migrationBuilder.DropTable(
                name: "SyncPerformanceLog");

            migrationBuilder.DropTable(
                name: "SyncFailureLog");
        }
    }
}
