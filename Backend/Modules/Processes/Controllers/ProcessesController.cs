using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Processes.DTOs;
using MyApi.Modules.Processes.Models;
using MyApi.Modules.Processes.Services;

namespace MyApi.Modules.Processes.Controllers
{
    /// <summary>
    /// Admin API for the Processes workspace page. All endpoints are gated to
    /// any authenticated user — schedules are global and the scheduler runs them
    /// automatically in the background regardless of who is signed in.
    ///
    /// - GET  /api/processes/schedules            — list all schedules (state overlay for the UI)
    /// - PUT  /api/processes/schedules            — upsert a schedule (interval/config/etc.)
    /// - POST /api/processes/schedules/{key}/pause?paused=true|false
    /// - POST /api/processes/schedules/{key}/enable?enabled=true|false
    /// - POST /api/processes/schedules/{key}/reset-failures — clear BlockReason + failure counter
    /// - GET  /api/processes/runs/{key}?limit=20  — recent run history for one process
    /// - POST /api/processes/run                  — { key } → execute immediately, return result
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/processes")]
    public class ProcessesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ProcessHandlerRegistry _registry;
        private readonly RunningProcessRegistry _running;
        private readonly ILogger<ProcessesController> _logger;

        public ProcessesController(ApplicationDbContext db, ProcessHandlerRegistry registry, RunningProcessRegistry running, ILogger<ProcessesController> logger)
        {
            _db = db; _registry = registry; _running = running; _logger = logger;
        }

        // Admin-only gate.
        //
        // Every process in this module is a system-wide, cross-tenant job
        // (purge logs, mark invoices overdue, retry outbound emails, …).
        // Exposing them to any authenticated user let a regular tenant user
        // trigger admin.soft-deleted-purge or change every schedule's
        // interval. The frontend already treats non-MainAdmins as read-only;
        // enforce the same rule on the server so it isn't just a UX gate.
        private bool IsMainAdmin()
        {
            var claims = User?.Claims;
            if (claims == null) return false;
            return claims.Any(c =>
                (string.Equals(c.Type, "UserType", StringComparison.OrdinalIgnoreCase) &&
                 string.Equals(c.Value, "MainAdminUser", StringComparison.OrdinalIgnoreCase)) ||
                (string.Equals(c.Type, "user_type", StringComparison.OrdinalIgnoreCase) &&
                 string.Equals(c.Value, "MainAdminUser", StringComparison.OrdinalIgnoreCase)) ||
                (string.Equals(c.Type, "login_type", StringComparison.OrdinalIgnoreCase) &&
                 string.Equals(c.Value, "admin", StringComparison.OrdinalIgnoreCase)));
        }

