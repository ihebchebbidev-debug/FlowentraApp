using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Shifts.DTOs;
using MyApi.Modules.OAS.Shifts.Services;

namespace MyApi.Modules.OAS.Shifts.Controllers;

[Route("api/oas/shifts")]
[OasPluginGate("OA0008REFERENTIALS")]
public class OasShiftsController : OasControllerBase
{
    private readonly IOasShiftService _service;
    public OasShiftsController(IOasShiftService service) => _service = service;

    [HttpGet] public async Task<ActionResult<IReadOnlyList<OasShiftTemplateDto>>> GetAll() => Ok(await _service.GetTemplatesAsync(CurrentTenantId));

    [HttpPost] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<IActionResult> Create([FromBody] OasShiftTemplateRequestDto request)
    {
        var (success, error, dto) = await _service.CreateTemplateAsync(CurrentTenantId, request);
        if (success) return Ok(dto);
        return error == "code_already_exists" ? Conflict(new { error }) : BadRequest(new { error });
    }

    [HttpPut("{id}")] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<IActionResult> Update(Guid id, [FromBody] OasShiftTemplateRequestDto request)
    {
        var (success, error) = await _service.UpdateTemplateAsync(CurrentTenantId, id, request);
        if (!success) return error == "not_found" ? NotFound()
            : error == "code_already_exists" ? Conflict(new { error })
            : BadRequest(new { error });
        return Ok(new { success = true });
    }

    [HttpPut("{id}/active")] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] OasSetActiveRequestDto request)
    {
        var (success, error) = await _service.SetTemplateActiveAsync(CurrentTenantId, id, request.IsActive);
        if (!success) return error == "not_found" ? NotFound() : BadRequest(new { error });
        return Ok(new { success = true });
    }

    [HttpDelete("{id}")] [OasAuthorize(Roles = "admin")] [OasWorkspace("web")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (ok, error) = await _service.DeleteTemplateAsync(CurrentTenantId, id);
        if (ok) return Ok(new { success = true });
        if (error == "not_found") return NotFound();
        return Problem(409, "shift_template_in_use", "This shift template is still referenced and cannot be deleted.");
    }

    [HttpGet("calendar")]
    public async Task<ActionResult<IReadOnlyList<OasShiftCalendarEntryDto>>> GetCalendar([FromQuery] DateOnly from, [FromQuery] DateOnly to)
        => Ok(await _service.GetCalendarAsync(CurrentTenantId, from, to));

    [HttpPut("calendar")] [OasAuthorize(Roles = "admin,supervisor")]
    public async Task<IActionResult> PutCalendar([FromQuery] Guid siteId, [FromBody] List<OasShiftCalendarEntryDto> entries)
    {
        await _service.PutCalendarAsync(CurrentTenantId, siteId, entries);
        return Ok(new { success = true });
    }
}

[Route("api/oas/shift-signoffs")]
[OasPluginGate("OA0009REPORTING")]
public class OasShiftSignoffsController : OasControllerBase
{
    private readonly IOasShiftService _service;
    public OasShiftSignoffsController(IOasShiftService service) => _service = service;

    /// <summary>Only reachable from ShiftReport.tsx (console-only, admin/supervisor never issues a token to a plain operator) — carried no restriction of its own, unlike every other write in this file.</summary>
    [HttpPost]
    [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<ActionResult<OasShiftSignoffDto>> Create([FromBody] OasShiftSignoffRequestDto request)
        => Ok(await _service.CreateSignoffAsync(CurrentTenantId, CurrentOasUserId, request));

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OasShiftSignoffDto>>> GetAll([FromQuery] Guid? shift, [FromQuery] DateOnly? date)
        => Ok(await _service.GetSignoffsAsync(CurrentTenantId, shift, date));
}
