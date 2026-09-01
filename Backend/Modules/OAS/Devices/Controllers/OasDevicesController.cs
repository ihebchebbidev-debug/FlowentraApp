using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Devices.DTOs;
using MyApi.Modules.OAS.Devices.Services;

namespace MyApi.Modules.OAS.Devices.Controllers;

/// <summary>
/// EF-M2-09 device registry. Registration is self-service (any signed-in
/// user registers their own device); listing and revoking are admin /
/// supervisor console actions.
/// </summary>
[Route("api/oas/devices")]
public class OasDevicesController : OasControllerBase
{
    private readonly IOasDeviceService _service;
    public OasDevicesController(IOasDeviceService service) => _service = service;

    [HttpGet]
    [OasAuthorize(Roles = "admin,supervisor")]
    [OasWorkspace("web")]
    public async Task<ActionResult<IReadOnlyList<OasDeviceDto>>> GetAll([FromQuery] Guid? userId)
        => Ok(await _service.GetAllAsync(CurrentTenantId, userId));

    /// <summary>The caller's own devices — lets the mobile app show "this device is registered".</summary>
    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<OasDeviceDto>>> GetMine()
        => Ok(await _service.GetAllAsync(CurrentTenantId, CurrentOasUserId));

    [HttpPost("register")]
    public async Task<ActionResult<OasDeviceDto>> Register([FromBody] OasDeviceRegisterRequestDto request)
        => Ok(await _service.RegisterAsync(CurrentTenantId, CurrentOasUserId, request));

    [HttpPost("{id}/revoke")]
    [OasAuthorize(Roles = "admin,supervisor")]
    [OasWorkspace("web")]
    public async Task<IActionResult> Revoke(Guid id)
    {
        var (success, error) = await _service.RevokeAsync(CurrentTenantId, CurrentOasUserId, id);
        return success ? Ok(new { success = true }) : NotFound(new { error });
    }

    [HttpPost("{id}/restore")]
    [OasAuthorize(Roles = "admin")]
    [OasWorkspace("web")]
    public async Task<IActionResult> Restore(Guid id)
    {
        var (success, error) = await _service.RestoreAsync(CurrentTenantId, id);
        return success ? Ok(new { success = true }) : NotFound(new { error });
    }
}
