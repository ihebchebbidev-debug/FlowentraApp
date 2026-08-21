using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Hierarchy.DTOs;
using MyApi.Modules.OAS.Hierarchy.Services;

namespace MyApi.Modules.OAS.Hierarchy.Controllers;

[Route("api/oas/zones")]
[OasPluginGate("OA0008REFERENTIALS")]
public class OasZonesController : OasControllerBase
{
    private readonly IOasHierarchyService _service;
    public OasZonesController(IOasHierarchyService service) => _service = service;

    [HttpGet] public async Task<ActionResult<IReadOnlyList<OasZoneDto>>> GetAll([FromQuery] Guid? siteId, [FromQuery] bool includeArchived = false) => Ok(await _service.GetZonesAsync(CurrentTenantId, siteId, includeArchived));

    [HttpPost] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<ActionResult<OasZoneDto>> Create([FromBody] OasZoneRequestDto request) => Ok(await _service.CreateZoneAsync(CurrentTenantId, request));

    [HttpPut("{id}")] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<IActionResult> Update(Guid id, [FromBody] OasZoneRequestDto request)
        => await _service.UpdateZoneAsync(CurrentTenantId, id, request) ? Ok(new { success = true }) : NotFound();

    [HttpPost("{id}/archive")] [OasAuthorize(Roles = "admin")] [OasWorkspace("web")]
    public async Task<IActionResult> Archive(Guid id) => RespondScoped(await _service.ArchiveZoneAsync(CurrentTenantId, id));

    [HttpPost("{id}/restore")] [OasAuthorize(Roles = "admin")] [OasWorkspace("web")]
    public async Task<IActionResult> Restore(Guid id) => RespondScoped(await _service.RestoreZoneAsync(CurrentTenantId, id));

    private IActionResult RespondScoped((bool success, string? error) result) => result switch
    {
        (true, _) => Ok(new { success = true }),
        (false, "out_of_scope") => Problem(statusCode: 403, title: "out_of_scope"),
        _ => NotFound(),
    };
}