        private ObjectResult? RequireAdmin()
        {
            if (IsMainAdmin()) return null;
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                error = "Only the main administrator can view or manage background processes.",
            });
        }





        [HttpGet("schedules")]
        public async Task<ActionResult<IEnumerable<ProcessScheduleDto>>> List(CancellationToken ct)
        {
            if (RequireAdmin() is { } deny) return deny;

            var rows = await _db.Set<ProcessSchedule>().AsNoTracking().ToListAsync(ct);
            var keys = rows.Select(r => r.Key).ToList();

            // Project the real runtime state from run history so the UI shows the
            // actual status (running / failed / blocked) and the exact error text,
            // instead of inferring it from LastStatus alone.
            //
            // Per-key top-N (not a global Take): a chatty process (retry-failed-emails
            // runs every 5 min) can otherwise saturate a global cap and hide a lower-
            // frequency key's true latest run behind the cap boundary.
            // EF Core cannot translate GroupBy(...).SelectMany(g => g.Take(N))
            // for PostgreSQL. Use the SQL-native window function instead so the
            // endpoint stays one indexed query and still returns the latest 30
            // runs per process key. This fixes stale UI refreshes caused by the
            // previous query throwing at runtime.
            var keyArray = keys.ToArray();
            var recent = keyArray.Length == 0
                ? new List<ProcessRun>()
                : await _db.Set<ProcessRun>().FromSqlInterpolated($@"
                    SELECT
                        ranked.""Id"",
                        ranked.""ProcessKey"",
                        ranked.""TriggeredBy"",
                        ranked.""Attempt"",
                        ranked.""Status"",
                        ranked.""StartedAt"",
                        ranked.""FinishedAt"",
                        ranked.""DurationMs"",
                        ranked.""ItemsProcessed"",
                        ranked.""Error"",
                        ranked.""BlockReason"",
                        ranked.""NextRetryAt"",
                        ranked.""OutputJson""
                    FROM (
                        SELECT
                            r.""Id"",
                            r.""ProcessKey"",
                            r.""TriggeredBy"",
                            r.""Attempt"",
                            r.""Status"",
                            r.""StartedAt"",
                            r.""FinishedAt"",
                            r.""DurationMs"",
                            r.""ItemsProcessed"",
                            r.""Error"",
                            r.""BlockReason"",
                            r.""NextRetryAt"",
                            r.""OutputJson"",
                            ROW_NUMBER() OVER (PARTITION BY r.""ProcessKey"" ORDER BY r.""StartedAt"" DESC) AS rn
                        FROM ""ProcessRuns"" AS r
                        WHERE r.""ProcessKey"" = ANY({keyArray})
                    ) AS ranked
                    WHERE ranked.rn <= 30")
                    .AsNoTracking()
                    .ToListAsync(ct);

            var staleCutoff = DateTime.UtcNow.AddMinutes(-30);
            var byKey = recent.GroupBy(r => r.ProcessKey)
                              .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.StartedAt).ToList());

            var dtos = rows.Select(s =>
            {
                var dto = ToDto(s);
                dto.HasHandler = _registry.TryGet(s.Key, out _);
                if (byKey.TryGetValue(s.Key, out var runs) && runs.Count > 0)
                {
                    var latest = runs[0];
                    dto.IsRunning = latest.Status == "running" && latest.FinishedAt == null && latest.StartedAt >= staleCutoff;
                    // Surface the newest failure/skip text so a real problem never
                    // disappears behind a no-op run. `skipped` runs may carry a
                    // BlockReason (e.g. FK-blocked purge) that the operator MUST see
                    // — previously only `failed`/`blocked` were surfaced, hiding
                    // recurring skip reasons in the History tab.
                    var lastProblem = runs.FirstOrDefault(r =>
                        r.Status == "failed" || r.Status == "blocked" ||
                        (r.Status == "skipped" && !string.IsNullOrEmpty(r.BlockReason)));
                    if (latest.Status == "failed" || latest.Status == "blocked")
                        dto.LastError = latest.Error ?? latest.BlockReason;
                    else if (latest.Status == "skipped" && !string.IsNullOrEmpty(latest.BlockReason))
                        dto.LastError = latest.BlockReason;
                    else if (s.ConsecutiveFailures > 0)
                        dto.LastError = lastProblem?.Error ?? lastProblem?.BlockReason;
                    dto.LastDurationMs = latest.DurationMs;
                    dto.LastItemsProcessed = latest.ItemsProcessed;
                    dto.LastTriggeredBy = latest.TriggeredBy;
                    dto.LastAttempt = latest.Attempt;
                    dto.NextRetryAt = latest.NextRetryAt;
                    // Manual "Run now" deliberately does NOT update s.LastRunAt (it
                    // must not overwrite the scheduled-cadence audit trail). Fall back
                    // to the most recent finished run so the UI reflects manual runs.
                    var mostRecentFinished = runs.FirstOrDefault(r => r.FinishedAt != null);
                    if (mostRecentFinished != null && (dto.LastRunAt == null || mostRecentFinished.FinishedAt > dto.LastRunAt))
                        dto.LastRunAt = mostRecentFinished.FinishedAt;

                    var finished = runs.Where(r => r.Status != "running").Take(30).ToList();
                    dto.RecentTotal = finished.Count;
                    dto.RecentSuccess = finished.Count(r => r.Status == "success" || r.Status == "skipped");

                }
                if (!dto.HasHandler && string.IsNullOrEmpty(dto.BlockReason))
                    dto.BlockReason = "No handler registered on the server for this process key.";
                return dto;
            }).ToList();

            return Ok(dtos);
        }

        [HttpPut("schedules")]
        public async Task<ActionResult<ProcessScheduleDto>> Upsert([FromBody] UpsertScheduleRequest req, CancellationToken ct)
        {
            if (RequireAdmin() is { } deny) return deny;
            if (string.IsNullOrWhiteSpace(req.Key)) return BadRequest(new { error = "key is required" });

            // Reject unknown keys: a schedule with no handler would be marked "blocked"
            // on every tick and pollute the UI with a process that can never run.
            if (!_registry.TryGet(req.Key, out _))
                return BadRequest(new { error = $"No handler registered for '{req.Key}'" });

            var s = await _db.Set<ProcessSchedule>().FirstOrDefaultAsync(x => x.Key == req.Key, ct);
            var isNew = s == null;
            s ??= new ProcessSchedule { Key = req.Key, Name = req.Name ?? req.Key };

            if (req.Name != null) s.Name = req.Name;
            if (req.Enabled.HasValue) s.Enabled = req.Enabled.Value;
            if (req.Paused.HasValue) s.Paused = req.Paused.Value;
            if (req.IntervalMinutes.HasValue) s.IntervalMinutes = Math.Clamp(req.IntervalMinutes.Value, 1, 43_200);
            if (req.MaxRetries.HasValue) s.MaxRetries = Math.Max(0, req.MaxRetries.Value);
            if (req.RetryBackoffSeconds.HasValue) s.RetryBackoffSeconds = Math.Max(1, req.RetryBackoffSeconds.Value);
            if (req.Timezone != null) s.Timezone = req.Timezone;
            if (req.Config != null) s.ConfigJson = JsonSerializer.Serialize(req.Config);

            s.UpdatedAt = DateTime.UtcNow;
            if (isNew || s.NextRunAt == null)
                s.NextRunAt = DateTime.UtcNow.AddMinutes(s.IntervalMinutes);

            if (isNew) _db.Set<ProcessSchedule>().Add(s);
            await _db.SaveChangesAsync(ct);
            return Ok(ToDto(s));
        }

        [HttpPost("schedules/{key}/pause")]
        public async Task<IActionResult> SetPaused(string key, [FromQuery] bool paused, CancellationToken ct)
        {
            if (RequireAdmin() is { } deny) return deny;
            // Single-column ExecuteUpdate avoids the lost-update race with the
            // scheduler's per-run save (different scope, no concurrency token on
            // ProcessSchedule) — tracked SaveChanges would clobber NextRunAt /
            // ConsecutiveFailures set by an in-flight run finishing at the same time.
            var now = DateTime.UtcNow;
            var affected = await _db.Set<ProcessSchedule>()
                .Where(x => x.Key == key)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(x => x.Paused, paused)
                    .SetProperty(x => x.BlockReason, x => !paused ? null : x.BlockReason)
                    .SetProperty(x => x.ConsecutiveFailures, x => !paused ? 0 : x.ConsecutiveFailures)
                    .SetProperty(x => x.NextRunAt, x => !paused && x.NextRunAt == null
                        ? now.AddMinutes(x.IntervalMinutes < 1 ? 1 : x.IntervalMinutes)
                        : x.NextRunAt)
                    .SetProperty(x => x.UpdatedAt, now), ct);
            if (affected == 0) return NotFound();
            var s = await _db.Set<ProcessSchedule>().AsNoTracking().FirstAsync(x => x.Key == key, ct);
            return Ok(ToDto(s));
        }

        [HttpPost("schedules/{key}/enable")]
        public async Task<IActionResult> SetEnabled(string key, [FromQuery] bool enabled, CancellationToken ct)
        {
            if (RequireAdmin() is { } deny) return deny;
            var now = DateTime.UtcNow;
            var affected = await _db.Set<ProcessSchedule>()
                .Where(x => x.Key == key)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(x => x.Enabled, enabled)
                    .SetProperty(x => x.NextRunAt, x => enabled && x.NextRunAt == null
                        ? now.AddMinutes(x.IntervalMinutes < 1 ? 1 : x.IntervalMinutes)
                        : x.NextRunAt)
                    .SetProperty(x => x.UpdatedAt, now), ct);
            if (affected == 0) return NotFound();
            var s = await _db.Set<ProcessSchedule>().AsNoTracking().FirstAsync(x => x.Key == key, ct);
            return Ok(ToDto(s));
        }

        [HttpPost("schedules/{key}/reset-failures")]
        public async Task<IActionResult> ResetFailures(string key, CancellationToken ct)
        {
            if (RequireAdmin() is { } deny) return deny;
            var now = DateTime.UtcNow;
            // ExecuteUpdate avoids the lost-update race with a concurrent run save.
            // On an active schedule we force NextRunAt = now so "Clear failures" runs
            // immediately — leaving the retry-exhausted cooldown time (up to 24h out)
            // made the button appear to do nothing.
            var affected = await _db.Set<ProcessSchedule>()
                .Where(x => x.Key == key)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(x => x.ConsecutiveFailures, 0)
                    .SetProperty(x => x.BlockReason, (string?)null)
                    .SetProperty(x => x.NextRunAt, x => x.Enabled && !x.Paused ? now : x.NextRunAt)
                    .SetProperty(x => x.UpdatedAt, now), ct);
            if (affected == 0) return NotFound();
            var s = await _db.Set<ProcessSchedule>().AsNoTracking().FirstAsync(x => x.Key == key, ct);
            return Ok(ToDto(s));
        }

        [HttpGet("runs/{key}")]
        public async Task<ActionResult<IEnumerable<ProcessRunDto>>> ListRuns(string key, [FromQuery] int limit = 20, CancellationToken ct = default)
        {
            if (RequireAdmin() is { } deny) return deny;

            limit = Math.Clamp(limit, 1, 200);
            var rows = await _db.Set<ProcessRun>().AsNoTracking()
                .Where(r => r.ProcessKey == key)
                .OrderByDescending(r => r.StartedAt)
                .Take(limit)
                .ToListAsync(ct);
            return Ok(rows.Select(ToDto));
        }

        /// <summary>
        /// Returns keys of processes whose most recent run is still 'running'.
        /// Used by the UI to show a live "running" pill for scheduler-triggered runs.
        /// A run is considered stale (and ignored here) if it started more than
        /// 30 minutes ago without finishing — protects against crashed-mid-run rows.
        /// </summary>
        [HttpGet("running-keys")]
        public async Task<ActionResult<IEnumerable<string>>> RunningKeys(CancellationToken ct)
        {
            if (RequireAdmin() is { } deny) return deny;

            var staleCutoff = DateTime.UtcNow.AddMinutes(-30);
            var keys = await _db.Set<ProcessRun>().AsNoTracking()
                .Where(r => r.Status == "running" && r.FinishedAt == null && r.StartedAt >= staleCutoff)
                .Select(r => r.ProcessKey)
                .Distinct()
                .ToListAsync(ct);
            return Ok(keys);
        }

        public class RunNowRequest { public string Key { get; set; } = string.Empty; }

        [HttpPost("run")]
        public async Task<ActionResult<RunNowResult>> RunNow([FromBody] RunNowRequest req, CancellationToken ct)
        {
            if (RequireAdmin() is { } deny) return deny;

            if (string.IsNullOrWhiteSpace(req.Key)) return BadRequest(new { error = "key is required" });
            if (!_registry.TryGet(req.Key, out var handler))
                return BadRequest(new { error = $"No handler registered for '{req.Key}'" });

            var s = await _db.Set<ProcessSchedule>().FirstOrDefaultAsync(x => x.Key == req.Key, ct);
            if (s == null)
            {
                // A row created by "Run now" must also get a NextRunAt, otherwise it shows
                // as Enabled in the UI while the scheduler's due-query (NextRunAt <= now)
                // can never select it — the process would silently never run again on its
                // own until an admin happens to save the schedule from the UI.
                s = new ProcessSchedule
                {
                    Key = req.Key,
                    Name = req.Key,
                    Enabled = true,
                    Paused = false,
                };
                s.NextRunAt = DateTime.UtcNow.AddMinutes(Math.Max(1, s.IntervalMinutes));
                _db.Set<ProcessSchedule>().Add(s);
                await _db.SaveChangesAsync(ct);
            }

            // Manual triggers are always attempt=1 (they don't participate in the retry ladder;
            // if the handler fails, the operator sees the error and decides).
            var result = await ProcessSchedulerService.ExecuteOnceAsync(_db, s, handler, "manual", attempt: 1, ct, _running);
            // Log every manual outcome so the server log mirrors the persisted run row.
            if (string.Equals(result.Status, "success", StringComparison.OrdinalIgnoreCase))
                _logger.LogInformation("⚙️  Manual run of '{Key}' succeeded in {Duration}ms", req.Key, result.DurationMs);
            else
                _logger.LogWarning("⚙️  Manual run of '{Key}' ended as '{Status}' in {Duration}ms: {Detail}",
                    req.Key, result.Status, result.DurationMs, result.Error ?? result.BlockReason ?? "no detail");
            return Ok(result);
        }

        /// <summary>
        /// Cooperatively stops the currently running execution for {key}, if any.
        /// The handler's CancellationToken is triggered so it aborts at its next
        /// await point. Idempotent — returns 200 with running=false when nothing
        /// was in flight.
        /// </summary>
        [HttpPost("schedules/{key}/stop")]
        public IActionResult StopRun(string key)
        {
            if (RequireAdmin() is { } deny) return deny;
            var stopped = _running.RequestStop(key);
            return Ok(new { key, stopped });
        }


        // ── mappers ──────────────────────────────────────────────────────────
        private static ProcessScheduleDto ToDto(ProcessSchedule s)
        {
            object cfg = new { };
            try { if (!string.IsNullOrWhiteSpace(s.ConfigJson)) cfg = JsonSerializer.Deserialize<object>(s.ConfigJson) ?? new { }; }
            catch { /* ignore */ }
            return new ProcessScheduleDto
            {
                Key = s.Key,
                Name = s.Name,
                Enabled = s.Enabled,
                Paused = s.Paused,
                IntervalMinutes = s.IntervalMinutes,
                MaxRetries = s.MaxRetries,
                RetryBackoffSeconds = s.RetryBackoffSeconds,
                Config = cfg,
                Timezone = s.Timezone,
                NextRunAt = s.NextRunAt,
                LastRunAt = s.LastRunAt,
                LastStatus = s.LastStatus,
                ConsecutiveFailures = s.ConsecutiveFailures,
                BlockReason = s.BlockReason,
                UpdatedAt = s.UpdatedAt,
            };
        }

        private static ProcessRunDto ToDto(ProcessRun r) => new()
        {
            Id = r.Id,
            ProcessKey = r.ProcessKey,
            TriggeredBy = r.TriggeredBy,
            Attempt = r.Attempt,
            Status = r.Status,
            StartedAt = r.StartedAt,
            FinishedAt = r.FinishedAt,
            DurationMs = r.DurationMs,
            ItemsProcessed = r.ItemsProcessed,
            Error = r.Error,
            BlockReason = r.BlockReason,
            NextRetryAt = r.NextRetryAt,
        };
    }
}
