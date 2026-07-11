using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.Reporting.DTOs;
using MyApi.Modules.Reporting.Services;

namespace MyApi.Modules.Reporting.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportingFavoritesController : ControllerBase
{
    private readonly IReportingFavoritesService _service;

    public ReportingFavoritesController(IReportingFavoritesService service)
    {
        _service = service;
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst("UserId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedAccessException("User ID not found in token");
        return id;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? scope, CancellationToken ct)
    {
        try
        {
            var data = await _service.GetAsync(GetCurrentUserId(), scope ?? "default", ct);
            return Ok(new { success = true, data });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { success = false, message = "User not authenticated" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UpsertReportingFavoriteRequest req, CancellationToken ct)
    {
        try
        {
            if (req == null || string.IsNullOrWhiteSpace(req.WidgetId))
                return BadRequest(new { success = false, message = "widgetId is required" });
            var data = await _service.UpsertAsync(GetCurrentUserId(), req, ct);
            return Ok(new { success = true, data });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { success = false, message = "User not authenticated" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("{widgetId}")]
    public async Task<IActionResult> Delete(string widgetId, [FromQuery] string? scope, CancellationToken ct)
    {
        try
        {
            var ok = await _service.DeleteAsync(GetCurrentUserId(), scope ?? "default", widgetId, ct);
            return Ok(new { success = ok });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { success = false, message = "User not authenticated" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAll([FromQuery] string? scope, CancellationToken ct)
    {
        try
        {
            var count = await _service.DeleteAllAsync(GetCurrentUserId(), scope ?? "default", ct);
            return Ok(new { success = true, removed = count });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { success = false, message = "User not authenticated" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder([FromBody] ReorderReportingFavoritesRequest req, CancellationToken ct)
    {
        try
        {
            if (req == null) return BadRequest(new { success = false, message = "Body required" });
            await _service.ReorderAsync(GetCurrentUserId(), req, ct);
            return Ok(new { success = true });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { success = false, message = "User not authenticated" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}