using System.Data;
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
    ///
    /// Concurrency: every execution is guarded by a Postgres advisory lock keyed
    /// on the process Key, so a scheduler tick + a manual "Run now" (or two app
    /// instances) can never run the same handler twice at the same time.
    /// </summary>
    public class ProcessSchedulerService : BackgroundService
    {
        private static readonly TimeSpan TickInterval = TimeSpan.FromMinutes(1);

        /// <summary>Maximum wall-clock time one handler execution may take before it is cancelled.</summary>
        private static readonly TimeSpan HandlerTimeout = TimeSpan.FromMinutes(10);

        /// <summary>ProcessSchedule.BlockReason is capped at 500 chars in the schema.</summary>
        private static string? Truncate(string? value, int max = 500)
            => value != null && value.Length > max ? value.Substring(0, max - 1) + "…" : value;
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

            // Close out runs that were still 'running' when the process died — otherwise
            // the UI shows a phantom "running" pill and history keeps an open row forever.
            try { await ReconcileStaleRunsAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "ProcessSchedulerService stale-run reconcile failed"); }

            // Seed the built-in reliable schedules on boot so processes execute on their
            // own without requiring an admin to first create the row from the UI.
            try { await SeedBuiltInSchedulesAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "ProcessSchedulerService seed failed"); }

            while (!stoppingToken.IsCancellationRequested)
            {
                try { await TickAsync(stoppingToken); }
                catch (Exception ex) { _logger.LogError(ex, "ProcessSchedulerService tick failed"); }

                try { await Task.Delay(TickInterval, stoppingToken); }
                catch (TaskCanceledException) { break; }
            }
        }

        /// <summary>
        /// Registered handlers that ship with a default schedule. Every entry here is
        /// end-to-end reliable — no placeholder work, no external dependency the app
        /// can't verify at runtime. Add a new entry only after the handler is proven.
        /// </summary>
        private static readonly (string Key, string Name, int IntervalMinutes)[] BuiltInSchedules =
            new[]
            {
                // System hygiene — daily
                ("admin.purge-system-logs",            "Purge old system logs",             1440),
                ("admin.notifications-purge-read",     "Purge read notifications",          1440),
                ("admin.notifications-purge-stale-unread", "Purge stale unread notifications", 1440),
                ("admin.sync-changes-purge",           "Purge old sync changes",            1440),
                ("admin.sync-receipts-purge",          "Purge old sync receipts",           1440),
                ("admin.webhook-jobs-purge",           "Purge completed webhook jobs",      1440),
                ("admin.external-endpoint-logs-purge", "Purge external endpoint logs",      1440),
                ("admin.calendar-events-purge-past",   "Purge past calendar events",        1440),
                ("admin.dispatch-audit-purge",         "Purge old dispatch audit logs",     1440),
                ("admin.hr-audit-purge",               "Purge old HR audit logs",           1440),
                ("admin.recurring-task-logs-purge",    "Purge old recurring task logs",     1440),
                ("admin.soft-deleted-purge",           "Hard-purge soft-deleted records",   1440),
                ("admin.draft-offers-purge",           "Purge abandoned draft offers",      1440),
                ("admin.draft-invoices-purge",         "Purge abandoned draft invoices",    1440),

                // Business status — hourly
                ("admin.invoices-mark-overdue",              "Mark overdue invoices",              60),
                ("admin.offers-mark-expired",                "Expire past-due offers",             60),
                ("admin.payment-installments-mark-overdue",  "Mark overdue payment installments",  60),
                ("admin.dispatches-mark-missed",             "Mark missed dispatches",             60),
                ("admin.support-tickets-autoclose-resolved", "Auto-close resolved tickets",        360),

                // Email retries — frequent
                ("admin.retry-failed-emails",          "Retry failed outbound emails",       5),
            };

        /// <summary>
        /// Any ProcessRun left in 'running' state (crash / restart mid-run) is closed as
        /// failed so the UI's running-keys endpoint and the history tab tell the truth.
        /// Advisory locks are session-scoped, so they are already gone after a restart.
        /// </summary>
        private async Task ReconcileStaleRunsAsync(CancellationToken ct)
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var now = DateTime.UtcNow;
            var fixedUp = await db.Set<ProcessRun>()
                .Where(r => r.Status == "running" && r.FinishedAt == null)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(r => r.Status, "failed")
                    .SetProperty(r => r.FinishedAt, now)
                    .SetProperty(r => r.Error, "Interrupted — the application restarted while this run was in progress"), ct);
            if (fixedUp > 0)
                _logger.LogWarning("⚙️  Reconciled {Count} interrupted process run(s) on boot", fixedUp);
        }


        private async Task SeedBuiltInSchedulesAsync(CancellationToken ct)
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var registry = scope.ServiceProvider.GetRequiredService<ProcessHandlerRegistry>();

            foreach (var (key, name, interval) in BuiltInSchedules)
            {
                if (!registry.TryGet(key, out _)) continue; // handler not registered → skip

                var existing = await db.Set<ProcessSchedule>().FirstOrDefaultAsync(s => s.Key == key, ct);
                if (existing == null)
                {
                    db.Set<ProcessSchedule>().Add(new ProcessSchedule
                    {
                        Key = key,
                        Name = name,
                        Enabled = true,
                        Paused = false,
                        IntervalMinutes = interval,
                        NextRunAt = DateTime.UtcNow.AddMinutes(1),
                    });
                    _logger.LogInformation("⚙️  Seeded built-in process schedule '{Key}' (every {Interval} min)", key, interval);
                }
                else if (existing.Enabled && !existing.Paused && existing.NextRunAt == null)
                {
                    // Repair a schedule that lost its NextRunAt (e.g. after a prior block).
                    existing.NextRunAt = DateTime.UtcNow.AddMinutes(1);
                    existing.UpdatedAt = DateTime.UtcNow;
                }
            }

            await db.SaveChangesAsync(ct);
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

                // On a scheduler tick the next attempt number is the running failure count + 1.
                // On success this resets to 0, so the next scheduled run is attempt=1 again.
                var attempt = Math.Max(1, s.ConsecutiveFailures + 1);
                await ExecuteOnceAsync(db, s, handler, "schedule", attempt, ct);
            }
        }

        /// <summary>Stable 64-bit hash for Postgres pg_advisory_lock keys.</summary>
        private static long AdvisoryLockKey(string key)
        {
            // FNV-1a 64-bit — deterministic, no allocations.
            unchecked
            {
                ulong hash = 14695981039346656037UL;
                foreach (var c in key)
                {
                    hash ^= c;
                    hash *= 1099511628211UL;
                }
                return (long)hash;
            }
        }

        private static async Task<bool> TryAcquireLockAsync(ApplicationDbContext db, long lockId, CancellationToken ct)
        {
            var conn = db.Database.GetDbConnection();
            if (conn.State != ConnectionState.Open) await conn.OpenAsync(ct);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT pg_try_advisory_lock(@k)";
            var p = cmd.CreateParameter(); p.ParameterName = "@k"; p.Value = lockId;
            cmd.Parameters.Add(p);
            var result = await cmd.ExecuteScalarAsync(ct);
            return result is bool b && b;
        }

        private static async Task ReleaseLockAsync(ApplicationDbContext db, long lockId, CancellationToken ct)
        {
            try
            {
                var conn = db.Database.GetDbConnection();
                if (conn.State != ConnectionState.Open) await conn.OpenAsync(ct);
                await using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT pg_advisory_unlock(@k)";
                var p = cmd.CreateParameter(); p.ParameterName = "@k"; p.Value = lockId;
                cmd.Parameters.Add(p);
                await cmd.ExecuteScalarAsync(ct);
            }
            catch { /* best effort — session end releases the lock anyway */ }
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
            // Prevent duplicate execution across scheduler ticks, manual "Run now",
            // and multiple app instances all pointing at the same database.
            var lockId = AdvisoryLockKey(s.Key);
            if (!await TryAcquireLockAsync(db, lockId, ct))
            {
                return new DTOs.RunNowResult
                {
                    Status = "skipped",
                    BlockReason = "Another execution of this process is already in progress",
                };
            }

            try
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
                // Hard cap: a hung handler must never block the scheduler loop (which
                // executes due schedules sequentially) or an HTTP "Run now" request.
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                timeoutCts.CancelAfter(HandlerTimeout);
                try
                {
                    result = await handler.ExecuteAsync(s.ConfigJson ?? "{}", timeoutCts.Token);
                    if (string.IsNullOrEmpty(result.Status)) result.Status = "success";
                }
                catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !ct.IsCancellationRequested)
                {
                    result = new DTOs.RunNowResult
                    {
                        Status = "failed",
                        Error = $"Timed out after {HandlerTimeout.TotalMinutes:0} minutes",
                    };
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
                run.BlockReason = Truncate(result.BlockReason); // column is capped at 500 chars
                run.ItemsProcessed = result.ItemsProcessed;
                run.OutputJson = result.Output != null ? System.Text.Json.JsonSerializer.Serialize(result.Output) : null;

                result.DurationMs = run.DurationMs ?? 0;

                // Schedule state transition
                s.LastRunAt = run.FinishedAt;
                s.LastStatus = result.Status;
                s.UpdatedAt = DateTime.UtcNow;

                // Manual "Run now" is a diagnostic action — it records the run but must
                // NOT mutate the retry ladder (ConsecutiveFailures / NextRunAt / Paused),
                // otherwise an admin clicking Run to investigate can accidentally pause
                // a healthy schedule.
                var isManual = triggeredBy == "manual";

                if (result.Status == "success" || result.Status == "skipped")
                {
                    if (!isManual)
                    {
                        s.ConsecutiveFailures = 0;
                        s.BlockReason = null;
                        s.NextRunAt = DateTime.UtcNow.AddMinutes(Math.Max(1, s.IntervalMinutes));
                    }
                }
                else if (result.Status == "blocked")
                {
                    if (!isManual)
                    {
                        s.BlockReason = Truncate(result.BlockReason ?? "Handler reported blocked");
                        s.NextRunAt = DateTime.UtcNow.AddMinutes(Math.Max(1, s.IntervalMinutes));
                    }
                }
                else if (!isManual) // failed, scheduled run
                {
                    s.ConsecutiveFailures = s.ConsecutiveFailures + 1;
                    if (attempt < Math.Max(1, s.MaxRetries))
                    {
                        // Clamp the exponent (and the resulting delay) so a long failure
                        // streak can never overflow or push the next run years away.
                        var exponent = Math.Min(attempt - 1, 10);
                        var backoffSec = Math.Min(
                            (long)Math.Max(1, s.RetryBackoffSeconds) * (long)Math.Pow(2, exponent),
                            86_400L);
                        var retryAt = DateTime.UtcNow.AddSeconds(backoffSec);
                        run.NextRetryAt = retryAt;
                        s.NextRunAt = retryAt; // scheduler will pick it up on the next tick past retryAt
                    }
                    else
                    {
                        // Retry ladder exhausted. Processes must KEEP RUNNING — never
                        // self-pause, otherwise a transient outage silently stops
                        // automation until someone notices. Instead: surface the reason,
                        // reset the ladder, and cool down until the next normal slot
                        // (at least 15 minutes) so we don't hot-loop on a hard failure.
                        s.BlockReason = Truncate($"Failed after {attempt} attempts: {result.Error}");
                        s.ConsecutiveFailures = 0;
                        var cooldown = Math.Max(15, Math.Max(1, s.IntervalMinutes));
                        s.NextRunAt = DateTime.UtcNow.AddMinutes(cooldown);
                        run.NextRetryAt = s.NextRunAt;
                    }
                }
                // manual + failed → surfaced to the operator via the response, no schedule mutation.

                try
                {
                    await db.SaveChangesAsync(ct);
                }
                catch (Exception saveEx)
                {
                    // Never leave the run row stuck as 'running'. Persist a minimal
                    // closing update with raw SQL so the UI and history stay accurate.
                    try
                    {
                        var finishedAt = DateTime.UtcNow;
                        await db.Set<ProcessRun>()
                            .Where(r => r.Id == run.Id)
                            .ExecuteUpdateAsync(u => u
                                .SetProperty(r => r.Status, "failed")
                                .SetProperty(r => r.FinishedAt, finishedAt)
                                .SetProperty(r => r.Error, "State persist failed: " + saveEx.Message), ct);
                    }
                    catch { /* best effort — boot reconcile will close it */ }

                    result.Status = "failed";
                    result.Error ??= saveEx.Message;
                }
                return result;
            }
            finally
            {
                await ReleaseLockAsync(db, lockId, ct);
            }
        }

    }
}
