using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Kpi.DTOs;
using MyApi.Modules.OAS.Kpi.Services;

namespace MyApi.Modules.OAS.Kpi.Controllers;

[Route("api/oas/kpi")]
[OasPluginGate("OA0002DASHBOARD")]
public class OasKpiController : OasControllerBase
{
    private readonly IOasKpiService _service;
    public OasKpiController(IOasKpiService service) => _service = service;

    private static (DateOnly from, DateOnly to) Range(DateOnly? from, DateOnly? to)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return (from ?? today, to ?? today);
    }

    [HttpGet("daily")]
    public async Task<ActionResult<OasKpiDailyDto>> Daily([FromQuery] Guid? postId, [FromQuery] Guid? lineId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var (f, t) = Range(from, to);
        return Ok(await _service.GetDailyAsync(CurrentTenantId, postId, lineId, f, t));
    }

    /// <summary>
    /// Batched per-post KPI: one HTTP call instead of one per post. The
    /// console rolls plant/line figures up client-side, and browsers cap
    /// HTTP/1.1 at 6 connections per origin, so the fan-out was the single
    /// biggest source of dashboard latency.
    /// </summary>
    [HttpGet("daily-batch")]
    public async Task<ActionResult<IReadOnlyList<OasPostKpiDailyDto>>> DailyBatch([FromQuery] string? postIds, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var ids = ParseIds(postIds);
        if (ids.Count == 0) return BadRequest(new { success = false, message = "postIds is required." });
        if (ids.Count > 500) return BadRequest(new { success = false, message = "Too many postIds (max 500)." });
        var (f, t) = Range(from, to);
        // Set-based: 4 grouped queries for the whole batch (was one GetDailyAsync
        // — ~5 sequential queries — per post, i.e. 500+ round trips per sweep).
        return Ok(await _service.GetDailyBatchAsync(CurrentTenantId, ids, f, t));
    }

    /// <summary>Batched per-post trend series — same rationale as daily-batch.</summary>
    [HttpGet("trend-batch")] [OasWorkspace("web")]
    public async Task<ActionResult<IReadOnlyList<OasPostTrendDto>>> TrendBatch([FromQuery] string? postIds, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var ids = ParseIds(postIds);
        if (ids.Count == 0) return BadRequest(new { success = false, message = "postIds is required." });
        if (ids.Count > 500) return BadRequest(new { success = false, message = "Too many postIds (max 500)." });
        var (f, t) = Range(from, to);
        // Set-based per (post, day): 4 grouped queries instead of posts × days
        // daily computations — that N×D fan-out is what left the TRS trend blank.
        return Ok(await _service.GetTrendBatchAsync(CurrentTenantId, ids, f, t));
    }

    private static List<Guid> ParseIds(string? raw)
    {
        var ids = new List<Guid>();
        if (string.IsNullOrWhiteSpace(raw)) return ids;
        foreach (var part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            if (Guid.TryParse(part, out var g) && !ids.Contains(g)) ids.Add(g);
        return ids;
    }

    [HttpGet("pareto")]
    public async Task<ActionResult<IReadOnlyList<OasParetoEntryDto>>> Pareto([FromQuery] Guid? postId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var (f, t) = Range(from, to);
        return Ok(await _service.GetParetoAsync(CurrentTenantId, postId, f, t));
    }

    // Verified: only ManagerDashboard.tsx (useLiveTrend) calls this — daily/pareto/line-comparison below are shared with MobileKpi.tsx via liveState.ts and must stay unrestricted.
    [HttpGet("trend")] [OasWorkspace("web")]
    public async Task<ActionResult<IReadOnlyList<OasTrendPointDto>>> Trend([FromQuery] Guid? postId, [FromQuery] Guid? lineId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var (f, t) = Range(from, to);
        return Ok(await _service.GetTrendAsync(CurrentTenantId, postId, lineId, f, t));
    }

    [HttpGet("line-comparison")]
    public async Task<ActionResult<IReadOnlyList<OasLineComparisonEntryDto>>> LineComparison([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var (f, t) = Range(from, to);
        return Ok(await _service.GetLineComparisonAsync(CurrentTenantId, f, t));
    }

    [HttpGet("sla-summary")]
    public async Task<ActionResult<IReadOnlyList<OasSlaSummaryEntryDto>>> SlaSummary([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var (f, t) = Range(from, to);
        return Ok(await _service.GetSlaSummaryAsync(CurrentTenantId, f, t));
    }

    // Verified: only Reports.tsx (web) calls this.
    [HttpGet("cadence-gap")] [OasWorkspace("web")]
    public async Task<ActionResult<IReadOnlyList<OasCadenceGapEntryDto>>> CadenceGap([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var (f, t) = Range(from, to);
        return Ok(await _service.GetCadenceGapAsync(CurrentTenantId, f, t));
    }
}

[Route("api/oas/andon/message")]
[OasPluginGate("OA0010ANDON")]
public class OasAndonMessageController : OasControllerBase
{
    private readonly IOasKpiService _service;
    public OasAndonMessageController(IOasKpiService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<OasAndonMessageDto>> Get([FromQuery] Guid? lineId)
    {
        var dto = await _service.GetAndonMessageAsync(CurrentTenantId, lineId);
        return Ok(dto ?? new OasAndonMessageDto { LineId = lineId, Message = "" });
    }

    [HttpPut] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<ActionResult<OasAndonMessageDto>> Set([FromBody] OasAndonMessageRequestDto request)
        => Ok(await _service.SetAndonMessageAsync(CurrentTenantId, CurrentOasUserId, request));
}
