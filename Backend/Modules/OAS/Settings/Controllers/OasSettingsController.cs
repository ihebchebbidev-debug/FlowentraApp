using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Settings.DTOs;
using MyApi.Modules.OAS.Settings.Services;

namespace MyApi.Modules.OAS.Settings.Controllers;

/// <summary>
/// Tenant runtime configuration (EF-M7-01/02, EF-M5-13). Readable by any
/// signed-in user — the mobile app needs the shift-day start to label its
/// own "today" the same way the KPIs do — writable by admins only.
/// </summary>
[Route("api/oas/settings")]
public class OasSettingsController : OasControllerBase
{
    private readonly IOasSettingsService _service;
    public OasSettingsController(IOasSettingsService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OasSettingDto>>> GetAll()
        => Ok(await _service.GetAllAsync(CurrentTenantId));

    [HttpPut("{key}")]
    [OasAuthorize(Roles = "admin")]
    [OasWorkspace("web")]
    public async Task<IActionResult> Update(string key, [FromBody] OasSettingUpdateRequestDto request)
    {
        var (success, error, dto) = await _service.SetAsync(CurrentTenantId, CurrentOasUserId, key, request.Value);
        if (success) return Ok(dto);
        return error == "unknown_setting" ? NotFound(new { error }) : BadRequest(new { error });
    }
}
