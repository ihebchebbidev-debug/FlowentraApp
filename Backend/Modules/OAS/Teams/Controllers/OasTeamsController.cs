using Microsoft.AspNetCore.Mvc;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Teams.DTOs;
using MyApi.Modules.OAS.Teams.Services;

namespace MyApi.Modules.OAS.Teams.Controllers;

[Route("api/oas/teams")]
[OasPluginGate("OA0008REFERENTIALS")]
public class OasTeamsController : OasControllerBase
{
    private readonly IOasTeamService _service;
    public OasTeamsController(IOasTeamService service) => _service = service;

    [HttpGet] public async Task<ActionResult<IReadOnlyList<OasTeamDto>>> GetAll() => Ok(await _service.GetAllAsync(CurrentTenantId));

    [HttpPost] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<ActionResult<OasTeamDto>> Create([FromBody] OasTeamRequestDto request)
    {
        try { return Ok(await _service.CreateAsync(CurrentTenantId, request)); }
        catch (ArgumentException ex) { return Problem(statusCode: 400, title: ex.Message); }
        catch (InvalidOperationException ex) { return Problem(statusCode: 409, title: ex.Message); }
    }


    [HttpDelete("{id}")] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<IActionResult> Delete(Guid id)
        => await _service.DeleteAsync(CurrentTenantId, id) ? Ok(new { success = true }) : NotFound();

    [HttpPut("{id}/members")] [OasAuthorize(Roles = "admin,supervisor")] [OasWorkspace("web")]
    public async Task<IActionResult> SetMembers(Guid id, [FromBody] OasTeamMembersRequestDto request)
        => await _service.SetMembersAsync(CurrentTenantId, id, request) ? Ok(new { success = true }) : NotFound();
}
