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
    /// Admin API for the Processes workspace page.
    /// - GET  /api/processes/schedules            — list all schedules (state overlay for the UI)
    /// - PUT  /api/processes/schedules            — upsert a schedule (interval/config/etc.)
    /// - POST /api/processes/schedules/{key}/pause?paused=true|false
    /// - POST /api/processes/schedules/{key}/enable?enabled=true|false
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
        private readonly ILogger<ProcessesController> _logger;

        public ProcessesController(ApplicationDbContext db, ProcessHandlerRegistry registry, ILogger<ProcessesController> logger)
        {
            _db = db; _registry = registry; _logger = logger;
        }

        [HttpGet("schedules")]
        public async Task<ActionResult<IEnumerable<ProcessScheduleDto>>> List(CancellationToken ct)
        {
            var rows = await _db.Set<ProcessSchedule>().AsNoTracking().ToListAsync(ct);
            return Ok(rows.Select(ToDto));
        }

        [HttpPut("schedules")]
        public async Task<ActionResult<ProcessScheduleDto>> Upsert([FromBody] UpsertScheduleRequest req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req.Key)) return BadRequest(new { error = "key is required" });

            var s = await _db.Set<ProcessSchedule>().FirstOrDefaultAsync(x => x.Key == req.Key, ct);
            var isNew = s == null;
            s ??= new ProcessSchedule { Key = req.Key, Name = req.Name ?? req.Key };

            if (req.Name != null) s.Name = req.Name;
            if (req.Enabled.HasValue) s.Enabled = req.Enabled.Value;
            if (req.Paused.HasValue) s.Paused = req.Paused.Value;
            if (req.IntervalMinutes.HasValue) s.IntervalMinutes = Math.Max(1, req.IntervalMinutes.Value);
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
            var s = await _db.Set<ProcessSchedule>().FirstOrDefaultAsync(x => x.Key == key, ct);
            if (s == null) return NotFound();
            s.Paused = paused;
            if (!paused) { s.BlockReason = null; s.ConsecutiveFailures = 0; if (s.NextRunAt == null) s.NextRunAt = DateTime.UtcNow.AddMinutes(s.IntervalMinutes); }
            s.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(ToDto(s));
        }

        [HttpPost("schedules/{key}/enable")]
        public async Task<IActionResult> SetEnabled(string key, [FromQuery] bool enabled, CancellationToken ct)
        {
            var s = await _db.Set<ProcessSchedule>().FirstOrDefaultAsync(x => x.Key == key, ct);
            if (s == null) return NotFound();
            s.Enabled = enabled;
            if (enabled && s.NextRunAt == null) s.NextRunAt = DateTime.UtcNow.AddMinutes(s.IntervalMinutes);
            s.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(ToDto(s));
        }

        [HttpGet("runs/{key}")]
        public async Task<ActionResult<IEnumerable<ProcessRunDto>>> ListRuns(string key, [FromQuery] int limit = 20, CancellationToken ct = default)
        {
            limit = Math.Clamp(limit, 1, 200);
            var rows = await _db.Set<ProcessRun>().AsNoTracking()
                .Where(r => r.ProcessKey == key)
                .OrderByDescending(r => r.StartedAt)
                .Take(limit)
                .ToListAsync(ct);
            return Ok(rows.Select(ToDto));
        }

        public class RunNowRequest { public string Key { get; set; } = string.Empty; }

        [HttpPost("run")]
        public async Task<ActionResult<RunNowResult>> RunNow([FromBody] RunNowRequest req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req.Key)) return BadRequest(new { error = "key is required" });
            if (!_registry.TryGet(req.Key, out var handler))
                return BadRequest(new { error = $"No handler registered for '{req.Key}'" });

            var s = await _db.Set<ProcessSchedule>().FirstOrDefaultAsync(x => x.Key == req.Key, ct);
            if (s == null)
            {
                s = new ProcessSchedule { Key = req.Key, Name = req.Key, Enabled = true, Paused = false };
                _db.Set<ProcessSchedule>().Add(s);
                await _db.SaveChangesAsync(ct);
            }

            var result = await ProcessSchedulerService.ExecuteOnceAsync(_db, s, handler, "manual", attempt: 1, ct);
            return Ok(result);
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
