using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Processes.Models;

namespace MyApi.Modules.Processes.Services
{
    /// <summary>
    /// Ticks every minute, finds ProcessSchedules whose NextRunAt is due, and
    /// executes their handler with retry + exponential backoff.
    ///
    /// A run either:
    ///   - succeeds → schedule's NextRunAt is bumped by IntervalMinutes,
    ///   - fails and attempts &lt; MaxRetries → NextRetryAt = now + Backoff*2^(attempt-1),
    ///   - fails and attempts ≥ MaxRetries → schedule is marked BlockReason and paused
    ///     until an admin re-enables it from the UI.
    /// </summary>
    public class ProcessSchedulerService : BackgroundService
    {
        private static readonly TimeSpan TickInterval = TimeSpan.FromMinutes(1);
        private readonly IServiceProvider _sp;
        private readonly ILogger<ProcessSchedulerService> _logger;

        public ProcessSchedulerService(IServiceProvider sp, ILogger<ProcessSchedulerService> logger)
        {
            _sp = sp; _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("⚙️  ProcessSchedulerService started — tick every {Interval}", TickInterval);
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try { await TickAsync(stoppingToken); }
                catch (Exception ex) { _logger.LogError(ex, "ProcessSchedulerService tick failed"); }

                try { await Task.Delay(TickInterval, stoppingToken); }
                catch (TaskCanceledException) { break; }
            }
        }

        private async Task TickAsync(CancellationToken ct)
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var registry = scope.ServiceProvider.GetRequiredService<ProcessHandlerRegistry>();

            var now = DateTime.UtcNow;
            var due = await db.Set<ProcessSchedule>()
                .Where(s => s.Enabled && !s.Paused && s.NextRunAt != null && s.NextRunAt <= now)
                .ToListAsync(ct);

            foreach (var s in due)
            {
                if (!registry.TryGet(s.Key, out var handler))
                {
                    s.LastStatus = "blocked";
                    s.BlockReason = "No handler registered for this key";
                    s.NextRunAt = now.AddMinutes(Math.Max(1, s.IntervalMinutes));
                    s.UpdatedAt = now;
                    await db.SaveChangesAsync(ct);
                    continue;
                }

                await ExecuteOnceAsync(db, s, handler, "schedule", attempt: 1, ct);
            }
        }

        /// <summary>
        /// Runs a handler and persists both the ProcessRun row and the schedule state.
        /// Public so ProcessesController can reuse it for "Run now".
        /// </summary>
        public static async Task<DTOs.RunNowResult> ExecuteOnceAsync(
            ApplicationDbContext db,
            ProcessSchedule s,
            IProcessHandler handler,
            string triggeredBy,
            int attempt,
            CancellationToken ct)
        {
            var run = new ProcessRun
            {
                ProcessKey = s.Key,
                TriggeredBy = triggeredBy,
                Attempt = attempt,
                Status = "running",
                StartedAt = DateTime.UtcNow,
            };
            db.Set<ProcessRun>().Add(run);
            await db.SaveChangesAsync(ct);

            var sw = Stopwatch.StartNew();
            DTOs.RunNowResult result;
            try
            {
                result = await handler.ExecuteAsync(s.ConfigJson ?? "{}", ct);
                if (string.IsNullOrEmpty(result.Status)) result.Status = "success";
            }
            catch (Exception ex)
            {
                result = new DTOs.RunNowResult { Status = "failed", Error = ex.Message };
            }
            sw.Stop();

            run.FinishedAt = DateTime.UtcNow;
            run.DurationMs = (int)sw.ElapsedMilliseconds;
            run.Status = result.Status;
            run.Error = result.Error;
            run.BlockReason = result.BlockReason;
            run.ItemsProcessed = result.ItemsProcessed;
            run.OutputJson = result.Output != null ? System.Text.Json.JsonSerializer.Serialize(result.Output) : null;

            result.DurationMs = run.DurationMs ?? 0;

            // Schedule state transition
            s.LastRunAt = run.FinishedAt;
            s.LastStatus = result.Status;
            s.UpdatedAt = DateTime.UtcNow;

            if (result.Status == "success" || result.Status == "skipped")
            {
                s.ConsecutiveFailures = 0;
                s.BlockReason = null;
                if (triggeredBy != "manual")
                    s.NextRunAt = DateTime.UtcNow.AddMinutes(Math.Max(1, s.IntervalMinutes));
            }
            else if (result.Status == "blocked")
            {
                s.BlockReason = result.BlockReason ?? "Handler reported blocked";
                s.NextRunAt = DateTime.UtcNow.AddMinutes(Math.Max(1, s.IntervalMinutes));
            }
            else // failed
            {
                s.ConsecutiveFailures = attempt >= 1 ? s.ConsecutiveFailures + 1 : s.ConsecutiveFailures;
                if (attempt < Math.Max(1, s.MaxRetries))
                {
                    var backoffSec = Math.Max(1, s.RetryBackoffSeconds) * (int)Math.Pow(2, attempt - 1);
                    var retryAt = DateTime.UtcNow.AddSeconds(backoffSec);
                    run.NextRetryAt = retryAt;
                    s.NextRunAt = retryAt; // scheduler will pick it up on the next tick past retryAt
                }
                else
                {
                    s.BlockReason = $"Failed after {attempt} attempts: {result.Error}";
                    s.Paused = true; // require admin intervention
                    s.NextRunAt = null;
                }
            }

            await db.SaveChangesAsync(ct);
            return result;
        }
    }
}
