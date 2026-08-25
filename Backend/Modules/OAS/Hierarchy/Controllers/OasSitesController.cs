using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Hierarchy.DTOs;
using MyApi.Modules.OAS.Hierarchy.Services;

namespace MyApi.Modules.OAS.Hierarchy.Controllers;

[Route("api/oas/sites")]
[OasPluginGate("OA0008REFERENTIALS")]
public class OasSitesController : OasControllerBase
{
    private readonly IOasHierarchyService _service;
    public OasSitesController(IOasHierarchyService service) => _service = service;

    // GetAll deliberately unrestricted — hierarchyStore.ts's reloadAll() calls
    // all four Sites/Zones/Lines/Posts GETs in one Promise.all, which mobile
    // pages (ScanPage, ShopFloorPage, OperatorHome, DeclareStop) also trigger.
    // includeArchived defaults to false so this default behavior is unchanged;
    // pass true to also see soft-deleted rows (needed to resolve a name for
    // an archived post still referenced by old events/declarations).
    [HttpGet] public async Task<ActionResult<IReadOnlyList<OasSiteDto>>> GetAll([FromQuery] bool includeArchived = false) => Ok(await _service.GetSitesAsync(CurrentTenantId, includeArchived));

    [HttpPost] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<ActionResult<OasSiteDto>> Create([FromBody] OasSiteRequestDto request)
    {
        var (success, error, dto) = await _service.CreateSiteAsync(CurrentTenantId, request);
        if (!success) return Problem(statusCode: 409, title: error ?? "conflict");
        return Ok(dto);
    }

    [HttpPut("{id}")] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<IActionResult> Update(Guid id, [FromBody] OasSiteRequestDto request)
        => await _service.UpdateSiteAsync(CurrentTenantId, id, request) ? Ok(new { success = true }) : NotFound();

    [HttpPost("{id}/archive")] [OasAuthorize(Roles = "admin")] [OasWorkspace("web")]
    public async Task<IActionResult> Archive(Guid id) => RespondScoped(await _service.ArchiveSiteAsync(CurrentTenantId, id));

    [HttpPost("{id}/restore")] [OasAuthorize(Roles = "admin")] [OasWorkspace("web")]
    public async Task<IActionResult> Restore(Guid id) => RespondScoped(await _service.RestoreSiteAsync(CurrentTenantId, id));

    private IActionResult RespondScoped((bool success, string? error) result) => result switch
    {
        (true, _) => Ok(new { success = true }),
        (false, "out_of_scope") => Problem(statusCode: 403, title: "out_of_scope"),
        _ => NotFound(),
    };
}
