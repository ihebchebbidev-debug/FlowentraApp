using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Processes.DTOs;

namespace MyApi.Modules.Processes.Services.Handlers
{
    /// <summary>
    /// Deletes SystemLogs older than <c>retention_days</c> (default 30).
    /// Also trims ProcessRuns history using the same window.
    /// </summary>
    public class PurgeSystemLogsHandler : IProcessHandler
    {
        public string Key => "admin.purge-system-logs";

        private readonly IServiceProvider _sp;
        public PurgeSystemLogsHandler(IServiceProvider sp) { _sp = sp; }

        public async Task<RunNowResult> ExecuteAsync(string configJson, CancellationToken ct)
        {
            int retentionDays = 30;
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(configJson) ? "{}" : configJson);
                if (doc.RootElement.TryGetProperty("retention_days", out var v) && v.TryGetInt32(out var d)) retentionDays = d;
            }
            catch { /* keep default */ }

            var cutoff = DateTime.UtcNow.AddDays(-Math.Max(1, retentionDays));

            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var logsDeleted = await db.SystemLogs.Where(l => l.Timestamp < cutoff).ExecuteDeleteAsync(ct);
            var runsDeleted = await db.Set<Models.ProcessRun>()
                .Where(r => r.StartedAt < cutoff)
                .ExecuteDeleteAsync(ct);

            return new RunNowResult
            {
                Status = "success",
                ItemsProcessed = logsDeleted + runsDeleted,
                Output = new { retention_days = retentionDays, logs_deleted = logsDeleted, runs_deleted = runsDeleted },
            };
        }
    }
}
