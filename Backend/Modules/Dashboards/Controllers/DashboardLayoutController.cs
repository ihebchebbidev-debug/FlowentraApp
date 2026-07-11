using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.Dashboards.DTOs;
using MyApi.Modules.Dashboards.Services;

namespace MyApi.Modules.Dashboards.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardLayoutController : ControllerBase
{
    private readonly IDashboardLayoutService _service;

    public DashboardLayoutController(IDashboardLayoutService service)
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

    [HttpPut]
    public async Task<IActionResult> Save([FromBody] SaveDashboardLayoutRequest req, CancellationToken ct)
    {
        try
        {
            if (req == null) return BadRequest(new { success = false, message = "Body required" });
            var data = await _service.SaveAsync(GetCurrentUserId(), req, ct);
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

    [HttpDelete]
    public async Task<IActionResult> Reset([FromQuery] string? scope, CancellationToken ct)
    {
        try
        {
            var ok = await _service.ResetAsync(GetCurrentUserId(), scope ?? "default", ct);
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
}
